# Bolo API server

Go modular monolith backing the Bolo app. Design doc: [`../Bolo/BACKEND_PLAN.md`](../Bolo/BACKEND_PLAN.md).

## Quick start

```sh
docker compose up -d        # Postgres 16 + MinIO
make migrate-up             # apply SQL migrations
make run                    # API on :8080
```

Configuration comes from env vars (or a local `.env`); see [.env.example](.env.example).
Defaults work against the compose services with zero setup.

## Layout

```
cmd/api            the API binary
cmd/contentgen     the AI lesson-generation worker (separate deployable, contentgen queue)
cmd/lessons        content-review queue CLI (pending / show / approve / reject)
cmd/migrate        migration runner (golang-migrate over /migrations)
cmd/packs          pack publishing pipeline (validate → Postgres → object storage)
migrations/        reviewable up/down SQL — no GORM AutoMigrate
seeds/packs/       seed pack JSON, exported from the app (scripts/export-content-pack.ts)
internal/platform  cross-cutting: config, database, auth tokens, object storage, HTTP error contract
internal/identity  bounded context: parents, auth, children, categories
internal/content   bounded context: packs, lessons, catalog (the cross-module read interface)
internal/learning  bounded context: sessions, speech attempts, mastery graph, offline sync
internal/companion bounded context: species choice, growth stages
internal/reporting bounded context: progress snapshots, weekly parent digest
internal/contentgen bounded context: the AI lesson-generation agent + validation layer
internal/speech    scoring capability: vendor interface + dev stub (SPEECH_SCORER=stub)
```

Lesson generation (BACKEND_PLAN.md §7): mastering the final lesson enqueues
`lesson.generation.requested`; `cmd/contentgen` builds a vocabulary-constrained
context, generates (CONTENTGEN_PROVIDER: `stub` templates or `anthropic` —
Claude via the official Go SDK), and runs the four-check validation layer.
Clean lessons auto-publish per-child; borderline ones wait in `cmd/lessons`
pending review — a child never sees unreviewed content.

Async jobs run on [River](https://riverqueue.com) (Postgres-backed, §9 of the
plan): `mastery.updated` refreshes progress snapshots; `audio.retention.sweep`
(periodic, also on startup) deletes attempt audio past `retain_until`.
Modules publish through the `EventBus` adapter in `cmd/api` — swapping to
Kafka later replaces that adapter, nothing else.

Module rule (BACKEND_PLAN.md §1): a module's tables are private — other
modules use its exported service, never its tables. That is what keeps
"extract to a microservice later" honest.

## Implemented endpoints (M1–M4)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/auth/register` | → parent_id + token pair |
| POST | `/api/v1/auth/login` | |
| POST | `/api/v1/auth/refresh` | refresh tokens rotate on use |
| POST | `/api/v1/children` | computes `suggested_category` from DOB |
| GET | `/api/v1/children` | |
| PATCH | `/api/v1/children/{child_id}/category` | parent confirm/override |
| POST | `/api/v1/children/{child_id}/lessons/{lesson_id}/sessions` | idempotent on `client_key` |
| POST | `/api/v1/sessions/{session_id}/attempts` | multipart audio → score + feedback_code; idempotent on `client_key` |
| POST | `/api/v1/sessions/{session_id}/complete` | idempotent by session state; → mastery summary + next unlock |
| POST | `/api/v1/sync/attempts` | offline batch; per-item synced/duplicate/conflict |
| POST | `/api/v1/children/{child_id}/companion` | idempotent; different species → 409 |
| GET | `/api/v1/children/{child_id}/companion` | species, growth stage, word count |
| GET | `/api/v1/children/{child_id}/digest/weekly` | words, streak, weak phonemes, signed clips |
| GET | `/api/v1/children/{child_id}/content-overlay` | unlock state + approved AI lessons (base pack stays on the CDN) |
| GET | `/healthz` | includes a DB ping |

Content packs are **not** served by the API — clients fetch them from the
public packs bucket/CDN (`packs/{category}/latest.json`); see BACKEND_PLAN.md §4.

Errors are always `{ "error": { "code", "message" } }`; clients switch on `code`.

## Tests

```sh
make test
```
