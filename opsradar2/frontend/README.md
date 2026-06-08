# OpsRadar Frontend

이 폴더가 현재 공식 프론트엔드입니다.

기존 정적 HTML 프론트는 `opsradar2/frontend-legacy-static/`에 백업해두었고, 현재 `opsradar2/frontend/`는 SeongHo 브랜치에서 가져온 React + Vite 버전입니다.

## 실행

PowerShell에서는 `npm` 대신 `npm.cmd`를 사용합니다.

```powershell
cd C:\Users\wndnj\OneDrive\문서\인수인계\opsradar2\frontend
npm.cmd install
npm.cmd run dev
```

기본 주소:

```text
http://127.0.0.1:5173/
```

## 백엔드 연결

Vite 개발 서버는 `/api` 요청을 FastAPI 서버로 프록시합니다.

기본값:

```text
React/Vite: http://127.0.0.1:5173
FastAPI:    http://127.0.0.1:8010
API:        /api/v1
```

FastAPI를 다른 포트로 실행 중이면 프록시 대상을 바꿔 실행합니다.

```powershell
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8002"
npm.cmd run dev
```

## 구조

```text
frontend/
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
```

## 현재 판단

이 프론트는 기존 정적 프론트보다 데모 완성도가 높아서 공식 프론트로 승격했습니다.

남은 우선 작업:

1. 깨진 한글 문구 정리
2. `Analysis` 업로드 흐름을 실제 `/api/v1/documents/upload`와 연결
3. 화면 문구를 팀장용 업무 레이더, 후속조치, 리스크, 보고서 중심으로 정리
4. 백엔드 API 필드와 화면 표시 데이터 최종 점검

## 백업

기존 정적 프론트:

```text
opsradar2/frontend-legacy-static/
```
