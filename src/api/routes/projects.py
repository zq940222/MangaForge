"""
Projects API Routes
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps import get_db, get_current_user_id
from src.api.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from src.models import Project, Episode, Character

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取项目列表"""
    # 构建查询
    query = select(Project).where(Project.user_id == user_id)

    if status:
        query = query.where(Project.status == status)

    # 获取总数
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # 分页
    query = query.order_by(Project.updated_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    projects = result.scalars().all()

    # 获取关联数据计数
    items = []
    for project in projects:
        # 获取 episodes 和 characters 数量
        episodes_count = await db.scalar(
            select(func.count()).where(Episode.project_id == project.id)
        ) or 0
        characters_count = await db.scalar(
            select(func.count()).where(Character.project_id == project.id)
        ) or 0

        item = ProjectResponse(
            **{
                **project.__dict__,
                "episodes_count": episodes_count,
                "characters_count": characters_count,
            }
        )
        items.append(item)

    return ProjectListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """创建项目"""
    project = Project(
        user_id=user_id,
        title=data.title,
        description=data.description,
        style=data.style,
        target_platform=data.target_platform,
        aspect_ratio=data.aspect_ratio,
        settings=data.settings,
        status="draft",
    )

    db.add(project)
    await db.flush()
    await db.refresh(project)

    return ProjectResponse(
        **{
            **project.__dict__,
            "episodes_count": 0,
            "characters_count": 0,
        }
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取项目详情"""
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

    # 获取关联数据计数
    episodes_count = await db.scalar(
        select(func.count()).where(Episode.project_id == project.id)
    ) or 0
    characters_count = await db.scalar(
        select(func.count()).where(Character.project_id == project.id)
    ) or 0

    return ProjectResponse(
        **{
            **project.__dict__,
            "episodes_count": episodes_count,
            "characters_count": characters_count,
        }
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """更新项目"""
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

    # 更新字段
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.flush()
    await db.refresh(project)

    # 获取关联数据计数
    episodes_count = await db.scalar(
        select(func.count()).where(Episode.project_id == project.id)
    ) or 0
    characters_count = await db.scalar(
        select(func.count()).where(Character.project_id == project.id)
    ) or 0

    return ProjectResponse(
        **{
            **project.__dict__,
            "episodes_count": episodes_count,
            "characters_count": characters_count,
        }
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """删除项目"""
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

    await db.delete(project)
