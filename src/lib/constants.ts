export const APP_NAME = 'BudgetBox';

export const DEFAULT_CURRENCY = 'PHP';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  AUD: 'A$',
};

export const SYSTEM_CATEGORIES = {
  income: [
    { name: 'Salary', icon: '💼', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', color: '#16a34a' },
    { name: 'Business', icon: '🏪', color: '#15803d' },
    { name: 'Investment Returns', icon: '📈', color: '#166534' },
    { name: 'Other Income', icon: '💰', color: '#14532d' },
  ],
  expense: [
    { name: 'Food & Dining', icon: '🍽️', color: '#ef4444' },
    { name: 'Transportation', icon: '🚗', color: '#f97316' },
    { name: 'Utilities', icon: '💡', color: '#eab308' },
    { name: 'Rent/Mortgage', icon: '🏠', color: '#f59e0b' },
    { name: 'Healthcare', icon: '🏥', color: '#ec4899' },
    { name: 'Education', icon: '📚', color: '#8b5cf6' },
    { name: 'Shopping', icon: '🛒', color: '#6366f1' },
    { name: 'Entertainment', icon: '🎬', color: '#3b82f6' },
    { name: 'Insurance', icon: '🛡️', color: '#0ea5e9' },
    { name: 'Personal Care', icon: '💇', color: '#14b8a6' },
    { name: 'Subscriptions', icon: '📱', color: '#a855f7' },
    { name: 'Taxes', icon: '🧾', color: '#dc2626' },
    { name: 'Tuition Fee', icon: '🎓', color: '#7c3aed' },
    { name: 'School Service', icon: '🚌', color: '#d97706' },
    { name: 'School Supplies', icon: '✏️', color: '#0284c7' },
    { name: 'Allowance', icon: '💵', color: '#16a34a' },
    { name: 'Remittance', icon: '🔄', color: '#0891b2' },
    { name: 'Personal Care and Leisure', icon: '🧖', color: '#db2777' },
    { name: 'License, Registration and Certification', icon: '🪪', color: '#0369a1' },
    { name: 'Other Expense', icon: '📦', color: '#64748b' },
  ],
  investment: [
    { name: 'Stocks', icon: '📊', color: '#2563eb' },
    { name: 'Mutual Funds/UITF', icon: '🏦', color: '#1d4ed8' },
    { name: 'Pag-IBIG MP2', icon: '🏗️', color: '#1e40af' },
    { name: 'Bonds', icon: '📃', color: '#1e3a8a' },
    { name: 'Real Estate', icon: '🏘️', color: '#0369a1' },
    { name: 'Crypto', icon: '🪙', color: '#7c3aed' },
    { name: 'Other Investment', icon: '💎', color: '#4338ca' },
  ],
  savings: [
    { name: 'Emergency Fund', icon: '🆘', color: '#059669' },
    { name: 'Sinking Fund', icon: '🎯', color: '#0d9488' },
    { name: 'Travel Fund', icon: '✈️', color: '#0891b2' },
    { name: 'Education Fund', icon: '🎓', color: '#6d28d9' },
    { name: 'Other Savings', icon: '🐷', color: '#4f46e5' },
  ],
} as const;

export const BUDGET_ALERT_THRESHOLD = 0.8;

export const REMINDER_DAYS_BEFORE = 3;
