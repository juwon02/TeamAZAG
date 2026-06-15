# Docker Deployment

This folder contains the Docker files needed to run TeamAZAG OpsRadar from the
`opsradar2/` application.

## Services

- `api`: FastAPI backend. It also serves the current frontend files.
- `db`: PostgreSQL for local or VM Docker deployment.

There is no separate frontend container right now because the frontend is
served by `opsradar2/app/main.py`.

## Start

Run from the repository root:

```bash
docker compose -f docker/compose.yml up -d --build
```

Open:

- App: <http://localhost:8002>
- API docs: <http://localhost:8002/docs>
- Health: <http://localhost:8002/health>

## Environment

The compose file provides safe local defaults for Docker:

```text
DATABASE_URL=postgresql+asyncpg://opsradar:opsradar@db:5432/opsradar
DB_SCHEMA=opsradar2
AI_PROVIDER=disabled
```

Do not commit a populated `.env` file. For a VM, keep real secrets on the VM or
in GitHub Secrets, then pass them as environment variables.

## Useful Commands

```bash
docker compose -f docker/compose.yml ps
docker compose -f docker/compose.yml logs -f api
docker compose -f docker/compose.yml down
```

To reset only the local Docker database and FAISS volumes:

```bash
docker compose -f docker/compose.yml down -v
```
