# OpsRadar React 전환 런타임 전역 의존성

업데이트: 2026-06-04

이 문서는 `frontend-react-vite/public/static/js/app.js`와 `frontend-react-vite/public/static/js/runtime-state.js`에 남긴 전역 의존성을 설명합니다. 이 파일들은 기존 레거시 bridge가 모두 React state로 완전히 전환될 때까지 유지하는 호환 계층입니다.

## app.js가 담당하는 것

`public/static/js/app.js`는 아래 역할만 담당합니다.

```text
OpsRadarFrontend
  legacy bridge 모듈 등록용 runtime registry

nav(screen)
  legacy shell sidebar와 React 컴포넌트에서 공통으로 쓰는 화면 이동 함수
```

`public/static/js/runtime-state.js`는 아래 역할만 담당합니다.

```text
G
  현재 활성 화면 currentScreen

todos
  Todo bridge와 API integration이 공유하는 Todo 배열

issues
  Issue, Dashboard, Report bridge가 공유하는 Issue 배열
```

## 주요 의존 모듈

```text
G
  shell.js

todos
  api-integration.js
  issue.js
  report.js
  todo.js

issues
  api-integration.js
  dashboard.js
  issue.js
  issue-data.js
  report.js

nav
  dashboard.js
  issue.js
  React components through App.jsx/callLegacy
```

## 화면별 소유로 이동한 전역

```text
chatResponses
  app.js에서 제거
  chat.js가 window.chatResponses 호환 캐시로 소유

chatTyping / currentChatSessionId / lastChatPrompt / restoringChat
  G에서 제거
  chat.js 내부 chatState가 Chat 세션 선택, 최근 질문, 타이핑 상태를 소유

todos / issues
  app.js에서 제거
  runtime-state.js가 window.todos/window.issues 호환 배열로 소유

G
  app.js에서 제거
  runtime-state.js가 window.G 호환 상태로 소유

uploadedFiles / analysisHistory
  G에서 제거
  analysis.js 내부 state가 업로드 파일과 분석 이력을 소유

Calendar / Todo / Issue / Report / Knowledge 화면 상태
  G에서 제거
  calendarState, todoState, issueState, reportState, handoffState가 각 화면 bridge 안에서 소유
```

## 정리 기준

- 새 기능은 가능하면 React component state나 화면별 bridge module 안에 둡니다.
- `app.js`에는 새 화면 로직, API 호출, DOM 렌더링, 모달 처리, 날짜/텍스트 유틸을 다시 넣지 않습니다.
- `G.currentScreen`은 floating AI 문맥 표시용으로만 유지합니다.
- `todos`, `issues`를 제거하려면 API integration과 화면 bridge의 공유 배열 계약을 React/API store 구조로 먼저 바꿉니다.
- `nav(screen)`은 sidebar shell과 React 컴포넌트가 모두 참조하므로, 공식 라우터를 도입하기 전까지 유지합니다.
