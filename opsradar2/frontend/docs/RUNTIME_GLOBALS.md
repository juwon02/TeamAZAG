# Runtime Globals

Updated: 2026-06-08

The React frontend still loads several legacy scripts from `public/static/js/`. These scripts expose global state and functions so the migrated React screens can keep working while the remaining legacy behavior is cleaned up.

## Main Globals

```text
window.OpsRadarFrontend
  Runtime module registry used by legacy bridge scripts.

window.G
  Shared shell state. Currently keeps the active screen for sidebar/floating AI behavior.

window.todos
window.issues
  Shared compatibility arrays used by Todo, Issue, Dashboard, Report, and API integration.

window.nav(screen)
  Shared navigation function used by the legacy shell and React components.

window.opsRadarApi
  API helper exposed by public/static/js/api-integration.js.
```

## Ownership

```text
public/static/js/runtime-state.js
  Owns G, todos, and issues compatibility state.

public/static/js/app.js
  Owns OpsRadarFrontend registration and nav(screen).

public/static/js/api-integration.js
  Owns backend request helpers and API response normalization.

public/static/js/shell.js
  Owns modal, toast, notification, and floating AI compatibility functions.
```

## Cleanup Direction

Keep these globals during the 15-day demo stabilization period. After the demo, move feature state into React state or a small explicit store and remove compatibility globals one screen at a time.
