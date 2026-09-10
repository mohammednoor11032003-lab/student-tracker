-- ============================================================
-- SQL Migration: Smart Manual Consolidation System (نظام التثبيت اليدوي الذكي)
-- ============================================================

CREATE TABLE IF NOT EXISTS manual_consolidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_page INTEGER NOT NULL DEFAULT 1,
  end_page INTEGER NOT NULL DEFAULT 20,
  daily_pages_count INTEGER NOT NULL DEFAULT 4,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  has_harvest_day BOOLEAN NOT NULL DEFAULT false,
  harvest_days_count INTEGER NOT NULL DEFAULT 1,
  resume_page_pointer TEXT NOT NULL DEFAULT 'ص 1 النصف العلوي',
  pages_description TEXT,
  repetitions_count INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all new columns exist if table was already created
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS start_page INTEGER NOT NULL DEFAULT 1;
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS end_page INTEGER NOT NULL DEFAULT 20;
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS daily_pages_count INTEGER NOT NULL DEFAULT 4;
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS has_harvest_day BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS harvest_days_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS resume_page_pointer TEXT NOT NULL DEFAULT 'ص 1 النصف العلوي';
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS pages_description TEXT;
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS repetitions_count INTEGER NOT NULL DEFAULT 5;
ALTER TABLE manual_consolidations ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

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
