"""
Voice Agent - 配音 Agent

负责：
1. 根据对白文本生成角色语音
2. 支持声音克隆
3. 不同角色使用不同音色
"""
from typing import Any

from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent
from src.services.factory import get_service_factory
from src.services.voice.base import VoiceGenerationRequest


class VoiceState(AgentState):
    """配音 Agent 状态"""

    # 输入
    storyboard: list[dict[str, Any]] = Field(default_factory=list)
    characters: list[dict[str, Any]] = Field(default_factory=list)
    project_id: str = ""

    # 处理过程
    character_voices: dict[str, str] = Field(default_factory=dict)  # 角色 -> 声音 ID
    generated_audio: list[dict[str, Any]] = Field(default_factory=list)

    # 输出
    audio_results: list[dict[str, Any]] = Field(default_factory=list)


class VoiceAgent(BaseAgent):
    """配音 Agent"""

    name = "voice_agent"
    description = "生成角色配音"

    # 默认声音分配
    DEFAULT_VOICES = {
        "male_young": "zh-CN-YunxiNeural",
        "male_adult": "zh-CN-YunjianNeural",
        "female_young": "zh-CN-XiaoxiaoNeural",
        "female_adult": "zh-CN-XiaohanNeural",
        "child": "zh-CN-XiaoshuangNeural",
    }

    def __init__(self):
        self.service_factory = get_service_factory()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建配音工作流图"""
        graph = StateGraph(VoiceState)

        graph.add_node("assign_voices", self._assign_voices)
        graph.add_node("generate_audio", self._generate_audio)
        graph.add_node("save_results", self._save_results)

        graph.set_entry_point("assign_voices")
        graph.add_edge("assign_voices", "generate_audio")
        graph.add_edge("generate_audio", "save_results")
        graph.add_edge("save_results", END)

        return graph.compile()

    def _get_voice_for_character(self, char: dict[str, Any]) -> str:
        """根据角色特征选择声音"""
        gender = char.get("gender", "").lower()
        age = char.get("age_range", "").lower()

        # 判断年龄段
        if "child" in age or "儿童" in age or "小" in age:
            return self.DEFAULT_VOICES["child"]

        if gender in ("male", "男"):
            if "young" in age or "年轻" in age or "青年" in age:
                return self.DEFAULT_VOICES["male_young"]
            return self.DEFAULT_VOICES["male_adult"]
        elif gender in ("female", "女"):
            if "young" in age or "年轻" in age or "青年" in age:
                return self.DEFAULT_VOICES["female_young"]
            return self.DEFAULT_VOICES["female_adult"]

        # 默认
        return self.DEFAULT_VOICES["female_young"]

    async def _assign_voices(self, state: VoiceState) -> dict[str, Any]:
        """为角色分配声音"""
        character_voices = {}

        for char in state.characters:
            char_name = char.get("name", "")
            if not char_name:
                continue

            # 如果有声音样本，使用声音克隆
            if char.get("voice_sample_path"):
                # 声音克隆需要 Fish-Speech
                character_voices[char_name] = f"clone:{char['voice_sample_path']}"
            else:
                # 使用预设声音
                voice_id = self._get_voice_for_character(char)
                character_voices[char_name] = voice_id

        return {
            "current_step": "assign_voices",
            "character_voices": character_voices,
        }

    async def _generate_audio(self, state: VoiceState) -> dict[str, Any]:
        """生成配音"""
        voice_service = self.service_factory.get_voice_service()
        generated_audio = []

        for shot in state.storyboard:
            dialog = shot.get("dialog", {})
            if not dialog or not dialog.get("text"):
                generated_audio.append({
                    "shot_id": shot.get("shot_id"),
                    "has_dialog": False,
                })
                continue

            speaker = dialog.get("speaker", "")
            text = dialog.get("text", "")
            emotion = dialog.get("emotion", "neutral")

            # 获取声音 ID
            voice_id = state.character_voices.get(speaker)

            # 检查是否是声音克隆
            if voice_id and voice_id.startswith("clone:"):
                reference_audio = voice_id.replace("clone:", "")
                request = VoiceGenerationRequest(
                    text=text,
                    reference_audio=reference_audio,
                    emotion=emotion,
                )
            else:
                request = VoiceGenerationRequest(
                    text=text,
                    voice_id=voice_id,
                    emotion=emotion,
                )

            result = await voice_service.generate(request)

            if result.success:
                generated_audio.append({
                    "shot_id": shot.get("shot_id"),
                    "scene_id": shot.get("scene_id"),
                    "speaker": speaker,
                    "text": text,
                    "audio_data": result.data.audio_data,
                    "duration": result.data.duration,
                    "has_dialog": True,
                    "success": True,
                })
            else:
                generated_audio.append({
                    "shot_id": shot.get("shot_id"),
                    "scene_id": shot.get("scene_id"),
                    "speaker": speaker,
                    "text": text,
                    "has_dialog": True,
                    "error": result.error,
                    "success": False,
                })

        return {
            "current_step": "generate_audio",
            "generated_audio": generated_audio,
        }

    async def _save_results(self, state: VoiceState) -> dict[str, Any]:
        """保存配音结果"""
        from src.storage import get_storage

        storage = get_storage()
        audio_results = []

        for audio in state.generated_audio:
            if not audio.get("has_dialog"):
                audio_results.append({
                    "shot_id": audio.get("shot_id"),
                    "has_dialog": False,
                })
                continue

            if audio.get("success") and audio.get("audio_data"):
                path = storage.upload_bytes(
                    data=audio["audio_data"],
                    project_id=state.project_id,
                    asset_type="audio",
                    filename=f"dialog_{audio['scene_id']}_{audio['shot_id']}.mp3",
                    content_type="audio/mpeg",
                )

                audio_results.append({
                    "shot_id": audio["shot_id"],
                    "scene_id": audio["scene_id"],
                    "speaker": audio["speaker"],
                    "text": audio["text"],
                    "audio_path": path,
                    "duration": audio.get("duration", 0),
                    "has_dialog": True,
                    "success": True,
                })
            else:
                audio_results.append({
                    "shot_id": audio.get("shot_id"),
                    "scene_id": audio.get("scene_id"),
                    "speaker": audio.get("speaker"),
                    "text": audio.get("text"),
                    "has_dialog": True,
                    "error": audio.get("error", "Unknown error"),
                    "success": False,
                })

        return {
            "current_step": "complete",
            "audio_results": audio_results,
            "result": {
                "audio_files": audio_results,
                "dialog_count": sum(1 for a in audio_results if a.get("has_dialog")),
                "success_count": sum(1 for a in audio_results if a.get("success")),
                "total_duration": sum(a.get("duration", 0) for a in audio_results if a.get("success")),
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行配音生成

        Args:
            input_data: 包含:
                - storyboard: 分镜数据（含对白）
                - characters: 角色信息
                - project_id: 项目 ID

        Returns:
            配音结果
        """
        initial_state = VoiceState(
            storyboard=input_data.get("storyboard", []),
            characters=input_data.get("characters", []),
            project_id=input_data.get("project_id", ""),
            messages=[],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
