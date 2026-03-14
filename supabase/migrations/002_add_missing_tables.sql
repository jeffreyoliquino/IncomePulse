-- BudgetBox Database Schema - Safe Migration
-- This migration safely adds missing tables without failing on existing ones

-- =============================================================
-- 1. ACCOUNTS (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'cash', 'bank_savings', 'bank_checking',
        'e_wallet', 'credit_card', 'investment',
        'loan', 'fund', 'other'
    )),
    institution TEXT,
    balance NUMERIC(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'PHP',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 2. CATEGORIES (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investment', 'savings')),
    is_system BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 3. RECURRING TRANSACTIONS (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    category_id UUID REFERENCES public.categories(id),
    type TEXT NOT NULL CHECK (type IN (
        'income', 'expense', 'transfer', 'investment',
        'savings_deposit', 'savings_withdrawal',
        'fund_deposit', 'fund_withdrawal'
    )),
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'PHP',
    description TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN (
        'daily', 'weekly', 'biweekly', 'monthly',
        'quarterly', 'semi_annual', 'annual'
    )),
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    day_of_month INTEGER,
    is_active BOOLEAN DEFAULT true,
    auto_create BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 4. TRANSACTIONS (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id),
    category_id UUID REFERENCES public.categories(id),
    type TEXT NOT NULL CHECK (type IN (
        'income', 'expense', 'transfer', 'investment',
        'savings_deposit', 'savings_withdrawal',
        'fund_deposit', 'fund_withdrawal'
    )),
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'PHP',
    description TEXT,
    notes TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_id UUID REFERENCES public.recurring_transactions(id),
    receipt_url TEXT,
    source TEXT CHECK (source IN (
        'manual', 'sms_scan', 'email_scan',
        'receipt_scan', 'import'
    )) DEFAULT 'manual',
    transfer_to_account_id UUID REFERENCES public.accounts(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(user_id, category_id, date DESC);

-- =============================================================
-- 5. BUDGETS (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    name TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    period TEXT DEFAULT 'monthly' CHECK (period IN (
        'weekly', 'biweekly', 'monthly', 'annual'
    )),
    alert_threshold NUMERIC(3,2) DEFAULT 0.80,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 6. REMINDERS (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2),
    due_date DATE NOT NULL,
    remind_days_before INTEGER DEFAULT 3,
    recurring_id UUID REFERENCES public.recurring_transactions(id),
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE,
    notification_sent BOOLEAN DEFAULT false,
    source TEXT CHECK (source IN (
        'manual', 'sms_detected', 'email_detected',
        'receipt_detected', 'recurring'
    )) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.reminders(user_id, due_date) WHERE is_paid = false;

-- =============================================================
-- 7. HOUSEHOLDS (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Household',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    monthly_contribution NUMERIC(15, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 8. EXCHANGE RATES (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate NUMERIC(15, 6) NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(base_currency, target_currency)
);

-- =============================================================
-- 9. PRICE MONITORING (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.price_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    current_price NUMERIC(15, 2),
    previous_price NUMERIC(15, 2),
    unit TEXT,
    location TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_item_id UUID NOT NULL REFERENCES public.price_items(id) ON DELETE CASCADE,
    price NUMERIC(15, 2) NOT NULL,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 10. AI COACH CONVERSATIONS (if not exists)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- ROW LEVEL SECURITY - Enable on all tables
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- RLS POLICIES - Drop existing and recreate
-- =============================================================

-- Profiles
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "categories_read" ON public.categories;
DROP POLICY IF EXISTS "categories_write" ON public.categories;
CREATE POLICY "categories_read" ON public.categories
    FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "categories_write" ON public.categories
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Accounts
DROP POLICY IF EXISTS "accounts_own" ON public.accounts;
CREATE POLICY "accounts_own" ON public.accounts
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "transactions_own" ON public.transactions;
CREATE POLICY "transactions_own" ON public.transactions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Recurring Transactions
DROP POLICY IF EXISTS "recurring_own" ON public.recurring_transactions;
CREATE POLICY "recurring_own" ON public.recurring_transactions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Budgets
DROP POLICY IF EXISTS "budgets_own" ON public.budgets;
CREATE POLICY "budgets_own" ON public.budgets
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Reminders
DROP POLICY IF EXISTS "reminders_own" ON public.reminders;
CREATE POLICY "reminders_own" ON public.reminders
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Households
DROP POLICY IF EXISTS "households_own" ON public.households;
CREATE POLICY "households_own" ON public.households
    FOR ALL USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Household Members
DROP POLICY IF EXISTS "household_members_access" ON public.household_members;
DROP POLICY IF EXISTS "household_members_manage" ON public.household_members;
CREATE POLICY "household_members_access" ON public.household_members
    FOR SELECT USING (
        household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
        OR user_id = auth.uid()
    );
CREATE POLICY "household_members_manage" ON public.household_members
    FOR ALL USING (
        household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
    )
    WITH CHECK (
        household_id IN (SELECT id FROM public.households WHERE owner_id = auth.uid())
    );

-- Exchange Rates
DROP POLICY IF EXISTS "exchange_rates_read" ON public.exchange_rates;
CREATE POLICY "exchange_rates_read" ON public.exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Price Items
DROP POLICY IF EXISTS "price_items_own" ON public.price_items;
CREATE POLICY "price_items_own" ON public.price_items
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Price History
DROP POLICY IF EXISTS "price_history_own" ON public.price_history;
DROP POLICY IF EXISTS "price_history_manage" ON public.price_history;
CREATE POLICY "price_history_own" ON public.price_history
    FOR SELECT USING (
        price_item_id IN (SELECT id FROM public.price_items WHERE user_id = auth.uid())
    );
CREATE POLICY "price_history_manage" ON public.price_history
    FOR ALL USING (
        price_item_id IN (SELECT id FROM public.price_items WHERE user_id = auth.uid())
    )
    WITH CHECK (
        price_item_id IN (SELECT id FROM public.price_items WHERE user_id = auth.uid())
    );

-- AI Conversations
DROP POLICY IF EXISTS "ai_conversations_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_own" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- AI Messages
DROP POLICY IF EXISTS "ai_messages_own" ON public.ai_messages;
DROP POLICY IF EXISTS "ai_messages_manage" ON public.ai_messages;
CREATE POLICY "ai_messages_own" ON public.ai_messages
    FOR SELECT USING (
        conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
    );
CREATE POLICY "ai_messages_manage" ON public.ai_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
    );
