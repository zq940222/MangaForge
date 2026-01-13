"""
Base Service Interface
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class ServiceType(str, Enum):
    """服务类型枚举"""
    LLM = "llm"
    IMAGE = "image"
    VIDEO = "video"
    VOICE = "voice"
    LIPSYNC = "lipsync"


@dataclass
class ServiceConfig:
    """服务配置"""
    provider: str
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    model: Optional[str] = None
    settings: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.settings is None:
            self.settings = {}


@dataclass
class ServiceResult:
    """服务调用结果"""
    success: bool
    data: Any = None
    error: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def ok(cls, data: Any, metadata: Optional[dict] = None) -> "ServiceResult":
        """创建成功结果"""
        return cls(success=True, data=data, metadata=metadata or {})

    @classmethod
    def fail(cls, error: str, metadata: Optional[dict] = None) -> "ServiceResult":
        """创建失败结果"""
        return cls(success=False, error=error, metadata=metadata or {})


class BaseService(ABC):
    """服务基类"""

    service_type: ServiceType
    provider: str

    def __init__(self, config: ServiceConfig):
        self.config = config

    @abstractmethod
    async def health_check(self) -> bool:
        """检查服务是否可用"""
        pass

    @abstractmethod
    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        pass

    def get_info(self) -> dict[str, Any]:
        """获取服务信息"""
        return {
            "service_type": self.service_type.value,
            "provider": self.provider,
            "model": self.config.model,
            "endpoint": self.config.endpoint,
        }
