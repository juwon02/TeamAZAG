# OpsRadar Azure VM Docker deployment

This deployment runs two services:

- `app`: FastAPI and the built frontend on port 8002
- `db`: PostgreSQL 16 with pgvector, available only on the Docker network

PostgreSQL data and uploaded documents use separate named volumes.

## First deployment

```bash
git clone --branch main https://github.com/juwon02/TeamAZAG.git
cd TeamAZAG
cp .env.example .env
```

Generate URL-safe secrets:

```bash
openssl rand -hex 32
```

Edit `.env` and replace every `CHANGE_ME` value. Start with
`AI_PROVIDER=disabled`.

```bash
nano .env
chmod 600 .env
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=200 app
docker compose logs --tail=200 db
curl http://127.0.0.1:8002/api/v1/system/health
```

The initial administrator login uses `APP_ADMIN_USERNAME` and
`APP_ADMIN_PASSWORD` from `.env`. These values initialize the database only
when the PostgreSQL volume is created for the first time.

## Updating

Back up the database before changes that include SQL migrations.

```bash
docker compose exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  > "backup-$(date +%Y%m%d-%H%M%S).sql"

git pull --ff-only origin main
docker compose up -d --build
```

## Operations

```bash
docker compose ps
docker compose logs -f app
docker compose restart app
docker compose stop
docker compose start
```

`docker compose down` removes containers but preserves named volumes.
Do not run `docker compose down -v` on a server with data you need.

PostgreSQL port 5432 is intentionally not published. During initial testing,
allow TCP port 8002 in the Azure Network Security Group. For production, put a
reverse proxy with HTTPS in front of the app and stop exposing 8002 publicly.
