-- MangaForge Database Initialization Script
-- Version: 2.0.0 - AI漫剧短视频系统

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- One-API 数据库 (LLM网关)
-- =============================================
CREATE DATABASE one_api;

-- =============================================
-- 项目表
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    style VARCHAR(50) DEFAULT 'anime',  -- anime / manga / realistic / 3d
    target_platform VARCHAR(50) DEFAULT 'douyin',  -- douyin / kuaishou / bilibili / youtube
    aspect_ratio VARCHAR(10) DEFAULT '9:16',  -- 9:16 竖屏 / 16:9 横屏
    status VARCHAR(20) DEFAULT 'draft',  -- draft / processing / completed / failed
    user_config JSONB DEFAULT '{}',  -- 用户的API配置
    settings JSONB DEFAULT '{}',  -- 项目设置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE projects IS 'AI漫剧项目，每个项目可包含多集';
COMMENT ON COLUMN projects.user_config IS '用户配置的各类API Key和服务选择';

-- =============================================
-- 角色表
-- =============================================
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,  -- 角色外貌描述
    gender VARCHAR(20),
    age_range VARCHAR(20),
    personality TEXT,  -- 性格特征
    reference_images TEXT[],  -- 参考图路径数组
    voice_sample_path VARCHAR(500),  -- 声音样本路径
    voice_settings JSONB DEFAULT '{}',  -- 语音合成设置
    lora_path VARCHAR(500),  -- LoRA模型路径
    ip_adapter_embedding VARCHAR(500),  -- IP-Adapter嵌入路径
    trigger_word VARCHAR(50),  -- LoRA触发词
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE characters IS '漫剧角色定义，包含视觉和语音特征';

-- =============================================
-- 集/章节表
-- =============================================
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255),
    script_input TEXT,  -- 用户输入的原始剧本/故事
    parsed_script JSONB,  -- LLM解析后的结构化剧本
    status VARCHAR(20) DEFAULT 'pending',  -- pending / script_done / rendering / lipsync / editing / completed
    video_path VARCHAR(500),  -- 最终视频路径
    thumbnail_path VARCHAR(500),  -- 缩略图路径
    duration INTEGER,  -- 视频时长(秒)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

COMMENT ON TABLE episodes IS '漫剧集/章节，每集生成一个完整短视频';

-- =============================================
-- 镜头表 (核心)
-- =============================================
CREATE TABLE IF NOT EXISTS shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL,
    duration FLOAT NOT NULL DEFAULT 5.0,  -- 镜头时长(秒)

    -- 镜头描述
    scene_description TEXT,  -- 场景描述
    camera_type VARCHAR(50),  -- wide_shot / medium_shot / close_up / extreme_close_up
    camera_movement VARCHAR(50),  -- static / pan_left / pan_right / zoom_in / zoom_out

    -- 角色和对白
    characters UUID[],  -- 出现的角色ID数组
    dialog JSONB DEFAULT '{}',  -- {"speaker": "角色名", "text": "对白", "emotion": "情绪"}

    -- Prompt
    image_prompt TEXT,  -- 图像生成Prompt
    negative_prompt TEXT,  -- 负面Prompt
    video_prompt TEXT,  -- 视频生成Prompt（运动描述）

    -- 生成的资产路径
    image_path VARCHAR(500),  -- 分镜静态图
    video_path VARCHAR(500),  -- 图生视频结果
    audio_path VARCHAR(500),  -- 配音音频
    lipsync_video_path VARCHAR(500),  -- 口型同步后的视频
    final_video_path VARCHAR(500),  -- 带字幕的最终视频

    -- 状态
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shots IS '单个镜头，是漫剧的最小生成单位';

-- =============================================
-- 用户API配置表
-- =============================================
CREATE TABLE IF NOT EXISTS user_api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    service_type VARCHAR(50) NOT NULL,  -- llm / video / voice / image / lipsync
    provider VARCHAR(50) NOT NULL,  -- openai / anthropic / kling / hunyuan / fish-speech 等
    api_key_encrypted TEXT,  -- 加密存储的API Key
    endpoint VARCHAR(500),  -- 自定义端点(如本地部署)
    model VARCHAR(100),  -- 选用的模型
    settings JSONB DEFAULT '{}',  -- 其他设置
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,  -- 优先级，用于降级
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE user_api_configs IS '用户自行配置的各类AI服务API Key';

-- =============================================
-- 任务队列表
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    episode_id UUID REFERENCES episodes(id),
    shot_id UUID REFERENCES shots(id),

    task_type VARCHAR(50) NOT NULL,  -- script / character / image / video / voice / lipsync / edit
    status VARCHAR(20) DEFAULT 'pending',  -- pending / running / completed / failed / cancelled
    priority INTEGER DEFAULT 0,

    payload JSONB,  -- 任务输入数据
    result JSONB,  -- 任务结果
    error TEXT,

    worker_id VARCHAR(100),  -- 执行任务的Worker ID
    progress INTEGER DEFAULT 0,  -- 进度百分比

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tasks IS '异步任务队列，跟踪各Agent的执行状态';

-- =============================================
-- 资产表 (通用资产管理)
-- =============================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL,  -- image / video / audio / model / workflow
    name VARCHAR(255),
    path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE assets IS '所有生成的资产文件';

-- =============================================
-- 索引
-- =============================================
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_project ON episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
CREATE INDEX IF NOT EXISTS idx_shots_episode ON shots(episode_id);
CREATE INDEX IF NOT EXISTS idx_shots_status ON shots(status);
CREATE INDEX IF NOT EXISTS idx_user_configs ON user_api_configs(user_id, service_type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);

-- =============================================
-- 触发器：自动更新 updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_api_configs_updated_at ON user_api_configs;
CREATE TRIGGER update_user_api_configs_updated_at
    BEFORE UPDATE ON user_api_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 初始数据：支持的服务商配置
-- =============================================
CREATE TABLE IF NOT EXISTS supported_providers (
    id VARCHAR(50) PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_local BOOLEAN DEFAULT false,
    requires_gpu BOOLEAN DEFAULT false,
    default_endpoint VARCHAR(500),
    config_schema JSONB DEFAULT '{}'
);

INSERT INTO supported_providers (id, service_type, name, description, is_local, requires_gpu, default_endpoint) VALUES
-- LLM Providers
('openai', 'llm', 'OpenAI', 'GPT-4系列', false, false, 'https://api.openai.com/v1'),
('anthropic', 'llm', 'Anthropic', 'Claude系列', false, false, 'https://api.anthropic.com'),
('deepseek', 'llm', 'DeepSeek', '国产大模型', false, false, 'https://api.deepseek.com'),
('qwen', 'llm', '通义千问', '阿里大模型', false, false, 'https://dashscope.aliyuncs.com'),
('ollama', 'llm', 'Ollama (本地)', '本地运行LLM', true, false, 'http://localhost:11434'),

-- Video Providers
('kling', 'video', '可灵 Kling', '快手视频生成API', false, false, 'https://api.klingai.com'),
('runway', 'video', 'Runway', 'Gen-4视频生成', false, false, 'https://api.runwayml.com'),
('vidu', 'video', 'Vidu', '生数科技视频模型', false, false, 'https://api.vidu.io'),
('hunyuan', 'video', 'Hunyuan I2V (本地)', '腾讯开源图生视频', true, true, 'http://localhost:8000'),
('ltx', 'video', 'LTX-2 (本地)', '快速视频生成', true, true, 'http://localhost:8000'),

-- Voice Providers
('fish-speech', 'voice', 'Fish-Speech', '中文语音克隆', true, true, 'http://localhost:8080'),
('xtts', 'voice', 'Coqui XTTS-v2', '多语言TTS', true, true, 'http://localhost:8080'),
('edge-tts', 'voice', 'Edge-TTS', '微软免费TTS', false, false, NULL),
('cosyvoice', 'voice', 'CosyVoice', '阿里开源TTS', true, true, 'http://localhost:8080'),

-- Lipsync Providers
('sadtalker', 'lipsync', 'SadTalker', '口型同步', true, true, 'http://localhost:7860'),
('liveportrait', 'lipsync', 'LivePortrait', '高质量口型', true, true, 'http://localhost:7860'),
('wav2lip', 'lipsync', 'Wav2Lip', '轻量口型替换', true, true, 'http://localhost:7860'),

-- Image Providers
('comfyui', 'image', 'ComfyUI', '图像工作流引擎', true, true, 'http://localhost:8188')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 示例项目（可选）
-- =============================================
-- INSERT INTO projects (id, user_id, title, description, style, status)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     '00000000-0000-0000-0000-000000000000',
--     '示例漫剧项目',
--     '这是一个示例项目，用于测试系统功能',
--     'anime',
--     'draft'
-- ) ON CONFLICT (id) DO NOTHING;

COMMIT;
