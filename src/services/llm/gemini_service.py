"""
Google Gemini Service Implementation
"""
from typing import AsyncIterator

from src.services.base import ServiceConfig, ServiceResult
from .base import BaseLLMService, LLMMessage, LLMResponse


class GeminiService(BaseLLMService):
    """Google Gemini 服务实现"""

    provider = "gemini"

    # Gemini 稳定版模型列表（按推荐顺序）
    STABLE_MODELS = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash-8b",
        "gemini-1.0-pro",
    ]

    def __init__(self, config: ServiceConfig):
        super().__init__(config)
        # 使用 google-generativeai 库
        import google.generativeai as genai

        genai.configure(api_key=config.api_key)
        self.genai = genai
        # 默认使用稳定版 gemini-1.5-flash
        self.model_name = config.model or "gemini-1.5-flash"
        self._last_error: str | None = None
        try:
            self.model = genai.GenerativeModel(self.model_name)
        except Exception as e:
            self._last_error = str(e)
            self.model = None

    async def health_check(self) -> bool:
        """检查服务是否可用"""
        import asyncio

        # 如果模型初始化失败
        if self.model is None:
            raise Exception(f"Model initialization failed: {self._last_error}")

        try:
            # 使用 generate_content_async 直接测试 API 连接和模型可用性
            # 这是最可靠的方式，因为它同时验证 API key 和模型访问权限
            response = await self.model.generate_content_async(
                "Reply with just the word 'ok'",
            )

            # 检查响应是否有效
            if response is None:
                raise Exception("Empty response from API")

            # 检查是否有候选响应
            if not response.candidates:
                # 可能被安全过滤器阻止
                if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                    feedback = response.prompt_feedback
                    if hasattr(feedback, 'block_reason') and feedback.block_reason:
                        raise Exception(f"Request blocked: {feedback.block_reason}")
                raise Exception("No response candidates returned")

            # 检查文本内容
            try:
                text = response.text
                if text is not None:
                    return True
            except ValueError as e:
                # response.text 可能抛出 ValueError 如果被阻止
                raise Exception(f"Response blocked or invalid: {e}")

            raise Exception("Response has no text content")

        except Exception as e:
            error_str = str(e).lower()
            # 分析错误类型并提供更友好的错误信息
            if "api_key" in error_str or "api key" in error_str or "invalid" in error_str:
                raise Exception(f"Invalid API key: Please check your Gemini API key")
            elif "permission" in error_str or "denied" in error_str or "403" in error_str:
                raise Exception(f"Permission denied: Your API key may not have access to this model")
            elif "quota" in error_str or "rate" in error_str or "429" in error_str:
                raise Exception(f"Rate limit or quota exceeded: Please try again later")
            elif "not found" in error_str or "404" in error_str:
                raise Exception(f"Model '{self.model_name}' not found: Please select a different model")
            elif "timeout" in error_str or "timed out" in error_str:
                raise Exception(f"Connection timeout: Please check your network")
            else:
                # 重新抛出原始异常
                raise

    async def get_models(self) -> list[str]:
        """获取可用模型列表"""
        import google.generativeai as genai

        try:
            # 动态获取用户 API key 可用的模型
            models = list(genai.list_models())
            gemini_models = []

            for model in models:
                # 只返回支持 generateContent 的 Gemini 模型
                if "gemini" in model.name.lower() and "generateContent" in model.supported_generation_methods:
                    # 移除 "models/" 前缀
                    model_name = model.name.replace("models/", "")
                    gemini_models.append(model_name)

            # 按照推荐顺序排序
            def model_priority(name: str) -> int:
                priorities = {
                    "gemini-1.5-flash": 0,
                    "gemini-1.5-pro": 1,
                    "gemini-2.0-flash-exp": 2,
                    "gemini-1.5-flash-8b": 3,
                    "gemini-1.0-pro": 4,
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
            from google.generativeai.types import GenerationConfig

            # 构建对话历史
            system_instruction = None
            chat_history = []

            for msg in messages:
                if msg.role.value == "system":
                    system_instruction = msg.content
                elif msg.role.value == "user":
                    chat_history.append({"role": "user", "parts": [msg.content]})
                elif msg.role.value == "assistant":
                    chat_history.append({"role": "model", "parts": [msg.content]})

            # 创建带有 system instruction 的模型
            model = self.genai.GenerativeModel(
                self.model_name,
                system_instruction=system_instruction,
            )

            # 配置生成参数
            generation_config = GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )

            if json_mode:
                generation_config.response_mime_type = "application/json"

            # 如果只有一条用户消息，直接生成
            if len(chat_history) == 1 and chat_history[0]["role"] == "user":
                response = await model.generate_content_async(
                    chat_history[0]["parts"][0],
                    generation_config=generation_config,
                )
            else:
                # 使用聊天模式
                chat = model.start_chat(history=chat_history[:-1] if chat_history else [])
                last_message = chat_history[-1]["parts"][0] if chat_history else ""
                response = await chat.send_message_async(
                    last_message,
                    generation_config=generation_config,
                )

            # 构建响应
            usage = {}
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = {
                    "input_tokens": response.usage_metadata.prompt_token_count,
                    "output_tokens": response.usage_metadata.candidates_token_count,
                }

            llm_response = LLMResponse(
                content=response.text,
                model=self.model_name,
                usage=usage,
                finish_reason=response.candidates[0].finish_reason.name if response.candidates else None,
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
        from google.generativeai.types import GenerationConfig

        # 构建对话历史
        system_instruction = None
        chat_history = []

        for msg in messages:
            if msg.role.value == "system":
                system_instruction = msg.content
            elif msg.role.value == "user":
                chat_history.append({"role": "user", "parts": [msg.content]})
            elif msg.role.value == "assistant":
                chat_history.append({"role": "model", "parts": [msg.content]})

        # 创建带有 system instruction 的模型
        model = self.genai.GenerativeModel(
            self.model_name,
            system_instruction=system_instruction,
        )

        # 配置生成参数
        generation_config = GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )

        # 如果只有一条用户消息，直接生成
        if len(chat_history) == 1 and chat_history[0]["role"] == "user":
            response = await model.generate_content_async(
                chat_history[0]["parts"][0],
                generation_config=generation_config,
                stream=True,
            )
        else:
            # 使用聊天模式
            chat = model.start_chat(history=chat_history[:-1] if chat_history else [])
            last_message = chat_history[-1]["parts"][0] if chat_history else ""
            response = await chat.send_message_async(
                last_message,
                generation_config=generation_config,
                stream=True,
            )

        async for chunk in response:
            if chunk.text:
                yield chunk.text
