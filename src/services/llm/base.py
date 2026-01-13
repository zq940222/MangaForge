"""
Base LLM Service Interface
"""
from abc import abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from src.services.base import BaseService, ServiceConfig, ServiceResult, ServiceType


class MessageRole(str, Enum):
    """消息角色"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


@dataclass
class LLMMessage:
    """LLM 消息"""
    role: MessageRole
    content: str

    @classmethod
    def system(cls, content: str) -> "LLMMessage":
        return cls(role=MessageRole.SYSTEM, content=content)

    @classmethod
    def user(cls, content: str) -> "LLMMessage":
        return cls(role=MessageRole.USER, content=content)

    @classmethod
    def assistant(cls, content: str) -> "LLMMessage":
        return cls(role=MessageRole.ASSISTANT, content=content)

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role.value, "content": self.content}


@dataclass
class LLMResponse:
    """LLM 响应"""
    content: str
    model: str
    usage: dict[str, int] = field(default_factory=dict)
    finish_reason: Optional[str] = None
    raw_response: Optional[Any] = None

    @property
    def input_tokens(self) -> int:
        return self.usage.get("input_tokens", 0)

    @property
    def output_tokens(self) -> int:
        return self.usage.get("output_tokens", 0)

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


class BaseLLMService(BaseService):
    """LLM 服务基类"""

    service_type = ServiceType.LLM

    @abstractmethod
    async def generate(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        json_mode: bool = False,
        **kwargs,
    ) -> ServiceResult:
        """
        生成文本

        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大 token 数
            json_mode: 是否返回 JSON 格式
            **kwargs: 其他参数

        Returns:
            ServiceResult with LLMResponse
        """
        pass

    @abstractmethod
    async def generate_stream(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs,
    ):
        """
        流式生成文本

        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大 token 数
            **kwargs: 其他参数

        Yields:
            文本片段
        """
        pass

    async def generate_json(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.3,
        max_tokens: int = 4096,
        **kwargs,
    ) -> ServiceResult:
        """
        生成 JSON 格式输出

        Args:
            messages: 消息列表
            temperature: 温度参数（JSON 模式建议较低）
            max_tokens: 最大 token 数
            **kwargs: 其他参数

        Returns:
            ServiceResult with parsed JSON
        """
        result = await self.generate(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=True,
            **kwargs,
        )

        if not result.success:
            return result

        import json

        try:
            response: LLMResponse = result.data
            parsed = json.loads(response.content)
            return ServiceResult.ok(parsed, {"raw_response": response})
        except json.JSONDecodeError as e:
            return ServiceResult.fail(f"JSON parse error: {e}")
