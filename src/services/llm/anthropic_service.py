"""
Anthropic Claude Service Implementation
"""
from typing import AsyncIterator

import anthropic
from anthropic import AsyncAnthropic

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseLLMService, LLMMessage, LLMResponse


class AnthropicService(BaseLLMService):
    """Anthropic Claude 服务实现"""

    provider = "anthropic"

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        self.client = AsyncAnthropic(
            api_key=config.api_key,
            base_url=config.endpoint,
        )
        self.model = config.model or "claude-3-5-sonnet-20241022"

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        try:
            # 发送一个简单请求测试连接
            await self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "hi"}],
            )
            return True
        except Exception:
            return False

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        # Anthropic 不提供模型列表 API，返回已知模型
        return [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
        ]

    async def generate(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        json_mode: bool = False,
        **kwargs,
    ) -> ServiceResult:
        """生成文本"""
        try:
            # 分离 system 消息
            system_message = None
            chat_messages = []

            for msg in messages:
                if msg.role.value == "system":
                    system_message = msg.content
                else:
                    chat_messages.append(msg.to_dict())

            # 构建请求参数
            request_params = {
                "model": self.model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": chat_messages,
            }

            if system_message:
                request_params["system"] = system_message

            # 调用 API
            response = await self.client.messages.create(**request_params)

            # 构建响应
            llm_response = LLMResponse(
                content=response.content[0].text,
                model=response.model,
                usage={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
                finish_reason=response.stop_reason,
                raw_response=response,
            )

            return ServiceResult.ok(llm_response)

        except anthropic.APIConnectionError as e:
            return ServiceResult.fail(f"Connection error: {e}")
        except anthropic.RateLimitError as e:
            return ServiceResult.fail(f"Rate limit exceeded: {e}")
        except anthropic.APIStatusError as e:
            return ServiceResult.fail(f"API error: {e.message}")
        except Exception as e:
            return ServiceResult.fail(f"Unexpected error: {e}")

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs,
    ) -> AsyncIterator[str]:
        """流式生成文本"""
        # 分离 system 消息
        system_message = None
        chat_messages = []

        for msg in messages:
            if msg.role.value == "system":
                system_message = msg.content
            else:
                chat_messages.append(msg.to_dict())

        # 构建请求参数
        request_params = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": chat_messages,
        }

        if system_message:
            request_params["system"] = system_message

        # 流式调用
        async with self.client.messages.stream(**request_params) as stream:
            async for text in stream.text_stream:
                yield text
