(function () {
  const API = window.OPSRADAR_API_BASE || "http://127.0.0.1:8010/api/v1";
  const idMap = new Map();
  let nextUiId = 100000;

  function uiId(kind, apiId) {
    const key = `${kind}:${apiId}`;
    if (!idMap.has(key)) idMap.set(key, nextUiId++);
    return idMap.get(key);
  }

  function apiStatusToUi(status) {
    return {
      pending: "pending",
      approved: "approved",
      in_progress: "approved",
      completed: "done",
      done: "done",
      rejected: "rejected",
      blocked: "approved",
    }[status] || "pending";
  }

  function uiStatusToApi(status) {
    return {
      pending: "pending",
      approved: "in_progress",
      done: "completed",
      rejected: "rejected",
    }[status] || status;
  }

  async function request(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.status === 204 ? null : res.json();
  }

  function replaceArray(target, values) {
    target.length = 0;
    target.push(...values);
  }

  function normalizeTodo(t) {
    return {
      id: uiId("todo", t.id),
      apiId: t.id,
      title: t.title || "Untitled",
      src: t.document_id || null,
      srcChunk: t.source_chunk_id || null,
      assignee: t.assignee || null,
      priority: t.priority || "medium",
      confidence: t.confidence == null ? null : Number(t.confidence),
      status: apiStatusToUi(t.status),
      type: t.source || "manual",
      chunk: null,
      grounds: [t.source === "ai" ? "DB AI 분석 결과" : "DB 저장 Todo"],
      risk: "",
    };
  }

  function normalizeIssue(i) {
    const status = i.status || "open";
    const source = i.source || "manual";
    return {
      id: uiId("issue", i.id),
      apiId: i.id,
      type: status === "resolved" ? "resolved" : source === "ai" ? "candidate" : "confirmed",
      severity: i.risk_level || "medium",
      status,
      confidence: i.confidence == null ? null : Number(i.confidence),
      title: i.title || "Untitled issue",
      src: i.document_id || null,
      assignee: i.assignee || null,
      days: 0,
      desc: i.description || i.title || "",
      chunk: "",
      history: [],
      domino: [],
      dominoFinal: "",
      suggestTodo: i.title ? `${i.title} 대응` : null,
      suggestAssignee: i.assignee || null,
      suggestPriority: i.risk_level === "high" ? "high" : "medium",
    };
  }

  function calendarClass(type) {
    return {
      deadline: "ct-danger",
      absence: "ct-gray",
      meeting: "ct-success",
      milestone: "ct-info",
    }[type] || "ct-info";
  }

  function calendarTypeFromColor(color) {
    return {
      "ct-danger": "deadline",
      "ct-gray": "absence",
      "ct-success": "meeting",
      "ct-info": "milestone",
    }[color] || "milestone";
  }

  window.opsRadarCreateCalendarEvent = async function ({ title, day, color }) {
    const created = await request("/calendar/", {
      method: "POST",
      body: JSON.stringify({
        title,
        event_date: `2026-05-${String(day).padStart(2, "0")}`,
        event_type: calendarTypeFromColor(color),
      }),
    });
    return created.event;
  };

  function normalizeCalendarEvent(e) {
    const day = Number(String(e.event_date || "").split("-")[2]);
    if (!day) return null;
    return {
      apiId: e.id,
      d: day,
      tags: [{
        apiId: e.id,
        t: e.person ? `${e.person} ${e.title}` : e.title,
        c: calendarClass(e.event_type),
      }],
    };
  }

  function mergeCalendarEvents(events) {
    const byDay = new Map();
    events.map(normalizeCalendarEvent).filter(Boolean).forEach((event) => {
      const existing = byDay.get(event.d);
      if (existing) existing.tags.push(...event.tags);
      else byDay.set(event.d, event);
    });
    G.calEvents = Array.from(byDay.values());
  }

  async function loadDashboardFromAPI() {
    const data = await request("/dashboard/summary");
    const rateEl = document.getElementById("db-todo-rate");
    const barEl = document.getElementById("db-todo-bar");
    const blockedEl = document.getElementById("db-blocked");
    const pendingEl = document.getElementById("pendingCount");
    if (rateEl) rateEl.textContent = `${data.done_todos || 0} / ${data.total_todos || 0}`;
    if (barEl) barEl.style.width = `${data.todo_completion_rate || 0}%`;
    if (blockedEl) blockedEl.textContent = `${data.blocked_count || 0}건`;
    if (pendingEl) pendingEl.textContent = data.pending_todos || 0;
  }

  async function loadTodosFromAPI() {
    const data = await request("/todos");
    replaceArray(todos, (data.todos || []).map(normalizeTodo));
    renderTodos();
    updateTodoCounts();
  }

  async function loadIssuesFromAPI() {
    const data = await request("/issues");
    replaceArray(issues, (data.issues || []).map(normalizeIssue));
    renderIssues();
  }

  async function loadCalendarFromAPI() {
    const data = await request("/calendar");
    mergeCalendarEvents(data.events || []);
    renderCalendar();
  }

  const uiApproveTodo = approveTodo;
  approveTodo = async function (id) {
    const todo = todos.find((x) => x.id === id);
    if (todo?.apiId) {
      try { await request(`/todos/${todo.apiId}`, { method: "PATCH", body: JSON.stringify({ status: uiStatusToApi("approved") }) }); }
      catch (error) { console.warn("Todo approve API failed", error); }
    }
    uiApproveTodo(id);
  };

  const uiRejectTodo = rejectTodo;
  rejectTodo = async function (id) {
    const todo = todos.find((x) => x.id === id);
    if (todo?.apiId) {
      try { await request(`/todos/${todo.apiId}`, { method: "PATCH", body: JSON.stringify({ status: uiStatusToApi("rejected") }) }); }
      catch (error) { console.warn("Todo reject API failed", error); }
    }
    uiRejectTodo(id);
  };

  const uiDoneTodo = doneTodo;
  doneTodo = async function (id) {
    const todo = todos.find((x) => x.id === id);
    if (todo?.apiId) {
      try { await request(`/todos/${todo.apiId}`, { method: "PATCH", body: JSON.stringify({ status: uiStatusToApi("done") }) }); }
      catch (error) { console.warn("Todo done API failed", error); }
    }
    uiDoneTodo(id);
  };

  const uiUndoTodo = undoTodo;
  undoTodo = async function (id) {
    const todo = todos.find((x) => x.id === id);
    if (todo?.apiId) {
      try { await request(`/todos/${todo.apiId}`, { method: "PATCH", body: JSON.stringify({ status: uiStatusToApi("pending") }) }); }
      catch (error) { console.warn("Todo undo API failed", error); }
    }
    uiUndoTodo(id);
  };

  saveManual = async function () {
    const title = document.getElementById("manualTitle").value.trim();
    if (!title) return;
    const assignee = document.getElementById("manualAssignee").value;
    const priority = document.getElementById("manualPriority").value;
    let apiId = null;
    try {
      const created = await request("/todos", {
        method: "POST",
        body: JSON.stringify({ title, assignee, priority, source: "manual", status: "pending" }),
      });
      apiId = created.todo_id;
    } catch (error) {
      console.warn("Todo create API failed", error);
    }
    todos.unshift({
      id: apiId ? uiId("todo", apiId) : Date.now(),
      apiId,
      title,
      src: null,
      srcChunk: null,
      assignee,
      priority,
      confidence: null,
      status: "pending",
      type: "manual",
      chunk: null,
      grounds: ["수동 등록"],
      risk: "",
    });
    closeModal("manualModal");
    document.getElementById("manualTitle").value = "";
    if (G.currentTodoTab !== "ai") switchTodoTab("ai");
    else renderTodos();
    updateTodoCounts();
    showToast("Todo가 등록되었습니다.", "success");
  };

  const uiResolveIssue = resolveIssue;
  resolveIssue = async function (id) {
    const issue = issues.find((x) => x.id === id);
    if (issue?.apiId) {
      try { await request(`/issues/${issue.apiId}/resolve`, { method: "PATCH" }); }
      catch (error) { console.warn("Issue resolve API failed", error); }
    }
    uiResolveIssue(id);
  };

  const uiDoConfirmIssue = doConfirmIssue;
  doConfirmIssue = async function () {
    const issue = issues.find((x) => x.id === G.confirmIssueId);
    if (issue?.apiId) {
      try { await request(`/issues/${issue.apiId}`, { method: "PATCH", body: JSON.stringify({ status: "open", approval_status: "approved" }) }); }
      catch (error) { console.warn("Issue confirm API failed", error); }
    }
    uiDoConfirmIssue();
  };

  confirmTodoCreate = async function () {
    const title = document.getElementById("tcTitle").value.trim();
    if (!title) return;
    const assignee = document.getElementById("tcAssignee").value;
    const priority = document.getElementById("tcPriority").value;
    const due = document.getElementById("tcDue").value;
    const sourceIssue = issues.find((x) => x.id === G.createIssueId);
    closeModal("todoCreateModal");
    showTransition("이슈 기반 대응 Todo를 생성하고 있습니다");
    let apiId = null;
    try {
      const created = await request("/todos", {
        method: "POST",
        body: JSON.stringify({ title, assignee, priority, source: "manual", status: "pending" }),
      });
      apiId = created.todo_id;
    } catch (error) {
      console.warn("Issue todo create API failed", error);
    }
    setTimeout(() => {
      hideTransition();
      G.createdTodosFromIssue.push({ id: Date.now(), issueId: G.createIssueId, title, assignee, priority, dueDate: due, status: "pending" });
      todos.unshift({
        id: apiId ? uiId("todo", apiId) : Date.now() + 1,
        apiId,
        title,
        src: sourceIssue ? `이슈 #${G.createIssueId}` : null,
        srcChunk: "이슈 연결",
        assignee,
        priority,
        confidence: null,
        status: "pending",
        type: "ai",
        chunk: null,
        grounds: ["이슈 기반 생성"],
        risk: "",
      });
      document.getElementById("todoFromIssueBanner").style.display = "inline-flex";
      document.getElementById("todoBadge").style.display = "inline-block";
      renderIssues();
      if (G.selectedIssueId === G.createIssueId) renderIssueDetail(G.createIssueId);
      nav("todo");
      showToast(`"${title.slice(0, 20)}..." Todo가 생성되었습니다.`, "success");
      addNotif(`이슈 기반 대응 Todo "${title.slice(0, 20)}..."가 생성되었습니다.`, "success");
      showCtxBanner("todo", `이슈 #${G.createIssueId}에서 생성된 Todo가 최상단에 추가되었습니다.`);
      updateTodoCounts();
    }, 500);
  };

  const uiDeleteCalTag = deleteCalTag;
  deleteCalTag = async function (day, index) {
    const tag = G.calEvents.find((x) => x.d === day)?.tags[index];
    if (tag?.apiId) {
      try { await request(`/calendar/${tag.apiId}`, { method: "DELETE" }); }
      catch (error) { console.warn("Calendar delete API failed", error); }
    }
    uiDeleteCalTag(day, index);
  };

  window.addEventListener("load", () => {
    Promise.allSettled([
      loadDashboardFromAPI(),
      loadTodosFromAPI(),
      loadIssuesFromAPI(),
      loadCalendarFromAPI(),
    ]).then((results) => {
      const rejected = results.filter((r) => r.status === "rejected");
      if (rejected.length) console.warn("Some OpsRadar API loads failed", rejected);
    });
  });
})();
