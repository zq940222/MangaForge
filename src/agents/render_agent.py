"""
Render Agent - 图像渲染 Agent

负责：
1. 调用 ComfyUI 批量生成分镜图
2. 注入角色 LoRA/IP-Adapter 保证一致性
3. 后处理：超分、色彩校正
"""
from typing import Any

from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent
from src.services.factory import get_service_factory
from src.services.image.base import ImageGenerationRequest


class RenderState(AgentState):
    """渲染 Agent 状态"""

    # 输入
    storyboard: list[dict[str, Any]] = Field(default_factory=list)
    characters: list[dict[str, Any]] = Field(default_factory=list)
    style: str = "anime"
    aspect_ratio: str = "9:16"
    project_id: str = ""

    # 处理过程
    current_shot_index: int = 0
    rendered_images: list[dict[str, Any]] = Field(default_factory=list)

    # 输出
    render_results: list[dict[str, Any]] = Field(default_factory=list)


class RenderAgent(BaseAgent):
    """图像渲染 Agent"""

    name = "render_agent"
    description = "批量生成分镜图像"

    def __init__(self):
        self.service_factory = get_service_factory()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建渲染工作流图"""
        graph = StateGraph(RenderState)

        graph.add_node("render_shots", self._render_shots)
        graph.add_node("save_results", self._save_results)

        graph.set_entry_point("render_shots")
        graph.add_edge("render_shots", "save_results")
        graph.add_edge("save_results", END)

        return graph.compile()

    def _get_dimensions(self, aspect_ratio: str) -> tuple[int, int]:
        """根据宽高比获取尺寸"""
        dimensions = {
            "9:16": (768, 1344),
            "16:9": (1344, 768),
            "1:1": (1024, 1024),
        }
        return dimensions.get(aspect_ratio, (768, 1344))

    def _find_character_lora(self, char_name: str, characters: list[dict]) -> tuple[str | None, str | None]:
        """查找角色的 LoRA 和参考图"""
        for char in characters:
            if char.get("name") == char_name:
                return (
                    char.get("lora_path"),
                    char.get("reference_images", [None])[0],
                )
        return None, None

    async def _render_shots(self, state: RenderState) -> dict[str, Any]:
        """渲染所有镜头"""
        image_service = self.service_factory.get_image_service()
        width, height = self._get_dimensions(state.aspect_ratio)
        rendered_images = []

        for shot in state.storyboard:
            # 查找主角色的 LoRA
            shot_characters = shot.get("characters", [])
            lora_name = None
            character_image = None

            if shot_characters:
                lora_name, character_image = self._find_character_lora(
                    shot_characters[0], state.characters
                )

            request = ImageGenerationRequest(
                prompt=shot.get("image_prompt", ""),
                negative_prompt=shot.get("negative_prompt", ""),
                width=width,
                height=height,
                steps=25,
                cfg_scale=7.0,
                lora_name=lora_name,
                character_image=character_image,
            )

            result = await image_service.generate(request)

            if result.success and result.data.images:
                rendered_images.append({
                    "shot_id": shot.get("shot_id"),
                    "scene_id": shot.get("scene_id"),
                    "image_data": result.data.images[0],
                    "seed": result.data.seeds[0] if result.data.seeds else -1,
                    "success": True,
                })
            else:
                rendered_images.append({
                    "shot_id": shot.get("shot_id"),
                    "scene_id": shot.get("scene_id"),
                    "image_data": None,
                    "error": result.error if not result.success else "No image generated",
                    "success": False,
                })

        return {
            "current_step": "render_shots",
            "rendered_images": rendered_images,
        }

    async def _save_results(self, state: RenderState) -> dict[str, Any]:
        """保存渲染结果"""
        from src.storage import get_storage

        storage = get_storage()
        render_results = []

        for img_result in state.rendered_images:
            if img_result.get("success") and img_result.get("image_data"):
                # 保存图像
                path = storage.upload_bytes(
                    data=img_result["image_data"],
                    project_id=state.project_id,
                    asset_type="storyboard",
                    filename=f"shot_{img_result['scene_id']}_{img_result['shot_id']}.png",
                    content_type="image/png",
                )

                render_results.append({
                    "shot_id": img_result["shot_id"],
                    "scene_id": img_result["scene_id"],
                    "image_path": path,
                    "seed": img_result.get("seed", -1),
                    "success": True,
                })
            else:
                render_results.append({
                    "shot_id": img_result.get("shot_id"),
                    "scene_id": img_result.get("scene_id"),
                    "error": img_result.get("error", "Unknown error"),
                    "success": False,
                })

        return {
            "current_step": "complete",
            "render_results": render_results,
            "result": {
                "rendered_shots": render_results,
                "success_count": sum(1 for r in render_results if r.get("success")),
                "failed_count": sum(1 for r in render_results if not r.get("success")),
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行图像渲染

        Args:
            input_data: 包含:
                - storyboard: 分镜数据
                - characters: 角色信息
                - style: 风格
                - aspect_ratio: 画面比例
                - project_id: 项目 ID

        Returns:
            渲染结果
        """
        initial_state = RenderState(
            storyboard=input_data.get("storyboard", []),
            characters=input_data.get("characters", []),
            style=input_data.get("style", "anime"),
            aspect_ratio=input_data.get("aspect_ratio", "9:16"),
            project_id=input_data.get("project_id", ""),
            messages=[],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
