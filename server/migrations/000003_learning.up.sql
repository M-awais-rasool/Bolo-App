-- Learning bounded context: sessions, speech attempts, and the two tables
-- every smart feature reads from — mastery_words and weak_phonemes
-- (BACKEND_PLAN.md §5). client_key columns carry client-generated idempotency
-- keys so retried requests after dropped connections never double-count (§11).

CREATE TABLE lesson_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id         UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    category_code    TEXT NOT NULL REFERENCES categories(code),
    lesson_client_id TEXT NOT NULL,  -- the stable client lesson id, e.g. 'greetings'
    client_key       TEXT NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    UNIQUE (child_id, client_key)
);

CREATE INDEX idx_lesson_sessions_child ON lesson_sessions (child_id);

CREATE TABLE speech_attempts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID NOT NULL REFERENCES lesson_sessions(id) ON DELETE CASCADE,
    word_id          TEXT NOT NULL,
    audio_object_key TEXT,
    score            DOUBLE PRECISION NOT NULL,
    feedback_code    TEXT NOT NULL,
    client_key       TEXT NOT NULL,
    recorded_at      TIMESTAMPTZ,               -- client clock, for offline-synced attempts
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    retain_until     TIMESTAMPTZ NOT NULL,      -- audio deletion deadline (§12); sweep job lands in M3
    UNIQUE (session_id, client_key)
);

CREATE INDEX idx_speech_attempts_session ON speech_attempts (session_id);
CREATE INDEX idx_speech_attempts_retention ON speech_attempts (retain_until) WHERE audio_object_key IS NOT NULL;

CREATE TABLE mastery_words (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id          UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    word_id           TEXT NOT NULL,
    attempt_count     INT NOT NULL DEFAULT 0,
    avg_score         DOUBLE PRECISION NOT NULL DEFAULT 0,
    first_mastered_at TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (child_id, word_id)
);

CREATE TABLE weak_phonemes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id     UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    phoneme      TEXT NOT NULL,
    miss_count   INT NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (child_id, phoneme)
);
