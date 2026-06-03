# OpsRadar Backend Base

This backend uses a four-layer feature structure:

1. `app/api/v1/endpoints/<feature>.py`
   - HTTP only: request params, response shape, status codes.
   - No SQL and no business branching that belongs in services.

2. `app/services/<feature>_service.py`
   - Business rules and workflow decisions.
   - Receives repositories through the constructor.

3. `app/repositories/<feature>_repository.py`
   - Persistence only.
   - SQL and DB shape compatibility live here.

4. `app/schemas/<feature>.py`
   - Pydantic request and response contracts.

## Router Rule

Do not keep adding router imports directly to `app/api/api.py`.

Register new endpoint modules in:

```text
app/api/v1/router_registry.py
```

Add one `RouterSpec` entry:

```python
RouterSpec(my_feature.router, "/my-feature", "my-feature")
```

## Team Rules

1. Endpoints should stay thin.
2. Services should not import FastAPI.
3. Repositories should not import FastAPI.
4. API response field names should match the frontend adapter in
   `frontend/js/api-integration.js`.
5. DB schema compatibility belongs in repositories, not endpoints.
6. New shared request/response shapes should be added to `app/schemas`.
7. Add focused tests for service decisions before broad integration tests.

## Next Backend Cleanup Targets

- Replace `dict` request bodies in Todo/Issue endpoints with schema classes.
- Move repeated repository construction into small dependency helpers.
- Add response schemas for list/create/update endpoints.
- Document API response contracts for frontend consumers.
