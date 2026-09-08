# منصة متابعة الطلاب 🏆

موقع ويب عربي لمتابعة الطلاب يومياً وتسجيل المهام ومنح النقاط.

---

## خطوات الإعداد (مرة واحدة فقط)

### 1. إعداد Supabase (مجاني)
1. اذهب إلى https://supabase.com وأنشئ حساباً مجانياً
2. أنشئ مشروعاً جديداً
3. من القائمة الجانبية اختر **SQL Editor**
4. انسخ محتوى ملف `supabase/schema.sql` والصقه ثم اضغط Run
5. من **Settings → API** انسخ:
   - **Project URL** ← NEXT_PUBLIC_SUPABASE_URL
   - **anon public** ← NEXT_PUBLIC_SUPABASE_ANON_KEY
   - **service_role** ← SUPABASE_SERVICE_ROLE_KEY

### 2. إنشاء ملف البيئة
انسخ الملف:
```
copy .env.local.example .env.local
```
ثم افتح `.env.local` وأدخل قيم Supabase

### 3. تثبيت وتشغيل
```
npm install
npm run dev
```
افتح المتصفح على: http://localhost:3000

---

## إضافة المستخدمين

### في Supabase Dashboard:
1. **Authentication → Users → Add user** (أضف بريد + كلمة سر)
2. **SQL Editor** - شغّل لكل مستخدم:

```sql
-- مدرس
INSERT INTO profiles (id, full_name, role) VALUES
('UUID_من_الخطوة_1', 'اسم المدرس', 'teacher');

-- طالب
INSERT INTO profiles (id, full_name, role) VALUES
('UUID_الطالب', 'اسم الطالب', 'student');

-- ولي أمر (student_id = معرف الطالب، phone = رقم واتساب)
INSERT INTO profiles (id, full_name, role, phone, student_id) VALUES
('UUID_ولي_الامر', 'اسم ولي الأمر', 'parent', '+966500000000', 'UUID_الطالب');
```

---

## إشعارات WhatsApp (اختياري)
1. سجّل في https://twilio.com
2. فعّل WhatsApp Sandbox من Messaging → Try it out → WhatsApp
3. أضف بيانات Twilio في `.env.local`

---

## النشر على Vercel (مجاني)
1. ارفع المشروع على GitHub
2. اذهب إلى https://vercel.com وربط المشروع
3. أضف متغيرات البيئة في Vercel Dashboard
4. انشر!