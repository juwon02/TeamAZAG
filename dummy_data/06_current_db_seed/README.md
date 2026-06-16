# OpsRadar2 Current DB Seed

This folder contains a minimal [DUMMY] seed for local demos of document upload, analysis, Todo, issue, report, chat, and handoff flows.

## Files
- `csv/`: table-shaped CSV files
- `sql/insert_current_seed.sql`: PostgreSQL insert script
- `sql/clear_current_seed.sql`: cleanup script for this seed only
- `current-seed-compatibility-check.md`: compatibility notes and verification summary

## Row counts
- `teams.csv`: 1 rows
- `users.csv`: 8 rows
- `projects.csv`: 1 rows
- `project_members.csv`: 8 rows
- `documents.csv`: 56 rows
- `issues.csv`: 14 rows
- `todos.csv`: 42 rows
- `calendar_events.csv`: 42 rows
- `weekly_reports.csv`: 3 rows
- `monthly_reports.csv`: 2 rows
- `handoff_reports.csv`: 2 rows
- `chat_messages.csv`: 9 rows
- `ai_summaries.csv`: 14 rows

## Usage
```bash
python scripts/create_current_db_seed.py
psql -h 127.0.0.1 -p 5432 -U postgres -d azag_db -f dummy_data/06_current_db_seed/sql/insert_current_seed.sql
```

To remove only this demo seed:

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d azag_db -f dummy_data/06_current_db_seed/sql/clear_current_seed.sql
```

The expected-output test samples are not used as seed input.
