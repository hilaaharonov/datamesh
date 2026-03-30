# AGENTS.md

## Purpose
- This repo is a small data-mesh demo: one producer service (`team`), one collector (`mesh`), shared schema package (`shared_models`), and a React UI (`team/my-app`).
- Preserve the contract that producer endpoints return `DataProductDocument` shape (`product`, `url`, `data`, `collected_at`) from `shared_models/shared_models/models.py`.

## Architecture and Data Flow
- `team/main.py` exposes CRUD at `/members/*` and a product endpoint at `/data`.
- `mesh/config.py` registers products via `DATA_PRODUCTS`; each entry points to a producer URL and target Arango collection.
- `mesh/main.py` runs an infinite scheduler loop: initial `poll_all(...)` then periodic `poll(...)` using `schedule`.
- `mesh/collector.py` fetches each product URL, validates JSON as `DataProductDocument`, then inserts into Arango.
- `shared_models` is installed into both Python services via `shared_models @ file:///shared_models` and mounted in Docker (`docker-compose.yml`).

## Service Boundaries
- Producer DB: `team/db.py` uses database `team_service`, collection `team_members`.
- Mesh DB: `mesh/config.py` defaults to database `data_mesh`, collections like `product_team`.
- Frontend (`team/my-app/src/ViewMembers.tsx`) currently reads directly from producer `http://localhost:8001/data` (not from collector DB).

## Codebase-Specific Conventions
- Team member identity is duplicated intentionally: `TeamMember.id` and Arango `_key` are both the same (`team/models.py::to_arango`).
- `team/main.py` creates `db = get_db()` at import time; startup failures usually mean env vars or Arango reachability issues.
- Collector expects producer payloads to be JSON-serializable list/dict in `data`; do not tighten schema in one service without updating `shared_models` first.
- New products are added by extending `DATA_PRODUCTS` in `mesh/config.py`; no discovery mechanism exists.

## Developer Workflows
- Full stack (preferred): `docker compose up --build` from repo root.
- Clean rebuild helper: `rebuild_services_and_run.bat` does no-cache builds for `team` and `mesh`, then runs compose.
- Team API local run: install `team/requirements.txt`, then `uvicorn main:app --host 0.0.0.0 --port 8001` from `team/`.
- Mesh local run: install `mesh/requirements.txt`, then `python main.py` from `mesh/`.
- Frontend local run: in `team/my-app`, run `npm install` then `npm run dev` (Vite scripts from `package.json`).

## Integrations and Observability
- ArangoDB is the central dependency (`docker-compose.yml`, port `8529`); both services auto-create their DB/collections if missing.
- Prometheus is configured only for Arango metrics (`prometheus.yml` scraping `/_admin/metrics/v2`).
- Jaeger container is present; Python services currently do not include tracing instrumentation code.

## Practical Editing Tips for Agents
- When changing producer response fields, update both `team/main.py` and `shared_models/shared_models/models.py` in the same change.
- When adding a new data product, update: `mesh/config.py`, producer endpoint, and collection naming consistency (`product_<name>` pattern).
- Validate integration quickly by hitting `GET /data` on team service, then confirming new docs appear in the corresponding mesh collection.
- There is no test suite in this repo today; favor small, verifiable runtime checks after edits.
