-- ==============================================================================
-- Migration: Create student_plans table with strict RLS policies
-- ==============================================================================

-- 1. Create table: student_plans
CREATE TABLE IF NOT EXISTS public.student_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Memorization fields
  current_page INTEGER NOT NULL DEFAULT 1 CHECK (current_page BETWEEN 1 AND 604),
  page_part TEXT NOT NULL DEFAULT 'top' CHECK (page_part IN ('top', 'bottom')),
  
  -- Revision fields
  memorized_ajza INTEGER[] NOT NULL DEFAULT '{1}',
  current_review_index INTEGER NOT NULL DEFAULT 0,
  current_review_hizb INTEGER NOT NULL DEFAULT 1 CHECK (current_review_hizb BETWEEN 1 AND 60),
  
  -- Consolidation fields
  is_in_consolidation BOOLEAN NOT NULL DEFAULT false,
  consolidation_day INTEGER NOT NULL DEFAULT 0,
  consolidation_juz INTEGER NOT NULL DEFAULT 0,
  
  -- Dates and lifecycle
  plan_date DATE,
  last_lesson_completed_date DATE,
  last_review_completed_date DATE,
  plan_start_date DATE,
  plan_end_date DATE,
  plan_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Daily plan snapshots JSONB
  daily_plan_snapshots JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create index on student_id
CREATE INDEX IF NOT EXISTS idx_student_plans_student_id ON public.student_plans(student_id);

-- 3. Enable RLS
ALTER TABLE public.student_plans ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies
DROP POLICY IF EXISTS "Students can view own plan, teachers view all" ON public.student_plans;
DROP POLICY IF EXISTS "Teachers manage all plans, students cannot self-edit sensitive fields" ON public.student_plans;
DROP POLICY IF EXISTS "Allow read student_plans for authenticated users" ON public.student_plans;
DROP POLICY IF EXISTS "Allow manage student_plans for authenticated users" ON public.student_plans;

-- 5. Strict RLS Policies:
-- (A) Students can view own plan, Teachers/Admins can view all plans
CREATE POLICY "Students can view own plan, teachers view all" ON public.student_plans
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- (B) Only Teachers/Admins can manage/update/insert plans directly via client.
-- Students cannot self-edit sensitive plan fields.
-- Backend routes / API with Service Role Key bypass RLS safely on the server.
CREATE POLICY "Teachers manage all plans, students cannot self-edit sensitive fields" ON public.student_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );
