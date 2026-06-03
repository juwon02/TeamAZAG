# OpsRadar Frontend/Backend API Contracts

This document is the handoff point between `frontend/js/api-integration.js`
and the FastAPI backend.

## Base URL

The frontend should use same-origin API calls by default:

```js
window.OPSRADAR_API_BASE || "/api/v1"
```

Use `window.OPSRADAR_API_BASE` only when running the frontend from a separate
static server.

## Core Paths Used By Frontend

| Frontend action | Method | Backend path |
| --- | --- | --- |
| Dashboard summary | GET | `/api/v1/dashboard/summary` |
| Load todos | GET | `/api/v1/todos` |
| Create todo | POST | `/api/v1/todos` |
| Update todo | PATCH | `/api/v1/todos/{todo_id}` |
| Load issues | GET | `/api/v1/issues` |
| Create issue | POST | `/api/v1/issues` |
| Update issue | PATCH | `/api/v1/issues/{issue_id}` |
| Resolve issue | PATCH | `/api/v1/issues/{issue_id}/resolve` |
| Create todo from issue | POST | `/api/v1/issues/{issue_id}/todos` |
| Load calendar | GET | `/api/v1/calendar` |
| Create calendar event | POST | `/api/v1/calendar/` |
| Delete calendar event | DELETE | `/api/v1/calendar/{event_id}` |
| Load reports | GET | `/api/v1/reports` |
| Generate report | POST | `/api/v1/reports/generate` |
| Update report | PATCH | `/api/v1/reports/{report_id}` |
| Chat | POST | `/api/v1/chat` |

## Response Shape Rule

Backend responses should keep the top-level keys expected by
`frontend/js/api-integration.js`:

- `GET /todos` -> `{ "todos": [...] }`
- `GET /issues` -> `{ "issues": [...] }`
- `GET /calendar` -> `{ "events": [...] }`
- `GET /reports` -> `{ "reports": [...] }`
- `POST /reports/generate` -> includes `report_id`
- `POST /calendar/` -> includes `event`

When changing any of these, update both the adapter and
`tests/test_runtime_configuration.py` in the same PR.
