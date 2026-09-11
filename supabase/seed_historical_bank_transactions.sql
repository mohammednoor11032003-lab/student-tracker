-- ==========================================================
-- 1. Create bank_transactions table if not already created
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'adjustment')),
  description TEXT NOT NULL,
  reference_id TEXT UNIQUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_student ON public.bank_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON public.bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_ref ON public.bank_transactions(reference_id);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_transactions' AND policyname = 'Anyone can view bank transactions'
  ) THEN
    CREATE POLICY "Anyone can view bank transactions" ON public.bank_transactions FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bank_transactions' AND policyname = 'Authenticated users can manage bank transactions'
  ) THEN
    CREATE POLICY "Authenticated users can manage bank transactions" ON public.bank_transactions FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ==========================================================
-- 2. Insert 43 Historical Transactions (Gains & Spends)
-- ==========================================================
INSERT INTO public.bank_transactions (student_id, amount, type, description, reference_id, created_at)
VALUES
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في التحفيظ لشهر 7 - الأسبوع الرابع', 'hist_earn_d42d62cc_2026-08-01_1', '2026-08-01T10:00:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الرابع', 'hist_earn_d42d62cc_2026-08-01_2', '2026-08-01T11:07:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 1, 'earn', 'المركز الثاني في المفكرة للأسبوع السادس', 'hist_earn_d42d62cc_2026-08-15_3', '2026-08-15T12:14:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في المفكرة للأسبوع السابع', 'hist_earn_d42d62cc_2026-08-22_4', '2026-08-22T13:21:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الثامن', 'hist_earn_d42d62cc_2026-08-29_5', '2026-08-29T14:28:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 10, 'earn', 'المركز الأول كبطل للمفكرة النهائية (نهاية البرنامج)', 'hist_earn_d42d62cc_2026-09-11_6', '2026-09-11T15:35:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 3, 'spend', 'مسبح', 'hist_spend_d42d62cc_2026-09-05_7', '2026-09-05T16:42:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 1, 'spend', 'مسبح', 'hist_spend_d42d62cc_2026-09-05_8', '2026-09-05T17:49:00.000Z'),
  ('d42d62cc-f9c7-4484-8789-1de973ec8375', 5, 'spend', 'شاورما', 'hist_spend_d42d62cc_2026-09-05_9', '2026-09-05T10:56:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 2, 'earn', 'المركز الثاني في التحفيظ لشهر 7 - الأسبوع الأول', 'hist_earn_f7c52257_2026-07-11_10', '2026-07-11T11:03:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الثالث', 'hist_earn_f7c52257_2026-07-25_11', '2026-07-25T12:10:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في التحفيظ لشهر 7 - الأسبوع الرابع', 'hist_earn_f7c52257_2026-08-01_12', '2026-08-01T13:17:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 2, 'earn', 'المركز الثاني في المفكرة للأسبوع الخامس', 'hist_earn_f7c52257_2026-08-08_13', '2026-08-08T14:24:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع السادس', 'hist_earn_f7c52257_2026-08-15_14', '2026-08-15T15:31:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع السابع', 'hist_earn_f7c52257_2026-08-22_15', '2026-08-22T16:38:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع الثامن', 'hist_earn_f7c52257_2026-08-29_16', '2026-08-29T17:45:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 6, 'earn', 'المركز الثاني كبطل للمفكرة النهائية (نهاية البرنامج)', 'hist_earn_f7c52257_2026-09-11_17', '2026-09-11T10:52:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 3.75, 'spend', 'شاورما', 'hist_spend_f7c52257_2026-07-31_18', '2026-07-31T11:59:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'spend', 'مسبح', 'hist_spend_f7c52257_2026-08-05_19', '2026-08-05T12:06:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 3, 'spend', 'مسبح', 'hist_spend_f7c52257_2026-09-05_20', '2026-09-05T13:13:00.000Z'),
  ('f7c52257-d501-45ec-bacc-0f0c75a295e4', 2.25, 'spend', 'شاورما', 'hist_spend_f7c52257_2026-09-05_21', '2026-09-05T14:20:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الأول في التحفيظ لشهر 7 - الاسبوع الأول', 'hist_earn_00b5cbd1_2026-07-11_22', '2026-07-11T15:27:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الثاني في التحفيظ لشهر 7 - الأسبوع الرابع', 'hist_earn_00b5cbd1_2026-08-01_23', '2026-08-01T16:34:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الأول في التحفيظ لشهر 8 - الأسبوع الأول', 'hist_earn_00b5cbd1_2026-08-08_24', '2026-08-08T17:41:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع الخامس', 'hist_earn_00b5cbd1_2026-08-08_25', '2026-08-08T10:48:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع السادس', 'hist_earn_00b5cbd1_2026-08-15_26', '2026-08-15T11:55:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الثاني في المفكرة للأسبوع الثامن', 'hist_earn_00b5cbd1_2026-08-29_27', '2026-08-29T12:02:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 4, 'earn', 'المركز الثالث كبطل للمفكرة النهائية (نهاية البرنامج)', 'hist_earn_00b5cbd1_2026-09-11_28', '2026-09-11T13:09:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 3.25, 'spend', 'شاورما', 'hist_spend_00b5cbd1_2026-07-31_29', '2026-07-31T14:16:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 1, 'spend', 'مسبح', 'hist_spend_00b5cbd1_2026-08-05_30', '2026-08-05T15:23:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 3, 'spend', 'مسبح', 'hist_spend_00b5cbd1_2026-09-05_31', '2026-09-05T16:30:00.000Z'),
  ('00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2.25, 'spend', 'شاورما', 'hist_spend_00b5cbd1_2026-09-05_32', '2026-09-05T17:37:00.000Z'),
  ('cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 2, 'earn', 'المركز الأول في المفكرة للأسبوع السادس', 'hist_earn_cf94cdf6_2026-08-15_33', '2026-08-15T10:44:00.000Z'),
  ('cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 2, 'earn', 'المركز الأول في المفكرة للأسبوع السابع', 'hist_earn_cf94cdf6_2026-08-22_34', '2026-08-22T11:51:00.000Z'),
  ('cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 2, 'earn', 'المركز الأول في التحفيظ لشهر 9 - الأسبوع الأول', 'hist_earn_cf94cdf6_2026-09-05_35', '2026-09-05T12:58:00.000Z'),
  ('cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 3, 'spend', 'مسبح', 'hist_spend_cf94cdf6_2026-09-05_36', '2026-09-05T13:05:00.000Z'),
  ('cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 3, 'spend', 'شاورما', 'hist_spend_cf94cdf6_2026-09-05_37', '2026-09-05T14:12:00.000Z'),
  ('5615da6f-e6cd-4733-a28e-a3fdee8cb9de', 1, 'earn', 'المركز الثالث في التحفيظ للأسبوع الأول', 'hist_earn_5615da6f_2026-07-11_38', '2026-07-11T15:19:00.000Z'),
  ('5615da6f-e6cd-4733-a28e-a3fdee8cb9de', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الخامس', 'hist_earn_5615da6f_2026-08-08_39', '2026-08-08T16:26:00.000Z'),
  ('5615da6f-e6cd-4733-a28e-a3fdee8cb9de', 1, 'earn', 'المركز الثالث في التحفيظ لشهر 9 - الأسبوع الأول', 'hist_earn_5615da6f_2026-09-05_40', '2026-09-05T17:33:00.000Z'),
  ('e0c08070-a9b7-4581-9c22-9c7b17c1483f', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الأول', 'hist_earn_e0c08070_2026-07-11_41', '2026-07-11T10:40:00.000Z'),
  ('e0c08070-a9b7-4581-9c22-9c7b17c1483f', 2, 'spend', 'المسبح', 'hist_spend_e0c08070_2026-09-05_42', '2026-09-05T11:47:00.000Z'),
  ('d77802d5-c1bc-40a6-b683-f57a4e4f38ac', 2, 'earn', 'المركز الأول في التحفيظ لشهر 9 - الأسبوع الأول', 'hist_earn_d77802d5_2026-09-05_43', '2026-09-05T12:54:00.000Z')
ON CONFLICT (reference_id) DO UPDATE SET
  amount = EXCLUDED.amount,
  type = EXCLUDED.type,
  description = EXCLUDED.description;
