export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'investment'
  | 'savings_deposit'
  | 'savings_withdrawal'
  | 'fund_deposit'
  | 'fund_withdrawal';

export type AccountType =
  | 'cash'
  | 'bank_savings'
  | 'bank_checking'
  | 'e_wallet'
  | 'credit_card'
  | 'investment'
  | 'loan'
  | 'fund'
  | 'other';

export type CategoryType = 'income' | 'expense' | 'investment' | 'savings';

export type BudgetPeriod = 'weekly' | 'biweekly' | 'monthly' | 'annual';

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semi_annual'
  | 'annual';

export type TransactionSource =
  | 'manual'
  | 'sms_scan'
  | 'email_scan'
  | 'receipt_scan'
  | 'import';

export type ReminderSource =
  | 'manual'
  | 'sms_detected'
  | 'email_detected'
  | 'receipt_detected'
  | 'recurring';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  default_currency: string;
  monthly_income: number | null;
  biometric_enabled: boolean;
  notification_preferences: {
    bill_reminders: boolean;
    budget_alerts: boolean;
    weekly_summary: boolean;
    ai_tips: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
  is_system: boolean;
  parent_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string | null;
  notes: string | null;
  date: string;
  is_recurring: boolean;
  recurring_id: string | null;
  receipt_url: string | null;
  source: TransactionSource;
  transfer_to_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  day_of_month: number | null;
  is_active: boolean;
  auto_create: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  alert_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  due_date: string;
  remind_days_before: number;
  recurring_id: string | null;
  is_paid: boolean;
  paid_date: string | null;
  notification_sent: boolean;
  source: ReminderSource;
  created_at: string;
}

export interface Household {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string | null;
  name: string;
  role: 'owner' | 'admin' | 'member';
  monthly_contribution: number | null;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

export interface PriceItem {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  current_price: number | null;
  previous_price: number | null;
  unit: string | null;
  location: string | null;
  last_updated: string;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}
