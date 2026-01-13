"""
Editor Agent - 剪辑合成 Agent

负责：
1. 按剧本顺序拼接视频片段
2. 添加转场效果
3. 添加字幕
4. 添加背景音乐和音效
5. 输出最终视频
"""
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Optional

from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent


class EditorState(AgentState):
    """剪辑 Agent 状态"""

    # 输入
    video_results: list[dict[str, Any]] = Field(default_factory=list)
    lipsync_results: list[dict[str, Any]] = Field(default_factory=list)
    audio_results: list[dict[str, Any]] = Field(default_factory=list)
    storyboard: list[dict[str, Any]] = Field(default_factory=list)
    project_id: str = ""
    aspect_ratio: str = "9:16"

    # 设置
    add_subtitles: bool = True
    bgm_path: Optional[str] = None
    bgm_volume: float = 0.3

    # 处理过程
    temp_dir: str = ""
    clip_paths: list[str] = Field(default_factory=list)
    subtitle_file: str = ""

    # 输出
    final_video_path: str = ""


class EditorAgent(BaseAgent):
    """剪辑合成 Agent"""

    name = "editor_agent"
    description = "合成最终视频"

    def __init__(self):
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建剪辑工作流图"""
        graph = StateGraph(EditorState)

        graph.add_node("prepare_clips", self._prepare_clips)
        graph.add_node("generate_subtitles", self._generate_subtitles)
        graph.add_node("concat_videos", self._concat_videos)
        graph.add_node("add_audio_effects", self._add_audio_effects)
        graph.add_node("finalize", self._finalize)

        graph.set_entry_point("prepare_clips")
        graph.add_edge("prepare_clips", "generate_subtitles")
        graph.add_edge("generate_subtitles", "concat_videos")
        graph.add_edge("concat_videos", "add_audio_effects")
        graph.add_edge("add_audio_effects", "finalize")
        graph.add_edge("finalize", END)

        return graph.compile()

    def _get_best_video_for_shot(
        self,
        shot_id: int,
        video_results: list[dict],
        lipsync_results: list[dict],
    ) -> str | None:
        """获取镜头的最佳视频（优先口型同步版本）"""
        # 优先使用口型同步版本
        for lipsync in lipsync_results:
            if (
                lipsync.get("shot_id") == shot_id
                and lipsync.get("success")
                and lipsync.get("lipsync_video_path")
            ):
                return lipsync["lipsync_video_path"]

        # 其次使用普通视频
        for video in video_results:
            if (
                video.get("shot_id") == shot_id
                and video.get("success")
                and video.get("video_path")
            ):
                return video["video_path"]

        return None

    async def _prepare_clips(self, state: EditorState) -> dict[str, Any]:
        """准备视频片段"""
        from src.storage import get_storage

        storage = get_storage()
        temp_dir = tempfile.mkdtemp(prefix="mangaforge_edit_")
        clip_paths = []

        # 按照分镜顺序排列
        sorted_shots = sorted(state.storyboard, key=lambda x: (x.get("scene_id", 0), x.get("shot_id", 0)))

        for shot in sorted_shots:
            shot_id = shot.get("shot_id")
            video_path = self._get_best_video_for_shot(
                shot_id, state.video_results, state.lipsync_results
            )

            if video_path:
                # 下载视频到临时目录
                local_path = Path(temp_dir) / f"clip_{shot_id:04d}.mp4"
                storage.download_file(video_path, local_path)
                clip_paths.append(str(local_path))

        return {
            "current_step": "prepare_clips",
            "temp_dir": temp_dir,
            "clip_paths": clip_paths,
        }

    async def _generate_subtitles(self, state: EditorState) -> dict[str, Any]:
        """生成字幕文件 (SRT 格式)"""
        if not state.add_subtitles:
            return {"current_step": "generate_subtitles", "subtitle_file": ""}

        subtitle_lines = []
        current_time = 0.0
        index = 1

        sorted_shots = sorted(state.storyboard, key=lambda x: (x.get("scene_id", 0), x.get("shot_id", 0)))

        for shot in sorted_shots:
            dialog = shot.get("dialog", {})
            duration = shot.get("duration", 5)

            if dialog and dialog.get("text"):
                start_time = current_time
                end_time = current_time + duration

                # 格式化时间 (HH:MM:SS,mmm)
                start_str = self._format_srt_time(start_time)
                end_str = self._format_srt_time(end_time)

                speaker = dialog.get("speaker", "")
                text = dialog.get("text", "")

                # 添加字幕条目
                subtitle_lines.append(f"{index}")
                subtitle_lines.append(f"{start_str} --> {end_str}")
                if speaker:
                    subtitle_lines.append(f"【{speaker}】{text}")
                else:
                    subtitle_lines.append(text)
                subtitle_lines.append("")

                index += 1

            current_time += duration

        # 保存字幕文件
        subtitle_file = Path(state.temp_dir) / "subtitles.srt"
        subtitle_file.write_text("\n".join(subtitle_lines), encoding="utf-8")

        return {
            "current_step": "generate_subtitles",
            "subtitle_file": str(subtitle_file),
        }

    def _format_srt_time(self, seconds: float) -> str:
        """格式化 SRT 时间"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    async def _concat_videos(self, state: EditorState) -> dict[str, Any]:
        """拼接视频片段"""
        if not state.clip_paths:
            return {
                "current_step": "concat_videos",
                "error": "No clips to concatenate",
            }

        # 创建 FFmpeg 合并列表文件
        concat_file = Path(state.temp_dir) / "concat.txt"
        with open(concat_file, "w") as f:
            for clip_path in state.clip_paths:
                f.write(f"file '{clip_path}'\n")

        # 输出路径
        output_path = Path(state.temp_dir) / "concat_output.mp4"

        # 使用 FFmpeg 拼接
        cmd = [
            "ffmpeg",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            str(output_path),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            return {
                "current_step": "concat_videos",
                "error": f"FFmpeg concat failed: {e.stderr.decode()}",
            }

        return {
            "current_step": "concat_videos",
            "final_video_path": str(output_path),
        }

    async def _add_audio_effects(self, state: EditorState) -> dict[str, Any]:
        """添加背景音乐和音效"""
        if not state.bgm_path or not Path(state.final_video_path).exists():
            return {"current_step": "add_audio_effects"}

        input_video = state.final_video_path
        output_path = Path(state.temp_dir) / "with_bgm.mp4"

        # 使用 FFmpeg 混音
        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_video,
            "-i", state.bgm_path,
            "-filter_complex",
            f"[1:a]volume={state.bgm_volume}[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout]",
            "-map", "0:v",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            str(output_path),
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return {
                "current_step": "add_audio_effects",
                "final_video_path": str(output_path),
            }
        except subprocess.CalledProcessError:
            # 如果失败，继续使用原视频
            return {"current_step": "add_audio_effects"}

    async def _finalize(self, state: EditorState) -> dict[str, Any]:
        """最终化输出"""
        from src.storage import get_storage

        if not state.final_video_path or not Path(state.final_video_path).exists():
            return {
                "current_step": "complete",
                "error": "No final video to save",
            }

        storage = get_storage()

        # 如果需要添加字幕，烧录字幕
        if state.add_subtitles and state.subtitle_file and Path(state.subtitle_file).exists():
            subtitled_path = Path(state.temp_dir) / "final_with_subs.mp4"

            cmd = [
                "ffmpeg",
                "-y",
                "-i", state.final_video_path,
                "-vf", f"subtitles={state.subtitle_file}",
                "-c:a", "copy",
                str(subtitled_path),
            ]

            try:
                subprocess.run(cmd, check=True, capture_output=True)
                state.final_video_path = str(subtitled_path)
            except subprocess.CalledProcessError:
                pass  # 字幕烧录失败，使用无字幕版本

        # 上传最终视频
        final_path = storage.upload_file(
            file_path=state.final_video_path,
            project_id=state.project_id,
            asset_type="final",
            filename="final_video.mp4",
            content_type="video/mp4",
        )

        # 清理临时文件
        import shutil
        try:
            shutil.rmtree(state.temp_dir)
        except Exception:
            pass

        return {
            "current_step": "complete",
            "final_video_path": final_path,
            "result": {
                "video_path": final_path,
                "clips_count": len(state.clip_paths),
                "has_subtitles": state.add_subtitles and bool(state.subtitle_file),
                "has_bgm": bool(state.bgm_path),
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行视频剪辑合成

        Args:
            input_data: 包含:
                - video_results: 视频生成结果
                - lipsync_results: 口型同步结果
                - audio_results: 配音结果
                - storyboard: 分镜数据
                - project_id: 项目 ID
                - add_subtitles: 是否添加字幕
                - bgm_path: 背景音乐路径
                - bgm_volume: 背景音乐音量

        Returns:
            最终视频信息
        """
        initial_state = EditorState(
            video_results=input_data.get("video_results", []),
            lipsync_results=input_data.get("lipsync_results", []),
            audio_results=input_data.get("audio_results", []),
            storyboard=input_data.get("storyboard", []),
            project_id=input_data.get("project_id", ""),
            aspect_ratio=input_data.get("aspect_ratio", "9:16"),
            add_subtitles=input_data.get("add_subtitles", True),
            bgm_path=input_data.get("bgm_path"),
            bgm_volume=input_data.get("bgm_volume", 0.3),
            messages=[],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
