-- ==============================================================================
-- Migration: Create manual_consolidations, battle_history, and arena_battles
-- ==============================================================================

-- 1. Create table: manual_consolidations (نظام التثبيت اليدوي الذكي)
CREATE TABLE IF NOT EXISTS public.manual_consolidations (
  id TEXT PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_page INTEGER NOT NULL DEFAULT 1,
  end_page INTEGER NOT NULL DEFAULT 20,
  daily_pages_count INTEGER NOT NULL DEFAULT 4,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  include_fridays BOOLEAN NOT NULL DEFAULT false,
  has_harvest_day BOOLEAN NOT NULL DEFAULT false,
  harvest_days_count INTEGER NOT NULL DEFAULT 1,
  resume_page_pointer TEXT NOT NULL DEFAULT 'ص 1 النصف العلوي',
  pages_description TEXT,
  repetitions_count INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_manual_consolidations_student 
  ON public.manual_consolidations(student_id);

CREATE INDEX IF NOT EXISTS idx_manual_consolidations_dates 
  ON public.manual_consolidations(student_id, start_date, end_date);

ALTER TABLE public.manual_consolidations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated users full access to manual_consolidations" ON public.manual_consolidations;
CREATE POLICY "Allow all authenticated users full access to manual_consolidations"
  ON public.manual_consolidations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. Seed the 3 Active Manual Consolidations from local-manual-consolidations.json
-- ------------------------------------------------------------------------------
INSERT INTO public.manual_consolidations (
  id, student_id, start_page, end_page, daily_pages_count, start_date, end_date,
  include_fridays, has_harvest_day, harvest_days_count, resume_page_pointer,
  pages_description, repetitions_count, is_active, created_at, updated_at
)
VALUES
(
  'mc_1789082133049_cqu5n',
  '5615da6f-e6cd-4733-a28e-a3fdee8cb9de',
  91,
  106,
  2,
  '2026-09-12',
  '2026-09-22',
  true,
  true,
  3,
  'ص107 النصف العلوي',
  'من ص 91 إلى ص 106',
  10,
  true,
  '2026-09-10T23:20:00.697Z',
  '2026-09-10T23:20:00.697Z'
),
(
  'mc_1789080911393_x1m6k',
  'f7c52257-d501-45ec-bacc-0f0c75a295e4',
  22,
  33,
  2,
  '2026-09-20',
  '2026-09-26',
  true,
  true,
  1,
  'ص 34 النصف العلوي',
  'من ص 22 إلى ص 33',
  10,
  true,
  '2026-09-10T22:55:11.392Z',
  '2026-09-10T22:55:11.392Z'
),
(
  'mc_1789073066395_dmqcw',
  'f7c52257-d501-45ec-bacc-0f0c75a295e4',
  1,
  21,
  3,
  '2026-09-12',
  '2026-09-19',
  true,
  true,
  1,
  'ص34 النصف العلوي',
  'من ص 1 إلى ص 21',
  10,
  true,
  '2026-09-10T23:11:42.309Z',
  '2026-09-10T23:11:42.309Z'
)
ON CONFLICT (id) DO UPDATE SET
  start_page = EXCLUDED.start_page,
  end_page = EXCLUDED.end_page,
  daily_pages_count = EXCLUDED.daily_pages_count,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  include_fridays = EXCLUDED.include_fridays,
  has_harvest_day = EXCLUDED.has_harvest_day,
  harvest_days_count = EXCLUDED.harvest_days_count,
  resume_page_pointer = EXCLUDED.resume_page_pointer,
  pages_description = EXCLUDED.pages_description,
  repetitions_count = EXCLUDED.repetitions_count,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- ------------------------------------------------------------------------------
-- 3. Create table: battle_history (سجلات ساحة التحديات)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.battle_history (
  id TEXT PRIMARY KEY,
  attacker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  defender_id TEXT NOT NULL,
  attacker_name TEXT NOT NULL,
  defender_name TEXT NOT NULL,
  attacker_attack INTEGER NOT NULL DEFAULT 10,
  attacker_defense INTEGER NOT NULL DEFAULT 10,
  defender_attack INTEGER NOT NULL DEFAULT 10,
  defender_defense INTEGER NOT NULL DEFAULT 10,
  is_quran_boosted BOOLEAN NOT NULL DEFAULT false,
  outcome TEXT NOT NULL DEFAULT 'defeat',
  winner_id TEXT,
  gems_awarded INTEGER NOT NULL DEFAULT 0,
  battle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rounds_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_battle_history_attacker_date 
  ON public.battle_history(attacker_id, battle_date);

CREATE INDEX IF NOT EXISTS idx_battle_history_attacker_created 
  ON public.battle_history(attacker_id, created_at DESC);

ALTER TABLE public.battle_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read battle_history" ON public.battle_history;
CREATE POLICY "Allow authenticated read battle_history"
  ON public.battle_history
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert battle_history" ON public.battle_history;
CREATE POLICY "Allow authenticated insert battle_history"
  ON public.battle_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. Create table: arena_battles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_battles (
  id TEXT PRIMARY KEY,
  attacker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  defender_id TEXT NOT NULL,
  attacker_name TEXT NOT NULL,
  defender_name TEXT NOT NULL,
  attacker_attack INTEGER NOT NULL DEFAULT 10,
  attacker_defense INTEGER NOT NULL DEFAULT 10,
  defender_attack INTEGER NOT NULL DEFAULT 10,
  defender_defense INTEGER NOT NULL DEFAULT 10,
  is_quran_boosted BOOLEAN NOT NULL DEFAULT false,
  winner_id TEXT,
  gems_awarded INTEGER NOT NULL DEFAULT 0,
  battle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rounds_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arena_battles_attacker_date 
  ON public.arena_battles(attacker_id, battle_date);

CREATE INDEX IF NOT EXISTS idx_arena_battles_attacker_created 
  ON public.arena_battles(attacker_id, created_at DESC);

ALTER TABLE public.arena_battles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read arena_battles" ON public.arena_battles;
CREATE POLICY "Allow authenticated read arena_battles"
  ON public.arena_battles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert arena_battles" ON public.arena_battles;
CREATE POLICY "Allow authenticated insert arena_battles"
  ON public.arena_battles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
