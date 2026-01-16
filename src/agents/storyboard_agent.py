"""
Storyboard Agent - 分镜规划 Agent

负责：
1. 根据剧本生成每个镜头的详细描述
2. 规划镜头构图和角色位置
3. 生成图像生成用的 Prompt
"""
from typing import Any

from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent
from src.services.factory import get_service_factory
from src.services.llm.base import LLMMessage


class StoryboardState(AgentState):
    """分镜 Agent 状态"""

    # 输入
    script: dict[str, Any] = Field(default_factory=dict)
    characters: list[dict[str, Any]] = Field(default_factory=list)
    style: str = "anime"
    aspect_ratio: str = "9:16"

    # 处理过程
    current_scene_index: int = 0
    processed_shots: list[dict[str, Any]] = Field(default_factory=list)

    # 输出
    storyboard: list[dict[str, Any]] = Field(default_factory=list)


class StoryboardAgent(BaseAgent):
    """分镜规划 Agent"""

    name = "storyboard_agent"
    description = "规划分镜，生成图像 Prompt"

    SHOT_PROMPT_TEMPLATE = """You are a professional storyboard artist. Generate a detailed image prompt for the following shot.

Scene: {scene_location} ({scene_time})
Atmosphere: {atmosphere}
Style: {style}

Shot details:
- Camera: {camera_type}
- Characters: {characters}
- Action: {action}

Character descriptions:
{character_descriptions}

Generate a detailed image prompt in English that includes:
1. Scene/background description
2. Character appearance and positions
3. Actions and expressions
4. Lighting and mood
5. Composition details

For a {aspect_ratio} vertical/horizontal frame.

Output only the prompt, no explanations."""

    def __init__(self, llm_service=None):
        """
        初始化分镜Agent

        Args:
            llm_service: 可选的LLM服务实例。如果不提供，将使用默认的服务工厂获取。
        """
        self._llm_service = llm_service
        self.service_factory = get_service_factory()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建分镜规划工作流图"""
        graph = StateGraph(StoryboardState)

        graph.add_node("process_shots", self._process_shots)
        graph.add_node("finalize", self._finalize)

        graph.set_entry_point("process_shots")
        graph.add_edge("process_shots", "finalize")
        graph.add_edge("finalize", END)

        return graph.compile()

    def _get_character_description(self, char_name: str, characters: list[dict]) -> str:
        """获取角色描述"""
        for char in characters:
            if char.get("name") == char_name:
                return f"{char_name}: {char.get('description', '')}"
        return f"{char_name}: unknown character"

    async def _process_shots(self, state: StoryboardState) -> dict[str, Any]:
        """处理所有镜头"""
        # 优先使用传入的LLM服务，否则使用默认的
        if self._llm_service:
            llm_service = self._llm_service
        else:
            llm_service = self.service_factory.get_llm_service()
        processed_shots = []

        scenes = state.script.get("scenes", [])

        for scene in scenes:
            scene_location = scene.get("location", "")
            scene_time = scene.get("time", "")
            atmosphere = scene.get("atmosphere", "")

            for shot in scene.get("shots", []):
                # 获取镜头中角色的描述
                shot_characters = shot.get("characters", [])
                char_descriptions = "\n".join([
                    self._get_character_description(c, state.characters)
                    for c in shot_characters
                ])

                # 如果剧本中已有 image_prompt，直接使用
                if shot.get("image_prompt"):
                    enhanced_prompt = self._enhance_prompt(
                        shot["image_prompt"],
                        state.style,
                        state.aspect_ratio,
                    )
                else:
                    # 生成新的 prompt
                    prompt_request = self.SHOT_PROMPT_TEMPLATE.format(
                        scene_location=scene_location,
                        scene_time=scene_time,
                        atmosphere=atmosphere,
                        style=state.style,
                        camera_type=shot.get("camera_type", "medium_shot"),
                        characters=", ".join(shot_characters),
                        action=shot.get("action", ""),
                        character_descriptions=char_descriptions,
                        aspect_ratio=state.aspect_ratio,
                    )

                    messages = [
                        LLMMessage.system("You are an expert storyboard artist."),
                        LLMMessage.user(prompt_request),
                    ]

                    result = await llm_service.generate(messages, temperature=0.7)

                    if result.success:
                        enhanced_prompt = self._enhance_prompt(
                            result.data.content,
                            state.style,
                            state.aspect_ratio,
                        )
                    else:
                        enhanced_prompt = shot.get("action", "")

                processed_shot = {
                    "scene_id": scene.get("scene_id"),
                    "shot_id": shot.get("shot_id"),
                    "duration": shot.get("duration", 5),
                    "camera_type": shot.get("camera_type", "medium_shot"),
                    "camera_movement": shot.get("camera_movement", "static"),
                    "characters": shot_characters,
                    "action": shot.get("action", ""),
                    "dialog": shot.get("dialog", {}),
                    "image_prompt": enhanced_prompt,
                    "negative_prompt": self._get_negative_prompt(),
                }
                processed_shots.append(processed_shot)

        return {
            "current_step": "process_shots",
            "processed_shots": processed_shots,
        }

    def _enhance_prompt(self, prompt: str, style: str, aspect_ratio: str) -> str:
        """增强提示词"""
        style_tags = {
            "anime": "anime style, high quality, detailed, vibrant colors, clean lines, studio ghibli quality",
            "manga": "manga style, detailed linework, dramatic shading, professional quality",
            "realistic": "photorealistic, cinematic, detailed, professional photography",
            "3d": "3D render, unreal engine, octane render, high quality",
        }

        composition_tags = {
            "9:16": "vertical composition, portrait orientation",
            "16:9": "horizontal composition, landscape orientation, cinematic aspect ratio",
        }

        base_quality = "masterpiece, best quality, highly detailed"
        style_tag = style_tags.get(style, style_tags["anime"])
        comp_tag = composition_tags.get(aspect_ratio, "")

        return f"{prompt}, {base_quality}, {style_tag}, {comp_tag}"

    def _get_negative_prompt(self) -> str:
        """获取负面提示词"""
        return (
            "lowres, bad anatomy, bad hands, text, error, missing fingers, "
            "extra digit, fewer digits, cropped, worst quality, low quality, "
            "normal quality, jpeg artifacts, signature, watermark, username, "
            "blurry, deformed, ugly, duplicate, morbid, mutilated"
        )

    async def _finalize(self, state: StoryboardState) -> dict[str, Any]:
        """最终化输出"""
        return {
            "current_step": "complete",
            "storyboard": state.processed_shots,
            "result": {
                "shots": state.processed_shots,
                "total_shots": len(state.processed_shots),
                "total_duration": sum(s.get("duration", 5) for s in state.processed_shots),
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行分镜规划

        Args:
            input_data: 包含:
                - script: 剧本数据
                - characters: 角色信息
                - style: 风格
                - aspect_ratio: 画面比例

        Returns:
            分镜数据
        """
        initial_state = StoryboardState(
            script=input_data.get("script", {}),
            characters=input_data.get("characters", []),
            style=input_data.get("style", "anime"),
            aspect_ratio=input_data.get("aspect_ratio", "9:16"),
            messages=[],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
