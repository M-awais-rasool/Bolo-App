-- Content bounded context: published packs + the lessons inside them.
-- Packs are immutable per (category, revision); the object on the CDN is the
-- serving copy, these rows are the system of record (BACKEND_PLAN.md §4–5).

CREATE TABLE content_packs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code  TEXT NOT NULL REFERENCES categories(code),
    revision       INT  NOT NULL,
    schema_version INT  NOT NULL,
    status         TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    object_key     TEXT NOT NULL,
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (category_code, revision)
);

CREATE TABLE lessons (
    id                UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code     TEXT  NOT NULL REFERENCES categories(code),
    client_id         TEXT  NOT NULL,  -- the id inside content, e.g. 'greetings'
    order_index       INT   NOT NULL,
    content           JSONB NOT NULL,  -- exact client LessonContent shape
    -- server-side pedagogy metadata; never shipped inside packs
    target_phonemes   TEXT[] NOT NULL DEFAULT '{}',
    known_words_scope TEXT[] NOT NULL DEFAULT '{}',
    source            TEXT NOT NULL CHECK (source IN ('seed', 'ai_generated')),
    status            TEXT NOT NULL CHECK (status IN ('active', 'pending_review', 'retired')),
    child_id          UUID REFERENCES child_profiles(id),  -- set only for per-child AI lessons
    version           INT NOT NULL DEFAULT 1,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shared curriculum lessons are unique per category; per-child AI lessons are not.
CREATE UNIQUE INDEX idx_lessons_category_client ON lessons (category_code, client_id) WHERE child_id IS NULL;
CREATE INDEX idx_lessons_child ON lessons (child_id) WHERE child_id IS NOT NULL;
