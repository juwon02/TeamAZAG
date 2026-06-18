from __future__ import annotations

import csv
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

from operational_raw_documents import validate_operational_body
from validate_current_db_seed import main as validate_current_db_seed


ROOT = Path(__file__).resolve().parents[1]
DUMMY = ROOT / "dummy_data"
CSV_DIR = DUMMY / "03_structured_csv"
START_DATE = "2026-07-01"
END_DATE = "2026-12-31"
MESSY_ISSUE_IDS = {f"ISSUE-2026-{idx:03d}" for idx in range(10, 16)}
SENSITIVE_WORDS = [
    "".join(parts)
    for parts in [
        ("OPEN", "AI"),
        ("AZ", "URE"),
        ("API", "_", "KEY"),
        ("SEC", "RET"),
        ("PASS", "WORD"),
        ("TOK", "EN"),
        ("DATA", "BASE", "_", "URL"),
        ("PRIVATE", "_", "KEY"),
    ]
]


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def fail(message: str, failures: list[str]) -> None:
    print(f"FAIL: {message}")
    failures.append(message)


def ok(message: str) -> None:
    print(f"OK: {message}")


def git_diff_names(path: str) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", "--", path],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        return ["<git diff failed>"]
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def scan_sensitive(paths: list[Path]) -> list[tuple[str, str]]:
    hits: list[tuple[str, str]] = []
    for path in paths:
        if not path.is_file() or path.suffix.lower() not in {".md", ".csv", ".py", ".sql"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = path.read_text(encoding="utf-8-sig")
        upper = text.upper()
        for word in SENSITIVE_WORDS:
            if word in upper:
                hits.append((str(path.relative_to(ROOT)), word))
    return hits


def main() -> int:
    failures: list[str] = []

    issues = read_csv(CSV_DIR / "issue_events.csv")
    docs = read_csv(CSV_DIR / "source_document_index.csv")
    orders = read_csv(CSV_DIR / "orders.csv")
    purchase_orders = read_csv(CSV_DIR / "purchase_orders.csv")
    shipments = read_csv(CSV_DIR / "shipments.csv")
    claims = read_csv(CSV_DIR / "claims.csv")

    issue_ids = {row["issue_id"] for row in issues}
    if MESSY_ISSUE_IDS.issubset(issue_ids):
        ok("ISSUE-2026-010 ~ ISSUE-2026-015 exist")
    else:
        fail(f"missing messy issue ids: {sorted(MESSY_ISSUE_IDS - issue_ids)}", failures)

    doc_by_issue: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in docs:
        if row["related_issue_id"] in MESSY_ISSUE_IDS:
            doc_by_issue[row["related_issue_id"]].append(row)

    total_docs = sum(len(rows) for rows in doc_by_issue.values())
    if total_docs >= 80:
        ok(f"messy source documents >= 80 ({total_docs})")
    else:
        fail(f"messy source documents below 80 ({total_docs})", failures)

    sparse = {issue_id: len(doc_by_issue[issue_id]) for issue_id in MESSY_ISSUE_IDS if len(doc_by_issue[issue_id]) < 6}
    if not sparse:
        ok("each messy issue has at least 6 source documents")
    else:
        fail(f"issues with fewer than 6 documents: {sparse}", failures)

    missing_paths = [row["file_path"] for rows in doc_by_issue.values() for row in rows if not (DUMMY / row["file_path"]).exists()]
    if not missing_paths:
        ok("source_document_index file_path values exist")
    else:
        fail(f"missing source document paths: {missing_paths[:10]}", failures)

    bad_doc_dates = [
        (row["doc_id"], row["created_date"])
        for rows in doc_by_issue.values()
        for row in rows
        if not (START_DATE <= row["created_date"] <= END_DATE)
    ]
    if not bad_doc_dates:
        ok("messy document dates are within 2026-07-01 ~ 2026-12-31")
    else:
        fail(f"bad messy document dates: {bad_doc_dates[:10]}", failures)

    related_sets = {
        "orders.csv": [row for row in orders if row["related_issue_id"] in MESSY_ISSUE_IDS],
        "purchase_orders.csv": [row for row in purchase_orders if row["related_issue_id"] in MESSY_ISSUE_IDS],
        "shipments.csv": [row for row in shipments if row["related_issue_id"] in MESSY_ISSUE_IDS],
        "claims.csv": [row for row in claims if row["related_issue_id"] in MESSY_ISSUE_IDS],
    }
    csv_row_count = len(MESSY_ISSUE_IDS) + total_docs + sum(len(rows) for rows in related_sets.values())
    if csv_row_count >= 100:
        ok(f"messy CSV row count >= 100 ({csv_row_count})")
    else:
        fail(f"messy CSV row count below 100 ({csv_row_count})", failures)

    for name, rows in related_sets.items():
        if len(rows) >= len(MESSY_ISSUE_IDS):
            ok(f"{name} has rows linked to messy issues ({len(rows)})")
        else:
            fail(f"{name} has insufficient messy linked rows ({len(rows)})", failures)

    duplicate_docs = [key for key, count in Counter(row["doc_id"] for row in docs).items() if count > 1]
    duplicate_issues = [key for key, count in Counter(row["issue_id"] for row in issues).items() if count > 1]
    if not duplicate_docs and not duplicate_issues:
        ok("no duplicate doc_id or issue_id")
    else:
        fail(f"duplicates found: docs={duplicate_docs[:10]}, issues={duplicate_issues[:10]}", failures)

    raw_errors: list[str] = []
    for row in docs:
        path = DUMMY / row["file_path"]
        if not path.exists():
            continue
        folder = Path(row["file_path"]).parts[1]
        text = path.read_text(encoding="utf-8")
        raw_errors.extend(f"{row['doc_id']}: {message}" for message in validate_operational_body(text, folder))
    if not raw_errors:
        ok(f"all raw documents use operational record formats ({len(docs)})")
    else:
        fail(f"raw document format errors: {raw_errors[:10]}", failures)

    db_v2_changes = git_diff_names("dummy_data/05_db_seed_v2")
    unexpected_db_v2_changes = [
        path for path in db_v2_changes if path != "dummy_data/05_db_seed_v2/README.md"
    ]
    if not unexpected_db_v2_changes:
        ok("expanded candidate DB seed data is not modified")
    else:
        fail(
            f"unexpected expanded candidate DB seed changes: {unexpected_db_v2_changes}",
            failures,
        )

    if validate_current_db_seed() == 0:
        ok("current DB seed matches the current database contract")
    else:
        fail("current DB seed contract validation failed", failures)

    if not git_diff_names("dummy_data/2022"):
        ok("isolated 2022 seed is not modified")
    else:
        fail("protected 2022 seed folder has modifications", failures)

    scan_paths = []
    for rel in [
        "dummy_data/02_raw_documents",
        "dummy_data/03_structured_csv",
        "dummy_data/04_expected_outputs_for_test",
        "dummy_data/06_current_db_seed",
        "scripts",
        "docs",
    ]:
        path = ROOT / rel
        if path.exists():
            scan_paths.extend(path.rglob("*"))
    hits = scan_sensitive(scan_paths)
    if not hits:
        ok("sensitive keyword scan passed")
    else:
        fail(f"sensitive keyword hits: {hits[:10]}", failures)

    print(f"실제 DB insert 여부: False")
    print(f"validation_failures: {len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
