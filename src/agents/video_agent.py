"""
Video Agent - 视频生成 Agent (核心能力)

负责：
1. 调用图生视频模型（可灵/Hunyuan/LTX）
2. 将静态分镜转为动态视频片段
3. 控制镜头运动
"""
from typing import Any

from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent
from src.services.factory import get_service_factory
from src.services.video.base import CameraMovement, VideoGenerationRequest


class VideoState(AgentState):
    """视频 Agent 状态"""

    # 输入
    rendered_shots: list[dict[str, Any]] = Field(default_factory=list)
    storyboard: list[dict[str, Any]] = Field(default_factory=list)
    aspect_ratio: str = "9:16"
    project_id: str = ""

    # 处理过程
    current_shot_index: int = 0
    generated_videos: list[dict[str, Any]] = Field(default_factory=list)

    # 输出
    video_results: list[dict[str, Any]] = Field(default_factory=list)


class VideoAgent(BaseAgent):
    """视频生成 Agent"""

    name = "video_agent"
    description = "将静态分镜图转为动态视频"

    CAMERA_MOVEMENT_MAP = {
        "static": CameraMovement.STATIC,
        "pan_left": CameraMovement.PAN_LEFT,
        "pan_right": CameraMovement.PAN_RIGHT,
        "pan_up": CameraMovement.PAN_UP,
        "pan_down": CameraMovement.PAN_DOWN,
        "zoom_in": CameraMovement.ZOOM_IN,
        "zoom_out": CameraMovement.ZOOM_OUT,
    }

    def __init__(self):
        self.service_factory = get_service_factory()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建视频生成工作流图"""
        graph = StateGraph(VideoState)

        graph.add_node("generate_videos", self._generate_videos)
        graph.add_node("save_results", self._save_results)

        graph.set_entry_point("generate_videos")
        graph.add_edge("generate_videos", "save_results")
        graph.add_edge("save_results", END)

        return graph.compile()

    def _get_shot_info(self, shot_id: int, storyboard: list[dict]) -> dict[str, Any]:
        """获取镜头信息"""
        for shot in storyboard:
            if shot.get("shot_id") == shot_id:
                return shot
        return {}

    async def _generate_videos(self, state: VideoState) -> dict[str, Any]:
        """生成所有视频"""
        video_service = self.service_factory.get_video_service()
        generated_videos = []

        for rendered in state.rendered_shots:
            if not rendered.get("success") or not rendered.get("image_path"):
                generated_videos.append({
                    "shot_id": rendered.get("shot_id"),
                    "success": False,
                    "error": "No image available",
                })
                continue

            # 获取镜头信息
            shot_info = self._get_shot_info(rendered["shot_id"], state.storyboard)

            # 获取镜头运动
            camera_movement_str = shot_info.get("camera_movement", "static")
            camera_movement = self.CAMERA_MOVEMENT_MAP.get(
                camera_movement_str, CameraMovement.STATIC
            )

            # 生成运动提示词
            motion_prompt = shot_info.get("action", "")

            request = VideoGenerationRequest(
                image_path=rendered["image_path"],
                prompt=motion_prompt,
                duration=min(shot_info.get("duration", 5), 5),  # 最长 5 秒
                camera_movement=camera_movement,
            )

            result = await video_service.generate(request)

            if result.success:
                generated_videos.append({
                    "shot_id": rendered["shot_id"],
                    "scene_id": rendered["scene_id"],
                    "video_data": result.data.video_data,
                    "duration": result.data.duration,
                    "success": True,
                })
            else:
                generated_videos.append({
                    "shot_id": rendered["shot_id"],
                    "scene_id": rendered.get("scene_id"),
                    "error": result.error,
                    "success": False,
                })

        return {
            "current_step": "generate_videos",
            "generated_videos": generated_videos,
        }

    async def _save_results(self, state: VideoState) -> dict[str, Any]:
        """保存视频结果"""
        from src.storage import get_storage

        storage = get_storage()
        video_results = []

        for video in state.generated_videos:
            if video.get("success") and video.get("video_data"):
                path = storage.upload_bytes(
                    data=video["video_data"],
                    project_id=state.project_id,
                    asset_type="video",
                    filename=f"shot_{video['scene_id']}_{video['shot_id']}.mp4",
                    content_type="video/mp4",
                )

                video_results.append({
                    "shot_id": video["shot_id"],
                    "scene_id": video["scene_id"],
                    "video_path": path,
                    "duration": video.get("duration", 0),
                    "success": True,
                })
            else:
                video_results.append({
                    "shot_id": video.get("shot_id"),
                    "scene_id": video.get("scene_id"),
                    "error": video.get("error", "Unknown error"),
                    "success": False,
                })

        return {
            "current_step": "complete",
            "video_results": video_results,
            "result": {
                "videos": video_results,
                "success_count": sum(1 for v in video_results if v.get("success")),
                "failed_count": sum(1 for v in video_results if not v.get("success")),
                "total_duration": sum(v.get("duration", 0) for v in video_results if v.get("success")),
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行视频生成

        Args:
            input_data: 包含:
                - rendered_shots: 渲染的图像
                - storyboard: 分镜数据
                - aspect_ratio: 画面比例
                - project_id: 项目 ID

        Returns:
            视频生成结果
        """
        initial_state = VideoState(
            rendered_shots=input_data.get("rendered_shots", []),
            storyboard=input_data.get("storyboard", []),
            aspect_ratio=input_data.get("aspect_ratio", "9:16"),
            project_id=input_data.get("project_id", ""),
            messages=[],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
