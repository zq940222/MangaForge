"""
Google Gemini Service Implementation

使用新的 google-genai SDK (替代已弃用的 google-generativeai)
"""
from typing import AsyncIterator

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseLLMService, LLMMessage, LLMResponse


class GeminiService(BaseLLMService):
    """Google Gemini 服务实现"""

    provider = "gemini"

    # Gemini 稳定版模型列表（按推荐顺序）
    STABLE_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        from google import genai

        # 使用新的 google-genai SDK
        self.client = genai.Client(api_key=config.api_key)
        # 默认使用稳定版 gemini-2.0-flash
        self.model_name = config.model or "gemini-2.0-flash"
        self._last_error: str | None = None

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        try:
            # 使用异步客户端测试连接
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents="Reply with just the word 'ok'",
            )

            # 检查响应是否有效
            if response is None:
                raise Exception("Empty response from API")

            # 检查文本内容
            if response.text:
                return True

            raise Exception("Response has no text content")

        except Exception as e:
            error_str = str(e).lower()
            # 分析错误类型并提供更友好的错误信息
            if "api_key" in error_str or "api key" in error_str or "invalid" in error_str:
                raise Exception("Invalid API key: Please check your Gemini API key")
            elif "permission" in error_str or "denied" in error_str or "403" in error_str:
                raise Exception("Permission denied: Your API key may not have access to this model")
            elif "quota" in error_str or "rate" in error_str or "429" in error_str:
                raise Exception("Rate limit or quota exceeded: Please try again later")
            elif "not found" in error_str or "404" in error_str:
                raise Exception(f"Model '{self.model_name}' not found: Please select a different model")
            elif "timeout" in error_str or "timed out" in error_str:
                raise Exception("Connection timeout: Please check your network")
            else:
                # 重新抛出原始异常
                raise

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        try:
            # 使用异步客户端获取模型列表
            gemini_models = []
            async for model in await self.client.aio.models.list():
                model_name = model.name
                # 只返回 Gemini 模型
                if "gemini" in model_name.lower():
                    # 移除 "models/" 前缀
                    clean_name = model_name.replace("models/", "")
                    gemini_models.append(clean_name)

            # 按照推荐顺序排序
            def model_priority(name: str) -> int:
                priorities = {
                    "gemini-2.5-flash": 0,
                    "gemini-2.0-flash": 1,
                    "gemini-1.5-flash": 2,
                    "gemini-1.5-pro": 3,
                    "gemini-2.5-pro": 4,
                }
                for key, priority in priorities.items():
                    if key in name:
                        return priority
                return 100

            gemini_models.sort(key=model_priority)
            return gemini_models if gemini_models else self.STABLE_MODELS

        except Exception:
            # 如果获取失败，返回默认列表
            return self.STABLE_MODELS

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
            from google.genai import types

            # 提取 system instruction 和构建内容
            system_instruction = None
            contents = []

            for msg in messages:
                if msg.role.value == "system":
                    system_instruction = msg.content
                elif msg.role.value == "user":
                    contents.append(types.Content(
                        role="user",
                        parts=[types.Part(text=msg.content)]
                    ))
                elif msg.role.value == "assistant":
                    contents.append(types.Content(
                        role="model",
                        parts=[types.Part(text=msg.content)]
                    ))

            # 配置生成参数
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                max_output_tokens=max_tokens,
            )

            if json_mode:
                config.response_mime_type = "application/json"

            # 调用 API
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=contents if len(contents) > 1 else contents[0].parts[0].text if contents else "",
                config=config,
            )

            # 构建响应
            usage = {}
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = {
                    "input_tokens": getattr(response.usage_metadata, 'prompt_token_count', 0),
                    "output_tokens": getattr(response.usage_metadata, 'candidates_token_count', 0),
                }

            finish_reason = None
            if response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason'):
                    finish_reason = str(candidate.finish_reason)

            llm_response = LLMResponse(
                content=response.text,
                model=self.model_name,
                usage=usage,
                finish_reason=finish_reason,
                raw_response=response,
            )

            return ServiceResult.ok(llm_response)

        except Exception as e:
            error_msg = str(e)
            if "API_KEY" in error_msg.upper() or "AUTHENTICATION" in error_msg.upper():
                return ServiceResult.fail(f"Authentication error: {e}")
            elif "QUOTA" in error_msg.upper() or "RATE" in error_msg.upper():
                return ServiceResult.fail(f"Rate limit exceeded: {e}")
            else:
                return ServiceResult.fail(f"Gemini API error: {e}")

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 4096,
        **kwargs,
    ) -> AsyncIterator[str]:
        """流式生成文本"""
        from google.genai import types

        # 提取 system instruction 和构建内容
        system_instruction = None
        contents = []

        for msg in messages:
            if msg.role.value == "system":
                system_instruction = msg.content
            elif msg.role.value == "user":
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part(text=msg.content)]
                ))
            elif msg.role.value == "assistant":
                contents.append(types.Content(
                    role="model",
                    parts=[types.Part(text=msg.content)]
                ))

        # 配置生成参数
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        # 调用流式 API
        async for chunk in await self.client.aio.models.generate_content_stream(
            model=self.model_name,
            contents=contents if len(contents) > 1 else contents[0].parts[0].text if contents else "",
            config=config,
        ):
            if chunk.text:
                yield chunk.text
