"""
Character Agent - 角色设计 Agent

负责：
1. 根据角色描述生成角色参考图
2. 建立角色视觉一致性（IP-Adapter 特征）
3. 管理角色资产
"""
from typing import Any, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent
from src.services.factory import get_service_factory
from src.services.image.base import ImageGenerationRequest
from src.services.llm.base import LLMMessage


class CharacterState(AgentState):
    """角色 Agent 状态"""

    # 输入
    characters: list[dict[str, Any]] = Field(default_factory=list)
    style: str = "anime"
    project_id: str = ""

    # 处理过程
    current_character_index: int = 0
    generated_images: dict[str, list[bytes]] = Field(default_factory=dict)
    character_prompts: dict[str, str] = Field(default_factory=dict)

    # 输出
    character_assets: list[dict[str, Any]] = Field(default_factory=list)


class CharacterAgent(BaseAgent):
    """角色设计 Agent"""

    name = "character_agent"
    description = "生成角色参考图，建立视觉一致性"

    PROMPT_TEMPLATE = """You are creating a character reference image for an {style} style manga/comic.

Character details:
- Name: {name}
- Description: {description}
- Gender: {gender}
- Age: {age_range}
- Personality: {personality}

Generate a detailed image prompt in English for creating a character portrait.
The prompt should include:
1. Character appearance details
2. Clothing and accessories
3. Expression and pose
4. Art style specifications
5. Quality tags

Output only the prompt, no explanations."""

    def __init__(self):
        self.service_factory = get_service_factory()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建角色生成工作流图"""
        graph = StateGraph(CharacterState)

        graph.add_node("generate_prompts", self._generate_prompts)
        graph.add_node("generate_images", self._generate_images)
        graph.add_node("save_assets", self._save_assets)

        graph.set_entry_point("generate_prompts")
        graph.add_edge("generate_prompts", "generate_images")
        graph.add_edge("generate_images", "save_assets")
        graph.add_edge("save_assets", END)

        return graph.compile()

    async def _generate_prompts(self, state: CharacterState) -> dict[str, Any]:
        """为每个角色生成图像提示词"""
        llm_service = self.service_factory.get_llm_service()
        character_prompts = {}

        for char in state.characters:
            prompt_request = self.PROMPT_TEMPLATE.format(
                style=state.style,
                name=char.get("name", "Unknown"),
                description=char.get("description", ""),
                gender=char.get("gender", ""),
                age_range=char.get("age_range", ""),
                personality=char.get("personality", ""),
            )

            messages = [
                LLMMessage.system("You are an expert at creating image prompts for character generation."),
                LLMMessage.user(prompt_request),
            ]

            result = await llm_service.generate(messages, temperature=0.7)

            if result.success:
                # 添加风格和质量标签
                base_prompt = result.data.content
                style_tags = self._get_style_tags(state.style)
                full_prompt = f"{base_prompt}, {style_tags}"
                character_prompts[char.get("name", "Unknown")] = full_prompt

        return {
            "current_step": "generate_prompts",
            "character_prompts": character_prompts,
        }

    def _get_style_tags(self, style: str) -> str:
        """获取风格标签"""
        style_map = {
            "anime": "anime style, high quality, detailed, vibrant colors, clean lines",
            "manga": "manga style, black and white, detailed linework, screentone",
            "realistic": "realistic, photorealistic, detailed, cinematic lighting",
            "3d": "3D render, octane render, high quality, detailed textures",
        }
        return style_map.get(style, style_map["anime"])

    async def _generate_images(self, state: CharacterState) -> dict[str, Any]:
        """生成角色参考图"""
        image_service = self.service_factory.get_image_service()
        generated_images = {}

        for char_name, prompt in state.character_prompts.items():
            request = ImageGenerationRequest(
                prompt=prompt,
                negative_prompt="lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, deformed",
                width=1024,
                height=1024,
                steps=30,
                cfg_scale=7.5,
                batch_size=1,
            )

            result = await image_service.generate(request)

            if result.success:
                generated_images[char_name] = result.data.images

        return {
            "current_step": "generate_images",
            "generated_images": generated_images,
        }

    async def _save_assets(self, state: CharacterState) -> dict[str, Any]:
        """保存角色资产"""
        from src.storage import get_storage

        storage = get_storage()
        character_assets = []

        for char in state.characters:
            char_name = char.get("name", "Unknown")
            images = state.generated_images.get(char_name, [])

            saved_paths = []
            for i, img_data in enumerate(images):
                path = storage.upload_bytes(
                    data=img_data,
                    project_id=state.project_id,
                    asset_type="character",
                    filename=f"{char_name}_{i}.png",
                    content_type="image/png",
                )
                saved_paths.append(path)

            character_assets.append({
                "name": char_name,
                "description": char.get("description", ""),
                "gender": char.get("gender", ""),
                "age_range": char.get("age_range", ""),
                "personality": char.get("personality", ""),
                "voice_style": char.get("voice_style", ""),
                "reference_images": saved_paths,
                "prompt": state.character_prompts.get(char_name, ""),
            })

        return {
            "current_step": "complete",
            "character_assets": character_assets,
            "result": {
                "characters": character_assets,
                "total_images": sum(len(c["reference_images"]) for c in character_assets),
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行角色生成

        Args:
            input_data: 包含:
                - characters: 角色信息列表
                - style: 风格
                - project_id: 项目 ID

        Returns:
            生成的角色资产
        """
        initial_state = CharacterState(
            characters=input_data.get("characters", []),
            style=input_data.get("style", "anime"),
            project_id=input_data.get("project_id", ""),
            messages=[],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
