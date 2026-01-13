"""
Platform API Routes - 发布平台管理
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps import get_db, get_current_user_id
from src.api.schemas.platform import (
    PlatformAccountCreate,
    PlatformAccountUpdate,
    PlatformAccountResponse,
    PlatformInfo,
    PublishRequest,
    PublishRecordResponse,
    PublishStatusResponse,
    BatchPublishResponse,
)
from src.models import PlatformAccount, PublishRecord, Episode

router = APIRouter(prefix="/platforms", tags=["platforms"])


# =============================================
# 支持的平台信息
# =============================================
SUPPORTED_PLATFORMS: dict[str, PlatformInfo] = {
    "douyin": PlatformInfo(
        id="douyin",
        name="抖音 (Douyin)",
        icon="music_note",
        color="#000000",
        supports_scheduling=True,
        supports_hashtags=True,
        supports_subtitles=True,
        max_video_duration=600,
        max_title_length=55,
        max_description_length=2200,
    ),
    "bilibili": PlatformInfo(
        id="bilibili",
        name="哔哩哔哩 (Bilibili)",
        icon="smart_display",
        color="#23ade5",
        supports_scheduling=True,
        supports_hashtags=True,
        supports_subtitles=True,
        max_video_duration=14400,
        max_title_length=80,
        max_description_length=2000,
    ),
    "kuaishou": PlatformInfo(
        id="kuaishou",
        name="快手 (Kuaishou)",
        icon="video_camera_back",
        color="#FF4C00",
        supports_scheduling=True,
        supports_hashtags=True,
        supports_subtitles=True,
        max_video_duration=600,
        max_title_length=50,
        max_description_length=500,
    ),
    "wechat_channels": PlatformInfo(
        id="wechat_channels",
        name="微信视频号",
        icon="chat_bubble",
        color="#07C160",
        supports_scheduling=False,
        supports_hashtags=True,
        supports_subtitles=True,
        max_video_duration=1800,
        max_title_length=50,
        max_description_length=1000,
    ),
    "youtube": PlatformInfo(
        id="youtube",
        name="YouTube",
        icon="play_circle",
        color="#FF0000",
        supports_scheduling=True,
        supports_hashtags=True,
        supports_subtitles=True,
        max_video_duration=43200,
        max_title_length=100,
        max_description_length=5000,
    ),
}


@router.get("/supported", response_model=list[PlatformInfo])
async def list_supported_platforms():
    """获取支持的发布平台列表"""
    return list(SUPPORTED_PLATFORMS.values())


# =============================================
# 平台账号管理
# =============================================

@router.get("/accounts", response_model=list[PlatformAccountResponse])
async def list_platform_accounts(
    platform: str = None,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取用户的平台账号列表"""
    query = select(PlatformAccount).where(PlatformAccount.user_id == user_id)

    if platform:
        query = query.where(PlatformAccount.platform == platform)

    result = await db.execute(query.order_by(PlatformAccount.platform, PlatformAccount.created_at))
    accounts = result.scalars().all()

    return [
        PlatformAccountResponse(
            id=acc.id,
            user_id=acc.user_id,
            platform=acc.platform,
            account_name=acc.account_name,
            platform_user_id=acc.platform_user_id,
            status=acc.status,
            settings=acc.settings,
            auto_publish=acc.auto_publish,
            token_expires_at=acc.token_expires_at,
            has_access_token=bool(acc.access_token_encrypted),
            created_at=acc.created_at,
            updated_at=acc.updated_at,
        )
        for acc in accounts
    ]


@router.post("/accounts", response_model=PlatformAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_platform_account(
    data: PlatformAccountCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """创建平台账号"""
    if data.platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported platform: {data.platform}",
        )

    # 检查是否已存在相同平台的账号
    existing = await db.execute(
        select(PlatformAccount).where(
            PlatformAccount.user_id == user_id,
            PlatformAccount.platform == data.platform,
            PlatformAccount.account_name == data.account_name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account already exists for {data.platform}",
        )

    # 确定状态
    account_status = "disconnected"
    if data.access_token:
        if data.token_expires_at and data.token_expires_at < datetime.now(timezone.utc):
            account_status = "expired"
        else:
            account_status = "connected"

    account = PlatformAccount(
        user_id=user_id,
        platform=data.platform,
        account_name=data.account_name,
        platform_user_id=data.platform_user_id,
        access_token_encrypted=data.access_token,  # TODO: 加密
        refresh_token_encrypted=data.refresh_token,  # TODO: 加密
        token_expires_at=data.token_expires_at,
        status=account_status,
        settings=data.settings,
    )

    db.add(account)
    await db.flush()
    await db.refresh(account)

    return PlatformAccountResponse(
        id=account.id,
        user_id=account.user_id,
        platform=account.platform,
        account_name=account.account_name,
        platform_user_id=account.platform_user_id,
        status=account.status,
        settings=account.settings,
        auto_publish=account.auto_publish,
        token_expires_at=account.token_expires_at,
        has_access_token=bool(account.access_token_encrypted),
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


@router.get("/accounts/{account_id}", response_model=PlatformAccountResponse)
async def get_platform_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取平台账号详情"""
    result = await db.execute(
        select(PlatformAccount).where(
            PlatformAccount.id == account_id,
            PlatformAccount.user_id == user_id,
        )
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform account not found",
        )

    return PlatformAccountResponse(
        id=account.id,
        user_id=account.user_id,
        platform=account.platform,
        account_name=account.account_name,
        platform_user_id=account.platform_user_id,
        status=account.status,
        settings=account.settings,
        auto_publish=account.auto_publish,
        token_expires_at=account.token_expires_at,
        has_access_token=bool(account.access_token_encrypted),
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


@router.patch("/accounts/{account_id}", response_model=PlatformAccountResponse)
async def update_platform_account(
    account_id: str,
    data: PlatformAccountUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """更新平台账号"""
    result = await db.execute(
        select(PlatformAccount).where(
            PlatformAccount.id == account_id,
            PlatformAccount.user_id == user_id,
        )
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform account not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    # 处理 token
    if "access_token" in update_data:
        access_token = update_data.pop("access_token")
        if access_token:
            account.access_token_encrypted = access_token  # TODO: 加密

    if "refresh_token" in update_data:
        refresh_token = update_data.pop("refresh_token")
        if refresh_token:
            account.refresh_token_encrypted = refresh_token  # TODO: 加密

    for field, value in update_data.items():
        setattr(account, field, value)

    await db.flush()
    await db.refresh(account)

    return PlatformAccountResponse(
        id=account.id,
        user_id=account.user_id,
        platform=account.platform,
        account_name=account.account_name,
        platform_user_id=account.platform_user_id,
        status=account.status,
        settings=account.settings,
        auto_publish=account.auto_publish,
        token_expires_at=account.token_expires_at,
        has_access_token=bool(account.access_token_encrypted),
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_platform_account(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """删除平台账号"""
    result = await db.execute(
        select(PlatformAccount).where(
            PlatformAccount.id == account_id,
            PlatformAccount.user_id == user_id,
        )
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform account not found",
        )

    await db.delete(account)


@router.post("/accounts/{account_id}/refresh-token", response_model=PlatformAccountResponse)
async def refresh_platform_token(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """刷新平台 Token"""
    result = await db.execute(
        select(PlatformAccount).where(
            PlatformAccount.id == account_id,
            PlatformAccount.user_id == user_id,
        )
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform account not found",
        )

    # TODO: 实现真正的 OAuth token 刷新
    # 这里模拟刷新成功
    account.status = "connected"
    account.token_expires_at = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    await db.flush()
    await db.refresh(account)

    return PlatformAccountResponse(
        id=account.id,
        user_id=account.user_id,
        platform=account.platform,
        account_name=account.account_name,
        platform_user_id=account.platform_user_id,
        status=account.status,
        settings=account.settings,
        auto_publish=account.auto_publish,
        token_expires_at=account.token_expires_at,
        has_access_token=bool(account.access_token_encrypted),
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


# =============================================
# 发布功能
# =============================================

@router.post("/publish", response_model=BatchPublishResponse)
async def publish_episode(
    data: PublishRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """发布视频到多个平台"""
    # 验证 episode 存在
    episode_result = await db.execute(
        select(Episode).where(Episode.id == data.episode_id)
    )
    episode = episode_result.scalar_one_or_none()

    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    if not episode.video_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Episode has no video to publish",
        )

    # 验证所有平台账号
    accounts_result = await db.execute(
        select(PlatformAccount).where(
            PlatformAccount.id.in_(data.platform_account_ids),
            PlatformAccount.user_id == user_id,
        )
    )
    accounts = accounts_result.scalars().all()

    if len(accounts) != len(data.platform_account_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some platform accounts not found",
        )

    # 检查账号状态
    for account in accounts:
        if account.status != "connected":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Platform account {account.account_name} is not connected",
            )

    # 创建发布记录
    records = []
    for account in accounts:
        record = PublishRecord(
            platform_account_id=account.id,
            episode_id=data.episode_id,
            status="pending",
            title=data.title,
            description=data.description,
            hashtags=data.hashtags,
            publish_settings={
                "scheduled_at": data.scheduled_at.isoformat() if data.scheduled_at else None,
                **data.settings,
            },
        )
        db.add(record)
        records.append(record)

    await db.flush()

    # 刷新所有记录
    for record in records:
        await db.refresh(record)

    # TODO: 触发异步发布任务
    # 这里应该调用 Celery 任务来实际执行发布

    response_records = []
    for record, account in zip(records, accounts):
        response_records.append(
            PublishRecordResponse(
                id=record.id,
                platform_account_id=record.platform_account_id,
                episode_id=record.episode_id,
                status=record.status,
                platform_video_id=record.platform_video_id,
                platform_video_url=record.platform_video_url,
                title=record.title,
                description=record.description,
                hashtags=record.hashtags,
                publish_settings=record.publish_settings,
                error_message=record.error_message,
                published_at=record.published_at,
                created_at=record.created_at,
                updated_at=record.updated_at,
                platform=account.platform,
                account_name=account.account_name,
            )
        )

    return BatchPublishResponse(
        success=True,
        message=f"Publishing to {len(records)} platform(s)",
        records=response_records,
    )


@router.get("/publish/history", response_model=list[PublishRecordResponse])
async def list_publish_history(
    episode_id: str = None,
    platform: str = None,
    status_filter: str = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取发布历史"""
    query = (
        select(PublishRecord)
        .join(PlatformAccount)
        .where(PlatformAccount.user_id == user_id)
    )

    if episode_id:
        query = query.where(PublishRecord.episode_id == episode_id)

    if platform:
        query = query.where(PlatformAccount.platform == platform)

    if status_filter:
        query = query.where(PublishRecord.status == status_filter)

    query = query.order_by(PublishRecord.created_at.desc()).limit(limit)

    result = await db.execute(query)
    records = result.scalars().all()

    response_records = []
    for record in records:
        # 获取关联的账号信息
        account_result = await db.execute(
            select(PlatformAccount).where(PlatformAccount.id == record.platform_account_id)
        )
        account = account_result.scalar_one_or_none()

        response_records.append(
            PublishRecordResponse(
                id=record.id,
                platform_account_id=record.platform_account_id,
                episode_id=record.episode_id,
                status=record.status,
                platform_video_id=record.platform_video_id,
                platform_video_url=record.platform_video_url,
                title=record.title,
                description=record.description,
                hashtags=record.hashtags,
                publish_settings=record.publish_settings,
                error_message=record.error_message,
                published_at=record.published_at,
                created_at=record.created_at,
                updated_at=record.updated_at,
                platform=account.platform if account else None,
                account_name=account.account_name if account else None,
            )
        )

    return response_records


@router.get("/publish/{record_id}", response_model=PublishRecordResponse)
async def get_publish_record(
    record_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取发布记录详情"""
    result = await db.execute(
        select(PublishRecord)
        .join(PlatformAccount)
        .where(
            PublishRecord.id == record_id,
            PlatformAccount.user_id == user_id,
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Publish record not found",
        )

    # 获取关联的账号信息
    account_result = await db.execute(
        select(PlatformAccount).where(PlatformAccount.id == record.platform_account_id)
    )
    account = account_result.scalar_one_or_none()

    return PublishRecordResponse(
        id=record.id,
        platform_account_id=record.platform_account_id,
        episode_id=record.episode_id,
        status=record.status,
        platform_video_id=record.platform_video_id,
        platform_video_url=record.platform_video_url,
        title=record.title,
        description=record.description,
        hashtags=record.hashtags,
        publish_settings=record.publish_settings,
        error_message=record.error_message,
        published_at=record.published_at,
        created_at=record.created_at,
        updated_at=record.updated_at,
        platform=account.platform if account else None,
        account_name=account.account_name if account else None,
    )


@router.get("/publish/status/{episode_id}", response_model=PublishStatusResponse)
async def get_publish_status(
    episode_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """获取某个 Episode 的发布状态汇总"""
    query = (
        select(PublishRecord)
        .join(PlatformAccount)
        .where(
            PublishRecord.episode_id == episode_id,
            PlatformAccount.user_id == user_id,
        )
    )

    result = await db.execute(query)
    records = result.scalars().all()

    response_records = []
    published_count = 0
    pending_count = 0
    failed_count = 0

    for record in records:
        account_result = await db.execute(
            select(PlatformAccount).where(PlatformAccount.id == record.platform_account_id)
        )
        account = account_result.scalar_one_or_none()

        if record.status == "published":
            published_count += 1
        elif record.status in ("pending", "publishing"):
            pending_count += 1
        elif record.status == "failed":
            failed_count += 1

        response_records.append(
            PublishRecordResponse(
                id=record.id,
                platform_account_id=record.platform_account_id,
                episode_id=record.episode_id,
                status=record.status,
                platform_video_id=record.platform_video_id,
                platform_video_url=record.platform_video_url,
                title=record.title,
                description=record.description,
                hashtags=record.hashtags,
                publish_settings=record.publish_settings,
                error_message=record.error_message,
                published_at=record.published_at,
                created_at=record.created_at,
                updated_at=record.updated_at,
                platform=account.platform if account else None,
                account_name=account.account_name if account else None,
            )
        )

    return PublishStatusResponse(
        total=len(records),
        published=published_count,
        pending=pending_count,
        failed=failed_count,
        records=response_records,
    )
