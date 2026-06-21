#!/usr/bin/env bash
set -Eeuo pipefail

: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${APP_ADMIN_USERNAME:?APP_ADMIN_USERNAME is required}"
: "${APP_ADMIN_PASSWORD:?APP_ADMIN_PASSWORD is required}"

psql_base=(
  psql
  --set ON_ERROR_STOP=1
  --username "$POSTGRES_USER"
  --dbname "$POSTGRES_DB"
)

"${psql_base[@]}" <<'SQL'
CREATE SCHEMA IF NOT EXISTS opsradar2;
SQL

PGOPTIONS='-c search_path=opsradar2,public' \
  "${psql_base[@]}" --file /opt/opsradar/schema.sql
PGOPTIONS='-c search_path=opsradar2,public' \
  "${psql_base[@]}" --file /opt/opsradar/bootstrap.sql
"${psql_base[@]}" --file /opt/opsradar/001_add_auth_columns.sql
PGOPTIONS='-c search_path=opsradar2,public' \
  "${psql_base[@]}" --file /opt/opsradar/002_pgvector_embeddings.sql

"${psql_base[@]}" \
  --set admin_username="$APP_ADMIN_USERNAME" \
  --set admin_password="$APP_ADMIN_PASSWORD" <<'SQL'
SET search_path = opsradar2, public;

UPDATE users
SET username = :'admin_username',
    password_hash = crypt(:'admin_password', gen_salt('bf')),
    status = 'active',
    role = 'admin',
    updated_at = now()
WHERE id = '20000000-0000-0000-0000-000000000001';
SQL
