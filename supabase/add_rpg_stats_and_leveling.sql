-- =========================================================================
-- Migration Script: RPG Stats (base_attack, base_defense) & Leveling System
-- =========================================================================

-- 1. Add base_attack and base_defense to shop_items
ALTER TABLE shop_items 
ADD COLUMN IF NOT EXISTS base_attack INTEGER DEFAULT 0;

ALTER TABLE shop_items 
ADD COLUMN IF NOT EXISTS base_defense INTEGER DEFAULT 0;

-- 2. Add item_level to student_inventory
ALTER TABLE student_inventory 
ADD COLUMN IF NOT EXISTS item_level INTEGER DEFAULT 1;

-- 3. Update Existing 28 Historic Items with Stats

-- HEAD (الرأس - دفاع أساسي وهجوم تكتيكي)
UPDATE shop_items SET base_attack = 0, base_defense = 5 WHERE name = 'طاقية البداية';
UPDATE shop_items SET base_attack = 1, base_defense = 10 WHERE name = 'كوفية الساعي';
UPDATE shop_items SET base_attack = 3, base_defense = 18 WHERE name = 'عمامة المرابط';
UPDATE shop_items SET base_attack = 5, base_defense = 28 WHERE name = 'خوذة الفرسان';
UPDATE shop_items SET base_attack = 6, base_defense = 38 WHERE name = 'عمامة الحجاز';
UPDATE shop_items SET base_attack = 10, base_defense = 52 WHERE name = 'خوذة الأيوبيين';
UPDATE shop_items SET base_attack = 15, base_defense = 70 WHERE name = 'تاج الوقار';

-- BODY (الجسم - حماية قوية وصمود)
UPDATE shop_items SET base_attack = 0, base_defense = 8 WHERE name = 'ثوب المبتدئ';
UPDATE shop_items SET base_attack = 2, base_defense = 15 WHERE name = 'عباءة الساعي';
UPDATE shop_items SET base_attack = 4, base_defense = 25 WHERE name = 'سترة الحرس';
UPDATE shop_items SET base_attack = 6, base_defense = 38 WHERE name = 'درع الفرسان الخفيف';
UPDATE shop_items SET base_attack = 8, base_defense = 50 WHERE name = 'عباءة الأندلس';
UPDATE shop_items SET base_attack = 12, base_defense = 68 WHERE name = 'درع المماليك الفولاذي';
UPDATE shop_items SET base_attack = 20, base_defense = 90 WHERE name = 'حُلة الكرامة';

-- WEAPON (السلاح - قوة هجومية فائقة)
UPDATE shop_items SET base_attack = 8, base_defense = 2 WHERE name = 'عصا الترحال';
UPDATE shop_items SET base_attack = 16, base_defense = 3 WHERE name = 'خنجر اليقين';
UPDATE shop_items SET base_attack = 28, base_defense = 5 WHERE name = 'قوس البصيرة';
UPDATE shop_items SET base_attack = 42, base_defense = 8 WHERE name = 'سيف العزيمة';
UPDATE shop_items SET base_attack = 58, base_defense = 12 WHERE name = 'رمح الثبات';
UPDATE shop_items SET base_attack = 78, base_defense = 15 WHERE name = 'نصل اليرموك';
UPDATE shop_items SET base_attack = 105, base_defense = 25 WHERE name = 'سيف الفتح المبين';

-- FEET (القدمين - خفة وتوازن ودفاع)
UPDATE shop_items SET base_attack = 0, base_defense = 3 WHERE name = 'صندل البداية';
UPDATE shop_items SET base_attack = 1, base_defense = 7 WHERE name = 'خف الساعي';
UPDATE shop_items SET base_attack = 2, base_defense = 12 WHERE name = 'حذاء المرابط';
UPDATE shop_items SET base_attack = 3, base_defense = 18 WHERE name = 'خف الصحراء';
UPDATE shop_items SET base_attack = 5, base_defense = 26 WHERE name = 'حذاء الفرسان';
UPDATE shop_items SET base_attack = 8, base_defense = 36 WHERE name = 'حذاء الخيل المدرع';
UPDATE shop_items SET base_attack = 12, base_defense = 50 WHERE name = 'خف الواثق';
