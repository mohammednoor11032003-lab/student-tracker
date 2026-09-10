-- =========================================================================
-- Migration Script: RPG Hero System (بطلي) & Gems Economy & Shop Schema
-- =========================================================================

-- 1. Add gems_balance to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gems_balance INTEGER DEFAULT 0;

-- 2. Create shop_items table
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('head', 'body', 'weapon', 'feet')),
  price_in_gems INTEGER NOT NULL DEFAULT 10,
  icon_name TEXT NOT NULL,
  description TEXT,
  visual_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create student_inventory table
CREATE TABLE IF NOT EXISTS student_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, item_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_inventory ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users for shop items
CREATE POLICY "Allow read access to shop_items for authenticated users" 
ON shop_items FOR SELECT TO authenticated USING (true);

-- Allow students to read and manage their own inventory
CREATE POLICY "Allow students to view their inventory" 
ON student_inventory FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Allow students to insert into their inventory" 
ON student_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Allow students to update their inventory" 
ON student_inventory FOR UPDATE TO authenticated USING (auth.uid() = student_id);
