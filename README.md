# TeamAZAG OpsRadar

OpsRadar(화면 표기: WorkRader)는 무역·제조 운영 문서를 업무 데이터로 바꾸고,
Todo·이슈·일정·보고서·인수인계를 한 흐름으로 관리하는 운영 인텔리전스
애플리케이션입니다.

배포 및 개발 대상 애플리케이션은 `opsradar2/` 아래에 있습니다. 앞으로 팀의
기본 개발·통합 브랜치는 `dev`이며, 기능 브랜치는 `dev`를 대상으로 Pull
Request를 올립니다.

## 주요 기능

- 로그인과 역할 기반 사용자·담당자 관리
- 문서 업로드, 파싱, 청킹, AI 분석 및 Todo·이슈 후보 추출
- Todo 생성·검토·승인·반려와 담당자별 업무 관리
- 이슈·리스크 등록, 검토, Todo 연결 및 상태 추적
- 캘린더 일정과 Todo 마감일 관리
- 주간·월간 보고서 생성과 저장
- 퇴사자·신규 담당자를 위한 인수인계 센터
- 운영 데이터를 활용한 AI Assistant와 PostgreSQL `pgvector` 검색
- 대시보드 기반 업무·리스크 현황 확인

## 기술 스택

- Backend: Python, FastAPI, Uvicorn
- API: `/api/v1`
- Database: PostgreSQL, SQLAlchemy 2 async, `asyncpg`
- Vector search: PostgreSQL `pgvector`, embedding dimension `1536`
- AI: Azure OpenAI 또는 비활성화 모드
- Frontend: React 19, Vite, 기존 JavaScript compatibility layer
- Authentication: JWT, bcrypt
- Test: pytest 기반 Python 회귀 테스트

FastAPI가 API와 프론트엔드 정적 파일을 함께 제공하며 로컬 기준 포트는
`8002`입니다.

## 디렉터리 구조

```text
.
├─ opsradar2/
│  ├─ app/
│  │  ├─ api/             # FastAPI router와 endpoint
│  │  ├─ services/        # 업무 규칙
│  │  ├─ repositories/    # async SQLAlchemy DB 접근
│  │  ├─ schemas/         # API 요청·응답 모델
│  │  ├─ ai/              # 파싱, 청킹, LLM, embedding, retrieval
│  │  ├─ core/            # 설정, DB session, 보안
│  │  └─ vectorstores/    # vector-store 경계
│  ├─ frontend/
│  │  ├─ public/          # FastAPI가 제공하는 정적 shell과 기존 자산
│  │  ├─ src/react-mount/ # 화면별 React component
│  │  └─ vite.config.js   # React bundle 설정
│  ├─ scripts/
│  │  ├─ migrations/      # 기존 DB용 SQL migration
│  │  ├─ dev_server.py
│  │  └─ verify_*.py
│  ├─ tests/
│  ├─ schema.sql          # 신규 DB 기준 schema
│  ├─ bootstrap.sql       # 최소 공용 개발 데이터
│  └─ .env.example
├─ AGENTS.md
├─ HANDOFF.md
└─ MIGRATION_LOG.md
```

## 사전 요구사항

- Git
- Python 3.11
- Node.js와 npm
- PostgreSQL
- PostgreSQL 서버에 설치된 `pgcrypto`, `vector` extension
- DB 생성·schema 변경 권한

Azure OpenAI 기능을 사용할 경우 별도의 Azure OpenAI resource와 chat/embedding
deployment가 필요합니다.

## 로컬 개발환경 설정

저장소 루트에서 Python 가상환경을 만들고 의존성을 설치합니다.

```powershell
py -3.11 -m venv .venv-run311
.\.venv-run311\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r .\opsradar2\requirements.txt
python -m pip install pytest
```

프론트엔드 의존성을 설치하고 React bundle을 생성합니다.

```powershell
cd .\opsradar2\frontend
npm install
npm run vite:build
cd ..\..
```

Vite 결과물은 `opsradar2/frontend/public/static/react/`에 생성되는 로컬
빌드 결과이며 Git에 커밋하지 않습니다. 현재 구조에서는 별도 frontend dev
server 없이 FastAPI가 frontend까지 제공합니다.

## 환경변수

예시 파일을 복사한 뒤 로컬 값만 수정합니다.

```powershell
Copy-Item .\opsradar2\.env.example .\opsradar2\.env
```

주요 변수:

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://` 형식의 PostgreSQL 연결 문자열 |
| `DB_SCHEMA` | 애플리케이션 schema. 기본값은 `opsradar2` |
| `FRONTEND_ORIGINS` | CORS 허용 origin 목록 |
| `MAX_UPLOAD_BYTES` | 업로드 최대 크기. 예시는 25 MiB |
| `AI_PROVIDER` | `disabled` 또는 `azure` |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI API version |
| `AZURE_OPENAI_CHAT_DEPLOYMENT` | chat model deployment 이름 |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | embedding deployment 이름 |
| `EMBEDDING_DIMENSION` | DB `vector(1536)`과 동일한 `1536` |
| `EMBEDDING_BATCH_SIZE` | embedding batch 크기 |
| `AZURE_OPENAI_MAX_RETRIES` | Azure 요청 재시도 횟수 |
| `JWT_SECRET_KEY` | JWT 서명 secret. 운영 환경에서는 반드시 교체 |
| `JWT_EXPIRE_HOURS` | JWT 만료 시간 |

AI 기능 없이 실행하려면 `AI_PROVIDER=disabled`로 설정합니다. `.env`, API key,
DB 비밀번호, JWT secret은 절대 커밋하지 않습니다. 비밀번호에 특수문자가 있으면
`DATABASE_URL`에서 URL encoding해야 합니다.

## PostgreSQL 준비

아래 예시는 `azag_db` 데이터베이스와 `opsradar2` schema를 사용합니다. 명령은
`opsradar2/`에서 실행합니다.

### 신규 schema

```powershell
cd .\opsradar2
$env:PGPASSWORD = "YOUR_PASSWORD"
psql -h DB_HOST -p 5432 -U DB_USER -d azag_db -c "CREATE SCHEMA IF NOT EXISTS opsradar2 AUTHORIZATION DB_USER; SET search_path TO opsradar2, public;" -f schema.sql
psql -h DB_HOST -p 5432 -U DB_USER -d azag_db -c "SET search_path TO opsradar2, public;" -f bootstrap.sql
Remove-Item Env:PGPASSWORD
```

`schema.sql`은 `pgcrypto`와 `vector` extension을 생성하므로 DB 계정에 필요한
권한이 있어야 합니다. 애플리케이션 시작 시 table을 자동 생성하거나 변경하지
않습니다.

### 기존 schema migration

이미 운영 중인 schema에는 필요한 migration만 번호 순서대로 적용합니다.

```powershell
$env:PGPASSWORD = "YOUR_PASSWORD"
psql -h DB_HOST -p 5432 -U DB_USER -d azag_db -f scripts/migrations/001_add_auth_columns.sql
psql -h DB_HOST -p 5432 -U DB_USER -d azag_db -c "SET search_path TO opsradar2, public;" -f scripts/migrations/002_pgvector_embeddings.sql
Remove-Item Env:PGPASSWORD
```

적용 전 DB backup을 만들고 SQL 내용을 검토하세요. `001`은 로그인 column,
`002`는 `chunk_embeddings`의 PostgreSQL vector 저장·검색 구조를 추가합니다.
신규 schema는 최신 `schema.sql`에 이 내용이 포함되어 있으므로 migration을
중복 적용할 필요가 없습니다.

DB 연결과 table 상태를 확인합니다.

```powershell
python .\scripts\verify_database.py
```

누락 embedding 확인은 dry-run이 기본입니다.

```powershell
python .\scripts\backfill_pgvector_embeddings.py
python .\scripts\backfill_pgvector_embeddings.py --execute
```

`--execute`는 Azure embedding 설정과 실제 DB 쓰기를 요구합니다.

## 실행

Python 가상환경이 활성화된 상태에서 실행합니다.

```powershell
cd .\opsradar2
python .\scripts\dev_server.py
```

- Application: <http://127.0.0.1:8002/>
- Health: <http://127.0.0.1:8002/health>
- Swagger UI: <http://127.0.0.1:8002/docs>
- API base: <http://127.0.0.1:8002/api/v1>

## 테스트 및 검증

저장소 루트에서 실행합니다.

```powershell
python -m compileall opsradar2/app
python -m pytest opsradar2/tests
```

Frontend source를 변경했다면 bundle도 검증합니다.

```powershell
cd .\opsradar2\frontend
npm run vite:build
```

실제 개발 DB persistence를 검증하려면 `opsradar2/`에서 실행합니다.

```powershell
python .\scripts\verify_database.py
python .\scripts\verify_persistence.py
```

`verify_persistence.py`는 검증용 Todo·일정·이슈 등을 실제 DB에 생성한 뒤
정리하므로, 반드시 테스트 가능한 개발 DB에서만 실행하세요.

`AGENTS.md`에는 아래 Harness 검증도 정의되어 있습니다.

```powershell
python scripts/execute.py --validate dev-stabilization
```

다만 현재 기준 브랜치에는 `scripts/execute.py`, `phases/`,
`docs/ARCHITECTURE.md`, `docs/ADR.md`가 포함되어 있지 않아 이 명령은 실행할 수
없습니다. 해당 Harness 자산이 다시 추가되기 전에는 위 compile, pytest, Vite,
DB 검증을 사용합니다.

## 아키텍처 원칙

- Route handler는 얇게 유지하고 업무 판단은 `app/services/`에 둡니다.
- DB 접근은 `app/repositories/`, `get_db()`, async SQLAlchemy session을
  사용합니다.
- API request/response 계약은 `app/schemas/`에서 명시합니다.
- Frontend가 사용하는 payload를 암묵적으로 변경하지 않습니다.
- AI provider와 vector-store 구현은 `app/ai/`, `app/services/`,
  `app/vectorstores/` 경계 안에 둡니다.
- Endpoint 계약 또는 persistence 동작을 바꾸면 관련 테스트도 갱신합니다.
- frontend React 전환 시 기존 CSS와 compatibility layer를 보존하고
  `frontend/dist/`를 생성하지 않습니다.

프론트엔드 전환 제약과 현재 상태는 [`HANDOFF.md`](HANDOFF.md), 상세 이력은
[`MIGRATION_LOG.md`](MIGRATION_LOG.md)를 확인하세요.

## 브랜치와 PR 규칙

`dev`가 기본 개발·통합 브랜치입니다.

```powershell
git switch dev
git pull origin dev
git switch -c feature/작업명

# 작업 및 검증
git add <변경한 파일>
git commit -m "feat: 작업 요약"
git push -u origin feature/작업명
```

GitHub에서 `feature/작업명` → `dev` Pull Request를 생성합니다. `dev` 직접
push는 긴급 상황 외에는 피하고, `main` 반영은 릴리스 시점에 별도 PR로
진행합니다.

PR에는 변경 이유, API·DB·UI 영향, migration·환경변수 변경 여부, 실행한 검증
결과를 적습니다. UI 변경은 가능하면 전후 화면을 첨부합니다.

## 커밋 규칙

Conventional Commits 형식을 사용합니다.

- `feat:` 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 변경
- `test:` 테스트 변경
- `refactor:` 동작을 바꾸지 않는 구조 개선
- `chore:` 설정, 브랜치 기준선, 도구 작업

한 커밋에는 가능한 한 하나의 논리적 변경만 담습니다.

## 트러블슈팅

### 다른 화면이 열리거나 API가 연결되지 않음

OpsRadar 기준 포트는 `8002`입니다. `8000`, `3000`, `5173`에서 실행 중인 다른
프로젝트와 혼동하지 않았는지 확인하고 `/health` 응답의 `app` 값이
`opsradar2`인지 확인하세요.

### DB 연결 또는 table 조회 실패

- `DATABASE_URL`이 `postgresql+asyncpg://`로 시작하는지 확인합니다.
- 비밀번호 특수문자를 URL encoding합니다.
- `DB_SCHEMA=opsradar2`와 PostgreSQL `search_path`를 확인합니다.
- `python scripts/verify_database.py`의 missing table 출력을 확인합니다.

### `vector` extension 또는 embedding 오류

- PostgreSQL 서버에 `pgvector`가 설치되어 있는지 확인합니다.
- `CREATE EXTENSION vector` 권한을 확인합니다.
- `EMBEDDING_DIMENSION=1536`과 DB column `vector(1536)`을 일치시킵니다.

### React 화면 또는 `/static/react/main.js`가 로드되지 않음

```powershell
cd .\opsradar2\frontend
npm install
npm run vite:build
```

`frontend/public/static/react/`가 생성되었는지 확인합니다. 이 폴더는 생성
결과물이므로 커밋하지 않습니다. `frontend/dist/`는 현재 runtime의 진입점
선택을 바꿀 수 있으므로 만들지 않습니다.

### Azure OpenAI 없이 실행하고 싶음

`.env`에서 `AI_PROVIDER=disabled`로 설정합니다. Azure 기능을 사용할 때는 API
key뿐 아니라 endpoint, API version, chat deployment, embedding deployment가
모두 필요합니다.

### PowerShell에서 npm 실행이 차단됨

PowerShell execution policy 때문에 `npm.ps1`이 차단되면 동일한 명령을
`npm.cmd install`, `npm.cmd run vite:build` 형식으로 실행할 수 있습니다.
