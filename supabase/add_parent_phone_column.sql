-- Migration: Add parent_phone column to profiles table
-- Stores guardian/parent phone number for WhatsApp reports and automated notifications.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS parent_phone text;

COMMENT ON COLUMN profiles.parent_phone IS 'Guardian phone number formatted with country code without plus sign (e.g. 9627XXXXXXXX)';
