# MangaForge - AI漫剧Agent系统设计文档 (SDD)

> **版本**: 2.0.0
> **创建日期**: 2026-01-12
> **项目名称**: MangaForge (漫剧锻造工坊)

---

## 1. 概述

### 1.1 项目背景

**AI漫剧**是2025年爆发的新兴内容形态，将漫画与短视频深度融合，最终产出为**带有配音、动效、字幕的短视频**。不同于传统静态漫画，AI漫剧强调：

- **视频输出**：最终产品是MP4/竖屏短视频
- **动态画面**：分镜图经过图生视频转化为动态场景
- **角色配音**：AI语音合成 + 口型同步
- **一键生成**：从剧本到成片的全自动化流程

> 截止2025年8月，在投漫剧数量达1802部，播放增量25.24亿次。AI技术可使制作成本降低70%-80%，效率提升2-3倍。

### 1.2 项目目标

MangaForge是一个开源的AI漫剧Agent系统，目标是：

- 实现从文本剧本到短视频的端到端自动化
- 保证角色在多个镜头中的视觉一致性
- 支持用户自配置各类AI服务的API Key
- 提供灵活的开源+商业API混合调用能力
- 构建可扩展的多Agent协作架构

### 1.3 核心价值

| 特性 | 描述 |
|------|------|
| **短视频输出** | 最终产品为MP4短视频，支持抖音/快手/B站等平台 |
| **用户自配Key** | 通过LLM网关层，用户自行配置OpenAI/Anthropic/本地模型等 |
| **角色一致性** | IP-Adapter + LoRA双轨方案保证多镜头角色一致 |
| **图生视频** | 支持多种视频生成模型（开源+商业API） |
| **口型同步** | SadTalker/LivePortrait实现说话口型匹配 |
| **模块化架构** | 可替换的服务层，灵活接入不同AI提供商 |

---

## 2. 需求分析

### 2.1 核心功能需求

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F001 | 剧本输入 | 支持文本剧本、故事大纲、对话脚本 | P0 |
| F002 | 剧本扩展 | LLM自动扩展为完整分镜剧本 | P0 |
| F003 | 角色设计 | 生成角色立绘，建立一致性特征 | P0 |
| F004 | 分镜生成 | 根据剧本生成每个镜头的静态画面 | P0 |
| F005 | **图生视频** | 将静态分镜转为动态视频片段 | **P0** |
| F006 | **口型同步** | 角色说话时口型与配音匹配 | **P0** |
| F007 | 语音配音 | AI生成角色配音，支持声音克隆 | P0 |
| F008 | 字幕生成 | 自动生成匹配的字幕 | P0 |
| F009 | 视频剪辑 | 自动合成、转场、配乐 | P0 |
| F010 | 视频导出 | 导出竖屏/横屏MP4 | P0 |

### 2.2 用户配置需求

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F011 | LLM配置 | 用户自行配置LLM API Key | P0 |
| F012 | 视频API配置 | 支持可灵/Runway等商业API配置 | P0 |
| F013 | 本地模型支持 | 支持本地部署的开源模型 | P1 |
| F014 | 多模型切换 | 运行时切换不同AI服务提供商 | P1 |

### 2.3 性能需求

| 指标 | 目标 |
|------|------|
| 单集生成时间 | < 30分钟 (60秒视频，云端GPU) |
| 角色一致性准确率 | > 85% |
| 口型同步准确率 | > 90% |
| 并发任务数 | 10+ |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         MangaForge System v2.0                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   Web UI    │  │   REST API  │  │    CLI      │   ← 用户接口层           │
│  │  (Next.js)  │  │  (FastAPI)  │  │  (Typer)    │                         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                         │
│         └────────────────┼────────────────┘                                │
│                          ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    LLM Gateway (One-API / LiteLLM)                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ OpenAI   │ │Anthropic │ │ Gemini   │ │ DeepSeek │ │ 本地模型  │   │  │
│  │  │   API    │ │   API    │ │   API    │ │   API    │ │ (Ollama) │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  │                     ↑ 用户自行配置API Key ↑                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                          ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   Agent Orchestrator (LangGraph)                      │  │
│  │                                                                        │  │
│  │   [剧本Agent] → [角色Agent] → [分镜Agent] → [渲染Agent]               │  │
│  │        ↓                                         ↓                     │  │
│  │   [配音Agent] ←──────────────────────── [视频Agent]                   │  │
│  │        ↓                                         ↓                     │  │
│  │   [口型Agent] ──────────────────────→ [剪辑Agent] → [导出]            │  │
│  │                                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                          ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Service Layer (可插拔)                         │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │   图像生成服务    │  │   视频生成服务    │  │   语音生成服务    │       │  │
│  │  │                 │  │                 │  │                 │       │  │
│  │  │ • ComfyUI       │  │ • 可灵 Kling API│  │ • Fish-Speech   │       │  │
│  │  │ • SDXL/FLUX     │  │ • Runway API   │  │ • XTTS-v2       │       │  │
│  │  │ • IP-Adapter    │  │ • Vidu API     │  │ • Edge-TTS      │       │  │
│  │  │ • LoRA训练      │  │ • Hunyuan I2V  │  │ • CosyVoice     │       │  │
│  │  │                 │  │ • LTX-2 (本地) │  │                 │       │  │
│  │  │                 │  │ • Wan2.1 (本地)│  │                 │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  │
│  │  │   口型同步服务    │  │   视频剪辑服务    │  │   字幕生成服务    │       │  │
│  │  │                 │  │                 │  │                 │       │  │
│  │  │ • SadTalker     │  │ • FFmpeg        │  │ • Whisper       │       │  │
│  │  │ • LivePortrait  │  │ • MoviePy       │  │ • 自动时间轴     │       │  │
│  │  │ • Wav2Lip       │  │ • 智能转场       │  │ • 多语言支持     │       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                          ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Infrastructure Layer                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │  │
│  │  │PostgreSQL│ │  Redis   │ │  MinIO   │ │ RabbitMQ │                 │  │
│  │  │ 元数据   │ │ 缓存/队列 │ │ 资产存储  │ │ 任务队列  │                 │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 核心技术选型

#### 3.2.1 LLM网关层 (用户自配Key)

| 组件 | 选型 | 说明 |
|------|------|------|
| LLM网关 | **One-API** | 开源LLM API管理系统，统一接口适配多提供商 |
| 备选方案 | **LiteLLM** | 轻量级，100+模型支持 |
| 支持的LLM | OpenAI、Anthropic、Gemini、DeepSeek、Qwen、本地Ollama等 | 用户自行配置Key |

**关键特性**：
- 用户通过Web界面配置自己的API Key
- 统一的OpenAI兼容接口
- 自动负载均衡和故障转移
- 用量统计和成本追踪

#### 3.2.2 图像生成 (分镜渲染)

| 组件 | 选型 | 说明 |
|------|------|------|
| 工作流引擎 | **ComfyUI** | 节点化工作流，API可编程 |
| 基础模型 | **SDXL / FLUX.1** | 高质量图像生成 |
| 角色一致性 | **IP-Adapter + FaceID** | 零训练快速建立角色特征 |
| 角色强化 | **LoRA训练** | 500+图片场景的深度一致性 |
| 风格模型 | **Anime/Manga LoRA** | 漫画风格专用 |

#### 3.2.3 视频生成 (核心能力)

**开源本地方案** (适合有GPU资源)：

| 模型 | 特点 | 硬件要求 |
|------|------|---------|
| **Hunyuan Video I2V** | 腾讯开源，13B参数，高质量 | 24GB+ VRAM |
| **LTX-2** | 速度快5-10倍，4K支持 | 12GB+ VRAM |
| **Wan 2.1** | 阿里开源，质量最佳 | 24GB+ VRAM |
| **CogVideoX** | 清华开源，图生视频质量高 | 16GB+ VRAM |

**商业API方案** (推荐生产环境)：

| 服务 | 特点 | 适用场景 |
|------|------|---------|
| **可灵 Kling API** | 国内首选，V2.1成本降65% | 国内用户，批量生产 |
| **Vidu Q1 API** | 动漫风格一致性好 | 动漫类漫剧 |
| **Runway Gen-4 API** | 稳定可控 | 海外用户 |
| **Pika API** | Lip-sync内置 | 快速原型 |

#### 3.2.4 口型同步 (说话动画)

| 组件 | 选型 | 说明 |
|------|------|------|
| 主方案 | **SadTalker** | 开源，单图+音频生成说话视频 |
| 高质量方案 | **LivePortrait** | 更高保真度，情感丰富 |
| 轻量方案 | **Wav2Lip** | 仅口型替换，速度快 |

#### 3.2.5 语音生成 (配音)

| 组件 | 选型 | 说明 |
|------|------|------|
| 声音克隆 | **Fish-Speech** | 开源，中文效果好 |
| 多语言 | **Coqui XTTS-v2** | 17语言，6秒克隆 |
| 免费方案 | **Edge-TTS** | 微软免费接口 |
| 高质量 | **CosyVoice** | 阿里开源 |

#### 3.2.6 Agent框架

| 组件 | 选型 | 说明 |
|------|------|------|
| Agent编排 | **LangGraph** | 状态机工作流，支持循环和分支 |
| 工具集成 | **LangChain** | 600+工具集成 |
| 任务队列 | **Celery + RabbitMQ** | 异步任务处理 |

#### 3.2.7 视频处理

| 组件 | 选型 | 说明 |
|------|------|------|
| 视频处理 | **FFmpeg** | 工业标准 |
| Python封装 | **MoviePy** | 易用的视频编辑库 |
| 字幕处理 | **pysrt / ass** | 字幕生成和渲染 |

---

## 4. Agent工作流设计

### 4.1 漫剧生成流水线

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI漫剧生成工作流 (Pipeline)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐                                                           │
│  │ 用户输入  │ ─→ 剧本/故事大纲/小说章节                                   │
│  └────┬─────┘                                                           │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. 剧本Agent                                                      │   │
│  │    • 解析用户输入，扩展为完整分镜剧本                                │   │
│  │    • 输出：场景列表、镜头描述、角色对白、情绪标注                     │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 2. 角色Agent                                                      │   │
│  │    • 根据剧本提取角色描述                                           │   │
│  │    • 生成角色参考图（正面、侧面、表情）                              │   │
│  │    • 建立IP-Adapter特征或训练LoRA                                   │   │
│  │    • 输出：角色资产库（图片、嵌入向量、触发词）                       │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 3. 分镜Agent                                                      │   │
│  │    • 规划每个镜头的构图、角色位置、动作                             │   │
│  │    • 生成详细的图像Prompt                                          │   │
│  │    • 输出：分镜Prompt列表、ControlNet参考                          │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 4. 渲染Agent                                                      │   │
│  │    • 调用ComfyUI工作流批量生成分镜图                               │   │
│  │    • 注入角色LoRA/IP-Adapter保证一致性                             │   │
│  │    • 后处理：超分、色彩校正                                        │   │
│  │    • 输出：高清分镜图序列                                          │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 5. 视频Agent  ★ 核心能力                                          │   │
│  │    • 调用图生视频模型（可灵/Hunyuan/LTX等）                        │   │
│  │    • 将静态分镜转为3-5秒动态视频片段                               │   │
│  │    • 控制镜头运动（推、拉、摇、移）                                 │   │
│  │    • 输出：动态视频片段序列                                        │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 6. 配音Agent                                                      │   │
│  │    • 根据对白文本生成角色语音                                       │   │
│  │    • 支持声音克隆（用户上传参考音频）                               │   │
│  │    • 不同角色使用不同音色                                          │   │
│  │    • 输出：对白音频文件、时间轴                                     │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 7. 口型Agent                                                      │   │
│  │    • 将静态角色图+音频合成为说话视频                               │   │
│  │    • 使用SadTalker/LivePortrait                                   │   │
│  │    • 替换视频片段中的角色面部                                       │   │
│  │    • 输出：口型同步后的视频片段                                     │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 8. 剪辑Agent                                                      │   │
│  │    • 按剧本顺序拼接视频片段                                        │   │
│  │    • 添加转场效果                                                   │   │
│  │    • 添加字幕（对白+旁白）                                         │   │
│  │    • 添加背景音乐和音效                                            │   │
│  │    • 输出：完整漫剧视频                                            │   │
│  └────┬─────────────────────────────────────────────────────────────┘   │
│       ▼                                                                  │
│  ┌──────────┐                                                           │
│  │ 视频输出  │ ─→ MP4 (竖屏9:16 / 横屏16:9)                              │
│  └──────────┘                                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Agent详细设计

#### 4.2.1 剧本Agent

**输入**：用户提供的故事/剧本/大纲

**输出**：
```json
{
  "title": "漫剧标题",
  "total_duration": 60,
  "scenes": [
    {
      "scene_id": 1,
      "location": "教室",
      "time": "白天",
      "shots": [
        {
          "shot_id": 1,
          "duration": 5,
          "camera": "medium_shot",
          "characters": ["小明", "小红"],
          "action": "小明转向小红，露出惊讶的表情",
          "dialog": {
            "speaker": "小明",
            "text": "你怎么会在这里？",
            "emotion": "surprised"
          }
        }
      ]
    }
  ],
  "characters": [
    {
      "name": "小明",
      "description": "18岁男生，黑色短发，戴眼镜，穿校服",
      "voice_style": "年轻男声，略带紧张"
    }
  ]
}
```

#### 4.2.2 视频Agent (核心)

**职责**：将静态分镜图转为动态视频

**支持的后端**：
```python
class VideoService:
    """可插拔的视频生成服务"""

    backends = {
        # 商业API
        "kling": KlingVideoBackend,      # 可灵API
        "runway": RunwayVideoBackend,    # Runway Gen-4
        "vidu": ViduVideoBackend,        # Vidu Q1
        "pika": PikaVideoBackend,        # Pika Labs

        # 开源本地
        "hunyuan": HunyuanVideoBackend,  # Hunyuan I2V
        "ltx": LTXVideoBackend,          # LTX-2
        "wan": WanVideoBackend,          # Wan 2.1
        "cogvideo": CogVideoBackend,     # CogVideoX
    }
```

#### 4.2.3 口型Agent

**职责**：生成角色说话的口型动画

**流程**：
1. 接收角色面部图像 + 对白音频
2. 调用SadTalker/LivePortrait生成说话视频
3. 与背景视频合成
4. 输出口型同步后的完整视频

---

## 5. 用户配置系统

### 5.1 API Key管理

用户通过Web界面配置自己的API Key：

```yaml
# 用户配置示例
user_config:
  llm:
    provider: "openai"  # openai / anthropic / deepseek / local
    api_key: "sk-xxx"
    model: "gpt-4-turbo"

  video:
    provider: "kling"  # kling / runway / hunyuan / local
    api_key: "xxx"

  voice:
    provider: "fish-speech"  # fish-speech / xtts / edge-tts
    api_key: null  # 本地模型无需key

  image:
    provider: "comfyui"
    endpoint: "http://localhost:8188"
```

### 5.2 模型优先级配置

```yaml
# 服务降级配置
fallback_config:
  video:
    - kling      # 优先使用可灵
    - hunyuan    # 降级到本地Hunyuan
    - ltx        # 再降级到LTX

  voice:
    - fish-speech
    - edge-tts   # 免费备选
```

---

## 6. 数据模型

### 6.1 核心实体

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Project     │────<│     Episode     │────<│      Shot       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ title           │     │ project_id      │     │ episode_id      │
│ style           │     │ episode_number  │     │ shot_number     │
│ target_platform │     │ script          │     │ duration        │
│ status          │     │ status          │     │ image_path      │
│ user_config     │     │ video_path      │     │ video_path      │
└─────────────────┘     └─────────────────┘     │ audio_path      │
        │                                        │ dialog          │
        │         ┌─────────────────┐           │ characters      │
        └────────<│    Character    │           └─────────────────┘
                  ├─────────────────┤
                  │ id              │
                  │ project_id      │
                  │ name            │
                  │ description     │
                  │ reference_images│
                  │ voice_sample    │
                  │ lora_path       │
                  └─────────────────┘
```

### 6.2 数据库Schema

```sql
-- 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    style VARCHAR(50) DEFAULT 'anime',
    target_platform VARCHAR(50) DEFAULT 'douyin',  -- douyin/kuaishou/bilibili
    aspect_ratio VARCHAR(10) DEFAULT '9:16',
    status VARCHAR(20) DEFAULT 'draft',
    user_config JSONB DEFAULT '{}',  -- 用户的API配置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    gender VARCHAR(20),
    age_range VARCHAR(20),
    reference_images TEXT[],
    voice_sample_path VARCHAR(500),
    voice_settings JSONB,
    lora_path VARCHAR(500),
    ip_adapter_embedding VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 集/章节表
CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255),
    script_input TEXT,  -- 用户输入的原始剧本
    parsed_script JSONB,  -- 解析后的结构化剧本
    status VARCHAR(20) DEFAULT 'pending',
    video_path VARCHAR(500),
    duration INTEGER,  -- 秒
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 镜头表
CREATE TABLE shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL,
    duration FLOAT NOT NULL,
    camera_type VARCHAR(50),
    prompt TEXT,
    characters UUID[],
    dialog JSONB,
    image_path VARCHAR(500),
    video_path VARCHAR(500),
    audio_path VARCHAR(500),
    lipsync_video_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户API配置表
CREATE TABLE user_api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    service_type VARCHAR(50) NOT NULL,  -- llm / video / voice / image
    provider VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    endpoint VARCHAR(500),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_episodes_project ON episodes(project_id);
CREATE INDEX idx_shots_episode ON shots(episode_id);
CREATE INDEX idx_characters_project ON characters(project_id);
CREATE INDEX idx_user_configs ON user_api_configs(user_id, service_type);
```

---

## 7. API设计

### 7.1 项目API

```
POST   /api/v1/projects                    # 创建项目
GET    /api/v1/projects                    # 项目列表
GET    /api/v1/projects/{id}               # 项目详情
DELETE /api/v1/projects/{id}               # 删除项目
```

### 7.2 生成API

```
POST   /api/v1/projects/{id}/generate      # 一键生成完整漫剧
POST   /api/v1/projects/{id}/generate/script      # 仅生成剧本
POST   /api/v1/projects/{id}/generate/characters  # 仅生成角色
POST   /api/v1/projects/{id}/generate/images      # 仅生成分镜图
POST   /api/v1/projects/{id}/generate/videos      # 仅生成视频
POST   /api/v1/projects/{id}/generate/voices      # 仅生成配音
POST   /api/v1/projects/{id}/generate/lipsync     # 仅生成口型
POST   /api/v1/projects/{id}/generate/final       # 仅合成最终视频
```

### 7.3 用户配置API

```
GET    /api/v1/config                      # 获取用户配置
PUT    /api/v1/config                      # 更新配置
POST   /api/v1/config/test                 # 测试API连通性
GET    /api/v1/config/providers            # 获取支持的服务商列表
```

### 7.4 WebSocket实时进度

```
WS /ws/projects/{id}/progress
```

消息格式：
```json
{
  "stage": "video_generation",
  "progress": 45,
  "current_shot": 5,
  "total_shots": 12,
  "message": "正在生成第5个镜头的视频..."
}
```

---

## 8. 部署架构

### 8.1 开发环境

```yaml
services:
  api:           # FastAPI主服务
  worker:        # Celery异步任务
  one-api:       # LLM网关
  comfyui:       # 图像生成 (需GPU)
  sadtalker:     # 口型同步 (需GPU)
  postgres:      # 数据库
  redis:         # 缓存/队列
  minio:         # 资产存储
```

### 8.2 生产环境

```
                    ┌─────────────┐
                    │ Cloudflare  │
                    │     CDN     │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Traefik   │
                    │    L7 LB    │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
    │  API Pod 1  │ │  API Pod 2  │ │  API Pod 3  │
    └─────────────┘ └─────────────┘ └─────────────┘
           │
    ┌──────┴──────────────────────────────────┐
    │              GPU Worker Pool             │
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
    │  │ComfyUI 1│ │ComfyUI 2│ │SadTalker│    │
    │  └─────────┘ └─────────┘ └─────────┘    │
    └─────────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────────────┐
    │           Managed Services               │
    │  ┌────────┐ ┌───────┐ ┌───────────────┐ │
    │  │RDS(PG) │ │Redis  │ │ S3/OSS/MinIO  │ │
    │  └────────┘ └───────┘ └───────────────┘ │
    └─────────────────────────────────────────┘
```

---

## 9. 技术参考

### 9.1 核心开源项目

| 项目 | 用途 | 链接 |
|------|------|------|
| One-API | LLM网关 | https://github.com/songquanpeng/one-api |
| LiteLLM | LLM代理 | https://github.com/BerriAI/litellm |
| ComfyUI | 图像工作流 | https://github.com/comfyanonymous/ComfyUI |
| Hunyuan Video | 图生视频 | https://github.com/Tencent/HunyuanVideo |
| LTX-Video | 快速视频生成 | https://github.com/Lightricks/LTX-Video |
| SadTalker | 口型同步 | https://github.com/OpenTalker/SadTalker |
| LivePortrait | 高质量口型 | https://github.com/KwaiVGI/LivePortrait |
| Fish-Speech | 中文TTS | https://github.com/fishaudio/fish-speech |
| LangGraph | Agent编排 | https://github.com/langchain-ai/langgraph |
| MoneyPrinterTurbo | 参考项目 | https://github.com/harry0703/MoneyPrinterTurbo |
| Story-Flicks | 参考项目 | 开源短视频生成 |

### 9.2 商业API参考

| 服务 | 文档 |
|------|------|
| 可灵 Kling API | https://klingai.com/cn/dev |
| Runway API | https://docs.runwayml.com |
| Vidu API | https://www.vidu.io/api |

### 9.3 参考资料

- [2025 AI漫剧：技术狂飙引领成本革命](https://36kr.com/p/3599718974783495)
- [45天做出千万播放爆款，AI给漫剧带来了什么？](https://zhuanlan.zhihu.com/p/1952103120118224232)
- [ComfyUI Hunyuan Video Examples](https://docs.comfy.org/tutorials/video/hunyuan/hunyuan-video)
- [Best Open Source Lip-Sync Models 2025](https://www.pixazo.ai/blog/best-open-source-lip-sync-models)
- [Top LLM Gateways 2025](https://agenta.ai/blog/top-llm-gateways)

---

## 10. 目录结构

```
MangaForge/
├── docs/
│   ├── SDD.md                    # 系统设计文档
│   ├── API.md                    # API文档
│   └── DEPLOYMENT.md             # 部署指南
├── src/
│   ├── agents/                   # Agent实现
│   │   ├── script_agent.py       # 剧本Agent
│   │   ├── character_agent.py    # 角色Agent
│   │   ├── storyboard_agent.py   # 分镜Agent
│   │   ├── render_agent.py       # 渲染Agent
│   │   ├── video_agent.py        # 视频Agent ★
│   │   ├── voice_agent.py        # 配音Agent
│   │   ├── lipsync_agent.py      # 口型Agent ★
│   │   └── editor_agent.py       # 剪辑Agent
│   ├── services/                 # 可插拔服务层
│   │   ├── llm/                  # LLM服务
│   │   │   ├── base.py
│   │   │   ├── openai_backend.py
│   │   │   └── one_api_gateway.py
│   │   ├── video/                # 视频生成服务
│   │   │   ├── base.py
│   │   │   ├── kling_backend.py
│   │   │   ├── hunyuan_backend.py
│   │   │   └── ltx_backend.py
│   │   ├── voice/                # 语音服务
│   │   │   ├── base.py
│   │   │   ├── fish_speech.py
│   │   │   └── edge_tts.py
│   │   ├── lipsync/              # 口型同步服务
│   │   │   ├── base.py
│   │   │   ├── sadtalker.py
│   │   │   └── liveportrait.py
│   │   └── image/                # 图像生成服务
│   │       ├── base.py
│   │       └── comfyui.py
│   ├── models/                   # 数据模型
│   ├── api/                      # API层
│   ├── workflows/                # ComfyUI工作流JSON
│   ├── utils/                    # 工具函数
│   └── config/                   # 配置管理
├── tests/
├── scripts/
├── docker/
│   ├── dev/
│   └── prod/
└── assets/
```

---

## 11. 版本历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 2.0.0 | 2026-01-12 | 重构：聚焦短视频输出，增加图生视频/口型同步，支持用户自配Key |
| 1.0.0 | 2026-01-12 | 初始版本（静态漫画方向） |

---

*MangaForge - 让每个人都能创作AI漫剧*
