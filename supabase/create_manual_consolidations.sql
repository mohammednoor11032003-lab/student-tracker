-- ============================================================
-- SQL Migration: Manual Consolidation System (نظام التثبيت اليدوي)
-- ============================================================

CREATE TABLE IF NOT EXISTS manual_consolidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pages_description TEXT NOT NULL,
  repetitions_count INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_consolidations_student 
  ON manual_consolidations(student_id);

CREATE INDEX IF NOT EXISTS idx_manual_consolidations_dates 
  ON manual_consolidations(student_id, start_date, end_date);

ALTER TABLE manual_consolidations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users full access to manual_consolidations"
  ON manual_consolidations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
