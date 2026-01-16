-- Migration: Add Google Gemini LLM provider
-- Date: 2026-01-16
-- Description: Add Gemini to supported_providers for LLM service

-- =============================================
-- Add Gemini Provider
-- =============================================
INSERT INTO supported_providers (id, service_type, name, description, is_local, requires_gpu, default_endpoint)
VALUES ('gemini', 'llm', 'Google Gemini', 'Gemini 2.0/1.5系列', false, false, 'https://generativelanguage.googleapis.com')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Verify insertion
-- =============================================
-- SELECT * FROM supported_providers WHERE id = 'gemini';
