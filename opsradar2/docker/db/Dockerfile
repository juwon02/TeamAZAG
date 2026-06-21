FROM pgvector/pgvector:pg16

COPY schema.sql /opt/opsradar/schema.sql
COPY bootstrap.sql /opt/opsradar/bootstrap.sql
COPY scripts/migrations/001_add_auth_columns.sql /opt/opsradar/001_add_auth_columns.sql
COPY scripts/migrations/002_pgvector_embeddings.sql /opt/opsradar/002_pgvector_embeddings.sql
COPY docker/db/init-opsradar.sh /docker-entrypoint-initdb.d/10-init-opsradar.sh

RUN chmod 755 /docker-entrypoint-initdb.d/10-init-opsradar.sh
