-- Migration 004: Add user_accounts table for app-level account storage
-- This is separate from the original `accounts` table to avoid schema conflicts.
-- Uses TEXT primary key so local IDs (account_${timestamp}_xxx) sync directly.

CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('cash', 'ewallet', 'bank')),
    sub_type TEXT,
    name TEXT NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON public.user_accounts(user_id);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_accounts_own" ON public.user_accounts;
CREATE POLICY "user_accounts_own" ON public.user_accounts
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
