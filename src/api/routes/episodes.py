"""
Episodes API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps import get_db, get_current_user_id
from src.api.schemas.episode import (
    EpisodeCreate,
    EpisodeUpdate,
    EpisodeResponse,
    ShotResponse,
)
from src.models import Project, Episode, Shot

router = APIRouter(prefix="/projects/{project_id}/episodes", tags=["episodes"])


async def _get_project(
    project_id: str,
    user_id: str,
    db: AsyncSession,
) -> Project:
    """获取并验证项目"""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user_id,
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.get("", response_model=list[EpisodeResponse])
async def list_episodes(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取集列表"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Episode)
        .where(Episode.project_id == project_id)
        .order_by(Episode.episode_number)
    )
    episodes = result.scalars().all()

    items = []
    for episode in episodes:
        shots_count = await db.scalar(
            select(func.count()).where(Shot.episode_id == episode.id)
        ) or 0

        items.append(
            EpisodeResponse(
                **{
                    **episode.__dict__,
                    "shots_count": shots_count,
                    "shots": [],
                }
            )
        )

    return items


@router.post("", response_model=EpisodeResponse, status_code=status.HTTP_201_CREATED)
async def create_episode(
    project_id: str,
    data: EpisodeCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """创建集"""
    await _get_project(project_id, user_id, db)

    # 检查 episode_number 是否已存在
    existing = await db.execute(
        select(Episode).where(
            Episode.project_id == project_id,
            Episode.episode_number == data.episode_number,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Episode {data.episode_number} already exists",
        )

    episode = Episode(
        project_id=project_id,
        episode_number=data.episode_number,
        title=data.title,
        script_input=data.script_input,
        status="pending",
    )

    db.add(episode)
    await db.flush()
    await db.refresh(episode)

    return EpisodeResponse(
        **{
            **episode.__dict__,
            "shots_count": 0,
            "shots": [],
        }
    )


@router.get("/{episode_id}", response_model=EpisodeResponse)
async def get_episode(
    project_id: str,
    episode_id: str,
    include_shots: bool = False,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取集详情"""
    await _get_project(project_id, user_id, db)

    if include_shots:
        result = await db.execute(
            select(Episode)
            .options(selectinload(Episode.shots))
            .where(
                Episode.id == episode_id,
                Episode.project_id == project_id,
            )
        )
    else:
        result = await db.execute(
            select(Episode).where(
                Episode.id == episode_id,
                Episode.project_id == project_id,
            )
        )

    episode = result.scalar_one_or_none()

    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    shots = []
    if include_shots and episode.shots:
        shots = [ShotResponse.model_validate(s) for s in episode.shots]

    shots_count = len(shots) if include_shots else await db.scalar(
        select(func.count()).where(Shot.episode_id == episode.id)
    ) or 0

    return EpisodeResponse(
        **{
            **episode.__dict__,
            "shots_count": shots_count,
            "shots": shots,
        }
    )


@router.patch("/{episode_id}", response_model=EpisodeResponse)
async def update_episode(
    project_id: str,
    episode_id: str,
    data: EpisodeUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """更新集"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Episode).where(
            Episode.id == episode_id,
            Episode.project_id == project_id,
        )
    )
    episode = result.scalar_one_or_none()

    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(episode, field, value)

    await db.flush()
    await db.refresh(episode)

    shots_count = await db.scalar(
        select(func.count()).where(Shot.episode_id == episode.id)
    ) or 0

    return EpisodeResponse(
        **{
            **episode.__dict__,
            "shots_count": shots_count,
            "shots": [],
        }
    )


@router.delete("/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_episode(
    project_id: str,
    episode_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """删除集"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Episode).where(
            Episode.id == episode_id,
            Episode.project_id == project_id,
        )
    )
    episode = result.scalar_one_or_none()

    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    await db.delete(episode)
