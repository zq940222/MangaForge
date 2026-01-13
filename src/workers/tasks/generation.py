"""
Generation Tasks - 漫剧生成任务
"""
import asyncio
import json
from datetime import datetime
from typing import Any

from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded

from src.workers.celery_app import celery_app, TaskStatus, GenerationStage


def run_async(coro):
    """在同步环境中运行异步协程"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _update_task_progress(
    task_id: str,
    stage: str,
    progress: float,
    message: str,
    details: dict[str, Any] | None = None,
):
    """更新任务进度并通过 Redis 发布"""
    from src.db.database import get_async_session
    from src.db.redis import get_redis_client
    from src.models import Task

    # 计算总体进度
    total_progress = GenerationStage.get_progress(stage, progress)

    # 更新数据库
    async with get_async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task:
            task.progress = total_progress
            if task.result is None:
                task.result = {}
            task.result["current_stage"] = stage
            task.result["stage_progress"] = progress
            task.result["message"] = message
            if details:
                task.result["details"] = details
            await session.commit()

    # 发布到 Redis
    redis = await get_redis_client()
    payload = {
        "type": "progress",
        "task_id": task_id,
        "data": {
            "stage": stage,
            "stage_progress": progress,
            "total_progress": total_progress,
            "message": message,
            "details": details or {},
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
    await redis.publish(f"task:{task_id}:progress", json.dumps(payload))


async def _mark_task_completed(
    task_id: str,
    result: dict[str, Any],
):
    """标记任务完成"""
    from src.db.database import get_async_session
    from src.db.redis import get_redis_client
    from src.models import Task

    async with get_async_session() as session:
        from sqlalchemy import select
        db_result = await session.execute(select(Task).where(Task.id == task_id))
        task = db_result.scalar_one_or_none()
        if task:
            task.status = TaskStatus.COMPLETED
            task.progress = 100.0
            task.result = result
            task.completed_at = datetime.utcnow()
            await session.commit()

    # 发布完成通知
    redis = await get_redis_client()
    payload = {
        "type": "complete",
        "task_id": task_id,
        "data": result,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await redis.publish(f"task:{task_id}:progress", json.dumps(payload))


async def _mark_task_failed(
    task_id: str,
    error: str,
    stage: str | None = None,
):
    """标记任务失败"""
    from src.db.database import get_async_session
    from src.db.redis import get_redis_client
    from src.models import Task

    async with get_async_session() as session:
        from sqlalchemy import select
        db_result = await session.execute(select(Task).where(Task.id == task_id))
        task = db_result.scalar_one_or_none()
        if task:
            task.status = TaskStatus.FAILED
            task.error = error
            task.completed_at = datetime.utcnow()
            if task.result is None:
                task.result = {}
            task.result["failed_at_stage"] = stage
            await session.commit()

    # 发布失败通知
    redis = await get_redis_client()
    payload = {
        "type": "error",
        "task_id": task_id,
        "data": {
            "error": error,
            "stage": stage,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }
    await redis.publish(f"task:{task_id}:progress", json.dumps(payload))


async def _run_generation(task_id: str):
    """执行生成流程"""
    from src.db.database import get_async_session
    from src.models import Task, Episode, Project
    from src.agents.orchestrator import MangaForgeOrchestrator
    from src.services.factory import ServiceFactory
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload

    # 获取任务信息
    async with get_async_session() as session:
        result = await session.execute(
            select(Task)
            .options(selectinload(Task.episode))
            .where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise ValueError(f"Task {task_id} not found")

        if not task.episode:
            raise ValueError(f"Task {task_id} has no associated episode")

        episode = task.episode

        # 获取项目
        project_result = await session.execute(
            select(Project).where(Project.id == task.project_id)
        )
        project = project_result.scalar_one_or_none()

        if not project:
            raise ValueError(f"Project not found for task {task_id}")

        # 更新任务状态
        task.status = TaskStatus.PROCESSING
        task.started_at = datetime.utcnow()
        await session.commit()

        # 准备配置
        config = {
            "style": task.payload.get("style", project.style),
            "add_subtitles": task.payload.get("add_subtitles", True),
            "bgm_path": task.payload.get("bgm_path"),
            "bgm_volume": task.payload.get("bgm_volume", 0.3),
            "regenerate_from": task.payload.get("regenerate_from"),
            "aspect_ratio": project.aspect_ratio,
            "target_platform": project.target_platform,
        }

        user_input = episode.script_input

        # 获取现有数据（用于部分重新生成）
        existing_data = {}
        if episode.script_parsed:
            existing_data["script"] = episode.script_parsed
        if episode.storyboard:
            existing_data["storyboard"] = episode.storyboard

    # 创建进度回调
    async def progress_callback(stage: str, progress: float, message: str, details: dict = None):
        await _update_task_progress(task_id, stage, progress, message, details)

    # 创建编排器
    service_factory = ServiceFactory(user_id=project.user_id)
    orchestrator = MangaForgeOrchestrator(
        service_factory=service_factory,
        progress_callback=progress_callback,
    )

    # 执行生成
    result = await orchestrator.generate(
        project_id=project.id,
        user_input=user_input,
        config=config,
        existing_data=existing_data,
    )

    # 更新 Episode
    async with get_async_session() as session:
        ep_result = await session.execute(
            select(Episode).where(Episode.id == episode.id)
        )
        ep = ep_result.scalar_one_or_none()
        if ep:
            ep.script_parsed = result.get("script")
            ep.storyboard = result.get("storyboard")
            ep.video_path = result.get("video_path")
            ep.duration = result.get("duration")
            ep.status = "completed"
            await session.commit()

    return result


@celery_app.task(
    bind=True,
    name="src.workers.tasks.generation.generate_manga_video",
    max_retries=3,
    soft_time_limit=3600,
    time_limit=3660,
)
def generate_manga_video(self, task_id: str):
    """
    生成漫剧视频的 Celery 任务。

    Args:
        task_id: 数据库中的 Task ID

    Returns:
        dict: 生成结果
    """
    current_stage = None

    try:
        # 运行异步生成流程
        result = run_async(_run_generation(task_id))

        # 标记完成
        run_async(_mark_task_completed(task_id, result))

        return result

    except SoftTimeLimitExceeded:
        error_msg = "Task exceeded time limit (1 hour)"
        run_async(_mark_task_failed(task_id, error_msg, current_stage))
        raise

    except Exception as e:
        error_msg = str(e)
        run_async(_mark_task_failed(task_id, error_msg, current_stage))

        # 重试
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))

        raise


@celery_app.task(
    name="src.workers.tasks.generation.regenerate_stage",
)
def regenerate_stage(task_id: str, stage: str, shot_ids: list[str] | None = None):
    """
    重新生成特定阶段。

    Args:
        task_id: 任务 ID
        stage: 要重新生成的阶段
        shot_ids: 可选，只重新生成特定镜头

    Returns:
        dict: 重新生成结果
    """
    # TODO: 实现部分重新生成逻辑
    pass
