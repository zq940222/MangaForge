"""
Lipsync Agent - 口型同步 Agent (核心能力)

负责：
1. 将静态角色图 + 音频合成为说话视频
2. 使用 SadTalker/LivePortrait
3. 替换视频片段中的角色面部
"""
from typing import Any

from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent
from src.services.factory import get_service_factory
from src.services.lipsync.base import LipsyncRequest


class LipsyncState(AgentState):
    """口型同步 Agent 状态"""

    # 输入
    rendered_shots: list[dict[str, Any]] = Field(default_factory=list)  # 渲染的图像
    audio_results: list[dict[str, Any]] = Field(default_factory=list)   # 配音结果
    project_id: str = ""

    # 处理过程
    generated_lipsync: list[dict[str, Any]] = Field(default_factory=list)

    # 输出
    lipsync_results: list[dict[str, Any]] = Field(default_factory=list)


class LipsyncAgent(BaseAgent):
    """口型同步 Agent"""

    name = "lipsync_agent"
    description = "生成角色说话的口型同步视频"

    def __init__(self):
        self.service_factory = get_service_factory()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建口型同步工作流图"""
        graph = StateGraph(LipsyncState)

        graph.add_node("generate_lipsync", self._generate_lipsync)
        graph.add_node("save_results", self._save_results)

        graph.set_entry_point("generate_lipsync")
        graph.add_edge("generate_lipsync", "save_results")
        graph.add_edge("save_results", END)

        return graph.compile()

    def _find_image_for_shot(self, shot_id: int, rendered_shots: list[dict]) -> str | None:
        """查找镜头对应的图像"""
        for shot in rendered_shots:
            if shot.get("shot_id") == shot_id and shot.get("success"):
                return shot.get("image_path")
        return None

    def _find_audio_for_shot(self, shot_id: int, audio_results: list[dict]) -> dict | None:
        """查找镜头对应的音频"""
        for audio in audio_results:
            if audio.get("shot_id") == shot_id and audio.get("success") and audio.get("has_dialog"):
                return audio
        return None

    async def _generate_lipsync(self, state: LipsyncState) -> dict[str, Any]:
        """生成口型同步视频"""
        lipsync_service = self.service_factory.get_lipsync_service()
        generated_lipsync = []

        for audio in state.audio_results:
            shot_id = audio.get("shot_id")

            # 检查是否有对白
            if not audio.get("has_dialog") or not audio.get("success"):
                generated_lipsync.append({
                    "shot_id": shot_id,
                    "has_lipsync": False,
                    "reason": "no_dialog" if not audio.get("has_dialog") else "audio_failed",
                })
                continue

            # 查找对应的图像
            image_path = self._find_image_for_shot(shot_id, state.rendered_shots)
            if not image_path:
                generated_lipsync.append({
                    "shot_id": shot_id,
                    "has_lipsync": False,
                    "reason": "no_image",
                })
                continue

            audio_path = audio.get("audio_path")
            if not audio_path:
                generated_lipsync.append({
                    "shot_id": shot_id,
                    "has_lipsync": False,
                    "reason": "no_audio_path",
                })
                continue

            # 生成口型同步视频
            request = LipsyncRequest(
                image_path=image_path,
                audio_path=audio_path,
                enhance_face=True,
                still_mode=False,
            )

            result = await lipsync_service.generate(request)

            if result.success:
                generated_lipsync.append({
                    "shot_id": shot_id,
                    "scene_id": audio.get("scene_id"),
                    "video_data": result.data.video_data,
                    "duration": result.data.duration,
                    "has_lipsync": True,
                    "success": True,
                })
            else:
                generated_lipsync.append({
                    "shot_id": shot_id,
                    "scene_id": audio.get("scene_id"),
                    "has_lipsync": True,
                    "error": result.error,
                    "success": False,
                })

        return {
            "current_step": "generate_lipsync",
            "generated_lipsync": generated_lipsync,
        }

    async def _save_results(self, state: LipsyncState) -> dict[str, Any]:
        """保存口型同步结果"""
        from src.storage import get_storage

        storage = get_storage()
        lipsync_results = []

        for lipsync in state.generated_lipsync:
            if not lipsync.get("has_lipsync"):
                lipsync_results.append({
                    "shot_id": lipsync.get("shot_id"),
                    "has_lipsync": False,
                    "reason": lipsync.get("reason"),
                })
                continue

            if lipsync.get("success") and lipsync.get("video_data"):
                path = storage.upload_bytes(
                    data=lipsync["video_data"],
                    project_id=state.project_id,
                    asset_type="lipsync",
                    filename=f"lipsync_{lipsync['scene_id']}_{lipsync['shot_id']}.mp4",
                    content_type="video/mp4",
                )

                lipsync_results.append({
                    "shot_id": lipsync["shot_id"],
                    "scene_id": lipsync["scene_id"],
                    "lipsync_video_path": path,
                    "duration": lipsync.get("duration", 0),
                    "has_lipsync": True,
                    "success": True,
                })
            else:
                lipsync_results.append({
                    "shot_id": lipsync.get("shot_id"),
                    "scene_id": lipsync.get("scene_id"),
                    "has_lipsync": True,
                    "error": lipsync.get("error", "Unknown error"),
                    "success": False,
                })

        return {
            "current_step": "complete",
            "lipsync_results": lipsync_results,
            "result": {
                "lipsync_videos": lipsync_results,
                "lipsync_count": sum(1 for l in lipsync_results if l.get("has_lipsync")),
                "success_count": sum(1 for l in lipsync_results if l.get("success")),
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行口型同步

        Args:
            input_data: 包含:
                - rendered_shots: 渲染的图像
                - audio_results: 配音结果
                - project_id: 项目 ID

        Returns:
            口型同步结果
        """
        initial_state = LipsyncState(
            rendered_shots=input_data.get("rendered_shots", []),
            audio_results=input_data.get("audio_results", []),
            project_id=input_data.get("project_id", ""),
            messages=[],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
