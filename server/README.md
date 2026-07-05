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
cmd/migrate        migration runner (golang-migrate over /migrations)
cmd/packs          pack publishing pipeline (validate → Postgres → object storage)
migrations/        reviewable up/down SQL — no GORM AutoMigrate
seeds/packs/       seed pack JSON, exported from the app (scripts/export-content-pack.ts)
internal/platform  cross-cutting: config, database, auth tokens, object storage, HTTP error contract
internal/identity  bounded context: parents, auth, children, categories
internal/content   bounded context: packs, lessons, catalog (the cross-module read interface)
internal/learning  bounded context: sessions, speech attempts, mastery graph, offline sync
internal/speech    scoring capability: vendor interface + dev stub (SPEECH_SCORER=stub)
```

Module rule (BACKEND_PLAN.md §1): a module's tables are private — other
modules use its exported service, never its tables. That is what keeps
"extract to a microservice later" honest.

## Implemented endpoints (M1 + M2)

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
| GET | `/healthz` | includes a DB ping |

Content packs are **not** served by the API — clients fetch them from the
public packs bucket/CDN (`packs/{category}/latest.json`); see BACKEND_PLAN.md §4.

Errors are always `{ "error": { "code", "message" } }`; clients switch on `code`.

## Tests

```sh
make test
```
