-- Add missing expense categories to match UI labels
-- Run this in Supabase SQL Editor

-- First, update "Food & Dining" to "Food & Groceries" if it exists
UPDATE categories
SET name = 'Food & Groceries'
WHERE name = 'Food & Dining' AND type = 'expense' AND user_id IS NULL;

-- Now insert all missing categories
-- Using INSERT ... WHERE NOT EXISTS to avoid duplicates
INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Food & Groceries', 'expense', 'shopping-basket', '#10b981', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Groceries' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Pet Supplies', 'expense', 'paw', '#8b5cf6', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pet Supplies' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Dining', 'expense', 'cutlery', '#f59e0b', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dining' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Shopping', 'expense', 'shopping-bag', '#ec4899', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Shopping' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Transportation', 'expense', 'bus', '#3b82f6', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Gas', 'expense', 'car', '#ef4444', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gas' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Toll Gate', 'expense', 'road', '#64748b', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Toll Gate' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Travel', 'expense', 'plane', '#06b6d4', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Travel' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Vehicle Maintenance', 'expense', 'wrench', '#f97316', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Vehicle Maintenance' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'House Maintenance', 'expense', 'home', '#84cc16', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'House Maintenance' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Gardening Needs', 'expense', 'leaf', '#22c55e', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gardening Needs' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Utilities', 'expense', 'bolt', '#eab308', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Utilities' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Healthcare', 'expense', 'medkit', '#dc2626', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Entertainment', 'expense', 'film', '#a855f7', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'CellPhone Load', 'expense', 'mobile', '#0ea5e9', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'CellPhone Load' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Online Shopping', 'expense', 'shopping-cart', '#d946ef', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Online Shopping' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Insurance', 'expense', 'shield', '#14b8a6', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Insurance' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Emergency Fund', 'expense', 'exclamation-triangle', '#f43f5e', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Emergency Fund' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Vacation', 'expense', 'sun-o', '#fbbf24', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Vacation' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Rent', 'expense', 'home', '#6366f1', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Rent' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Credit Cards', 'expense', 'credit-card', '#ef4444', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Credit Cards' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Loans', 'expense', 'bank', '#dc2626', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Loans' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Taxes', 'expense', 'file-text-o', '#78716c', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Taxes' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Tuition Fee', 'expense', 'graduation-cap', '#7c3aed', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Tuition Fee' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'School Service', 'expense', 'bus', '#d97706', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'School Service' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'School Supplies', 'expense', 'pencil', '#0284c7', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'School Supplies' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Allowance', 'expense', 'money', '#16a34a', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Allowance' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Remittance', 'expense', 'exchange', '#0891b2', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Remittance' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Personal Care and Leisure', 'expense', 'smile-o', '#db2777', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Personal Care and Leisure' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'License, Registration and Certification', 'expense', 'id-card-o', '#0369a1', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'License, Registration and Certification' AND type = 'expense' AND user_id IS NULL);

INSERT INTO categories (name, type, icon, color, is_system, user_id)
SELECT 'Others', 'expense', 'question-circle', '#9ca3af', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Others' AND type = 'expense' AND user_id IS NULL);

-- Verify the categories were added
SELECT name, type, icon, color
FROM categories
WHERE type = 'expense'
ORDER BY name;
