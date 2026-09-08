-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'parent')),
  phone TEXT,
  student_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks (preset list with fixed points)
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  emoji TEXT NOT NULL DEFAULT '📋',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily assignments
CREATE TABLE daily_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, task_id, assigned_date)
);

-- Weekly summaries (reset each week)
CREATE TABLE weekly_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_points INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  UNIQUE(student_id, week_start)
);

-- Monthly summaries
CREATE TABLE monthly_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  UNIQUE(student_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, owner can update
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tasks: everyone reads, only teachers write
CREATE POLICY "tasks_read_all" ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_teacher_write" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Daily assignments: teachers manage all, students manage their own
CREATE POLICY "assignments_read" ON daily_assignments FOR SELECT USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'parent'))
);
CREATE POLICY "assignments_teacher_write" ON daily_assignments FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "assignments_teacher_delete" ON daily_assignments FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "assignments_student_update" ON daily_assignments FOR UPDATE USING (
  student_id = auth.uid()
);

-- Summaries: everyone reads
CREATE POLICY "weekly_read_all" ON weekly_summaries FOR SELECT USING (true);
CREATE POLICY "monthly_read_all" ON monthly_summaries FOR SELECT USING (true);
