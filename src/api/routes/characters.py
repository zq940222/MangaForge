"""
Characters API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, get_current_user_id, get_storage_client
from src.api.schemas.character import (
    CharacterCreate,
    CharacterUpdate,
    CharacterResponse,
)
from src.models import Project, Character
from src.storage import MinioStorage

router = APIRouter(prefix="/projects/{project_id}/characters", tags=["characters"])


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


@router.get("", response_model=list[CharacterResponse])
async def list_characters(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取角色列表"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Character)
        .where(Character.project_id == project_id)
        .order_by(Character.created_at)
    )
    characters = result.scalars().all()

    return [CharacterResponse.model_validate(c) for c in characters]


@router.post("", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    project_id: str,
    data: CharacterCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """创建角色"""
    await _get_project(project_id, user_id, db)

    character = Character(
        project_id=project_id,
        name=data.name,
        description=data.description,
        gender=data.gender,
        age_range=data.age_range,
        personality=data.personality,
    )

    db.add(character)
    await db.flush()
    await db.refresh(character)

    return CharacterResponse.model_validate(character)


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(
    project_id: str,
    character_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取角色详情"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Character).where(
            Character.id == character_id,
            Character.project_id == project_id,
        )
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found",
        )

    return CharacterResponse.model_validate(character)


@router.patch("/{character_id}", response_model=CharacterResponse)
async def update_character(
    project_id: str,
    character_id: str,
    data: CharacterUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """更新角色"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Character).where(
            Character.id == character_id,
            Character.project_id == project_id,
        )
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(character, field, value)

    await db.flush()
    await db.refresh(character)

    return CharacterResponse.model_validate(character)


@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    project_id: str,
    character_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """删除角色"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Character).where(
            Character.id == character_id,
            Character.project_id == project_id,
        )
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found",
        )

    await db.delete(character)


@router.post("/{character_id}/reference-image", response_model=CharacterResponse)
async def upload_reference_image(
    project_id: str,
    character_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    storage: MinioStorage = Depends(get_storage_client),
):
    """上传角色参考图"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Character).where(
            Character.id == character_id,
            Character.project_id == project_id,
        )
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found",
        )

    # 上传文件
    content = await file.read()
    path = storage.upload_bytes(
        data=content,
        project_id=project_id,
        asset_type="character",
        filename=f"{character.name}_{file.filename}",
        content_type=file.content_type,
    )

    # 更新角色参考图
    if character.reference_images is None:
        character.reference_images = []
    character.reference_images = character.reference_images + [path]

    await db.flush()
    await db.refresh(character)

    return CharacterResponse.model_validate(character)


@router.post("/{character_id}/voice-sample", response_model=CharacterResponse)
async def upload_voice_sample(
    project_id: str,
    character_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    storage: MinioStorage = Depends(get_storage_client),
):
    """上传角色声音样本"""
    await _get_project(project_id, user_id, db)

    result = await db.execute(
        select(Character).where(
            Character.id == character_id,
            Character.project_id == project_id,
        )
    )
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found",
        )

    # 上传文件
    content = await file.read()
    path = storage.upload_bytes(
        data=content,
        project_id=project_id,
        asset_type="voice",
        filename=f"{character.name}_voice_{file.filename}",
        content_type=file.content_type,
    )

    # 更新角色声音样本
    character.voice_sample_path = path

    await db.flush()
    await db.refresh(character)

    return CharacterResponse.model_validate(character)
