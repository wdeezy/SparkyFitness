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

-- 3. Row Level Security
-- RLS is intentionally NOT defined here. The helper functions it relies on
-- (e.g. current_user_id()) are created by db/rls_policies.sql, which the server
-- applies AFTER all migrations. That file is the single source of truth for RLS:
-- it purges and re-creates every public-schema policy on each startup, so any
-- policy defined in a migration would be wiped anyway. The owner-only policies
-- and RLS enablement for these two tables live in db/rls_policies.sql.
