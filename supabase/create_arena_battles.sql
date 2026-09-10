-- ==============================================================================
-- Migration: Create arena_battles table for student duels & competitions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.arena_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  defender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attacker_name TEXT NOT NULL,
  defender_name TEXT NOT NULL,
  attacker_attack INTEGER NOT NULL DEFAULT 10,
  attacker_defense INTEGER NOT NULL DEFAULT 10,
  defender_attack INTEGER NOT NULL DEFAULT 10,
  defender_defense INTEGER NOT NULL DEFAULT 10,
  is_quran_boosted BOOLEAN NOT NULL DEFAULT FALSE,
  winner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gems_awarded INTEGER NOT NULL DEFAULT 0,
  battle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rounds_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for checking student's daily challenges limit (max 3 per day)
CREATE INDEX IF NOT EXISTS idx_arena_battles_attacker_date 
  ON public.arena_battles(attacker_id, battle_date);

-- Index for retrieving student recent battle history
CREATE INDEX IF NOT EXISTS idx_arena_battles_attacker_history 
  ON public.arena_battles(attacker_id, created_at DESC);

-- Index for defender history
CREATE INDEX IF NOT EXISTS idx_arena_battles_defender_history 
  ON public.arena_battles(defender_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.arena_battles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own battles
DROP POLICY IF EXISTS "Students can view their own battles" ON public.arena_battles;
CREATE POLICY "Students can view their own battles"
  ON public.arena_battles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Allow service role or authenticated insert
DROP POLICY IF EXISTS "Authenticated can insert battles" ON public.arena_battles;
CREATE POLICY "Authenticated can insert battles"
  ON public.arena_battles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = attacker_id);
