# React Migration Plan

Updated: 2026-06-08

## Current Status

`opsradar2/frontend/` is now the official React + Vite frontend.

The previous static frontend has been preserved at:

```text
opsradar2/frontend-legacy-static/
```

This React frontend was promoted from SeongHo's `frontend-react-vite` work. It keeps the legacy UI/runtime in `public/static/` while moving the main screens into React components.

## Completed

- Legacy HTML shell moved into `src/legacy/legacyMarkup.js`
- Legacy screen placeholders split into `src/legacy/screens/`
- Main screens moved into React components:
  - `Dashboard.jsx`
  - `Analysis.jsx`
  - `Todo.jsx`
  - `Issue.jsx`
  - `Calendar.jsx`
  - `Knowledge.jsx`
  - `Report.jsx`
  - `Chat.jsx`
  - `Settings.jsx`
- Legacy runtime modules preserved under `public/static/js/`
- Vite proxy connects `/api` to FastAPI `/api/v1`
- API proxy target can be changed with `VITE_API_PROXY_TARGET`

## Remaining Work

1. Fix broken Korean text in legacy JS and copied docs.
2. Connect the Analysis upload flow to the real `/api/v1/documents/upload` endpoint.
3. Align screen copy around the "team operations radar" positioning.
4. Verify live backend responses for todos, issues, reports, calendar, chat, and dashboard.
5. Reduce legacy global state after the demo is stable.

## Migration Rule

Do not edit `frontend-legacy-static/` unless restoring old behavior. New frontend work should happen in `opsradar2/frontend/`.
