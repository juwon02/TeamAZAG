from __future__ import annotations

import csv
import json
import re
import uuid
from pathlib import Path

from create_current_db_seed import OUT, TABLE_HEADERS, validate_tables


ROOT = Path(__file__).resolve().parents[1]
CSV_DIR = OUT / "csv"
INSERT_SQL = OUT / "sql" / "insert_current_seed.sql"


def read_table(table: str) -> tuple[list[str], list[dict[str, object]]]:
    path = CSV_DIR / f"{table}.csv"
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader.fieldnames or []), list(reader)


def main() -> int:
    errors: list[str] = []
    tables: dict[str, list[dict[str, object]]] = {}
    for table, expected_headers in TABLE_HEADERS.items():
        headers, rows = read_table(table)
        tables[table] = rows
        if headers != expected_headers:
            errors.append(f"{table}: header mismatch {headers}")

    try:
        validate_tables(tables)
    except ValueError as exc:
        errors.append(str(exc))

    for table, rows in tables.items():
        for row_number, row in enumerate(rows, 2):
            for key, value in row.items():
                if key == "id" or key.endswith("_id"):
                    if value:
                        try:
                            uuid.UUID(str(value))
                        except ValueError:
                            errors.append(f"{table}:{row_number} invalid UUID {key}={value}")
            for key in {"progress", "confidence_score", "progress_rate"} & set(row):
                if row[key] and not 0 <= int(str(row[key])) <= 100:
                    errors.append(f"{table}:{row_number} {key} outside 0..100")

    for table, column in [("chat_messages", "sources_json"), ("ai_summaries", "extracted_json")]:
        for row_number, row in enumerate(tables[table], 2):
            try:
                json.loads(str(row[column]))
            except json.JSONDecodeError:
                errors.append(f"{table}:{row_number} invalid JSON in {column}")

    for row_number, row in enumerate(tables["documents"], 2):
        uri = str(row["storage_uri"])
        if not uri.startswith("dummy_data/") or not (ROOT / uri).exists():
            errors.append(f"documents:{row_number} missing storage_uri target {uri}")
        if not re.fullmatch(r"[0-9a-f]{64}", str(row["content_hash"])):
            errors.append(f"documents:{row_number} invalid SHA-256 content_hash")

    sql = INSERT_SQL.read_text(encoding="utf-8")
    if "SET search_path TO opsradar2, public;" not in sql:
        errors.append("insert SQL does not set opsradar2 search_path")
    insert_headers = {
        table: [column.strip() for column in columns.split(",")]
        for table, columns in re.findall(r"INSERT INTO (\w+) \(([^)]+)\) VALUES", sql)
    }
    if insert_headers != TABLE_HEADERS:
        errors.append("insert SQL table/column contract differs from CSV contract")

    if errors:
        print("current DB seed validation: FAIL")
        for error in errors[:50]:
            print(f"- {error}")
        return 1

    print("current DB seed validation: OK")
    print(f"tables: {len(tables)}")
    print(f"rows: {sum(len(rows) for rows in tables.values())}")
    print("header/UUID/enum/FK/JSON/range/path/SQL checks: OK")
    print("actual DB insert: False")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
