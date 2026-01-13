"""
Generation API Routes
"""
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, get_current_user_id
from src.api.schemas.generation import (
    GenerationRequest,
    GenerationResponse,
    GenerationStatusResponse,
    GenerationResultResponse,
)
from src.models import Project, Episode, Task

router = APIRouter(prefix="/generate", tags=["generation"])


@router.post("", response_model=GenerationResponse)
async def start_generation(
    data: GenerationRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    开始生成漫剧

    触发异步生成任务，返回任务 ID
    """
    # 获取 episode
    result = await db.execute(
        select(Episode)
        .join(Project)
        .where(
            Episode.id == data.episode_id,
            Project.user_id == user_id,
        )
    )
    episode = result.scalar_one_or_none()

    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    # 如果提供了新的 script_input，更新 episode
    if data.script_input:
        episode.script_input = data.script_input
        episode.status = "pending"
        await db.flush()

    # 检查是否有 script_input
    if not episode.script_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Episode has no script input",
        )

    # 创建生成任务
    task = Task(
        project_id=episode.project_id,
        episode_id=episode.id,
        task_type="full_generation",
        status="pending",
        payload={
            "style": data.style,
            "add_subtitles": data.add_subtitles,
            "bgm_path": data.bgm_path,
            "bgm_volume": data.bgm_volume,
            "regenerate_from": data.regenerate_from,
        },
    )

    db.add(task)
    await db.flush()
    await db.refresh(task)

    # 更新 episode 状态
    episode.status = "processing"
    await db.flush()

    # TODO: 触发 Celery 任务
    # from src.workers.tasks.generation import generate_manga_video
    # generate_manga_video.delay(task.id)

    return GenerationResponse(
        task_id=task.id,
        episode_id=episode.id,
        status="pending",
        message="Generation task created",
    )


@router.get("/{task_id}/status", response_model=GenerationStatusResponse)
async def get_generation_status(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取生成任务状态"""
    result = await db.execute(
        select(Task)
        .join(Project)
        .where(
            Task.id == task_id,
            Project.user_id == user_id,
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return GenerationStatusResponse(
        task_id=task.id,
        episode_id=task.episode_id or "",
        status=task.status,
        progress=task.progress,
        current_stage=task.result.get("current_stage") if task.result else None,
        message=task.result.get("message", "") if task.result else "",
        result=task.result,
        error=task.error,
        started_at=task.started_at.isoformat() if task.started_at else None,
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
    )


@router.get("/{task_id}/result", response_model=GenerationResultResponse)
async def get_generation_result(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取生成结果"""
    from src.storage import get_storage

    result = await db.execute(
        select(Task)
        .join(Project)
        .where(
            Task.id == task_id,
            Project.user_id == user_id,
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is not completed. Current status: {task.status}",
        )

    # 获取视频 URL
    video_path = task.result.get("video_path") if task.result else None
    video_url = None

    if video_path:
        storage = get_storage()
        video_url = storage.get_presigned_url(video_path)

    # 获取 episode
    episode_result = await db.execute(
        select(Episode).where(Episode.id == task.episode_id)
    )
    episode = episode_result.scalar_one_or_none()

    return GenerationResultResponse(
        success=True,
        episode_id=task.episode_id or "",
        video_path=video_path,
        video_url=video_url,
        duration=episode.duration if episode else None,
        stages=task.result.get("stages", {}) if task.result else {},
    )


@router.post("/{task_id}/cancel", response_model=GenerationResponse)
async def cancel_generation(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """取消生成任务"""
    result = await db.execute(
        select(Task)
        .join(Project)
        .where(
            Task.id == task_id,
            Project.user_id == user_id,
        )
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.status in ("completed", "failed", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel task with status: {task.status}",
        )

    # 更新状态
    task.status = "cancelled"
    task.completed_at = datetime.utcnow()

    # TODO: 取消 Celery 任务
    # if task.celery_task_id:
    #     from src.workers.celery_app import celery_app
    #     celery_app.control.revoke(task.celery_task_id, terminate=True)

    await db.flush()

    return GenerationResponse(
        task_id=task.id,
        episode_id=task.episode_id or "",
        status="cancelled",
        message="Task cancelled",
    )
