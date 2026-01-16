"""
Script Agent - 剧本解析和扩展 Agent

负责：
1. 解析用户输入的故事/大纲
2. 扩展为完整的分镜剧本
3. 提取角色信息
4. 规划场景和镜头
"""
import json
from typing import Any, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph
from pydantic import Field

from src.agents.base_agent import AgentState, BaseAgent
from src.services.factory import get_service_factory
from src.services.llm.base import LLMMessage


class ScriptState(AgentState):
    """剧本 Agent 状态"""

    # 输入
    user_input: str = ""
    style: str = "anime"
    target_duration: int = 60  # 目标视频时长(秒)
    aspect_ratio: str = "9:16"

    # 处理过程
    story_analysis: dict[str, Any] = Field(default_factory=dict)
    characters_extracted: list[dict[str, Any]] = Field(default_factory=list)
    scenes_planned: list[dict[str, Any]] = Field(default_factory=list)

    # 输出
    parsed_script: dict[str, Any] = Field(default_factory=dict)


class ScriptAgent(BaseAgent):
    """剧本解析和扩展 Agent"""

    name = "script_agent"
    description = "解析用户故事，生成完整的分镜剧本"

    SYSTEM_PROMPT = """你是一位专业的漫剧编剧和分镜师。你的任务是将用户的故事创意转化为详细的分镜剧本。

## 输出格式要求

你需要输出严格的 JSON 格式，包含以下结构：

```json
{
  "title": "漫剧标题",
  "summary": "故事简介",
  "total_duration": 60,
  "characters": [
    {
      "name": "角色名",
      "description": "外貌描述（用于图像生成）",
      "gender": "male/female",
      "age_range": "年龄段",
      "personality": "性格特征",
      "voice_style": "声音风格描述"
    }
  ],
  "scenes": [
    {
      "scene_id": 1,
      "location": "场景地点",
      "time": "时间（白天/夜晚等）",
      "atmosphere": "氛围描述",
      "shots": [
        {
          "shot_id": 1,
          "duration": 5,
          "camera_type": "wide_shot/medium_shot/close_up/extreme_close_up",
          "camera_movement": "static/pan_left/pan_right/zoom_in/zoom_out",
          "characters": ["出场角色名"],
          "action": "画面动作描述",
          "image_prompt": "用于图像生成的英文提示词",
          "dialog": {
            "speaker": "说话角色",
            "text": "对白内容",
            "emotion": "情绪"
          }
        }
      ]
    }
  ]
}
```

## 注意事项

1. image_prompt 必须是英文，详细描述画面内容，包括：场景、角色外观、动作、表情、光线、构图
2. 每个镜头时长建议 3-8 秒
3. 对白要自然，符合角色性格
4. 场景描述要足够详细，便于图像生成
5. 控制总时长在目标范围内
"""

    ANALYSIS_PROMPT = """分析以下故事/大纲，提取关键信息：

故事内容：
{story}

目标时长：{duration}秒
风格：{style}
画面比例：{aspect_ratio}

请分析并返回 JSON：
{{
  "genre": "类型（爱情/悬疑/喜剧等）",
  "main_conflict": "核心冲突",
  "key_characters": ["主要角色"],
  "key_scenes": ["关键场景"],
  "estimated_shots": "预估镜头数",
  "tone": "基调"
}}
"""

    EXPAND_PROMPT = """基于以下分析，生成完整的分镜剧本：

故事内容：
{story}

分析结果：
{analysis}

目标时长：{duration}秒
风格：{style}
画面比例：{aspect_ratio}

请生成完整的 JSON 格式分镜剧本，严格按照系统提示中的格式要求。
"""

    def __init__(self, llm_service=None):
        """
        初始化剧本Agent

        Args:
            llm_service: 可选的LLM服务实例。如果不提供，将使用默认的服务工厂获取。
        """
        self._llm_service = llm_service
        self.service_factory = get_service_factory()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """构建剧本生成工作流图"""
        graph = StateGraph(ScriptState)

        # 添加节点
        graph.add_node("analyze_story", self._analyze_story)
        graph.add_node("extract_characters", self._extract_characters)
        graph.add_node("plan_scenes", self._plan_scenes)
        graph.add_node("generate_script", self._generate_script)
        graph.add_node("validate_output", self._validate_output)

        # 添加边
        graph.set_entry_point("analyze_story")
        graph.add_edge("analyze_story", "extract_characters")
        graph.add_edge("extract_characters", "plan_scenes")
        graph.add_edge("plan_scenes", "generate_script")
        graph.add_edge("generate_script", "validate_output")
        graph.add_edge("validate_output", END)

        return graph.compile()

    async def _call_llm(
        self,
        messages: list[LLMMessage],
        json_mode: bool = False,
    ) -> Optional[str]:
        """调用 LLM 服务"""
        try:
            # 优先使用传入的LLM服务，否则使用默认的
            if self._llm_service:
                llm_service = self._llm_service
            else:
                llm_service = self.service_factory.get_llm_service()

            if json_mode:
                result = await llm_service.generate_json(messages)
                if result.success:
                    return result.data
                else:
                    print(f"LLM JSON generation failed: {result.error}")
            else:
                result = await llm_service.generate(messages)
                if result.success:
                    return result.data.content
                else:
                    print(f"LLM generation failed: {result.error}")
            return None
        except Exception as e:
            print(f"LLM call failed: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def _analyze_story(self, state: ScriptState) -> dict[str, Any]:
        """分析用户输入的故事"""
        prompt = self.ANALYSIS_PROMPT.format(
            story=state.user_input,
            duration=state.target_duration,
            style=state.style,
            aspect_ratio=state.aspect_ratio,
        )

        messages = [
            LLMMessage.system("你是一位专业的故事分析师。请以 JSON 格式输出分析结果。"),
            LLMMessage.user(prompt),
        ]

        analysis = await self._call_llm(messages, json_mode=True)

        return {
            "current_step": "analyze_story",
            "story_analysis": analysis or {},
            "messages": state.messages + [
                HumanMessage(content=f"分析故事: {state.user_input[:100]}...")
            ],
        }

    async def _extract_characters(self, state: ScriptState) -> dict[str, Any]:
        """提取角色信息"""
        # 角色信息将在生成剧本时一并处理
        key_characters = state.story_analysis.get("key_characters", [])

        return {
            "current_step": "extract_characters",
            "characters_extracted": [{"name": c} for c in key_characters],
        }

    async def _plan_scenes(self, state: ScriptState) -> dict[str, Any]:
        """规划场景"""
        # 场景规划将在生成剧本时一并处理
        key_scenes = state.story_analysis.get("key_scenes", [])

        return {
            "current_step": "plan_scenes",
            "scenes_planned": [{"description": s} for s in key_scenes],
        }

    async def _generate_script(self, state: ScriptState) -> dict[str, Any]:
        """生成完整剧本"""
        prompt = self.EXPAND_PROMPT.format(
            story=state.user_input,
            analysis=json.dumps(state.story_analysis, ensure_ascii=False, indent=2),
            duration=state.target_duration,
            style=state.style,
            aspect_ratio=state.aspect_ratio,
        )

        messages = [
            LLMMessage.system(self.SYSTEM_PROMPT),
            LLMMessage.user(prompt),
        ]

        script = await self._call_llm(messages, json_mode=True)

        return {
            "current_step": "generate_script",
            "parsed_script": script or {},
        }

    async def _validate_output(self, state: ScriptState) -> dict[str, Any]:
        """验证输出格式"""
        script = state.parsed_script

        # 基本验证
        errors = []
        if not script.get("title"):
            errors.append("缺少标题")
        if not script.get("characters"):
            errors.append("缺少角色信息")
        if not script.get("scenes"):
            errors.append("缺少场景信息")

        if errors:
            return {
                "current_step": "validate_output",
                "error": "剧本验证失败: " + ", ".join(errors),
            }

        # 计算总时长
        total_duration = 0
        for scene in script.get("scenes", []):
            for shot in scene.get("shots", []):
                total_duration += shot.get("duration", 5)

        script["total_duration"] = total_duration

        return {
            "current_step": "complete",
            "parsed_script": script,
            "result": {
                "script": script,
                "characters": script.get("characters", []),
                "scenes_count": len(script.get("scenes", [])),
                "shots_count": sum(
                    len(s.get("shots", [])) for s in script.get("scenes", [])
                ),
                "total_duration": total_duration,
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """执行剧本生成

        Args:
            input_data: 包含:
                - user_input: 用户的故事/大纲
                - style: 风格 (anime/manga/realistic)
                - target_duration: 目标时长(秒)
                - aspect_ratio: 画面比例 (9:16/16:9)

        Returns:
            生成的剧本数据
        """
        initial_state = ScriptState(
            user_input=input_data.get("user_input", ""),
            style=input_data.get("style", "anime"),
            target_duration=input_data.get("target_duration", 60),
            aspect_ratio=input_data.get("aspect_ratio", "9:16"),
            messages=[
                SystemMessage(content=self.SYSTEM_PROMPT),
            ],
        )

        result = await self.graph.ainvoke(initial_state)

        if result.get("error"):
            return {"error": result["error"]}

        return result.get("result", {})
