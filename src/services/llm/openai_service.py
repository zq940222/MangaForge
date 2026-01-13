"""
OpenAI Service Implementation
"""
from typing import AsyncIterator

import openai
from openai import AsyncOpenAI

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseLLMService, LLMMessage, LLMResponse


class OpenAIService(BaseLLMService):
    """OpenAI GPT 服务实现"""

    provider = "openai"

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        self.client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.endpoint,
        )
        self.model = config.model or "gpt-4-turbo-preview"

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        try:
            await self.client.models.list()
            return True
        except Exception:
            return False

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        try:
            models = await self.client.models.list()
            return [m.id for m in models.data if "gpt" in m.id.lower()]
        except Exception:
            return [
                "gpt-4-turbo-preview",
                "gpt-4",
                "gpt-4-32k",
                "gpt-3.5-turbo",
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
            # 构建消息
            chat_messages = [msg.to_dict() for msg in messages]

            # 构建请求参数
            request_params = {
                "model": self.model,
                "messages": chat_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            # JSON 模式
            if json_mode:
                request_params["response_format"] = {"type": "json_object"}

            # 调用 API
            response = await self.client.chat.completions.create(**request_params)

            # 构建响应
            choice = response.choices[0]
            llm_response = LLMResponse(
                content=choice.message.content or "",
                model=response.model,
                usage={
                    "input_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "output_tokens": response.usage.completion_tokens if response.usage else 0,
                },
                finish_reason=choice.finish_reason,
                raw_response=response,
            )

            return ServiceResult.ok(llm_response)

        except openai.APIConnectionError as e:
            return ServiceResult.fail(f"Connection error: {e}")
        except openai.RateLimitError as e:
            return ServiceResult.fail(f"Rate limit exceeded: {e}")
        except openai.APIStatusError as e:
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
        chat_messages = [msg.to_dict() for msg in messages]

        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=chat_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
