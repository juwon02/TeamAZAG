# 인수인계 — OpsRadar 프론트 React 전환 (이 문서만 읽으면 이어서 작업 가능)

> 같이 보는 일지: **`MIGRATION_LOG.md`** (작업 시작 전 반드시 먼저 읽기).
> 규칙/AI 가이드: `AGENTS.md`.

---

## 0. 최신 상태 (2026-06-18 기준)
- 현재 기준 브랜치: codex/jw-new2-test-run / JWon = 1eb14a7.
- feature/analysis-react 병합 완료: 운영 로그 분석(s-analysis) + AI Assistant(s-chat) React 전환 반영.
- feature/todo-react 병합 완료: Todo(s-todo) React 전환 반영.
- 화면 전환 상태: 9개 화면 전부 React 전환완료.
  - Dashboard, 운영 로그 분석, Todo, 이슈 로그, 캘린더, 인수인계 센터, 보고서, AI Assistant, 설정.
- RAG 백엔드 상태: FAISS 런타임 호출 제거, PostgreSQL pgvector 기반 저장/검색으로 전환.
  - 기준 차원: EMBEDDING_DIMENSION=1536.
  - 공유 DB 확인: opsradar2.chunk_embeddings의 completed embedding 230개 확인.
- 아래 기존 섹션에는 과거 전환 중 안내가 남아 있을 수 있으므로, 최신 작업/검증 기준은 MIGRATION_LOG.md와 이 섹션을 우선한다.

## 1. 프로젝트가 뭔지
- **OpsRadar / WorkRader** — 무역 운영 인텔리전스 앱. 문서에서 Todo·이슈(리스크)를 AI로 추출하고
  실제 업무 객체와 연결, 캘린더·보고서·인수인계까지 연결하는 운영 관제 도구.
- 백엔드: **FastAPI** (`/api/v1`, 포트 **8002**), PostgreSQL + SQLAlchemy(async).
- 프론트: 원래 **단일 바닐라 JS**(`opsradar2/frontend/public/`). 지금 이걸 **React + Vite로
  "한 화면씩" 안전하게 전환 중**(스트랭글러 패턴). 안 옮긴 화면은 바닐라 그대로 동작.

## 2. 작업 폴더 / 실행법
- 앱 위치: 리포 안 **`opsradar2/`** (배포 단위). 프론트는 `opsradar2/frontend/`.
- **Python 3.11** 사용. 현재 개발기엔 메인 프로젝트 루트에 `.venv-run311`(3.11) 가상환경이 있음.
  새로 받는 경우 직접 3.11 venv 만들고 의존성 설치:
  ```bash
  # 리포 루트에서
  py -3.11 -m venv .venv-run311
  .venv-run311\Scripts\activate           # (PowerShell: .venv-run311\Scripts\Activate.ps1)
  pip install -r opsradar2/requirements.txt
  ```
- **백엔드 서버 띄우기** (포트 8002 고정):
  ```bash
  cd opsradar2
  python scripts/dev_server.py            # → http://127.0.0.1:8002
  ```
  서버는 `app/main.py` 가 `frontend/public/index.html`(바닐라 앱)을 서빙. 정적 자산은 `/static/...`.
  파일은 FileResponse라 **JS/HTML 수정 시 서버 재기동 없이 새로고침만 하면 반영**됨.
- **프론트(React) 빌드** — 화면을 옮길 때만 필요:
  ```bash
  cd opsradar2/frontend
  npm install            # 최초 1회 (vite, @vitejs/plugin-react 포함)
  npm run vite:build     # → public/static/react/main.js 생성 (gitignore됨)
  ```
  index.html 이 `<script type="module" src="/static/react/main.js">` 로 이 번들을 로드함.

## 3. 지금까지 한 것 (요약)
- **0단계 — 서빙 복구**: 어제 CRA(create-react-app) `frontend/build/` 를 우선 서빙하던 main.py
  로직이 화면을 깨뜨렸음. build/ 를 무시하고 `public/`(바닐라) 서빙하도록 수정. (커밋 c0e65cb)
- **인수인계 센터 보존**: 미커밋 상태였던 월요일 작업(handoff.js 504줄, 퇴사자/신규입사자 카드 +
  AI 파이프라인 데모)을 정식 커밋. (커밋 03b02ca)
- **1단계 — Vite 토대**: Vite 8 + plugin-react 추가(기존 react-scripts 보존). React를 기존
  바닐라 페이지에 **얹는 추가 스크립트**로 구성. `dist/` 미생성, 빈 마운트로 화면 변화 0. (커밋 19b0eb3)
- **설정(s-settings) 화면 React 전환 — 1번째**: 기존 `#s-settings` 노드 안에 React 렌더,
  전역 함수 재사용, 멤버 패널은 memo 껍데기 + vanilla 공존. (커밋 e6ff5a4)
- 자세한 경위/검증은 `MIGRATION_LOG.md` 참고.

## 4. ⚠️ 절대 규칙 (어기면 실패)
1. **기존 디자인/CSS 100% 유지 — 픽셀 동일.** 기존 class·HTML 구조 그대로. 디자인 "개선" 금지.
   기존 CSS(theme/layout/components/role-workflow-enhancements/workflow-v2)는 새로 만들지 말고 재사용.
2. **`dist/` 절대 생성 금지.** main.py가 `frontend/dist/index.html` 있으면 그걸 진입점으로
   바꿔치기 → 어제 화면 깨진 원인. Vite 출력은 **`public/static/react/`** 로만.
3. **한 번에 한 화면.** 각 화면 = 커밋 하나. 중간에 멈춰도 앱은 항상 정상이어야 함.
4. **잘 도는 건 안 건드림.** `api-integration.js`, `workflow-v2.js`, 멤버 CRUD 등 정상 동작
   로직은 수정 금지(전역 함수로 재사용만).
5. **위험 작업은 먼저 확인.** 파일 삭제, build/dist 정리, worktree/브랜치 변경, push,
   `package.json` 대거 변경, 큰 바닐라 파일 수정은 사용자 확인 후.
6. **workflow-v2(역할 기반 이슈/리스크 검토)** 기능은 반드시 보존.

## 5. 전환 패턴 (스트랭글러) — 설정 화면에서 확립
화면 하나를 옮길 때 이 순서를 따른다:
1. **조사**: 그 화면이 어떻게 그려지는지 파악.
   - `public/index.html` 의 `#s-OOO` 정적 HTML 구조 + class
   - `app.js`(+ 해당 `*.js`)의 렌더/이벤트 함수, 쓰는 전역, API 호출
   - ⚠️ **`api-integration.js` 의 런타임 DOM 주입까지 확인** (정적 HTML에 없어도 JS가
     `#s-OOO`에 패널을 끼워넣을 수 있음 — 예: 설정의 "담당자 관리"(#memberAdminPanel)).
2. **렌더 위치**: 새 노드 만들지 말고 **기존 `#s-OOO` 노드 안에 `createRoot`로 렌더** →
   `#s-OOO` ID 스코프 CSS를 그대로 상속받아 픽셀 동일.
3. **마크업**: 기존 HTML을 동일 class·구조로 JSX 복제 (CSS가 클래스 기반이면 ID는 생략).
4. **데이터/동작**: 재작성하지 말고 **전역 그대로 호출** — `window.opsRadarApi`(request/loadTodos/
   loadIssues/…), `window.G`(공유 상태), 화면별 전역 함수(setOpsRadarTheme, logout 등).
   필요하면 app.js에서 기존 함수를 `window.xxx = xxx` **1줄 노출**만(기존 줄 무수정).
5. **전환 감지**: `window.nav` 를 래핑하지 말고 **MutationObserver로 `#s-OOO`의 `.active`**
   변화를 감지해 렌더/갱신 → 다른 화면 영향 0.
6. **복잡/주입형 API 패널**: `React.memo` 껍데기만 1회 렌더하고 리스트/CRUD는 vanilla가 계속
   소유(같은 노드를 두 주체가 다투면 깜빡임). 멤버 패널이 이 방식.
7. **폴백 스위치**: 문제 시 즉시 바닐라 복귀.
   `localStorage.setItem('opsradar_react_settings','off')` + 새로고침. (화면마다 유사 키 패턴 권장)
8. **빌드·검증**: `npm run vite:build` → 8002에서 픽셀 동일 / 콘솔 에러 없음 / 타화면 무영향 확인.
   (참고: 콘솔 401 invalid token 은 로그인 토큰 만료 기존 이슈로 전환과 무관)

관련 파일:
- `frontend/src/react-mount/main.jsx` — 마운트 + 폴백 스위치 + active 감지(전환 화면 등록 지점)
- `frontend/src/react-mount/SettingsScreen.jsx` — 설정 화면 React 컴포넌트(참고 예시)
- `frontend/vite.config.js` — publicDir:false, outDir=public/static/react, dist/ 안 만듦

## 6. 다음 할 일
- 프론트 화면 전환은 **9/9 완료** 상태다. 새 화면 전환 대상을 더 찾지 말 것.
- 남은 바닐라 전환 화면은 **0개**다.
- 기존 vanilla JS는 삭제 대상이 아니라, React 화면과 공존하는 compatibility wrapper / 런타임 동작 보존용 코드일 수 있다.
- 이후 작업 기준은 `MIGRATION_LOG.md`와 이 문서의 "최신 상태" 섹션을 먼저 확인한다.
- 유지보수 체크리스트:
  - React 번들: `cd opsradar2/frontend && npm run vite:build`
  - FastAPI 실행: `cd opsradar2 && python scripts/dev_server.py`
  - RAG/AI: PostgreSQL `pgvector` 기준, `EMBEDDING_DIMENSION=1536` 유지
  - 재임베딩 필요 시: `python scripts/backfill_pgvector_embeddings.py --execute`
  - DB 확인: `SELECT COUNT(*) FROM opsradar2.chunk_embeddings WHERE embedding_status = 'completed' AND embedding IS NOT NULL;`

## 7. AI에게 시킬 때 첫 프롬프트 (복붙용)
```
이 프로젝트(opsradar2) 프론트를 바닐라 JS → React+Vite로 "한 화면씩" 안전 전환 중이다.
시작 전 HANDOFF.md와 MIGRATION_LOG.md를 먼저 읽고 규칙과 현황을 파악해라.
나는 Codex와 Claude를 번갈아 쓰므로 둘이 이어서 작업한다.

절대 규칙: 기존 디자인 100% 유지(픽셀 동일), dist/ 절대 생성 금지(public/static/react로만 빌드),
한 번에 한 화면, 잘 도는 코드(api-integration.js 등) 안 건드림, 위험작업은 먼저 확인.
환경: 작업폴더 opsradar2/, Python 3.11(.venv-run311), 서버는 opsradar2에서
python scripts/dev_server.py (포트 8002).

지금은 MIGRATION_LOG.md의 "다음 작업"부터 시작하되, 먼저 [조사 단계]만 하고 멈춰서
계획을 표로 보여줘. 내가 승인하면 그때 구현. 각 단계 끝나면 멈추고 확인받아.
```

## 8. 백로그 (나중에 — 백엔드 작업 필요)
- [ ] **멤버 관리: 담당자별 ID/이메일 수정 + 비밀번호 변경 기능.**
  ⚠️ 현재 **백엔드 API 없음**. 먼저 필요: `PATCH /members/{id}` 확장(이메일/ID), 비밀번호 변경
  엔드포인트, DB 스키마(멤버 비밀번호 필드). **보안: 비밀번호 평문 노출/조회 금지, '변경' 폼만.**
  → DB/백엔드 담당이 API부터 만든 뒤 프론트 연결.
