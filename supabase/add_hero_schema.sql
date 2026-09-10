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

-- 5. Seed 28 Islamic & Historic Items into shop_items
-- Clear old catalog items to refresh with 28 historic items
DELETE FROM shop_items;

INSERT INTO shop_items (name, category, price_in_gems, icon_name, description, visual_data) VALUES
  -- HEAD (7 items)
  ('طاقية البداية', 'head', 50, '🧢', 'طاقية قماشية بيضاء ناصعة وبسيطة ترمز لبداية مسيرة طالب القرآن المباركة.', '{"visual_id": "starter_cap"}'),
  ('كوفية الساعي', 'head', 120, '🧣', 'كوفية عملية محكمة تقي من حر الهواجر وتعين الساعي في حفظ كتاب الله.', '{"visual_id": "courier_keffiyeh"}'),
  ('عمامة المرابط', 'head', 250, '🧕', 'عمامة خضراء مباركة استلهمت من مرابطي الثغور الذين رابطوا بالقرآن والسنان.', '{"visual_id": "murabit_turban"}'),
  ('خوذة الفرسان', 'head', 420, '🪖', 'خوذة حديدية مصقولة تمنح الفارس هيبة وثباتاً في ميادين التلاوة والتنافس.', '{"visual_id": "knight_helmet"}'),
  ('عمامة الحجاز', 'head', 600, '👳', 'عمامة أهل الحجاز البيضاء الفاخرة المطرزة بالقصب الذهبي لطلبة العلم الشريف.', '{"visual_id": "hijaz_turban"}'),
  ('خوذة الأيوبيين', 'head', 800, '👑', 'خوذة تاريخية مذهبة منقوشة بالآيات ارتدتها كتائب التحرير والصلاح.', '{"visual_id": "ayyubid_helmet"}'),
  ('تاج الوقار', 'head', 1000, '✨👑', 'التاج الأعظم المزين بالياقوت والأنوار، مصداقاً لوعد من حفظ القرآن وأتقنه.', '{"visual_id": "crown_of_dignity"}'),

  -- BODY (7 items)
  ('ثوب المبتدئ', 'body', 50, '🥋', 'ثوب أبيض بسيط ومريح يعبر عن نقاء الهمة وإخلاص البدايات في حلقة التحفيظ.', '{"visual_id": "starter_thobe"}'),
  ('عباءة الساعي', 'body', 120, '🧥', 'عباءة رملية متينة تقي من الرياح وتمنح صاحبها خفة ورشاقة في مدارسة الآيات.', '{"visual_id": "courier_cloak"}'),
  ('سترة الحرس', 'body', 250, '🦺', 'سترة مبطنة بالجلد والكتان المقوى لحراس القلاع الساهرين على أمان الأمة.', '{"visual_id": "guard_vest"}'),
  ('درع الفرسان الخفيف', 'body', 420, '🛡️', 'درع صدري فولاذي يجمع بين صلابة الحماية وسهولة الحركة لحفظة القرآن الفرسان.', '{"visual_id": "light_knight_armor"}'),
  ('عباءة الأندلس', 'body', 600, '👘', 'كسوة أندلسية فاخرة بنسيج كحلي مذهب مستوحى من قصور قرطبة وجوامع العلم.', '{"visual_id": "andalus_cloak"}'),
  ('درع المماليك الفولاذي', 'body', 800, '⚔️', 'درع حديدي متشابك الحلقات شديد البأس حاز بطولات الدفاع عن الديار الإسلامية.', '{"visual_id": "mamluk_steel_armor"}'),
  ('حُلة الكرامة', 'body', 1000, '🌟', 'حُلة ملكية سماوية مطرزة بخيوط النور والذهب الخالص تليق بصفوة الحفاظ والمتفوقين.', '{"visual_id": "robe_of_honor"}'),

  -- WEAPON (7 items)
  ('عصا الترحال', 'weapon', 50, '🦯', 'عصا من خشب السنديان المتين يتوكأ عليها الساعي في رحلته الإيمانية المباركة.', '{"visual_id": "traveler_staff"}'),
  ('خنجر اليقين', 'weapon', 120, '🗡️', 'خنجر فولاذي أنيق في غمد منقوش يقطع شكوك التردد بحزم وثبات.', '{"visual_id": "dagger_of_certainty"}'),
  ('قوس البصيرة', 'weapon', 250, '🏹', 'قوس عربي أصيل مرن ودقيق يصيب أهداف الإتقان بثقة وسداد.', '{"visual_id": "bow_of_insight"}'),
  ('سيف العزيمة', 'weapon', 420, '⚔️', 'سيف عربي مستقيم مصقول من الفولاذ الدمشقي يشحذ همة البطل للتفوق.', '{"visual_id": "sword_of_resolve"}'),
  ('رمح الثبات', 'weapon', 600, '🔱', 'رمح طويل بسنان حاد وراية خضراء ترفرف في سماء العزة والرسوخ.', '{"visual_id": "spear_of_steadfastness"}'),
  ('نصل اليرموك', 'weapon', 800, '⚡', 'نصل مهيب يحمل عبق معارك الفتح الخالدة وشجاعة فرسان الصحابة الأبرار.', '{"visual_id": "blade_of_yarmouk"}'),
  ('سيف الفتح المبين', 'weapon', 1000, '✨⚔️', 'سيف أسطوري ملحمي يشع بنور أزرق سماوي متوهج يرمز للفتح والنصر المؤزر.', '{"visual_id": "sword_of_conquest"}'),

  -- FEET (7 items)
  ('نعل البداية', 'feet', 50, '🩴', 'نعل جلدي بسيط ومريح يخطو به الطالب أولى خطواته المباركة في رياض القرآن.', '{"visual_id": "starter_sandals"}'),
  ('خف الساعي', 'feet', 120, '👞', 'خف خفيف ومريح يعين على كثرة المسير إلى الحلقات والمساجد دون إرهاق.', '{"visual_id": "courier_slippers"}'),
  ('حذاء المرابط', 'feet', 250, '🥾', 'حذاء متين من الجلد الخام صمم لثبات الأقدام في وعورة الدروب ومسالك الجبال.', '{"visual_id": "murabit_boots"}'),
  ('خف الصحراء', 'feet', 420, '👢', 'خف محكم يمنع تسرب الرمال ويمنح الفارس سرعة فائقة في قطع المسافات الطويلة.', '{"visual_id": "desert_boots"}'),
  ('حذاء الفرسان', 'feet', 600, '🦾', 'حذاء جلدي مصفح بحلقات حديدية يمتد إلى منتصف الساق لحماية الفارس في المعركة.', '{"visual_id": "knight_boots"}'),
  ('حذاء الخيل المدرع', 'feet', 800, '🛡️', 'حذاء فولاذي كامل يمنح ثباتاً خارقاً على صهوة الجياد في أصعب النزالات.', '{"visual_id": "armored_cavalry_boots"}'),
  ('خف الواثق', 'feet', 1000, '✨🥾', 'خف أزرق سماوي مذهب يرتديه أصحاب الهمم العالية والخطوات الواثقة نحو العلا.', '{"visual_id": "shoes_of_confidence"}');
