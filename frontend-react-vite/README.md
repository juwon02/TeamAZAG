# OpsRadar React + Vite 프론트엔드

이 폴더는 기존 공식 프론트엔드인 `opsradar2/frontend/`를 바로 바꾸지 않고, React + Vite + Node.js 구조로 따로 이식하는 작업 공간입니다.

현재 공식 배포 대상은 아직 `opsradar2/`입니다. 이 폴더는 화면별 React 전환을 검증한 뒤 안정화되면 공식 프론트엔드로 반영하기 위한 별도 프로젝트입니다.

## 실행 방법

PowerShell에서는 `npm` 대신 `npm.cmd`를 사용합니다.

```powershell
cd frontend-react-vite
npm.cmd install
npm.cmd run dev
```

기본 주소:

```text
http://127.0.0.1:5173/
```

## 백엔드 연결

Vite 개발 서버는 `/api` 요청을 FastAPI 서버로 프록시합니다.

```text
React/Vite: http://127.0.0.1:5173
FastAPI:    http://127.0.0.1:8010
API:        /api/v1
```

## 현재 이식 상태

완료된 단계:

```text
1단계   기존 index.html/CSS/JS 전체 이식
2단계   화면별 legacy screen 파일 분리
3단계   Dashboard 함수 일부를 dashboard.js로 분리
4단계   Dashboard inline click을 React event bridge로 연결
5단계   Dashboard 화면을 React 컴포넌트로 분리
6단계   Dashboard 상세 패널/High Risk 카드 React state 전환
7단계   Todo 화면을 React 컴포넌트로 분리
8단계   Todo 목록/카드/상세 React state 전환
9단계   Todo 액션/API 함수를 todo.js로 분리
10단계  Issue 화면/상세/액션 흐름 React 전환
11단계  Calendar 화면/grid/일정 CRUD bridge React 전환
12단계  Report 화면/목록/상세/초안 편집 bridge React 전환
13단계  Knowledge 인수인계 센터/미리보기 bridge React 전환
14단계  Chat 화면/세션/메시지/컨텍스트 bridge React 전환
15단계  Settings 화면/테마/프로필/세션 bridge React 전환
16단계  Analysis 화면/업로드/분석 진행/결과/이력 bridge React 전환
17단계  Shell 모달/알림/floating AI inline handler 제거
18단계  Issue 데이터/API 보조 로직 issue-data.js 분리
19단계  미니 캘린더 채팅 로직 mini-calendar-chat.js 분리
20단계  clean fallback/bootstrap 로직 clean-bootstrap.js 분리
21단계  공통 텍스트/날짜 유틸 runtime-utils.js 분리
22단계  캘린더 색상 선택 호환 함수 calendar.js 이동
23단계  app.js 최종 고정 및 전역 의존성 문서화
24단계  Chat 응답 캐시 chat.js 소유로 이동
25단계  Todo/Issue 공유 배열 runtime-state.js 분리
26단계  G 공유 화면 상태 runtime-state.js 분리
27단계  Analysis 업로드 파일/분석 이력 상태 analysis.js 내부로 이동
28단계  Chat 세션/타이핑/최근 질문 상태 chat.js 내부로 이동
29단계  Calendar 월/선택/일정 상태 calendar.js 내부로 이동
30단계  Todo/Issue 상태 todo.js/issue.js 내부로 이동
31단계  Report/Knowledge 상태 report.js/handoff.js 내부로 이동 및 최종 정리
```

17단계 기준으로 legacy shell markup에 남아 있던 `onclick`, `onkeydown`, `onmouseover` 같은 inline handler를 제거했습니다. 모달, 토스트, 알림, floating AI 공통 기능은 `public/static/js/shell.js`가 담당하고, React `App.jsx`가 data 속성 기반 event delegation으로 연결합니다.

18단계 기준으로 `app.js`에 남아 있던 Issue 저장, API 응답 정규화, 로컬스토리지 fallback, Issue 상세 보조 액션을 `public/static/js/issue-data.js`로 분리했습니다. 이제 `app.js`는 전역 상태, 공통 텍스트 유틸, 화면 이동, 미니 캘린더 채팅, 초기 빈 데이터 보정 정도만 남아 있습니다.

19단계 기준으로 캘린더 화면의 자연어 일정 등록 보조 함수 `miniChat`을 `public/static/js/mini-calendar-chat.js`로 분리했습니다. `Calendar.jsx`는 기존처럼 `window.miniChat`을 호출하지만, 실제 구현은 별도 모듈이 담당합니다.

20단계 기준으로 초기 빈 데이터 보정, 기본 보고서 초안 fallback, 대시보드/캘린더 초기 표시 보정은 `public/static/js/clean-bootstrap.js`로 분리했습니다. `app.js`는 이제 전역 상태, 공통 텍스트 유틸, 화면 이동, 날짜 라벨 정도만 남았습니다.

21단계 기준으로 `normalizeText`, `escapeHtml`, `normalizeRenderedText`, `formatOpsDate`, `renderCurrentDateLabels`는 `public/static/js/runtime-utils.js`로 분리했습니다. `app.js`는 전역 상태, 화면 이동, 캘린더 색상 선택 호환 함수만 남은 상태입니다.

22단계 기준으로 `toggleColorPicker`, `pickColor`는 `public/static/js/calendar.js`로 이동했습니다. `app.js`는 이제 전역 상태와 화면 이동 역할만 남았습니다.

23단계 기준으로 `public/static/js/app.js`는 생성 스크립트에서 고정 템플릿으로 재생성되며, 레거시 원본의 깨진 주석이나 남은 화면 로직을 더 이상 가져오지 않습니다. 남은 전역 의존성은 `docs/RUNTIME_GLOBALS.md`에 정리했습니다.

24단계 기준으로 `chatResponses`는 `app.js`에서 제거했고, `public/static/js/chat.js`가 `window.chatResponses` 호환 캐시로 소유합니다.

25단계 기준으로 `todos`, `issues` 공유 배열은 `public/static/js/runtime-state.js`로 분리했습니다. `app.js`에는 이제 `OpsRadarFrontend`, `G`, `nav`만 남았습니다.

26단계 기준으로 `G` 공유 화면 상태도 `public/static/js/runtime-state.js`로 분리했습니다. `app.js`에는 이제 `OpsRadarFrontend` 등록소와 `nav` 화면 이동 함수만 남았습니다.

27단계 기준으로 Analysis 화면의 `uploadedFiles`, `analysisHistory`는 `G`에서 제거했고, `public/static/js/analysis.js` 내부 state가 소유합니다.

28단계 기준으로 Chat 화면의 `chatTyping`, `currentChatSessionId`, `lastChatPrompt`, `restoringChat`은 `G`에서 제거했고, `public/static/js/chat.js` 내부 `chatState`가 소유합니다. Chat의 캘린더 등록 연동에 필요한 `currentCalYear`, `currentCalMonth`, `newCalEvents` 참조는 아직 Calendar 상태 정리 단계까지 유지합니다.

29단계 기준으로 Calendar 화면의 `currentCalYear`, `currentCalMonth`, `selectedCalDay`, `calEvents`, `newCalEvents`는 `G`에서 제거했고, `public/static/js/calendar.js` 내부 `calendarState`가 소유합니다. Chat, Knowledge, mini calendar, API integration은 공개 함수로 Calendar 상태를 읽고 갱신합니다.

30~31단계 기준으로 Todo, Issue, Report, Knowledge 화면 상태도 `G`에서 제거했습니다. 이제 `G`에는 shell/floating AI가 보는 `currentScreen`만 남고, `runtime-state.js`는 `todos/issues` 공유 배열만 호환용으로 유지합니다.

## 문서

```text
docs/
  MIGRATION_PLAN.md
  RUNTIME_GLOBALS.md
```

## 구조

```text
frontend-react-vite/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx
    App.jsx
    components/
      Analysis.jsx
      Calendar.jsx
      Chat.jsx
      Dashboard.jsx
      Issue.jsx
      Knowledge.jsx
      Report.jsx
      Settings.jsx
      Todo.jsx
    legacy/
      legacyMarkup.js
      screens/
    styles/
      global.css
  public/
    static/
      css/
      js/
        analysis.js
        app.js
        calendar.js
        chat.js
        clean-bootstrap.js
        dashboard.js
        handoff.js
        issue-data.js
        issue.js
        mini-calendar-chat.js
        report.js
        runtime-state.js
        runtime-utils.js
        settings.js
        shell.js
        todo.js
```

## 기존 프론트 다시 가져오기

기존 `opsradar2/frontend`가 바뀌면 아래 명령으로 다시 동기화합니다. 이 스크립트는 현재까지 분리한 Analysis, Dashboard, Todo, Issue, Calendar, Report, Knowledge, Chat, Settings 구조를 유지하도록 보정합니다.

```powershell
cd frontend-react-vite
node scripts/import-legacy.mjs
```

## 남은 작업

남은 작업은 공식 `opsradar2/frontend/` 반영 여부 결정과 최종 브랜치 정리입니다.
