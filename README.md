# MangaForge - AI 漫剧生成系统

<p align="center">
  <img src="docs/logo.png" alt="MangaForge Logo" width="200" />
</p>

> 从文本剧本到短视频的端到端 AI 漫剧生成系统

**MangaForge** 是一个开源的 AI 漫剧 Agent 系统，能够自动将文本剧本转化为带有配音、动效、字幕的短视频。系统采用多 Agent 协作架构，支持用户自配置各类 AI 服务 API Key。

## 特性

- **端到端自动化**: 从文本剧本到 MP4 视频的全自动生成
- **角色一致性**: IP-Adapter + LoRA 方案保证多镜头角色一致
- **口型同步**: SadTalker/LivePortrait 实现说话口型匹配
- **多平台支持**: 支持抖音、快手、B站等竖屏/横屏格式
- **灵活配置**: 支持用户自配 OpenAI/Anthropic/本地模型等
- **模块化架构**: 可插拔的服务层，支持多种 AI 提供商

## 系统要求

### 最低配置
- **CPU**: 4 核
- **内存**: 16GB RAM
- **存储**: 50GB SSD
- **GPU**: NVIDIA GPU 8GB+ VRAM (用于图像/视频生成)

### 推荐配置
- **CPU**: 8 核+
- **内存**: 32GB+ RAM
- **存储**: 200GB+ SSD
- **GPU**: NVIDIA RTX 3090/4090 或更高

### 软件依赖
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+ (前端开发)
- NVIDIA Container Toolkit (GPU 支持)

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/MangaForge.git
cd MangaForge
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件，填入你的 API Key
vim .env
```

### 3. 启动基础服务

```bash
# 启动核心基础设施 (PostgreSQL, Redis, MinIO, RabbitMQ)
docker compose -f docker/dev/docker-compose.yml up -d postgres redis minio rabbitmq

# 等待服务就绪
docker compose -f docker/dev/docker-compose.yml logs -f postgres
```

### 4. 初始化数据库

```bash
# 数据库会通过 init-db.sql 自动初始化
# 或手动运行:
docker exec -i mangaforge-postgres-dev psql -U mangaforge -d mangaforge_dev < scripts/init-db.sql
```

### 5. 启动后端服务

**方式 A: Docker (推荐)**
```bash
docker compose -f docker/dev/docker-compose.yml up -d api worker
```

**方式 B: 本地开发**
```bash
# 安装依赖
pip install -r requirements.txt

# 启动 API 服务
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# 在另一个终端启动 Celery Worker
celery -A src.workers.celery_app worker -l info -Q generation,callbacks
```

### 6. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 7. 访问服务

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端** | http://localhost:5173 | Web 界面 |
| **API** | http://localhost:8000 | 后端 API |
| **API 文档** | http://localhost:8000/docs | Swagger UI |
| **MinIO** | http://localhost:9001 | 对象存储管理 |
| **RabbitMQ** | http://localhost:15672 | 消息队列管理 |
| **One-API** | http://localhost:3000 | LLM 网关 |

## 项目结构

```
MangaForge/
├── src/                          # 后端源码
│   ├── api/                      # FastAPI 应用
│   │   ├── main.py              # 应用入口
│   │   ├── deps.py              # 依赖注入
│   │   ├── routes/              # API 路由
│   │   ├── schemas/             # Pydantic 模型
│   │   └── websocket/           # WebSocket 处理
│   ├── agents/                   # LangGraph Agents
│   │   ├── script_agent.py      # 剧本解析
│   │   ├── character_agent.py   # 角色生成
│   │   ├── storyboard_agent.py  # 分镜规划
│   │   ├── render_agent.py      # 图像渲染
│   │   ├── video_agent.py       # 视频生成
│   │   ├── voice_agent.py       # 语音合成
│   │   ├── lipsync_agent.py     # 口型同步
│   │   ├── editor_agent.py      # 视频剪辑
│   │   └── orchestrator.py      # 编排器
│   ├── services/                 # 可插拔服务层
│   │   ├── llm/                 # LLM 服务
│   │   ├── image/               # 图像生成
│   │   ├── video/               # 视频生成
│   │   ├── voice/               # 语音合成
│   │   └── lipsync/             # 口型同步
│   ├── models/                   # SQLAlchemy 模型
│   ├── db/                       # 数据库连接
│   ├── storage/                  # MinIO 存储
│   ├── workers/                  # Celery 任务
│   └── config/                   # 配置管理
├── frontend/                     # React 前端
│   ├── src/
│   │   ├── api/                 # API 客户端
│   │   ├── components/          # React 组件
│   │   ├── pages/               # 页面
│   │   ├── stores/              # Zustand 状态
│   │   └── hooks/               # 自定义 Hooks
│   └── ...
├── docker/                       # Docker 配置
│   └── dev/                     # 开发环境
├── scripts/                      # 脚本
│   └── init-db.sql              # 数据库初始化
├── docs/                         # 文档
│   ├── SDD.md                   # 系统设计文档
│   └── DEPLOYMENT.md            # 部署指南
├── tests/                        # 测试
├── requirements.txt              # Python 依赖
└── CLAUDE.md                     # Claude Code 配置
```

## 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://...` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379/0` |
| `MINIO_ENDPOINT` | MinIO 端点 | `localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO 密钥 | `minioadmin` |
| `CELERY_BROKER_URL` | Celery Broker | `amqp://guest:guest@localhost:5672/` |
| `ANTHROPIC_API_KEY` | Anthropic API Key | - |
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `KLING_API_KEY` | 可灵 API Key | - |
| `COMFYUI_URL` | ComfyUI 服务地址 | `http://localhost:8188` |

### API 配置

用户可以在 Web 界面的"设置"页面配置各类 AI 服务的 API Key：

1. **LLM 服务**: OpenAI, Anthropic, DeepSeek, 本地模型
2. **图像生成**: ComfyUI (本地), Midjourney API
3. **视频生成**: 可灵 API, Runway API
4. **语音合成**: Edge-TTS (免费), Fish-Speech (本地)
5. **口型同步**: SadTalker (本地)

## 使用流程

1. **创建项目**: 设置风格、目标平台、画面比例
2. **添加角色**: 定义角色名称、外貌、性格
3. **编写剧本**: 输入故事内容或对话脚本
4. **开始生成**: 系统自动完成以下流程:
   - 剧本解析 → 角色生成 → 分镜规划 → 图像渲染
   - → 视频生成 → 语音合成 → 口型同步 → 最终剪辑
5. **下载视频**: 获取生成的 MP4 视频

## 开发指南

### 运行测试

```bash
# 运行所有测试
pytest tests/ -v

# 运行特定测试
pytest tests/test_agents.py -v

# 带覆盖率
pytest tests/ --cov=src --cov-report=html
```

### 代码格式化

```bash
# Python
ruff check src/ --fix
ruff format src/

# TypeScript
cd frontend && npm run lint
```

### 添加新服务

1. 在 `src/services/{service_type}/` 创建服务类
2. 继承对应的 `Base{Service}Service` 基类
3. 在 `src/services/factory.py` 注册服务
4. 在数据库 `supported_providers` 表添加记录

## 技术栈

### 后端
- **框架**: FastAPI + SQLAlchemy (async)
- **任务队列**: Celery + RabbitMQ
- **Agent**: LangGraph
- **数据库**: PostgreSQL
- **缓存**: Redis
- **存储**: MinIO

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **状态**: Zustand
- **数据获取**: TanStack Query
- **样式**: TailwindCSS

### AI 服务
- **LLM**: Anthropic Claude, OpenAI GPT-4
- **图像**: ComfyUI + SDXL
- **视频**: 可灵 API
- **语音**: Edge-TTS, Fish-Speech
- **口型**: SadTalker

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系

- GitHub Issues: [提交问题](https://github.com/yourusername/MangaForge/issues)
