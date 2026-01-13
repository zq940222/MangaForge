"""
Agent Orchestrator - 主编排器

负责串联所有 Agent，执行完整的漫剧生成流程：
剧本 → 角色 → 分镜 → 渲染 → 视频 → 配音 → 口型 → 剪辑
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional

from src.agents.script_agent import ScriptAgent
from src.agents.character_agent import CharacterAgent
from src.agents.storyboard_agent import StoryboardAgent
from src.agents.render_agent import RenderAgent
from src.agents.video_agent import VideoAgent
from src.agents.voice_agent import VoiceAgent
from src.agents.lipsync_agent import LipsyncAgent
from src.agents.editor_agent import EditorAgent


class GenerationStage(str, Enum):
    """生成阶段"""
    SCRIPT = "script"
    CHARACTER = "character"
    STORYBOARD = "storyboard"
    RENDER = "render"
    VIDEO = "video"
    VOICE = "voice"
    LIPSYNC = "lipsync"
    EDIT = "edit"
    COMPLETE = "complete"
    FAILED = "failed"


@dataclass
class GenerationProgress:
    """生成进度"""
    stage: GenerationStage
    progress: int  # 0-100
    message: str
    data: dict[str, Any] = field(default_factory=dict)


@dataclass
class GenerationConfig:
    """生成配置"""
    style: str = "anime"
    aspect_ratio: str = "9:16"
    target_duration: int = 60  # 秒
    add_subtitles: bool = True
    bgm_path: Optional[str] = None
    bgm_volume: float = 0.3

    # 跳过某些阶段（用于调试或重新生成）
    skip_script: bool = False
    skip_character: bool = False
    skip_video: bool = False
    skip_voice: bool = False
    skip_lipsync: bool = False


class MangaForgeOrchestrator:
    """漫剧生成编排器"""

    def __init__(
        self,
        service_factory: Optional[Any] = None,
        progress_callback: Optional[Callable] = None,
    ):
        """
        初始化编排器

        Args:
            service_factory: 服务工厂实例
            progress_callback: 进度回调函数，支持同步或异步
                签名: (stage: str, progress: float, message: str, details: dict = None)
        """
        self.service_factory = service_factory
        self.progress_callback = progress_callback

        # 初始化所有 Agent
        self.script_agent = ScriptAgent()
        self.character_agent = CharacterAgent()
        self.storyboard_agent = StoryboardAgent()
        self.render_agent = RenderAgent()
        self.video_agent = VideoAgent()
        self.voice_agent = VoiceAgent()
        self.lipsync_agent = LipsyncAgent()
        self.editor_agent = EditorAgent()

    async def _report_progress(
        self,
        stage: GenerationStage,
        progress: int,
        message: str,
        data: Optional[dict] = None,
    ) -> None:
        """报告进度"""
        if self.progress_callback:
            import asyncio

            # 支持同步和异步回调
            stage_str = stage.value if isinstance(stage, GenerationStage) else str(stage)

            if asyncio.iscoroutinefunction(self.progress_callback):
                await self.progress_callback(stage_str, float(progress), message, data or {})
            else:
                self.progress_callback(
                    GenerationProgress(
                        stage=stage,
                        progress=progress,
                        message=message,
                        data=data or {},
                    )
                )

    async def generate(
        self,
        project_id: str,
        user_input: str,
        config: Optional[GenerationConfig] = None,
        existing_data: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """
        执行完整的漫剧生成流程

        Args:
            project_id: 项目 ID
            user_input: 用户输入的故事/剧本
            config: 生成配置
            existing_data: 已有数据（用于部分重新生成）

        Returns:
            生成结果，包含所有阶段的输出
        """
        config = config or GenerationConfig()
        existing_data = existing_data or {}

        result = {
            "project_id": project_id,
            "success": False,
            "stages": {},
            "final_video": None,
            "error": None,
        }

        try:
            # 1. 剧本生成
            if config.skip_script and "script" in existing_data:
                script_result = existing_data["script"]
                await self._report_progress(GenerationStage.SCRIPT, 100, "使用已有剧本")
            else:
                await self._report_progress(GenerationStage.SCRIPT, 0, "开始解析剧本...")

                script_result = await self.script_agent.run({
                    "user_input": user_input,
                    "style": config.style,
                    "target_duration": config.target_duration,
                    "aspect_ratio": config.aspect_ratio,
                })

                if script_result.get("error"):
                    raise Exception(f"剧本生成失败: {script_result['error']}")

                await self._report_progress(GenerationStage.SCRIPT, 100, "剧本生成完成")

            result["stages"]["script"] = script_result
            result["script"] = script_result.get("script", {})
            script = script_result.get("script", {})
            characters = script.get("characters", [])

            # 2. 角色生成
            if config.skip_character and "character" in existing_data:
                character_result = existing_data["character"]
                await self._report_progress(GenerationStage.CHARACTER, 100, "使用已有角色")
            else:
                await self._report_progress(GenerationStage.CHARACTER, 0, "开始生成角色...")

                character_result = await self.character_agent.run({
                    "characters": characters,
                    "style": config.style,
                    "project_id": project_id,
                })

                await self._report_progress(GenerationStage.CHARACTER, 100, "角色生成完成")

            result["stages"]["character"] = character_result
            character_assets = character_result.get("characters", [])

            # 3. 分镜规划
            await self._report_progress(GenerationStage.STORYBOARD, 0, "开始规划分镜...")

            storyboard_result = await self.storyboard_agent.run({
                "script": script,
                "characters": character_assets,
                "style": config.style,
                "aspect_ratio": config.aspect_ratio,
            })

            await self._report_progress(GenerationStage.STORYBOARD, 100, "分镜规划完成")
            result["stages"]["storyboard"] = storyboard_result
            result["storyboard"] = storyboard_result.get("shots", [])
            storyboard = storyboard_result.get("shots", [])

            # 4. 图像渲染
            await self._report_progress(GenerationStage.RENDER, 0, "开始渲染分镜图...")

            render_result = await self.render_agent.run({
                "storyboard": storyboard,
                "characters": character_assets,
                "style": config.style,
                "aspect_ratio": config.aspect_ratio,
                "project_id": project_id,
            })

            await self._report_progress(GenerationStage.RENDER, 100, "分镜图渲染完成")
            result["stages"]["render"] = render_result
            rendered_shots = render_result.get("rendered_shots", [])

            # 5. 视频生成
            if config.skip_video:
                video_result = {"videos": []}
                await self._report_progress(GenerationStage.VIDEO, 100, "跳过视频生成")
            else:
                await self._report_progress(GenerationStage.VIDEO, 0, "开始生成视频...")

                video_result = await self.video_agent.run({
                    "rendered_shots": rendered_shots,
                    "storyboard": storyboard,
                    "aspect_ratio": config.aspect_ratio,
                    "project_id": project_id,
                })

                await self._report_progress(GenerationStage.VIDEO, 100, "视频生成完成")

            result["stages"]["video"] = video_result
            video_results = video_result.get("videos", [])

            # 6. 配音生成
            if config.skip_voice:
                voice_result = {"audio_files": []}
                await self._report_progress(GenerationStage.VOICE, 100, "跳过配音生成")
            else:
                await self._report_progress(GenerationStage.VOICE, 0, "开始生成配音...")

                voice_result = await self.voice_agent.run({
                    "storyboard": storyboard,
                    "characters": character_assets,
                    "project_id": project_id,
                })

                await self._report_progress(GenerationStage.VOICE, 100, "配音生成完成")

            result["stages"]["voice"] = voice_result
            audio_results = voice_result.get("audio_files", [])

            # 7. 口型同步
            if config.skip_lipsync or config.skip_voice:
                lipsync_result = {"lipsync_videos": []}
                await self._report_progress(GenerationStage.LIPSYNC, 100, "跳过口型同步")
            else:
                await self._report_progress(GenerationStage.LIPSYNC, 0, "开始口型同步...")

                lipsync_result = await self.lipsync_agent.run({
                    "rendered_shots": rendered_shots,
                    "audio_results": audio_results,
                    "project_id": project_id,
                })

                await self._report_progress(GenerationStage.LIPSYNC, 100, "口型同步完成")

            result["stages"]["lipsync"] = lipsync_result
            lipsync_results = lipsync_result.get("lipsync_videos", [])

            # 8. 最终剪辑
            await self._report_progress(GenerationStage.EDIT, 0, "开始合成最终视频...")

            edit_result = await self.editor_agent.run({
                "video_results": video_results,
                "lipsync_results": lipsync_results,
                "audio_results": audio_results,
                "storyboard": storyboard,
                "project_id": project_id,
                "aspect_ratio": config.aspect_ratio,
                "add_subtitles": config.add_subtitles,
                "bgm_path": config.bgm_path,
                "bgm_volume": config.bgm_volume,
            })

            await self._report_progress(GenerationStage.EDIT, 100, "视频合成完成")
            result["stages"]["edit"] = edit_result
            result["final_video"] = edit_result.get("video_path")
            result["video_path"] = edit_result.get("video_path")
            result["duration"] = edit_result.get("duration")

            # 完成
            await self._report_progress(GenerationStage.COMPLETE, 100, "漫剧生成完成!")
            result["success"] = True

        except Exception as e:
            await self._report_progress(GenerationStage.FAILED, 0, f"生成失败: {str(e)}")
            result["error"] = str(e)
            result["success"] = False

        return result

    async def generate_partial(
        self,
        project_id: str,
        start_stage: GenerationStage,
        existing_data: dict[str, Any],
        config: Optional[GenerationConfig] = None,
    ) -> dict[str, Any]:
        """
        从特定阶段开始重新生成

        Args:
            project_id: 项目 ID
            start_stage: 开始阶段
            existing_data: 已有数据
            config: 生成配置

        Returns:
            生成结果
        """
        config = config or GenerationConfig()

        # 根据开始阶段设置跳过选项
        stage_order = [
            GenerationStage.SCRIPT,
            GenerationStage.CHARACTER,
            GenerationStage.STORYBOARD,
            GenerationStage.RENDER,
            GenerationStage.VIDEO,
            GenerationStage.VOICE,
            GenerationStage.LIPSYNC,
            GenerationStage.EDIT,
        ]

        start_index = stage_order.index(start_stage)

        if start_index > 0:
            config.skip_script = True
        if start_index > 1:
            config.skip_character = True

        # 获取用户输入（从已有数据）
        user_input = existing_data.get("user_input", "")

        return await self.generate(
            project_id=project_id,
            user_input=user_input,
            config=config,
            existing_data=existing_data,
        )
