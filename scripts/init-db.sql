-- MangaForge 数据库初始化脚本
-- 版本: 2.0.0 - AI漫剧短视频系统

-- 启用扩展
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
    user_id UUID NOT NULL,  -- 用户ID
    title VARCHAR(255) NOT NULL,  -- 项目标题
    description TEXT,  -- 项目描述
    style VARCHAR(50) DEFAULT 'anime',  -- 风格: anime(动漫) / manga(漫画) / realistic(写实) / 3d(三维)
    target_platform VARCHAR(50) DEFAULT 'douyin',  -- 目标平台: douyin(抖音) / kuaishou(快手) / bilibili(B站) / youtube
    aspect_ratio VARCHAR(10) DEFAULT '9:16',  -- 画幅比例: 9:16(竖屏) / 16:9(横屏)
    status VARCHAR(20) DEFAULT 'draft',  -- 状态: draft(草稿) / processing(处理中) / completed(完成) / failed(失败)
    user_config JSONB DEFAULT '{}',  -- 用户的API配置
    settings JSONB DEFAULT '{}',  -- 项目设置
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

COMMENT ON TABLE projects IS 'AI漫剧项目，每个项目可包含多集';
COMMENT ON COLUMN projects.user_config IS '用户配置的各类API Key和服务选择';

-- =============================================
-- 角色表
-- =============================================
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,  -- 角色名称
    description TEXT,  -- 角色外貌描述
    gender VARCHAR(20),  -- 性别
    age_range VARCHAR(20),  -- 年龄段
    personality TEXT,  -- 性格特征
    reference_images TEXT[],  -- 参考图路径数组
    voice_sample_path VARCHAR(500),  -- 声音样本路径
    voice_settings JSONB DEFAULT '{}',  -- 语音合成设置
    lora_path VARCHAR(500),  -- LoRA模型路径
    ip_adapter_embedding VARCHAR(500),  -- IP-Adapter嵌入路径
    trigger_word VARCHAR(50),  -- LoRA触发词
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);

COMMENT ON TABLE characters IS '漫剧角色定义，包含视觉和语音特征';

-- =============================================
-- 集/章节表
-- =============================================
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,  -- 集数编号
    title VARCHAR(255),  -- 集标题
    script_input TEXT,  -- 用户输入的原始剧本/故事
    script_parsed JSONB,  -- LLM解析后的结构化剧本
    storyboard JSONB,  -- 分镜数据
    status VARCHAR(20) DEFAULT 'pending',  -- 状态: pending(待处理) / script_done(剧本完成) / rendering(渲染中) / lipsync(口型同步) / editing(剪辑中) / completed(完成)
    video_path VARCHAR(500),  -- 最终视频路径
    thumbnail_path VARCHAR(500),  -- 缩略图路径
    duration INTEGER,  -- 视频时长(秒)
    metadata JSONB DEFAULT '{}',  -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    completed_at TIMESTAMP  -- 完成时间
);

COMMENT ON TABLE episodes IS '漫剧集/章节，每集生成一个完整短视频';

-- =============================================
-- 镜头表 (核心)
-- =============================================
CREATE TABLE IF NOT EXISTS shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL,  -- 镜头序号
    duration FLOAT NOT NULL DEFAULT 5.0,  -- 镜头时长(秒)

    -- 镜头描述
    scene_description TEXT,  -- 场景描述
    camera_type VARCHAR(50),  -- 镜头类型: wide_shot(远景) / medium_shot(中景) / close_up(特写) / extreme_close_up(大特写)
    camera_movement VARCHAR(50),  -- 镜头运动: static(静止) / pan_left(左移) / pan_right(右移) / zoom_in(推进) / zoom_out(拉远)

    -- 角色和对白
    characters UUID[],  -- 出现的角色ID数组
    dialog JSONB DEFAULT '{}',  -- {"speaker": "角色名", "text": "对白", "emotion": "情绪"}

    -- 提示词
    image_prompt TEXT,  -- 图像生成提示词
    negative_prompt TEXT,  -- 负面提示词
    video_prompt TEXT,  -- 视频生成提示词（运动描述）

    -- 生成的资产路径
    image_path VARCHAR(500),  -- 分镜静态图
    video_path VARCHAR(500),  -- 图生视频结果
    audio_path VARCHAR(500),  -- 配音音频
    lipsync_video_path VARCHAR(500),  -- 口型同步后的视频
    final_video_path VARCHAR(500),  -- 带字幕的最终视频

    -- 状态
    status VARCHAR(20) DEFAULT 'pending',  -- 状态: pending(待处理) / 其他状态
    error_message TEXT,  -- 错误信息

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shots IS '单个镜头，是漫剧的最小生成单位';

-- =============================================
-- 用户API配置表
-- =============================================
CREATE TABLE IF NOT EXISTS user_api_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    service_type VARCHAR(50) NOT NULL,  -- 服务类型: llm(大语言模型) / video(视频) / voice(语音) / image(图像) / lipsync(口型同步)
    provider VARCHAR(50) NOT NULL,  -- 服务商: openai / anthropic / kling / hunyuan / fish-speech 等
    api_key_encrypted TEXT,  -- 加密存储的API Key
    endpoint VARCHAR(500),  -- 自定义端点(如本地部署)
    model VARCHAR(100),  -- 选用的模型
    settings JSONB DEFAULT '{}',  -- 其他设置
    is_active BOOLEAN DEFAULT true,  -- 是否启用
    priority INTEGER DEFAULT 0,  -- 优先级，用于降级
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

COMMENT ON TABLE user_api_configs IS '用户自行配置的各类AI服务API Key';

-- =============================================
-- 任务队列表
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
    shot_id UUID REFERENCES shots(id) ON DELETE SET NULL,

    task_type VARCHAR(50) NOT NULL,  -- 任务类型: script(剧本) / character(角色) / image(图像) / video(视频) / voice(语音) / lipsync(口型) / edit(剪辑) / full_generation(完整生成)
    status VARCHAR(20) DEFAULT 'pending',  -- 状态: pending(待处理) / running(运行中) / processing(处理中) / completed(完成) / failed(失败) / cancelled(已取消)
    priority INTEGER DEFAULT 0,  -- 优先级

    payload JSONB,  -- 任务输入数据
    result JSONB,  -- 任务结果
    error TEXT,  -- 错误信息

    worker_id VARCHAR(100),  -- 执行任务的Worker ID
    celery_task_id VARCHAR(100),  -- Celery任务ID
    progress FLOAT DEFAULT 0.0,  -- 进度百分比(0-100)

    started_at TIMESTAMP,  -- 开始时间
    completed_at TIMESTAMP,  -- 完成时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

COMMENT ON TABLE tasks IS '异步任务队列，跟踪各Agent的执行状态';

-- =============================================
-- 资产表 (通用资产管理)
-- =============================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL,  -- 资产类型: image(图像) / video(视频) / audio(音频) / model(模型) / workflow(工作流)
    name VARCHAR(255),  -- 资产名称
    path VARCHAR(500) NOT NULL,  -- 存储路径
    mime_type VARCHAR(100),  -- MIME类型
    size_bytes BIGINT,  -- 文件大小(字节)
    metadata JSONB DEFAULT '{}',  -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);

COMMENT ON TABLE assets IS '所有生成的资产文件';

-- =============================================
-- 平台账号表
-- =============================================
CREATE TABLE IF NOT EXISTS platform_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,  -- 平台: douyin(抖音) / bilibili(B站) / kuaishou(快手) / wechat_channels(视频号)
    account_name VARCHAR(100) NOT NULL,  -- 账号名称
    platform_user_id VARCHAR(100),  -- 平台用户ID
    access_token_encrypted TEXT,  -- 加密存储的访问令牌
    refresh_token_encrypted TEXT,  -- 加密存储的刷新令牌
    token_expires_at TIMESTAMP WITH TIME ZONE,  -- 令牌过期时间
    status VARCHAR(20) DEFAULT 'disconnected',  -- 状态: connected(已连接) / expired(已过期) / disconnected(未连接) / error(错误)
    settings JSONB DEFAULT '{}',  -- 其他设置
    auto_publish BOOLEAN DEFAULT false,  -- 是否自动发布
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

COMMENT ON TABLE platform_accounts IS '用户关联的发布平台账号';

-- =============================================
-- 发布记录表
-- =============================================
CREATE TABLE IF NOT EXISTS publish_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',  -- 状态: pending(待发布) / publishing(发布中) / published(已发布) / failed(失败) / deleted(已删除)
    platform_video_id VARCHAR(200),  -- 平台视频ID
    platform_video_url VARCHAR(500),  -- 平台视频链接
    title VARCHAR(200) NOT NULL,  -- 发布标题
    description TEXT,  -- 发布描述
    hashtags JSONB DEFAULT '[]',  -- 话题标签
    publish_settings JSONB DEFAULT '{}',  -- 发布设置
    error_message TEXT,  -- 错误信息
    published_at TIMESTAMP WITH TIME ZONE,  -- 发布时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

COMMENT ON TABLE publish_records IS '视频发布记录';

-- =============================================
-- 数据库索引
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
CREATE INDEX IF NOT EXISTS idx_tasks_episode ON tasks(episode_id);
CREATE INDEX IF NOT EXISTS idx_tasks_celery ON tasks(celery_task_id);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_user ON platform_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_platform ON platform_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_publish_records_account ON publish_records(platform_account_id);
CREATE INDEX IF NOT EXISTS idx_publish_records_episode ON publish_records(episode_id);
CREATE INDEX IF NOT EXISTS idx_publish_records_status ON publish_records(status);

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

DROP TRIGGER IF EXISTS update_platform_accounts_updated_at ON platform_accounts;
CREATE TRIGGER update_platform_accounts_updated_at
    BEFORE UPDATE ON platform_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_publish_records_updated_at ON publish_records;
CREATE TRIGGER update_publish_records_updated_at
    BEFORE UPDATE ON publish_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_episodes_updated_at ON episodes;
CREATE TRIGGER update_episodes_updated_at
    BEFORE UPDATE ON episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 初始数据：支持的服务商配置
-- =============================================
CREATE TABLE IF NOT EXISTS supported_providers (
    id VARCHAR(50) PRIMARY KEY,  -- 服务商标识
    service_type VARCHAR(50) NOT NULL,  -- 服务类型
    name VARCHAR(100) NOT NULL,  -- 显示名称
    description TEXT,  -- 服务描述
    is_local BOOLEAN DEFAULT false,  -- 是否本地部署
    requires_gpu BOOLEAN DEFAULT false,  -- 是否需要GPU
    default_endpoint VARCHAR(500),  -- 默认API端点
    config_schema JSONB DEFAULT '{}'  -- 配置模式定义
);

INSERT INTO supported_providers (id, service_type, name, description, is_local, requires_gpu, default_endpoint) VALUES
-- 大语言模型服务商
('openai', 'llm', 'OpenAI', 'GPT-4系列', false, false, 'https://api.openai.com/v1'),
('anthropic', 'llm', 'Anthropic', 'Claude系列', false, false, 'https://api.anthropic.com'),
('deepseek', 'llm', 'DeepSeek', '国产大模型', false, false, 'https://api.deepseek.com'),
('qwen', 'llm', '通义千问', '阿里大模型', false, false, 'https://dashscope.aliyuncs.com'),
('ollama', 'llm', 'Ollama (本地)', '本地运行LLM', true, false, 'http://localhost:11434'),

-- 视频生成服务商
('kling', 'video', '可灵 Kling', '快手视频生成API', false, false, 'https://api.klingai.com'),
('runway', 'video', 'Runway', 'Gen-4视频生成', false, false, 'https://api.runwayml.com'),
('vidu', 'video', 'Vidu', '生数科技视频模型', false, false, 'https://api.vidu.io'),
('hunyuan', 'video', 'Hunyuan I2V (本地)', '腾讯开源图生视频', true, true, 'http://localhost:8000'),
('ltx', 'video', 'LTX-2 (本地)', '快速视频生成', true, true, 'http://localhost:8000'),

-- 语音合成服务商
('fish-speech', 'voice', 'Fish-Speech', '中文语音克隆', true, true, 'http://localhost:8080'),
('xtts', 'voice', 'Coqui XTTS-v2', '多语言TTS', true, true, 'http://localhost:8080'),
('edge-tts', 'voice', 'Edge-TTS', '微软免费TTS', false, false, NULL),
('cosyvoice', 'voice', 'CosyVoice', '阿里开源TTS', true, true, 'http://localhost:8080'),

-- 口型同步服务商
('sadtalker', 'lipsync', 'SadTalker', '口型同步', true, true, 'http://localhost:7860'),
('liveportrait', 'lipsync', 'LivePortrait', '高质量口型', true, true, 'http://localhost:7860'),
('wav2lip', 'lipsync', 'Wav2Lip', '轻量口型替换', true, true, 'http://localhost:7860'),

-- 图像生成服务商
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
