-- Companion + reporting contexts: the child's growing companion and the
-- denormalized read model behind the Home screen (BACKEND_PLAN.md §5, §10).
-- companion_inventory (customization items) is deferred until a feature
-- consumes it. River's queue tables are managed by its own migrator.

CREATE TABLE companions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id             UUID NOT NULL UNIQUE REFERENCES child_profiles(id) ON DELETE CASCADE,
    species              TEXT NOT NULL CHECK (species IN ('mano', 'pip', 'zizi')),
    growth_stage         TEXT NOT NULL,
    words_mastered_count INT NOT NULL DEFAULT 0,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE progress_snapshots (
    child_id       UUID PRIMARY KEY REFERENCES child_profiles(id) ON DELETE CASCADE,
    words_mastered INT NOT NULL DEFAULT 0,
    streak_days    INT NOT NULL DEFAULT 0,
    growth_stage   TEXT NOT NULL DEFAULT 'egg',
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
