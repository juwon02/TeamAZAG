# React 전환 계획

업데이트: 2026-06-04

## 현재 상태

`frontend-react-vite/`는 기존 `opsradar2/frontend/`를 React + Vite 구조로 안전하게 옮기기 위한 별도 작업 공간입니다. 공식 배포 대상은 아직 `opsradar2/`이며, 이 폴더는 전환 검증용입니다.

## 완료된 작업

- 기존 `index.html` 본문을 `src/legacy/legacyMarkup.js`로 이식
- 기존 CSS/JS를 `public/static/` 아래로 이식
- 화면 markup을 `src/legacy/screens/` 아래 9개 screen 파일로 분리
- Dashboard 화면을 `src/components/Dashboard.jsx`로 분리
- Dashboard 역할 전환, 상세 패널, High Risk 카드 갱신을 React state/custom event로 전환
- Todo 화면을 `src/components/Todo.jsx`로 분리
- Todo 목록, 카드, 상세 패널을 React state snapshot 방식으로 전환
- Todo 승인/반려/완료/수동 등록/API 액션을 `public/static/js/todo.js`로 분리
- Issue 화면을 `src/components/Issue.jsx`로 분리
- Issue 목록, 상세 패널, Todo 생성 흐름을 React state/custom event로 전환
- Calendar 화면을 `src/components/Calendar.jsx`로 분리
- Calendar grid, 월 이동, 일정 추가/삭제, AI 추천 일정 등록을 `public/static/js/calendar.js` React bridge로 전환
- Report 화면을 `src/components/Report.jsx`로 분리
- Report 목록, 검색, 기간 전환, 상세 보기, AI 초안, 편집, 저장, 공유를 `public/static/js/report.js` React bridge로 전환
- Knowledge 화면을 `src/components/Knowledge.jsx`로 분리
- Knowledge 유형 선택, 흐름 snapshot, 인수인계 문서 미리보기, 초안 저장/공유를 `public/static/js/handoff.js` React bridge로 전환
- Chat 화면을 `src/components/Chat.jsx`로 분리
- Chat 세션 목록, 메시지 목록, 입력, 일정 분석 카드, 근거 컨텍스트 패널을 React 렌더링으로 전환
- Chat 세션 저장, 메시지 추가, `/api/v1/chat` 요청, 일정 등록 호환 함수를 `public/static/js/chat.js` React bridge로 전환
- Settings 화면을 `src/components/Settings.jsx`로 분리
- Settings 테마 선택, 사용자 프로필 표시, 로그아웃/세션 정리 흐름을 React 렌더링으로 전환
- Settings 테마 저장, 사용자 정보 snapshot, 세션 정리 호환 함수를 `public/static/js/settings.js` React bridge로 전환
- Analysis 화면을 `src/components/Analysis.jsx`로 분리
- Analysis 파일 업로드, 파일 검증, 분석 진행 단계, 결과 카드, 업로드 이력을 React 렌더링으로 전환
- Analysis 파일 선택/검증, 분석 진행 snapshot, 결과 생성, 이력 토글 호환 함수를 `public/static/js/analysis.js` React bridge로 전환
- Shell 영역의 모달, 알림, floating AI inline handler를 data 속성과 React event delegation으로 전환
- Shell 공통 함수인 closeModal/openModal/showToast/addNotif/toggleFloatAI/floatSend를 `public/static/js/shell.js` bridge로 분리
- `app.js`에 남아 있던 Analysis/Calendar/Report/Knowledge/Chat/Settings 구현 블록과 중복 초기 구현 제거
- Issue 저장, API 응답 정규화, 로컬스토리지 fallback, Issue 상세 보조 액션을 `public/static/js/issue-data.js`로 분리
- Calendar 화면의 자연어 일정 등록 보조 함수 `miniChat`을 `public/static/js/mini-calendar-chat.js`로 분리
- 초기 빈 데이터 보정, 기본 보고서 초안 fallback, 대시보드/캘린더 초기 표시 보정을 `public/static/js/clean-bootstrap.js`로 분리
- 공통 텍스트/HTML escape/렌더 텍스트 정규화/날짜 라벨 유틸을 `public/static/js/runtime-utils.js`로 분리
- 캘린더 색상 선택 호환 함수 `toggleColorPicker`, `pickColor`를 `public/static/js/calendar.js`로 이동
- `public/static/js/app.js`를 고정 템플릿으로 재생성하도록 정리하고 전역 의존성을 `docs/RUNTIME_GLOBALS.md`에 문서화
- Chat 응답 캐시 `chatResponses`를 `app.js`에서 제거하고 `public/static/js/chat.js` 소유로 이동
- Todo/Issue 공유 배열 `todos`, `issues`를 `app.js`에서 제거하고 `public/static/js/runtime-state.js` 소유로 이동
- 공유 화면 상태 `G`를 `app.js`에서 제거하고 `public/static/js/runtime-state.js` 소유로 이동
- Analysis 업로드 파일 `uploadedFiles`와 분석 이력 `analysisHistory`를 `G`에서 제거하고 `public/static/js/analysis.js` 내부 state 소유로 이동
- Chat 세션 선택, 최근 질문, 타이핑 상태를 `G`에서 제거하고 `public/static/js/chat.js` 내부 `chatState` 소유로 이동
- Calendar 월/선택/일정 상태를 `G`에서 제거하고 `public/static/js/calendar.js` 내부 `calendarState` 소유로 이동
- Todo/Issue 화면 상태를 `G`에서 제거하고 `todo.js`/`issue.js` 내부 state 소유로 이동
- Report/Knowledge 화면 상태를 `G`에서 제거하고 `report.js`/`handoff.js` 내부 state 소유로 이동

## 17단계 결과

Shell 공통 UI는 이제 아래처럼 분리되어 있습니다.

```text
src/legacy/legacyMarkup.js
  shell/modal/floating AI 영역의 onclick/onkeydown/onmouseover 제거
  data-modal-close/data-shell-call/data-enter-call/data-float-question 등 data 속성만 유지

src/App.jsx
  legacy-react-host에서 click/keyDown event delegation 처리
  모달 닫기, shell call, 캘린더 색상 선택, floating AI 질문, legacy nav를 중앙 처리

public/static/js/shell.js
  openModal/closeModal/showToast/showTransition/hideTransition
  toggleFloatAI/floatAsk/floatSend/toggleNotif/clearNotifs/addNotif/renderNotifs 전역 호환 bridge 제공

public/static/js/app.js
  shell 공통 UI 함수 제거
  공통 nav와 bootstrap 일부만 유지
```

## 18단계 결과

Issue 데이터 호환 계층은 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/issue-data.js
  persistIssues/fetchIssues/createIssue/toIssueModel 등 Issue API와 저장 fallback 담당
  createTodoFromIssue/assignIssueOwner/updateIssueStatus 등 Issue 상세 보조 액션 담당

src/legacy/legacyMarkup.js
  /static/js/app.js 바로 뒤에 /static/js/issue-data.js 로드
  dashboard.js, issue.js가 실행되기 전에 Issue 전역 호환 함수 준비

public/static/js/app.js
  Issue persistence 제거
  전역 상태, 공통 텍스트 유틸, 화면 이동, clean bootstrap만 유지
```

## 19단계 결과

미니 캘린더 채팅 보조 로직은 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/mini-calendar-chat.js
  Calendar.jsx에서 호출하는 window.miniChat 호환 함수 제공
  chat.js가 노출하는 window.parseScheduleMsg를 사용해 자연어 일정을 캘린더 이벤트로 변환

src/legacy/legacyMarkup.js
  /static/js/chat.js 뒤에 /static/js/mini-calendar-chat.js 로드

public/static/js/calendar.js
  miniChat 소유 표시 제거

public/static/js/app.js
  mini calendar chat 제거
  전역 상태, 공통 텍스트 유틸, 화면 이동, 날짜 라벨만 유지
```

## 20단계 결과

clean fallback/bootstrap 로직은 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/clean-bootstrap.js
  initOpsRadarCleanVersion 초기화 블록 담당
  빈 대시보드/캘린더 표시 보정, 기본 보고서 초안 fallback, 초기 runtime data 정리 담당

src/legacy/legacyMarkup.js
  /static/js/calendar.js 뒤에 /static/js/clean-bootstrap.js 로드
  calendar 렌더 함수 준비 후 report.js 초기화 전 fallback 데이터 준비

public/static/js/app.js
  clean fallback/bootstrap 제거
  전역 상태, 화면 이동, 캘린더 색상 선택 호환 함수만 유지
```

## 21단계 결과

공통 런타임 유틸은 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/runtime-utils.js
  normalizeText/escapeHtml/normalizeRenderedText 제공
  formatOpsDate/renderCurrentDateLabels 제공
  legacy bridge 모듈들이 쓰는 전역 호환 유틸 담당

src/legacy/legacyMarkup.js
  /static/js/app.js 바로 뒤에 /static/js/runtime-utils.js 로드
  issue-data.js, shell.js, analysis.js, report.js보다 먼저 공통 유틸 준비

public/static/js/app.js
  공통 텍스트/날짜 유틸 제거
  전역 상태, 화면 이동만 유지
```

## 22단계 결과

캘린더 색상 선택 호환 함수는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/calendar.js
  toggleColorPicker/pickColor 제공
  Calendar modal 색상 dropdown UI와 calSelectedColor 호환 상태 담당

src/App.jsx
  기존 data-shell-call/data-cal-color-value event delegation 유지
  window.toggleColorPicker/window.pickColor 호출 경로는 그대로 유지

public/static/js/app.js
  캘린더 색상 선택 함수 제거
  전역 상태와 화면 이동만 유지
```

## 23단계 결과

`app.js`는 이제 아래처럼 최종 고정되었습니다.

```text
public/static/js/app.js
  OpsRadarFrontend registry 제공
  G, todos, issues 공유 상태 제공
  nav(screen) 화면 이동 함수 제공
  화면 구현, API 호출, 유틸, 모달, 캘린더 색상 선택 로직 없음

scripts/import-legacy.mjs
  buildCoreAppSource()로 app.js를 고정 템플릿에서 생성
  legacy app.js에 남아 있는 깨진 주석이나 화면 로직을 다시 가져오지 않음

docs/RUNTIME_GLOBALS.md
  G, todos, issues, nav 의존 모듈과 정리 기준 문서화
```

## 24단계 결과

Chat 응답 캐시는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/chat.js
  chatResponses 캐시 소유
  window.chatResponses 호환 노출 유지

public/static/js/app.js
  chatResponses 제거
  OpsRadarFrontend, G, todos, issues, nav만 유지

docs/RUNTIME_GLOBALS.md
  chatResponses가 Chat 소유로 이동했음을 문서화
```

## 25단계 결과

Todo/Issue 공유 배열은 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/runtime-state.js
  todos, issues 공유 배열 소유
  window.todos/window.issues 호환 노출 유지

public/static/js/app.js
  todos, issues 제거
  OpsRadarFrontend, G, nav만 유지

src/legacy/legacyMarkup.js
  /static/js/app.js 바로 뒤에 /static/js/runtime-state.js 로드
  issue-data.js, api-integration.js, todo.js, issue.js보다 먼저 공유 배열 준비
```

## 26단계 결과

공유 화면 상태는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/runtime-state.js
  G, todos, issues 공유 상태 소유
  window.G/window.todos/window.issues 호환 노출 유지

public/static/js/app.js
  G 제거
  OpsRadarFrontend registry와 nav(screen) 화면 이동만 유지

scripts/import-legacy.mjs
  runtime-state.js를 고정 템플릿으로 생성
  app.js 재생성 시 공유 상태가 다시 섞이지 않도록 유지
```

## 27단계 결과

Analysis 화면 전용 상태는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/analysis.js
  uploadedFiles, analysisHistory를 내부 state로 소유
  getAnalysisSnapshot()으로 React Analysis.jsx에 snapshot 전달
  resetAnalysisRuntimeData()로 clean bootstrap 초기화와 연결

public/static/js/runtime-state.js
  uploadedFiles, analysisHistory 제거

public/static/js/clean-bootstrap.js
  G.analysisHistory 직접 초기화 제거
  window.resetAnalysisRuntimeData?.() 호출로 Analysis bridge에 위임
```

## 28단계 결과

Chat 화면 전용 상태는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/chat.js
  chatState가 currentSessionId, lastPrompt, restoring, typing 소유
  getChatSnapshot()으로 React Chat.jsx에 snapshot 전달
  localStorage 세션 저장 계약은 기존 CHAT_SESSION_KEY/CHAT_CURRENT_KEY 유지

public/static/js/runtime-state.js
  chatTyping 제거
  currentChatSessionId, lastChatPrompt, restoringChat 동적 G 의존 제거

아직 유지하는 범위
  Chat의 캘린더 등록 흐름은 Calendar 상태 정리 전까지 G.currentCalYear,
  G.currentCalMonth, G.newCalEvents를 계속 참조
```

## 29단계 결과

Calendar 화면 전용 상태는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/calendar.js
  calendarState가 currentCalYear, currentCalMonth, selectedCalDay, calEvents, newCalEvents 소유
  getCalendarRuntimeState/addCalendarRuntimeEvent/replaceCalendarRuntimeEvents/resetCalendarRuntimeData 제공

public/static/js/chat.js
public/static/js/mini-calendar-chat.js
public/static/js/handoff.js
public/static/js/api-integration.js
  G 캘린더 필드 직접 접근 제거
  Calendar 공개 함수로 일정 상태 읽기/갱신

public/static/js/runtime-state.js
  selectedCalDay, calEvents, newCalEvents 제거
```

## 30단계 결과

Todo/Issue 화면 전용 상태는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/todo.js
  todoState가 currentTodoTab, selectedTodoId, todoChecked, editTargetId 소유

public/static/js/issue-data.js
public/static/js/issue.js
  issueState가 currentIssueTab, selectedIssueId, createIssueId,
  confirmIssueId, createdTodosFromIssue 소유
```

## 31단계 결과

Report/Knowledge 화면 전용 상태는 이제 아래처럼 분리되어 있습니다.

```text
public/static/js/report.js
  reportState가 보고서 목록, 검색어, 기간, 선택 보고서, 편집 초안, 공유 기록 소유

public/static/js/handoff.js
  handoffState가 Knowledge 유형, 미리보기 열림 상태, 현재 초안, 저장 초안 소유

public/static/js/runtime-state.js
  G는 currentScreen만 유지
  todos/issues 공유 배열은 legacy API integration 호환용으로 유지
```

## 아직 남은 작업

- 안정화가 끝나면 공식 `opsradar2/frontend/` 반영 여부 결정

## 전환 기준

1. 화면 단위로 먼저 React 컴포넌트를 만든다.
2. 기존 API 계약과 `/api/v1` 경로는 바꾸지 않는다.
3. 기존 전역 함수는 한 번에 제거하지 않고 React bridge로 호환성을 유지한다.
4. 화면이 안정화되면 `app.js`에서 해당 화면 구현을 제거한다.
5. 빌드와 하네스 검증을 통과한 단계만 다음 단계로 넘긴다.
