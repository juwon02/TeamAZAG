# TeamAZAG DB Starter

TeamAZAG는 프로젝트 문서, 할 일, 이슈, AI 채팅, 리포트, 인수인계 정보를 프로젝트 단위로 관리하기 위한 DB 초안입니다.

아직 팀 이름은 가제이지만, 현재는 `TeamAZAG`를 기준 이름으로 사용합니다.

## 현재 DB 방향

- 관계형 데이터베이스는 PostgreSQL을 사용합니다.
- 문서 조각 임베딩 검색은 FAISS를 사용합니다.
- PostgreSQL에는 임베딩 벡터 원본을 저장하지 않습니다.
- PostgreSQL에는 `chunk_embeddings.vector_store`, `chunk_embeddings.vector_id` 같은 FAISS 참조 정보만 저장합니다.
- AI가 추출한 할 일과 사람이 직접 만든 할 일은 모두 `todos` 테이블에 저장합니다.
- Todo 화면에서는 `source_type`과 `approval_status` 값으로 AI 할 일과 공식 할 일을 구분합니다.

## 주요 파일

- `docs/db-design-v2.md`: ERD와 DB 설계 메모
- `docs/table-definition.md`: 테이블 역할과 주요 제약 조건
- `db/schema.postgresql.sql`: PostgreSQL 테이블 생성 SQL
- `db/seed.postgresql.sql`: 프론트엔드/백엔드 개발용 샘플 데이터
- `db/dashboard-queries.postgresql.sql`: 화면별 조회 쿼리 예시
- `db/verify.postgresql.sql`: 스키마와 샘플 데이터 검증 쿼리
- `app/models.py`: SQLAlchemy ORM 초안
- `alembic/versions/20260513_0001_create_teammemory_schema.py`: Alembic 마이그레이션 초안

## 실행 순서

먼저 PostgreSQL에서 개발용 데이터베이스를 만듭니다.

```bash
createdb teamazag
```

그 다음 아래 순서로 SQL 파일을 실행합니다.

```bash
psql -d teamazag -f db/schema.postgresql.sql
psql -d teamazag -f db/seed.postgresql.sql
psql -d teamazag -f db/verify.postgresql.sql
```

## Todo 승인 모델

AI가 뽑아낸 할 일 후보와 사람이 직접 만든 공식 할 일은 같은 `todos` 테이블을 사용합니다.

```text
source_type = manual, approval_status = approved  -> 사람이 직접 만든 공식 Todo
source_type = ai,     approval_status = pending   -> 승인 대기 중인 AI 추출 Todo
source_type = ai,     approval_status = approved  -> 승인된 AI 추출 Todo
source_type = ai,     approval_status = rejected  -> 거절된 AI 추출 Todo
```

## 백엔드 API 초안

```text
GET /projects/{project_id}/dashboard
GET /projects/{project_id}/todos
GET /projects/{project_id}/todos/ai-pending
POST /projects/{project_id}/todos
PATCH /todos/{todo_id}
PATCH /todos/{todo_id}/approval
GET /projects/{project_id}/issues
POST /projects/{project_id}/issues
PATCH /issues/{issue_id}
GET /projects/{project_id}/documents
POST /projects/{project_id}/documents
POST /projects/{project_id}/chat
GET /projects/{project_id}/chat/messages
GET /projects/{project_id}/handoff/latest
```
