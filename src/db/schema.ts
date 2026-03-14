import { column, Schema, Table } from '@powersync/react-native';

const profiles = new Table({
  email: column.text,
  display_name: column.text,
  avatar_url: column.text,
  default_currency: column.text,
  monthly_income: column.real,
  biometric_enabled: column.integer,
  notification_preferences: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const accounts = new Table({
  user_id: column.text,
  name: column.text,
  type: column.text,
  institution: column.text,
  balance: column.real,
  currency: column.text,
  is_active: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const categories = new Table({
  user_id: column.text,
  name: column.text,
  icon: column.text,
  color: column.text,
  type: column.text,
  is_system: column.integer,
  parent_id: column.text,
  created_at: column.text,
});

const transactions = new Table({
  user_id: column.text,
  account_id: column.text,
  category_id: column.text,
  type: column.text,
  amount: column.real,
  currency: column.text,
  description: column.text,
  notes: column.text,
  date: column.text,
  is_recurring: column.integer,
  recurring_id: column.text,
  receipt_url: column.text,
  source: column.text,
  transfer_to_account_id: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const recurring_transactions = new Table({
  user_id: column.text,
  account_id: column.text,
  category_id: column.text,
  type: column.text,
  amount: column.real,
  currency: column.text,
  description: column.text,
  frequency: column.text,
  start_date: column.text,
  end_date: column.text,
  next_due_date: column.text,
  day_of_month: column.integer,
  is_active: column.integer,
  auto_create: column.integer,
  created_at: column.text,
});

const budgets = new Table({
  user_id: column.text,
  category_id: column.text,
  name: column.text,
  amount: column.real,
  period: column.text,
  alert_threshold: column.real,
  is_active: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const reminders = new Table({
  user_id: column.text,
  title: column.text,
  description: column.text,
  amount: column.real,
  due_date: column.text,
  remind_days_before: column.integer,
  recurring_id: column.text,
  is_paid: column.integer,
  paid_date: column.text,
  notification_sent: column.integer,
  source: column.text,
  created_at: column.text,
});

const exchange_rates = new Table({
  base_currency: column.text,
  target_currency: column.text,
  rate: column.real,
  fetched_at: column.text,
});

const households = new Table({
  owner_id: column.text,
  name: column.text,
  created_at: column.text,
});

const household_members = new Table({
  household_id: column.text,
  user_id: column.text,
  name: column.text,
  role: column.text,
  monthly_contribution: column.real,
  created_at: column.text,
});

const ai_conversations = new Table({
  user_id: column.text,
  title: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const ai_messages = new Table({
  conversation_id: column.text,
  role: column.text,
  content: column.text,
  created_at: column.text,
});

export const AppSchema = new Schema({
  profiles,
  accounts,
  categories,
  transactions,
  recurring_transactions,
  budgets,
  reminders,
  exchange_rates,
  households,
  household_members,
  ai_conversations,
  ai_messages,
});

export type Database = (typeof AppSchema)['types'];
