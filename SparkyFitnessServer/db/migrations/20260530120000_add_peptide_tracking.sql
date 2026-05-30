-- Peptide / injection tracking with half-life decay estimation.
-- Two user-owned tables, RLS-protected with owner-only policies that match
-- the project's current_user_id() session model (see db/rls_policies.sql).

-- 1. Peptides (a substance the user injects, with its elimination half-life)
CREATE TABLE IF NOT EXISTS public.peptides (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    half_life_hours NUMERIC(10, 3) NOT NULL,
    default_dose NUMERIC(12, 4),
    dose_unit VARCHAR(20) NOT NULL DEFAULT 'mg',
    color VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peptides_user
    ON public.peptides(user_id);

-- 2. Injections (each administered dose, timestamped)
CREATE TABLE IF NOT EXISTS public.peptide_injections (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    peptide_id UUID NOT NULL REFERENCES public.peptides(id) ON DELETE CASCADE,
    dose NUMERIC(12, 4) NOT NULL,
    dose_unit VARCHAR(20) NOT NULL DEFAULT 'mg',
    injection_site VARCHAR(100),
    injected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peptide_injections_user_peptide
    ON public.peptide_injections(user_id, peptide_id);
CREATE INDEX IF NOT EXISTS idx_peptide_injections_user_time
    ON public.peptide_injections(user_id, injected_at);

-- 3. Row Level Security (owner-only; mirrors create_owner_policy in rls_policies.sql)
ALTER TABLE public.peptides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peptide_injections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS owner_policy ON public.peptides;
CREATE POLICY owner_policy ON public.peptides FOR ALL TO PUBLIC
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());

DROP POLICY IF EXISTS owner_policy ON public.peptide_injections;
CREATE POLICY owner_policy ON public.peptide_injections FOR ALL TO PUBLIC
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());
