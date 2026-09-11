-- ==========================================================
-- Migration: Create bank_transactions table for Dinars Bank System
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'adjustment')),
    description TEXT NOT NULL,
    reference_id TEXT UNIQUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning-fast lookups
CREATE INDEX IF NOT EXISTS idx_bank_transactions_student_id ON public.bank_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_created_at ON public.bank_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reference_id ON public.bank_transactions(reference_id);

-- Row Level Security
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Students can read their own transactions
CREATE POLICY "Students can view own bank transactions"
    ON public.bank_transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = student_id);

-- Teachers can view and manage all transactions
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
