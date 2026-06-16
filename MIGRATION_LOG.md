# 프론트 React+Vite 전환 일지 (두 AI 공유)

## 이 파일의 규칙
- 모든 AI(Codex/Claude)는 작업 시작 전 이 파일을 먼저 읽는다.
- 작업이 끝나면 이 파일을 갱신하고 git 커밋한다.
- "다음 작업" 칸에 다음 AI가 할 일을 구체적으로 남긴다.

## 절대 원칙
- 기존 디자인/CSS 100% 유지. 픽셀 단위로 동일. 화면이 달라지면 실패.
- 기존 CSS(theme/layout/components/role-workflow-enhancements/workflow-v2)는
  새로 만들지 않고 그대로 재사용.
- React 컴포넌트는 기존 index.html과 똑같은 class·HTML 구조 사용.
- 한 번에 한 화면. 각 화면 = 커밋 하나. 중간에 멈춰도 앱은 항상 정상.
- 파일 삭제/build·dist 정리/worktree·브랜치 변경은 사용자 확인 후에만.

## 환경 고정
- 작업 폴더: jw-new2-test-run worktree (이게 최신본)
- Python: 3.11 가상환경
- 빌드 도구: Vite (create-react-app 아님)
- 백엔드 API: /api/v1, 포트 8002
- 반드시 살려야 할 신규 기능: workflow-v2 (역할 기반 이슈/리스크 검토)

## 화면 전환 현황 (9개)
| 화면 | ID | 담당 기존 JS | 상태 |
|------|----|----|----|
| Dashboard | s-dashboard | app.js + workflow-v2.js | 기존바닐라 |
| 운영 로그 분석 | s-analysis | app.js | 기존바닐라 |
| Todo | s-todo | app.js + todo-calendar-enhancements.js | 기존바닐라 |
| 이슈 로그 | s-issues | app.js + workflow-v2.js | 기존바닐라 |
| 캘린더 | s-calendar | app.js + todo-calendar-enhancements.js | 기존바닐라 |
| 인수인계 센터 | s-knowledge | handoff.js (504줄·월요일작업 03b02ca) | 기존바닐라 |
| 보고서 | s-reports | report.js | 기존바닐라 |
| AI Assistant | s-chat | app.js | 기존바닐라 |
| 설정 | s-settings | app.js | 기존바닐라 |
(상태값: 기존바닐라 / 전환중 / 전환완료)

## 공통 인프라 현황
- [x] 0단계: 안전 복구 (public/ 서빙 정상화) — 완료 (2026-06-16, Claude)
- [x] 1단계: Vite 골격 + 빈 마운트 공존 세팅 — 완료 (2026-06-16, Claude)
- [ ] 공유 API 클라이언트 (api-integration.js를 React/바닐라 공용으로) — 미완
      (※ 현재 React는 window.opsRadarApi/window.G 전역을 그대로 공유 가능 — 별도 클라이언트 불요)

## 마지막 작업 (누가/언제/뭐)
- 2026-06-16, Claude Code, 0단계 안전 복구:
  - app/main.py 수정: CRA `frontend/build/`를 우선 서빙하던 로직이 화면을 깨뜨렸음.
    이제 build/를 무시하고 `frontend/public/`(정상 바닐라 앱)을 서빙. dist/(Vite)는
    생기면 자동 우선. build/는 삭제하지 않고 무시만 함.
  - 검증: .venv-run311로 임시 8003 포트 기동 → 루트가 "WorkRader AI - Clean Version"
    서빙, workflow-v2.css/js·app.js 모두 HTTP 200, CRA main.* 청크 없음 확인 후 종료.
  - 사용자의 8002 기존 서버는 건드리지 않음(정상 동작 중).
  - 안전조치: 미커밋 상태였던 handoff.js(+502줄)를 `.backups/handoff.js.20260616-uncommitted.bak`로
    백업(.backups는 gitignore됨).
- 2026-06-16, Claude Code, 인수인계 센터 월요일 작업 보존·커밋 완료:
  - 커밋 `03b02ca` "feat: 인수인계 센터 - 퇴사자/신규입사자 카드 + AI 파이프라인 데모 화면 (월요일 작업 보존)".
  - 대상: opsradar2/frontend/public/static/js/handoff.js (504줄, +502/-20). 한 세트로 묶일
    다른 파일은 없었음(index.html 버전쿼리 등은 이전 커밋 69281e9/dc49ee8에 이미 포함).
  - 8002 서버를 새 main.py로 재기동(구 PID 25776 종료 → 신규 PID 27364)하여 504줄 화면 확인.
    사용자가 브라우저에서 "퇴사자/신규입사자 두 카드 + 각 상세 AI 파이프라인 데모/보드" 정상 확인함.
  - .backups/ 백업본(504줄)은 폐기하지 않고 그대로 보존.
- 2026-06-16, Claude Code, 1단계 Vite 골격 + 빈 마운트 공존 완료 (스트랭글러 토대만, 화면 미전환):
  - Vite 8.0.16 + @vitejs/plugin-react 6.0.2를 frontend devDependencies에 **추가**(react-scripts 5.0.1 보존).
    package.json에 `vite`/`vite:build` 스크립트 추가.
  - vite.config.js 신규: publicDir:false, build.outDir=public/static/react, base=/static/react/,
    input=src/react-mount/main.jsx, entryFileNames=main.js. **dist/ 미생성**(main.py 진입점 바꿔치기 회피).
  - src/react-mount/main.jsx 신규: #react-mount에 빈 StrictMode 마운트(아무것도 안 그림 = 픽셀 0).
  - public/index.html: workflow-v2.js 스크립트 다음에 3줄만 삽입(주석 + `<div id="react-mount">` +
    `<script type="module" src="/static/react/main.js">`). 기존 줄 무수정.
  - .gitignore에 `/public/static/react/`(빌드 산출물) 추가 → 생성물은 커밋 안 함.
  - 검증: `vite build` 통과(main.js 189.68kB). 8002에서 main.js HTTP 200 +
    content-type application/javascript(모듈 MIME 정상), 기존 화면/자산(title·workflow-v2·handoff) 그대로.
    사용자가 브라우저에서 픽셀 변화 0 + React main.js 관련 콘솔 에러 없음 직접 확인.

## handoff.js 보존 결정 기록 (2026-06-16, 최종)
- 정정: 한때 "미커밋 504줄을 폐기하고 dc49ee8로 되돌린다"는 방침이 있었으나 **취소됨**.
- 최종: 504줄은 월요일(2026-06-15) 사용자+Codex가 만든 인수인계 센터 핵심 작업 →
  **보존·정식 커밋(03b02ca) 완료.** 되돌리지 않음.
- 참고(되돌린 게 아님): 직전 커밋 dc49ee8(22줄)은 "신규 입사자 온보딩" 모듈이었고,
  504줄본이 이를 인수인계 센터 전면(퇴사자/신규입사자 카드 + AI 파이프라인 데모/보드)으로 확장함.

## 다음 작업 (다음 AI가 할 일)
- 첫 화면 React 전환: 가장 단순한 **설정(Settings, s-settings) 화면부터** 검증.
  - 이유: 데이터/상태 의존이 적어 스트랭글러 1번째 검증용으로 위험 최소.
  - 방법: settings 화면 영역을 React 컴포넌트로 만들어 #react-mount(또는 settings 전용 노드)에
    렌더, 기존 바닐라 settings는 그대로 두고 토글/공존. 기존 class·HTML 구조·CSS 100% 재사용.
  - React에서 데이터는 window.opsRadarApi/window.G 전역을 그대로 호출(별도 클라이언트 X).
  - 빌드: `npm run vite:build` → public/static/react/main.js 갱신(gitignore됨). dist/ 절대 만들지 말 것.
  - 완료 기준: 설정 화면 픽셀 동일 + 콘솔 에러 없음 + 나머지 화면 바닐라 정상.
- 그 외 화면(인수인계 센터 포함)은 계속 바닐라 유지, 한 번에 한 화면씩.

## 주의사항 / 막힌 점
- app.js(3305줄)에 거의 모든 화면 로직이 몰려있음. 화면 전환 = app.js에서 해당 부분 추출.
- workflow-v2.js는 이슈/리스크 검토(renderPendingIssues 등). 이슈 화면 전환 시 반드시 함께 보존.
- frontend/build/ = 어제의 CRA 전면교체 시도본(깨짐). 삭제 금지, 무시만. main.py가 이미 무시함.
- venv: 메인 프로젝트 루트의 `.venv-run311`(Python 3.11)에 uvicorn 등 의존성 있음.
  실행: opsradar2/ 에서 `python scripts/dev_server.py` (포트 8002 고정).
- 콘솔 401 invalid token: 8002에서 workflow-v2.js / api-integration.js가 401(invalid token)을
  내는 건 **로그인 토큰 만료** 때문이며 1단계 Vite 작업과 무관한 기존 이슈. React main.js와는 별개.
  나중에 세션/토큰 갱신 처리를 점검할 것(로그인 후 access_token 재발급 흐름 확인).
- Vite 빌드 산출물 public/static/react/main.js 는 gitignore됨(생성물). 소스 변경 후
  `npm run vite:build` 재실행 필요. 서버 재기동 없이 FileResponse라 즉시 반영됨.
