"""Regression checks for the Todo workflow integration."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_todo_edit_persists_due_date_from_calendar():
    adapter = read("frontend/public/static/js/api-integration.js")
    calendar = read("frontend/public/static/js/todo-calendar-enhancements.js")

    assert 'const dueAt = document.getElementById("editDueDate")?.value || null;' in adapter
    assert "JSON.stringify({ title, description, assignee, due_at: dueAt })" in adapter
    assert "JSON.stringify({ title, description, assignee, due_at: dueDate })" in calendar


def test_completed_todos_can_return_to_progress_or_be_deleted():
    index = read("frontend/public/index.html")
    calendar = read("frontend/public/static/js/todo-calendar-enhancements.js")

    assert 'id="todoBulkRestoreDoneBtn"' in index
    assert "window.restoreDoneTodo" in calendar
    assert "window.bulkRestoreDoneTodos" in calendar
    assert 'JSON.stringify({ status: "in_progress", approval_status: "approved" })' in calendar
    assert "window.deleteDoneTodo" in calendar


def test_todo_dates_have_distinct_created_and_updated_fields():
    adapter = read("frontend/public/static/js/api-integration.js")
    repository = read("app/repositories/todo_repository.py")

    assert "createdAt: todo.created_at || null" in adapter
    assert "updatedAt: todo.updated_at || todo.created_at || null" in adapter
    assert "COALESCE(t.updated_at, t.created_at) AS updated_at" in repository


def test_authenticated_runtime_loads_all_todos_for_local_tabs():
    adapter = read("frontend/public/static/js/api-integration.js")

    assert 'localStorage.getItem("opsradar_session")' in adapter
    assert "headers.Authorization = `Bearer ${token}`" in adapter
    assert 'request("/todos?limit=500")' in adapter
