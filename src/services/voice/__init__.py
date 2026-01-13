"""
Voice/TTS Service Module
"""
from .base import BaseVoiceService, VoiceGenerationRequest, VoiceGenerationResult
from .edge_tts_service import EdgeTTSService
from .fish_speech_service import FishSpeechService

__all__ = [
    "BaseVoiceService",
    "VoiceGenerationRequest",
    "VoiceGenerationResult",
    "EdgeTTSService",
    "FishSpeechService",
]
