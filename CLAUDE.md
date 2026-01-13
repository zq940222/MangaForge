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
# Install dependencies
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
npm run build    # Production build
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

## Architecture

### Project Structure
```
MangaForge/
├── src/                          # Backend source code
│   ├── api/                      # FastAPI application
│   │   ├── main.py              # App entry, lifespan, routers
│   │   ├── deps.py              # Dependency injection
│   │   ├── routes/              # API endpoints
│   │   ├── schemas/             # Pydantic models
│   │   └── websocket/           # WebSocket handlers
│   ├── agents/                   # LangGraph agents
│   │   ├── base_agent.py        # Base class with StateGraph
│   │   ├── script_agent.py      # Script parsing/expansion
│   │   ├── character_agent.py   # Character image generation
│   │   ├── storyboard_agent.py  # Shot planning
│   │   ├── render_agent.py      # Image rendering (ComfyUI)
│   │   ├── video_agent.py       # Image-to-video (Kling)
│   │   ├── voice_agent.py       # Voice synthesis
│   │   ├── lipsync_agent.py     # Lip-sync (SadTalker)
│   │   ├── editor_agent.py      # Final video assembly
│   │   └── orchestrator.py      # Pipeline orchestrator
│   ├── services/                 # Pluggable service backends
│   │   ├── base.py              # Service interfaces
│   │   ├── factory.py           # Service factory
│   │   ├── llm/                 # LLM services
│   │   ├── image/               # Image generation
│   │   ├── video/               # Video generation
│   │   ├── voice/               # Voice synthesis
│   │   └── lipsync/             # Lip-sync
│   ├── models/                   # SQLAlchemy ORM models
│   ├── db/                       # Database & Redis connections
│   ├── storage/                  # MinIO client
│   ├── workers/                  # Celery tasks
│   │   ├── celery_app.py        # Celery configuration
│   │   └── tasks/               # Task definitions
│   └── config/                   # Pydantic settings
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── api/                 # API client (Axios)
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── stores/              # Zustand stores
│   │   └── hooks/               # Custom hooks
│   └── ...
├── docker/dev/                   # Docker Compose for development
├── scripts/init-db.sql          # Database schema
└── docs/                         # Documentation
```

### Multi-Agent Pipeline
The orchestrator (`src/agents/orchestrator.py`) runs the following pipeline:

1. **ScriptAgent** → Parse user text into structured screenplay (scenes, shots, dialogs)
2. **CharacterAgent** → Generate character reference images for consistency
3. **StoryboardAgent** → Plan each shot's composition and prompts
4. **RenderAgent** → Generate storyboard images via ComfyUI
5. **VideoAgent** → Convert images to video clips (Kling API)
6. **VoiceAgent** → Generate character voice-overs (Edge-TTS/Fish-Speech)
7. **LipsyncAgent** → Sync mouth movements with audio (SadTalker)
8. **EditorAgent** → Assemble final video with transitions, subtitles, BGM (FFmpeg)

### Agent Implementation Pattern
Agents inherit from `BaseAgent` and implement:
```python
class MyAgent(BaseAgent):
    async def run(self, input_data: dict) -> dict:
        # Build and run LangGraph StateGraph
        graph = self._build_graph()
        result = await graph.ainvoke(initial_state)
        return result

    def _build_graph(self) -> StateGraph:
        # Define nodes and edges
        pass
```

### Service Layer Pattern
Services use a factory pattern for pluggable backends:
```python
# src/services/factory.py
factory = ServiceFactory(user_id="...")
llm_service = factory.create_service(ServiceType.LLM, "anthropic", config)
```

### Database Schema
Core tables (see `scripts/init-db.sql`):
- `projects` → Top-level container
- `characters` → Character definitions per project
- `episodes` → Episodes within a project
- `shots` → Individual shots within episodes
- `tasks` → Async task tracking
- `user_api_configs` → User-configured API keys
- `supported_providers` → Available service providers

### API Endpoints
| Route | Description |
|-------|-------------|
| `GET /health` | Health check |
| `GET/POST /api/v1/projects` | Project CRUD |
| `GET/POST /api/v1/projects/{id}/characters` | Character management |
| `GET/POST /api/v1/projects/{id}/episodes` | Episode management |
| `POST /api/v1/generate` | Start generation task |
| `GET /api/v1/generate/{task_id}/status` | Task status |
| `WS /api/v1/ws/task/{task_id}` | Real-time progress |
| `GET/POST /api/v1/config` | User API config |

### WebSocket Progress
Real-time progress is delivered via WebSocket + Redis Pub/Sub:
```javascript
// Frontend subscribes to task progress
const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/task/${taskId}`)
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data)
  // type: 'progress' | 'stage_complete' | 'complete' | 'error'
}
```

## Environment Variables

Key environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - Object storage
- `CELERY_BROKER_URL` - RabbitMQ connection
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` - LLM API keys
- `COMFYUI_URL` - ComfyUI service endpoint
- `SADTALKER_URL` - SadTalker service endpoint

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
