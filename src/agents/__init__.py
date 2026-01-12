"""
MangaForge Agents Module

This module contains all the AI agents that collaborate to generate manga/comics.
"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .story_agent import StoryAgent
    from .character_agent import CharacterAgent
    from .storyboard_agent import StoryboardAgent
    from .render_agent import RenderAgent
    from .dialog_agent import DialogAgent
    from .animation_agent import AnimationAgent
    from .voice_agent import VoiceAgent
    from .export_agent import ExportAgent

__all__ = [
    "StoryAgent",
    "CharacterAgent",
    "StoryboardAgent",
    "RenderAgent",
    "DialogAgent",
    "AnimationAgent",
    "VoiceAgent",
    "ExportAgent",
]
