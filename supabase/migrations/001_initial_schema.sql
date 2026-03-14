-- BudgetBox Database Schema
-- Migration 001: Initial schema with all core tables and RLS policies

-- =============================================================
-- 1. USER PROFILES
-- =============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    default_currency TEXT DEFAULT 'PHP',
    monthly_income NUMERIC(15, 2),
    biometric_enabled BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{
        "bill_reminders": true,
        "budget_alerts": true,
        "weekly_summary": true,
        "ai_tips": true
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 2. CATEGORIES
-- =============================================================
CREATE TABLE public.categories (
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
-- 3. ACCOUNTS
-- =============================================================
CREATE TABLE public.accounts (
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
-- 4. RECURRING TRANSACTIONS (must be before transactions)
-- =============================================================
CREATE TABLE public.recurring_transactions (
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
-- 5. TRANSACTIONS
-- =============================================================
CREATE TABLE public.transactions (
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

CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(user_id, category_id, date DESC);

-- =============================================================
-- 6. BUDGETS
-- =============================================================
CREATE TABLE public.budgets (
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
-- 7. REMINDERS
-- =============================================================
CREATE TABLE public.reminders (
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

CREATE INDEX idx_reminders_due ON public.reminders(user_id, due_date) WHERE is_paid = false;

-- =============================================================
-- 8. HOUSEHOLDS
-- =============================================================
CREATE TABLE public.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Household',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    monthly_contribution NUMERIC(15, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 9. EXCHANGE RATES
-- =============================================================
CREATE TABLE public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate NUMERIC(15, 6) NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(base_currency, target_currency)
);

-- =============================================================
-- 10. PRICE MONITORING
-- =============================================================
CREATE TABLE public.price_items (
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

CREATE TABLE public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_item_id UUID NOT NULL REFERENCES public.price_items(id) ON DELETE CASCADE,
    price NUMERIC(15, 2) NOT NULL,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- 11. AI COACH CONVERSATIONS
-- =============================================================
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- ROW LEVEL SECURITY
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

-- Profiles: users can only access their own
CREATE POLICY "profiles_own" ON public.profiles
    FOR ALL USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Categories: users see system categories + their own
CREATE POLICY "categories_read" ON public.categories
    FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "categories_write" ON public.categories
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- All user-owned tables: standard policy
CREATE POLICY "accounts_own" ON public.accounts
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_own" ON public.transactions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_own" ON public.recurring_transactions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_own" ON public.budgets
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_own" ON public.reminders
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "households_own" ON public.households
    FOR ALL USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

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

-- Exchange rates: readable by all authenticated users
CREATE POLICY "exchange_rates_read" ON public.exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "price_items_own" ON public.price_items
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "ai_conversations_own" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_messages_own" ON public.ai_messages
    FOR SELECT USING (
        conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
    );
CREATE POLICY "ai_messages_manage" ON public.ai_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid())
    );

-- =============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- SEED SYSTEM CATEGORIES
-- =============================================================
INSERT INTO public.categories (name, icon, color, type, is_system) VALUES
    -- Income
    ('Salary', '💼', '#22c55e', 'income', true),
    ('Freelance', '💻', '#16a34a', 'income', true),
    ('Business', '🏪', '#15803d', 'income', true),
    ('Investment Returns', '📈', '#166534', 'income', true),
    ('Other Income', '💰', '#14532d', 'income', true),
    -- Expense
    ('Food & Dining', '🍽️', '#ef4444', 'expense', true),
    ('Transportation', '🚗', '#f97316', 'expense', true),
    ('Utilities', '💡', '#eab308', 'expense', true),
    ('Rent/Mortgage', '🏠', '#f59e0b', 'expense', true),
    ('Healthcare', '🏥', '#ec4899', 'expense', true),
    ('Education', '📚', '#8b5cf6', 'expense', true),
    ('Shopping', '🛒', '#6366f1', 'expense', true),
    ('Entertainment', '🎬', '#3b82f6', 'expense', true),
    ('Insurance', '🛡️', '#0ea5e9', 'expense', true),
    ('Personal Care', '💇', '#14b8a6', 'expense', true),
    ('Subscriptions', '📱', '#a855f7', 'expense', true),
    ('Other Expense', '📦', '#64748b', 'expense', true),
    -- Investment
    ('Stocks', '📊', '#2563eb', 'investment', true),
    ('Mutual Funds/UITF', '🏦', '#1d4ed8', 'investment', true),
    ('Pag-IBIG MP2', '🏗️', '#1e40af', 'investment', true),
    ('Bonds', '📃', '#1e3a8a', 'investment', true),
    ('Real Estate', '🏘️', '#0369a1', 'investment', true),
    ('Crypto', '🪙', '#7c3aed', 'investment', true),
    ('Other Investment', '💎', '#4338ca', 'investment', true),
    -- Savings
    ('Emergency Fund', '🆘', '#059669', 'savings', true),
    ('Sinking Fund', '🎯', '#0d9488', 'savings', true),
    ('Travel Fund', '✈️', '#0891b2', 'savings', true),
    ('Education Fund', '🎓', '#6d28d9', 'savings', true),
    ('Other Savings', '🐷', '#4f46e5', 'savings', true);
