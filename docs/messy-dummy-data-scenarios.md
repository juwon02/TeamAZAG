# Messy Dummy Data Scenarios

## Purpose
This extension adds July to December 2026 source materials that are intentionally less tidy than the original dummy data. The goal is to test whether OpsRadar2 can produce reports and handoff drafts without flattening ambiguous operational evidence into overly clean conclusions.

## Difference From The Original Dummy Data
- Original data focuses on well-structured operating events from 2025-06-01 to 2026-06-01.
- This extension adds separate 2026-07-01 to 2026-12-31 messy scenarios.
- Existing source documents and CSV rows are preserved.
- New IDs use `ISSUE-2026-010` through `ISSUE-2026-014` and `DOC-2026-*-MESSY-*`.
- `dummy_data/05_db_seed_v2` is not modified.

## Added Scenarios
- `ISSUE-2026-010`: repeated due-date changes for an urgent Hyundai Mobis Tier2 order.
- `ISSUE-2026-011`: Daesung Automotive cable claim with unclear quality versus logistics cause.
- `ISSUE-2026-012`: TE Connectivity Korea price increase notice conflicting with prior verbal agreement.
- `ISSUE-2026-013`: Global Harness Vietnam month-end shipment confirmation gap.
- `ISSUE-2026-014`: Mirae EV Systems temporary coverage gap during owner vacation.

## Messy Elements
- Ambiguous language such as "maybe", "tentative", "probably", "checking", and "not final".
- Conflicting dates between email, chat, logistics logs, and meeting notes.
- Duplicate requests across channels.
- Unclear owner assignment.
- Supplier, customer, and product names embedded in the middle of body text.
- Final due dates mixed with temporary target dates.

## Report Generation Checks
- Does the report preserve date and status conflicts instead of ignoring them?
- Does it include "confirmation required" items?
- Does it separate in-progress and closed issues?
- Does it avoid inventing an owner for unclear Todo items?
- Does it distinguish tentative due dates from confirmed due dates?
- Does it keep customer, supplier, and product relationships intact?
- Does it avoid summarizing the situation too cleanly?

## Expected Output Usage
The two expected-output files in `dummy_data/04_expected_outputs_for_test` are verification references only. They are not service upload inputs and should not be inserted into the current DB seed.

## Service Upload Boundary
Upload candidates:
- `dummy_data/02_raw_documents`
- `dummy_data/03_structured_csv`
- `dummy_data/06_current_db_seed` when the current database schema supports the generated tables

Verification-only materials:
- `dummy_data/04_expected_outputs_for_test`

Do not upload:
- Local environment files
- Python cache folders
- Virtual environments
- Node dependency folders
