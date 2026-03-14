-- Add savings_target column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS savings_target NUMERIC(15, 2) DEFAULT 200000;
