"""
MangaForge Agents Module

AI 漫剧生成的核心 Agent 层，使用 LangGraph 编排多个协作 Agent。
"""
from .base_agent import BaseAgent, AgentState
from .script_agent import ScriptAgent
from .character_agent import CharacterAgent
from .storyboard_agent import StoryboardAgent
from .render_agent import RenderAgent
from .video_agent import VideoAgent
from .voice_agent import VoiceAgent
from .lipsync_agent import LipsyncAgent
from .editor_agent import EditorAgent
from .orchestrator import (
    MangaForgeOrchestrator,
    GenerationStage,
    GenerationProgress,
    GenerationConfig,
)

__all__ = [
    # Base
    "BaseAgent",
    "AgentState",
    # Agents
    "ScriptAgent",
    "CharacterAgent",
    "StoryboardAgent",
    "RenderAgent",
    "VideoAgent",
    "VoiceAgent",
    "LipsyncAgent",
    "EditorAgent",
    # Orchestrator
    "MangaForgeOrchestrator",
    "GenerationStage",
    "GenerationProgress",
    "GenerationConfig",
]
