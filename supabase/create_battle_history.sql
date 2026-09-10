-- ==============================================================================
-- Migration: Add gems_balance to profiles and create battle_history table
-- ==============================================================================

-- 1. Ensure gems_balance column exists on profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS gems_balance INTEGER NOT NULL DEFAULT 0;

-- 2. Create battle_history table (and arena_battles if not exists)
CREATE TABLE IF NOT EXISTS public.battle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  defender_id TEXT NOT NULL,
  attacker_name TEXT NOT NULL,
  defender_name TEXT NOT NULL,
  attacker_attack INTEGER NOT NULL DEFAULT 10,
  attacker_defense INTEGER NOT NULL DEFAULT 10,
  defender_attack INTEGER NOT NULL DEFAULT 10,
  defender_defense INTEGER NOT NULL DEFAULT 10,
  is_quran_boosted BOOLEAN NOT NULL DEFAULT FALSE,
  outcome TEXT NOT NULL DEFAULT 'defeat', -- 'victory', 'defeat', 'draw'
  winner_id TEXT,
  gems_awarded INTEGER NOT NULL DEFAULT 0,
  battle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rounds_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Also create arena_battles with flexible text IDs so bot challenges and draws insert cleanly
CREATE TABLE IF NOT EXISTS public.arena_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  defender_id TEXT NOT NULL,
  attacker_name TEXT NOT NULL,
  defender_name TEXT NOT NULL,
  attacker_attack INTEGER NOT NULL DEFAULT 10,
  attacker_defense INTEGER NOT NULL DEFAULT 10,
  defender_attack INTEGER NOT NULL DEFAULT 10,
  defender_defense INTEGER NOT NULL DEFAULT 10,
  is_quran_boosted BOOLEAN NOT NULL DEFAULT FALSE,
  outcome TEXT NOT NULL DEFAULT 'defeat',
  winner_id TEXT,
  gems_awarded INTEGER NOT NULL DEFAULT 0,
  battle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rounds_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_battle_history_attacker_date 
  ON public.battle_history(attacker_id, battle_date);

CREATE INDEX IF NOT EXISTS idx_battle_history_attacker_created 
  ON public.battle_history(attacker_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.battle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_battles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view battles
DROP POLICY IF EXISTS "Anyone authenticated can view battle history" ON public.battle_history;
CREATE POLICY "Anyone authenticated can view battle history"
  ON public.battle_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert battle history" ON public.battle_history;
CREATE POLICY "Authenticated can insert battle history"
  ON public.battle_history FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone authenticated can view arena battles" ON public.arena_battles;
CREATE POLICY "Anyone authenticated can view arena battles"
  ON public.arena_battles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert arena battles" ON public.arena_battles;
CREATE POLICY "Authenticated can insert arena battles"
  ON public.arena_battles FOR INSERT TO authenticated WITH CHECK (true);
