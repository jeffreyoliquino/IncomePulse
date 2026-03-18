-- Migration 005: Add budget_templates table for cross-device sync
-- Stores one row per user per template type (employee, ofw, student).
-- Data is stored as JSONB so field additions don't require schema changes.

CREATE TABLE IF NOT EXISTS public.budget_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL CHECK (template_type IN ('employee', 'ofw', 'student')),
    data JSONB NOT NULL DEFAULT '{}',
    saved_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, template_type)
);

CREATE INDEX IF NOT EXISTS idx_budget_templates_user_id ON public.budget_templates(user_id);

ALTER TABLE public.budget_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_templates_own" ON public.budget_templates;
CREATE POLICY "budget_templates_own" ON public.budget_templates
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
