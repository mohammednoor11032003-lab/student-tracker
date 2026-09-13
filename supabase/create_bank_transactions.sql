-- ==========================================================
-- 1. Create bank_transactions table with TEXT id to preserve existing transaction IDs
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id TEXT PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'adjustment')),
    description TEXT NOT NULL,
    reference_id TEXT UNIQUE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_student_id ON public.bank_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON public.bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reference_id ON public.bank_transactions(reference_id);

-- Enable RLS
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Students can view own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Teachers can manage all bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Anyone can view bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Authenticated users can manage bank transactions" ON public.bank_transactions;

-- Allow students to view their own transactions
CREATE POLICY "Students can view own bank transactions"
    ON public.bank_transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);

-- Allow teachers to view and manage all transactions
CREATE POLICY "Teachers can manage all bank transactions"
    ON public.bank_transactions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
        )
    );

-- ==========================================================
-- 2. Seed all 48 Current Transactions from local-bank-transactions.json
-- ==========================================================
INSERT INTO public.bank_transactions (id, student_id, amount, type, description, reference_id, created_by, created_at)
VALUES
('tx_1789215628045_2_m75tx6b', 'cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 2, 'earn', 'المركز الثالث في التحفيظ لشهر 9 - الاسبوع ال2 بتاريخ 12-9-2026', 'ref_tahfeez_rank3_w2_m9_20260912_cf94cdf6', 'teacher', '2026-09-12T12:20:28.042Z'),
('tx_1789215628045_1_6hiybjv', 'e0c08070-a9b7-4581-9c22-9c7b17c1483f', 2, 'earn', 'المركز الثاني في التحفيظ لشهر 9 - الاسبوع ال2 بتاريخ 12-9-2026', 'ref_tahfeez_rank2_w2_m9_20260912_e0c08070', 'teacher', '2026-09-12T12:20:28.042Z'),
('tx_1789215628044_0_du0fyg6', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الاول في التحفيظ لشهر 9 - الاسبوع ال2 بتاريخ 12-9-2026', 'ref_tahfeez_rank1_w2_m9_20260912_00b5cbd1', 'teacher', '2026-09-12T12:20:28.042Z'),
('tx_test_مستخدم1_1789195186586', '862f7c11-d807-48ad-b3ae-c7e1e7afe2d4', 100, 'earn', 'رصيد تجريبي للشرح والعرض التقديمي (100 دينار)', 'ref_test_balance_مستخدم1', 'system', '2026-09-12T06:39:46.586Z'),
('tx_test_مستخدم2_1789195188367', 'a0643aae-2611-4791-a62b-5d129be57adb', 100, 'earn', 'رصيد تجريبي للشرح والعرض التقديمي (100 دينار)', 'ref_test_balance_مستخدم2', 'system', '2026-09-12T06:39:48.367Z'),
('hist_tx_17_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 6, 'earn', 'المركز الثاني كبطل للمفكرة النهائية (نهاية البرنامج)', 'hist_earn_f7c52257_2026-09-11_17', NULL, '2026-09-11T10:52:00.000Z'),
('hist_tx_6_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 10, 'earn', 'المركز الأول كبطل للمفكرة النهائية (نهاية البرنامج)', 'hist_earn_d42d62cc_2026-09-11_6', NULL, '2026-09-11T15:35:00.000Z'),
('hist_tx_28_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 4, 'earn', 'المركز الثالث كبطل للمفكرة النهائية (نهاية البرنامج)', 'hist_earn_00b5cbd1_2026-09-11_28', NULL, '2026-09-11T13:09:00.000Z'),
('hist_tx_43_d77802d5', 'd77802d5-c1bc-40a6-b683-f57a4e4f38ac', 2, 'earn', 'المركز الأول في التحفيظ لشهر 9 - الأسبوع الأول', 'hist_earn_d77802d5_2026-09-05_43', NULL, '2026-09-05T12:54:00.000Z'),
('hist_tx_42_e0c08070', 'e0c08070-a9b7-4581-9c22-9c7b17c1483f', 2, 'spend', 'المسبح', 'hist_spend_e0c08070_2026-09-05_42', NULL, '2026-09-05T11:47:00.000Z'),
('hist_tx_40_5615da6f', '5615da6f-e6cd-4733-a28e-a3fdee8cb9de', 1, 'earn', 'المركز الثالث في التحفيظ لشهر 9 - الأسبوع الأول', 'hist_earn_5615da6f_2026-09-05_40', NULL, '2026-09-05T17:33:00.000Z'),
('hist_tx_37_cf94cdf6', 'cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 3, 'spend', 'شاورما', 'hist_spend_cf94cdf6_2026-09-05_37', NULL, '2026-09-05T14:12:00.000Z'),
('hist_tx_36_cf94cdf6', 'cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 3, 'spend', 'مسبح', 'hist_spend_cf94cdf6_2026-09-05_36', NULL, '2026-09-05T13:05:00.000Z'),
('hist_tx_35_cf94cdf6', 'cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 2, 'earn', 'المركز الأول في التحفيظ لشهر 9 - الأسبوع الأول', 'hist_earn_cf94cdf6_2026-09-05_35', NULL, '2026-09-05T12:58:00.000Z'),
('hist_tx_32_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2.25, 'spend', 'شاورما', 'hist_spend_00b5cbd1_2026-09-05_32', NULL, '2026-09-05T17:37:00.000Z'),
('hist_tx_31_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 3, 'spend', 'مسبح', 'hist_spend_00b5cbd1_2026-09-05_31', NULL, '2026-09-05T16:30:00.000Z'),
('hist_tx_21_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 2.25, 'spend', 'شاورما', 'hist_spend_f7c52257_2026-09-05_21', NULL, '2026-09-05T14:20:00.000Z'),
('hist_tx_20_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 3, 'spend', 'مسبح', 'hist_spend_f7c52257_2026-09-05_20', NULL, '2026-09-05T13:13:00.000Z'),
('hist_tx_9_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 5, 'spend', 'شاورما', 'hist_spend_d42d62cc_2026-09-05_9', NULL, '2026-09-05T10:56:00.000Z'),
('hist_tx_8_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 1, 'spend', 'مسبح', 'hist_spend_d42d62cc_2026-09-05_8', NULL, '2026-09-05T17:49:00.000Z'),
('hist_tx_7_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 3, 'spend', 'مسبح', 'hist_spend_d42d62cc_2026-09-05_7', NULL, '2026-09-05T16:42:00.000Z'),
('hist_tx_5_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الثامن', 'hist_earn_d42d62cc_2026-08-29_5', NULL, '2026-08-29T14:28:00.000Z'),
('hist_tx_27_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الثاني في المفكرة للأسبوع الثامن', 'hist_earn_00b5cbd1_2026-08-29_27', NULL, '2026-08-29T12:02:00.000Z'),
('hist_tx_16_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع الثامن', 'hist_earn_f7c52257_2026-08-29_16', NULL, '2026-08-29T17:45:00.000Z'),
('hist_tx_4_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في المفكرة للأسبوع السابع', 'hist_earn_d42d62cc_2026-08-22_4', NULL, '2026-08-22T13:21:00.000Z'),
('hist_tx_34_cf94cdf6', 'cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 2, 'earn', 'المركز الأول في المفكرة للأسبوع السابع', 'hist_earn_cf94cdf6_2026-08-22_34', NULL, '2026-08-22T11:51:00.000Z'),
('hist_tx_15_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع السابع', 'hist_earn_f7c52257_2026-08-22_15', NULL, '2026-08-22T16:38:00.000Z'),
('hist_tx_3_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 1, 'earn', 'المركز الثاني في المفكرة للأسبوع السادس', 'hist_earn_d42d62cc_2026-08-15_3', NULL, '2026-08-15T12:14:00.000Z'),
('hist_tx_33_cf94cdf6', 'cf94cdf6-860e-4c46-9274-be0d8cbb27fe', 2, 'earn', 'المركز الأول في المفكرة للأسبوع السادس', 'hist_earn_cf94cdf6_2026-08-15_33', NULL, '2026-08-15T10:44:00.000Z'),
('hist_tx_26_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع السادس', 'hist_earn_00b5cbd1_2026-08-15_26', NULL, '2026-08-15T11:55:00.000Z'),
('hist_tx_14_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع السادس', 'hist_earn_f7c52257_2026-08-15_14', NULL, '2026-08-15T15:31:00.000Z'),
('hist_tx_39_5615da6f', '5615da6f-e6cd-4733-a28e-a3fdee8cb9de', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الخامس', 'hist_earn_5615da6f_2026-08-08_39', NULL, '2026-08-08T16:26:00.000Z'),
('hist_tx_25_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 1, 'earn', 'المركز الثالث في المفكرة للأسبوع الخامس', 'hist_earn_00b5cbd1_2026-08-08_25', NULL, '2026-08-08T10:48:00.000Z'),
('hist_tx_24_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الأول في التحفيظ لشهر 8 - الأسبوع الأول', 'hist_earn_00b5cbd1_2026-08-08_24', NULL, '2026-08-08T17:41:00.000Z'),
('hist_tx_13_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 2, 'earn', 'المركز الثاني في المفكرة للأسبوع الخامس', 'hist_earn_f7c52257_2026-08-08_13', NULL, '2026-08-08T14:24:00.000Z'),
('hist_tx_30_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 1, 'spend', 'مسبح', 'hist_spend_00b5cbd1_2026-08-05_30', NULL, '2026-08-05T15:23:00.000Z'),
('hist_tx_19_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'spend', 'مسبح', 'hist_spend_f7c52257_2026-08-05_19', NULL, '2026-08-05T12:06:00.000Z'),
('hist_tx_23_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الثاني في التحفيظ لشهر 7 - الأسبوع الرابع', 'hist_earn_00b5cbd1_2026-08-01_23', NULL, '2026-08-01T16:34:00.000Z'),
('hist_tx_12_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 1, 'earn', 'المركز الثالث في التحفيظ لشهر 7 - الأسبوع الرابع', 'hist_earn_f7c52257_2026-08-01_12', NULL, '2026-08-01T13:17:00.000Z'),
('hist_tx_2_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الرابع', 'hist_earn_d42d62cc_2026-08-01_2', NULL, '2026-08-01T11:07:00.000Z'),
('hist_tx_1_d42d62cc', 'd42d62cc-f9c7-4484-8789-1de973ec8375', 2, 'earn', 'المركز الأول في التحفيظ لشهر 7 - الأسبوع الرابع', 'hist_earn_d42d62cc_2026-08-01_1', NULL, '2026-08-01T10:00:00.000Z'),
('hist_tx_29_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 3.25, 'spend', 'شاورما', 'hist_spend_00b5cbd1_2026-07-31_29', NULL, '2026-07-31T14:16:00.000Z'),
('hist_tx_18_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 3.75, 'spend', 'شاورما', 'hist_spend_f7c52257_2026-07-31_18', NULL, '2026-07-31T11:59:00.000Z'),
('hist_tx_11_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الثالث', 'hist_earn_f7c52257_2026-07-25_11', NULL, '2026-07-25T12:10:00.000Z'),
('hist_tx_22_00b5cbd1', '00b5cbd1-a35a-4af7-83bc-5d7f007ab833', 2, 'earn', 'المركز الأول في التحفيظ لشهر 7 - الاسبوع الأول', 'hist_earn_00b5cbd1_2026-07-11_22', NULL, '2026-07-11T15:27:00.000Z'),
('hist_tx_38_5615da6f', '5615da6f-e6cd-4733-a28e-a3fdee8cb9de', 1, 'earn', 'المركز الثالث في التحفيظ للأسبوع الأول', 'hist_earn_5615da6f_2026-07-11_38', NULL, '2026-07-11T15:19:00.000Z'),
('hist_tx_10_f7c52257', 'f7c52257-d501-45ec-bacc-0f0c75a295e4', 2, 'earn', 'المركز الثاني في التحفيظ لشهر 7 - الأسبوع الأول', 'hist_earn_f7c52257_2026-07-11_10', NULL, '2026-07-11T11:03:00.000Z'),
('hist_tx_41_e0c08070', 'e0c08070-a9b7-4581-9c22-9c7b17c1483f', 2, 'earn', 'المركز الأول في المفكرة للأسبوع الأول', 'hist_earn_e0c08070_2026-07-11_41', NULL, '2026-07-11T10:40:00.000Z')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  reference_id = EXCLUDED.reference_id,
  created_by = EXCLUDED.created_by,
  created_at = EXCLUDED.created_at;
