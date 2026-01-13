"""
API Schemas - Pydantic 请求/响应模型
"""
from .project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)
from .character import (
    CharacterCreate,
    CharacterUpdate,
    CharacterResponse,
)
from .episode import (
    EpisodeCreate,
    EpisodeUpdate,
    EpisodeResponse,
)
from .generation import (
    GenerationRequest,
    GenerationResponse,
    GenerationProgress,
)
from .config import (
    UserConfigCreate,
    UserConfigUpdate,
    UserConfigResponse,
    ProviderInfo,
)
from .platform import (
    PlatformAccountCreate,
    PlatformAccountUpdate,
    PlatformAccountResponse,
    PlatformInfo,
    PublishRequest,
    PublishRecordResponse,
    PublishStatusResponse,
    BatchPublishResponse,
)

__all__ = [
    # Project
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectListResponse",
    # Character
    "CharacterCreate",
    "CharacterUpdate",
    "CharacterResponse",
    # Episode
    "EpisodeCreate",
    "EpisodeUpdate",
    "EpisodeResponse",
    # Generation
    "GenerationRequest",
    "GenerationResponse",
    "GenerationProgress",
    # Config
    "UserConfigCreate",
    "UserConfigUpdate",
    "UserConfigResponse",
    "ProviderInfo",
    # Platform
    "PlatformAccountCreate",
    "PlatformAccountUpdate",
    "PlatformAccountResponse",
    "PlatformInfo",
    "PublishRequest",
    "PublishRecordResponse",
    "PublishStatusResponse",
    "BatchPublishResponse",
]
