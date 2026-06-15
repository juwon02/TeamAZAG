# Current Seed Compatibility Check

## Scope
- Generated from `dummy_data/02_raw_documents` and `dummy_data/03_structured_csv`.
- Did not modify `dummy_data/05_db_seed_v2`.
- Did not use the expected-output test folder as input seed data.

## Included demo coverage
- Documents: 36
- Key issues: 9
- Todos: 27
- Calendar events: 27
- Weekly reports: 3
- Monthly reports: 2
- Handoff reports: 2
- Chat messages: 9
- AI summaries: 9

## Compatibility note
The `dummy` branch available in this local checkout does not contain a tracked database schema file. The seed therefore uses the current OpsRadar2 v2 table contracts already represented by the existing seed converter, but keeps the output smaller and cleanup-safe with fixed `DUMMY-*` IDs and `[DUMMY]` titles.

If a target database lacks optional tables such as `weekly_reports`, `monthly_reports`, `handoff_reports`, `chat_messages`, or `ai_summaries`, load only the CSV/SQL sections for tables present in that database.

## Safety
- All generated rows use fixed `DUMMY-*` IDs or `[DUMMY]` labels.
- Cleanup deletes by generated IDs only.
- No local environment files are read.
