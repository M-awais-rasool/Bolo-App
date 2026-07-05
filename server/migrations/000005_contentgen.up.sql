-- Content-generation bounded context: the domain record for every generation
-- attempt (BACKEND_PLAN.md §5, §7). Queue mechanics (retries, scheduling)
-- live in River's tables; this is the auditable pipeline history.

CREATE TABLE generation_jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_reason   TEXT NOT NULL CHECK (trigger_reason IN ('curriculum_exhausted', 'remedial', 'buffer')),
    child_id         UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
    category_code    TEXT NOT NULL REFERENCES categories(code),
    status           TEXT NOT NULL CHECK (status IN ('running', 'completed', 'needs_review', 'failed', 'skipped')),
    input_context    JSONB NOT NULL DEFAULT '{}',
    output_lesson_id UUID REFERENCES lessons(id),
    error            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generation_jobs_child ON generation_jobs (child_id);
