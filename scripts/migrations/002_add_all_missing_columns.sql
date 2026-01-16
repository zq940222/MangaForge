-- Migration: Add all missing columns to fix 500 errors
-- Run this on existing database

-- =============================================
-- Characters 表
-- =============================================
ALTER TABLE characters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- Shots 表
-- =============================================
ALTER TABLE shots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- Episodes 表
-- =============================================
-- 如果存在旧列名 parsed_script，重命名为 script_parsed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'parsed_script') THEN
        ALTER TABLE episodes RENAME COLUMN parsed_script TO script_parsed;
    END IF;
END $$;

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS script_parsed JSONB;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS storyboard JSONB;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- Tasks 表
-- =============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS celery_task_id VARCHAR(100);
ALTER TABLE tasks ALTER COLUMN progress TYPE FLOAT USING progress::float;
ALTER TABLE tasks ALTER COLUMN progress SET DEFAULT 0.0;

-- =============================================
-- 创建更新函数
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 添加触发器
-- =============================================
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shots_updated_at ON shots;
CREATE TRIGGER update_shots_updated_at
    BEFORE UPDATE ON shots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 创建索引
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tasks_celery ON tasks(celery_task_id);
