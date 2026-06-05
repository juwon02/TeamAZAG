# TeamAZAG

현재 실행 기준 프로젝트는 `opsradar2` 폴더입니다.

## 실행 위치

```powershell
cd opsradar2
.\.venv-codex\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

브라우저:

```text
http://127.0.0.1:8000
```

## 주요 구성

- `opsradar2/app`: FastAPI 백엔드
- `opsradar2/frontend`: HTML/CSS/JS 프론트
- `opsradar2/schema.sql`: DB 스키마
- `opsradar2/dbeaver_reset_and_seed.sql`: DBeaver 초기화/더미 데이터
- `opsradar2/requirements.txt`: Python 의존성

루트의 예전 백엔드/프론트/DB 초안 파일들은 제거했고, 앞으로는 `opsradar2` 기준으로 작업합니다.
