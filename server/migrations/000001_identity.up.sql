-- Identity bounded context: parents, children, categories, refresh tokens.
-- Categories carry the age windows so suggestion logic is data-driven (BACKEND_PLAN.md §3).

CREATE TABLE categories (
    code            TEXT PRIMARY KEY,
    label           TEXT NOT NULL,
    min_age_months  INT  NOT NULL,
    max_age_months  INT  NOT NULL,
    sort_order      INT  NOT NULL UNIQUE
);

CREATE TABLE parent_accounts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone         TEXT,
    region        TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id  UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_parent ON refresh_tokens (parent_id);

CREATE TABLE child_profiles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id             UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
    name                  TEXT NOT NULL,
    date_of_birth         DATE NOT NULL,
    category_code         TEXT NOT NULL REFERENCES categories(code),
    category_confirmed_at TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_child_profiles_parent ON child_profiles (parent_id);

-- Age windows per BACKEND_PLAN.md §3; suggestion clamps to KG below 48 months
-- and to G4 above 119 months.
INSERT INTO categories (code, label, min_age_months, max_age_months, sort_order) VALUES
    ('KG', 'Kindergarten', 48,  71,  1),
    ('G1', 'Grade 1',      72,  83,  2),
    ('G2', 'Grade 2',      84,  95,  3),
    ('G3', 'Grade 3',      96,  107, 4),
    ('G4', 'Grade 4',      108, 119, 5);
