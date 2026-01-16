# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MangaForge is an AI-powered manga/comic video generation system ("AI漫剧"). It transforms text scripts into short-form video content (MP4) with character consistency, lip-sync, and voice dubbing. The system uses a multi-agent architecture orchestrated by LangGraph.

**Key Output**: MP4 short videos for platforms like Douyin, Kuaishou, Bilibili (vertical 9:16 format)

## Tech Stack

### Backend
- **Framework**: FastAPI + SQLAlchemy (async) + Pydantic
- **Task Queue**: Celery + RabbitMQ
- **Agent Framework**: LangGraph
- **Database**: PostgreSQL
- **Cache/Pub-Sub**: Redis
- **Object Storage**: MinIO

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: TailwindCSS

### AI Services
- **LLM**: Anthropic Claude, OpenAI GPT-4 (via One-API gateway)
- **Image Generation**: ComfyUI + SDXL
- **Video Generation**: Kling API
- **Voice Synthesis**: Edge-TTS (free), Fish-Speech (local)
- **Lip-Sync**: SadTalker (local)

## Commands

### Development Environment
```bash
# Start core infrastructure (no GPU required)
docker compose -f docker/dev/docker-compose.yml up -d postgres redis minio rabbitmq

# Start all services including API
docker compose -f docker/dev/docker-compose.yml up -d

# Start GPU-dependent services (ComfyUI, SadTalker, Fish-Speech)
docker compose -f docker/dev/docker-compose.yml --profile gpu up -d

# View logs
docker compose -f docker/dev/docker-compose.yml logs -f api worker
```

### Backend (Local Development)
```bash
pip install -r requirements.txt

# Run API server
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# Run Celery worker
celery -A src.workers.celery_app worker -l info -Q generation,callbacks

# Run Celery beat (scheduled tasks)
celery -A src.workers.celery_app beat -l info
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Development server (http://localhost:5173)
npm run build    # Production build (runs tsc first)
npm run lint     # ESLint
```

### Testing & Linting
```bash
pytest                           # Run all tests
pytest tests/path/to/test.py    # Run single test file
pytest -k "test_name"           # Run tests matching pattern
pytest --cov=src                # With coverage

ruff check src/ --fix           # Lint and auto-fix
ruff format src/                # Format code
mypy src/                       # Type check
```

Note: The `tests/` directory is currently empty - tests need to be added.

## Architecture

### Multi-Agent Pipeline

The orchestrator (`src/agents/orchestrator.py`) runs this 8-stage pipeline:

1. **ScriptAgent** → Parse user text into structured screenplay (scenes, shots, dialogs)
2. **CharacterAgent** → Generate character reference images for consistency
3. **StoryboardAgent** → Plan each shot's composition and prompts
4. **RenderAgent** → Generate storyboard images via ComfyUI
5. **VideoAgent** → Convert images to video clips (Kling API)
6. **VoiceAgent** → Generate character voice-overs (Edge-TTS/Fish-Speech)
7. **LipsyncAgent** → Sync mouth movements with audio (SadTalker)
8. **EditorAgent** → Assemble final video with transitions, subtitles, BGM (FFmpeg)

The orchestrator supports partial regeneration via `generate_partial()` - you can skip stages and reuse existing data.

### Agent Implementation Pattern

Agents inherit from `BaseAgent` (`src/agents/base_agent.py`):
```python
class MyAgent(BaseAgent):
    async def run(self, input_data: dict) -> dict:
        graph = self._build_graph()
        result = await graph.ainvoke(initial_state)
        return result

    def _build_graph(self) -> StateGraph:
        # Define LangGraph nodes and edges
        pass
```

### Service Layer Pattern

Services use a factory pattern for pluggable backends (`src/services/factory.py`):
```python
factory = get_service_factory()
llm = factory.get_llm_service(provider="anthropic")  # or "openai"
image = factory.get_image_service(provider="comfyui")
voice = factory.get_voice_service(provider="edge-tts")  # or "fish-speech"
```

Available service types: `LLM`, `IMAGE`, `VIDEO`, `VOICE`, `LIPSYNC`

To add a new service provider:
1. Create service class in `src/services/{type}/` inheriting from base
2. Register in `SERVICE_REGISTRY` dict in `src/services/factory.py`
3. Add provider to `supported_providers` table in database

### Real-time Progress

WebSocket + Redis Pub/Sub delivers real-time progress updates:
- Backend publishes to Redis channels during generation
- WebSocket handler (`src/api/websocket/progress.py`) subscribes and forwards to clients
- Progress callback in orchestrator supports both sync and async callbacks

### Database Schema

Core tables (see `scripts/init-db.sql`):
- `projects` → Top-level container with style/platform settings
- `characters` → Character definitions per project
- `episodes` → Episodes within a project
- `shots` → Individual shots within episodes
- `tasks` → Async task tracking with status/progress
- `user_api_configs` → User-configured API keys per service
- `supported_providers` → Available service providers

### Configuration

Settings loaded via Pydantic from environment variables (`src/config/settings.py`). See `.env.example` for all available options.

Key settings:
- `LLM_PROVIDER`: "anthropic" | "openai" | "local"
- `COMFYUI_URL`, `SADTALKER_URL`: Local AI service endpoints
- `ONE_API_URL`: LLM gateway for unified API access

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| API | 8000 | FastAPI server |
| Frontend | 5173 | Vite dev server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| MinIO | 9000/9001 | Object storage |
| RabbitMQ | 5672/15672 | Message queue |
| ComfyUI | 8188 | Image generation |
| SadTalker | 7860 | Lip-sync |
| One-API | 3000 | LLM gateway |
