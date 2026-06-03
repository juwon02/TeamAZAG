(function () {
  const API = window.OPSRADAR_API_BASE || "/api/v1";
  const idMap = new Map();
  let nextUiId = 100000;

  function uiId(kind, apiId) {
    const key = `${kind}:${apiId}`;
    if (!idMap.has(key)) idMap.set(key, nextUiId++);
    return idMap.get(key);
  }

  async function request(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const attempts = method === "GET" ? 2 : 1;
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const res = await fetch(`${API}${path}`, {
          headers: { "Content-Type": "application/json", ...(options.headers || {}) },
          ...options,
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.status === 204 ? null : res.json();
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }

    throw lastError;
  }

  function replaceArray(target, values) {
    if (!Array.isArray(target)) return;
    target.length = 0;
    target.push(...values);
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

  function normalizeTodo(todo) {
    return {
      id: uiId("todo", todo.id),
      apiId: todo.id,
      title: todo.title || "Untitled",
      src: todo.document_id || null,
      srcChunk: todo.source_chunk_id || null,
      assignee: todo.assignee || null,
      priority: todo.priority || "medium",
      confidence: todo.confidence == null ? null : Number(todo.confidence),
      status: apiStatusToUi(todo.status),
      type: todo.source || "manual",
      chunk: null,
      grounds: [todo.source === "ai" ? "DB AI analysis result" : "DB saved Todo"],
      risk: "",
    };
  }

  function normalizeIssue(issue) {
    const status = issue.status || "open";
    const source = issue.source || "manual";
    return {
      id: uiId("issue", issue.id),
      apiId: issue.id,
      type: status === "resolved" ? "resolved" : source === "ai" ? "candidate" : "confirmed",
      severity: issue.risk_level || "medium",
      status,
      confidence: issue.confidence == null ? null : Number(issue.confidence),
      title: issue.title || "Untitled issue",
      src: issue.document_id || null,
      assignee: issue.assignee || null,
      days: 0,
      desc: issue.description || issue.title || "",
      chunk: "",
      history: [],
      domino: [],
      dominoFinal: "",
      suggestTodo: issue.title ? `${issue.title} follow-up` : null,
      suggestAssignee: issue.assignee || null,
      suggestPriority: issue.risk_level === "high" ? "high" : "medium",
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

  function normalizeCalendarEvent(event) {
    const date = String(event.event_date || "");
    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) return null;
    return {
      apiId: event.id,
      d: day,
      y: year,
      m: month - 1,
      tags: [{
        apiId: event.id,
        t: event.person ? `${event.person} ${event.title}` : event.title,
        c: calendarClass(event.event_type),
      }],
    };
  }

  function mergeCalendarEvents(events) {
    if (!window.G) return;
    const byDay = new Map();
    events.map(normalizeCalendarEvent).filter(Boolean).forEach((event) => {
      const key = `${event.y}-${event.m}-${event.d}`;
      const existing = byDay.get(key);
      if (existing) existing.tags.push(...event.tags);
      else byDay.set(key, event);
    });
    window.G.calEvents = Array.from(byDay.values());
  }

  async function loadDashboardFromAPI() {
    const data = await request("/dashboard/summary");
    const rateEl = document.getElementById("db-todo-rate");
    const barEl = document.getElementById("db-todo-bar");
    const blockedEl = document.getElementById("db-blocked");
    const pendingEl = document.getElementById("pendingCount");
    if (rateEl) rateEl.textContent = `${data.done_todos || 0} / ${data.total_todos || 0}`;
    if (barEl) barEl.style.width = `${data.todo_completion_rate || 0}%`;
    if (blockedEl) blockedEl.textContent = `${data.blocked_count || 0} items`;
    if (pendingEl) pendingEl.textContent = data.pending_todos || 0;
  }

  async function loadTodosFromAPI() {
    if (typeof todos === "undefined") return;
    const data = await request("/todos");
    replaceArray(todos, (data.todos || []).map(normalizeTodo));
    if (typeof renderTodos === "function") renderTodos();
    if (typeof updateTodoCounts === "function") updateTodoCounts();
  }

  async function loadIssuesFromAPI() {
    if (typeof issues === "undefined") return;
    const data = await request("/issues");
    replaceArray(issues, (data.issues || []).map(normalizeIssue));
    if (typeof renderIssues === "function") renderIssues();
  }

  async function loadCalendarFromAPI() {
    const data = await request("/calendar");
    mergeCalendarEvents(data.events || []);
    if (typeof renderCalendar === "function") renderCalendar();
  }

  window.opsRadarCreateCalendarEvent = async function ({ title, day, month, year, color }) {
    const target = new Date(
      year ?? window.G?.currentCalYear ?? new Date().getFullYear(),
      month ?? window.G?.currentCalMonth ?? new Date().getMonth(),
      day,
    );
    const created = await request("/calendar/", {
      method: "POST",
      body: JSON.stringify({
        title,
        event_date: [
          target.getFullYear(),
          String(target.getMonth() + 1).padStart(2, "0"),
          String(target.getDate()).padStart(2, "0"),
        ].join("-"),
        event_type: calendarTypeFromColor(color),
      }),
    });
    return created.event;
  };

  window.opsRadarApi = {
    request,
    loadCalendar: loadCalendarFromAPI,
    reload: () => Promise.allSettled([
      loadDashboardFromAPI(),
      loadTodosFromAPI(),
      loadIssuesFromAPI(),
      loadCalendarFromAPI(),
    ]),
  };

  function patchTodoActions() {
    if (typeof approveTodo === "function") {
      const original = approveTodo;
      window.approveTodo = approveTodo = async function (id) {
        const todo = typeof todos === "undefined" ? null : todos.find((x) => x.id === id);
        if (todo?.apiId) {
          try { await request(`/todos/${todo.apiId}`, { method: "PATCH", body: JSON.stringify({ status: uiStatusToApi("approved") }) }); }
          catch (error) { console.warn("Todo approve API failed", error); }
        }
        original(id);
      };
    }

    if (typeof rejectTodo === "function") {
      const original = rejectTodo;
      window.rejectTodo = rejectTodo = async function (id) {
        const todo = typeof todos === "undefined" ? null : todos.find((x) => x.id === id);
        if (todo?.apiId) {
          try { await request(`/todos/${todo.apiId}`, { method: "PATCH", body: JSON.stringify({ status: uiStatusToApi("rejected") }) }); }
          catch (error) { console.warn("Todo reject API failed", error); }
        }
        original(id);
      };
    }

    if (typeof doneTodo === "function") {
      const original = doneTodo;
      window.doneTodo = doneTodo = async function (id) {
        const todo = typeof todos === "undefined" ? null : todos.find((x) => x.id === id);
        if (todo?.apiId) {
          try { await request(`/todos/${todo.apiId}`, { method: "PATCH", body: JSON.stringify({ status: uiStatusToApi("done") }) }); }
          catch (error) { console.warn("Todo done API failed", error); }
        }
        original(id);
      };
    }
  }

  function patchCreateActions() {
    if (typeof saveManual === "function") {
      const original = saveManual;
      window.saveManual = saveManual = async function () {
        const titleEl = document.getElementById("manualTitle");
        const title = titleEl?.value?.trim();
        if (!title) return original();
        try {
          await request("/todos", {
            method: "POST",
            body: JSON.stringify({
              title,
              assignee: document.getElementById("manualAssignee")?.value || null,
              priority: document.getElementById("manualPriority")?.value || "medium",
              source: "manual",
              status: "pending",
            }),
          });
        } catch (error) {
          console.warn("Todo create API failed", error);
        }
        original();
      };
    }
  }

  // AI Assistant 연동
  function patchChatActions() {
    if (typeof sendMsg === "function") {
      const original = sendMsg;
      window.sendMsg = sendMsg = async function (text) {
        if (window.G?.chatTyping) return;
        const input = document.getElementById("chatInput");
        const msg = text || input?.value?.trim();
        if (!msg) return;
        if (input) { input.value = ""; input.style.height = "auto"; }
        appendChatMsg("user", msg);
        showTyping();

        try {
          // project_id 가져오기
          const dashboardData = await fetch("/api/v1/dashboard/summary").then(r => r.json());
          const projectId = dashboardData.project_id;

          const res = await fetch("http://127.0.0.1:8000/rag/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: msg,
              message: msg,
              project_id: projectId,
              current_todos: typeof todos !== "undefined" ? todos : [],
              current_issues: typeof issues !== "undefined" ? issues : []
            })
          });
          const data = await res.json();
          removeTyping();

          // answer가 배열이면 읽기 쉬운 형식으로, 문자열이면 그대로 처리
          let answer;
          if (Array.isArray(data.answer)) {
            answer = data.answer.map((item, idx) => {
              const lines = Object.entries(item)
                .map(([key, value]) => `  ${key}: ${value}`)
                .join("\n");
              return `[${idx + 1}]\n${lines}`;
            }).join("\n\n");
          } else {
            answer = data.answer || "답변을 가져올 수 없습니다.";
          }

          const sources = (data.sources || []).join(", ");
          appendChatMsg("ai", answer, sources || null);
        } catch (error) {
          removeTyping();
          original(text);
        }
      };
    }
  }

  // 파일 업로드 → AI 분석 실제 API 연동
  window.startAnalysis = async function () {
    const files = window.G?.uploadedFiles;
    if (!files || !files.length) {
      if (typeof showUploadError === "function") showUploadError("general");
      return;
    }
    if (typeof hideUploadError === "function") hideUploadError();

    document.getElementById("uploadSection").style.display = "none";
    document.getElementById("analysisSection").style.display = "block";
    if (document.getElementById("analysisGuide")) {
      document.getElementById("analysisGuide").style.display = "none";
    }

    const fname = files[0].name;
    document.getElementById("uploadedFname").textContent = `AI가 업무 내용을 분석하고 있습니다... · ${fname}`;

    try {
      // 1단계: 파일 업로드
      if (typeof setFlow === "function") setFlow(1, "active", "업무 항목 추출 중...", "AI 분석 진행 중...", "s-active");

      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("project_id", "30000000-0000-0000-0000-000000000001");

      const uploadRes = await fetch("http://127.0.0.1:8000/rag/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error(`업로드 실패: ${uploadRes.status}`);
      const uploadData = await uploadRes.json();
      const documentId = uploadData.document_id;

      if (typeof setFlow === "function") setFlow(1, "done", "업무 항목 추출 완료", "업무 항목 추출 완료", "s-done");

      // 2단계: 분석 상태 폴링
      if (typeof setFlow === "function") setFlow(2, "active", "위험 이슈 확인 중...", "AI 분석 진행 중...", "s-active");

      let result = null;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(`http://127.0.0.1:8000/rag/documents/${documentId}/status`);
        const statusData = await statusRes.json();

        if (statusData.status === "completed") {
          result = statusData.result;
          break;
        } else if (statusData.status === "failed") {
          throw new Error(statusData.error || "분석 실패");
        }
      }

      if (typeof setFlow === "function") setFlow(2, "done", "위험 이슈 확인 완료", "위험 이슈 확인 완료", "s-done");

      // 3단계: 결과 표시
      if (typeof setFlow === "function") setFlow(3, "active", "운영 요약 생성 중...", "AI 분석 진행 중...", "s-active");
      await new Promise((r) => setTimeout(r, 1000));
      if (typeof setFlow === "function") setFlow(3, "done", "운영 요약 생성 완료", "운영 요약 생성 완료", "s-done");

      document.getElementById("analysisBadge").textContent = "완료";
      document.getElementById("analysisBadge").className = "badge b-success";

      // 실제 결과 표시
      const todosList = result?.todos || [];
      const issuesList = result?.issues || [];

      document.getElementById("resultFname").textContent = fname;
      document.getElementById("rChunkMeta").textContent = `분석 완료 · ${result?.chunk_count || 0}개 청크`;
      document.getElementById("rChunkContent").innerHTML = result?.summary || "분석이 완료되었습니다.";
      if (document.getElementById("rSrcDoc")) document.getElementById("rSrcDoc").textContent = fname;
      if (document.getElementById("rSrcRange")) document.getElementById("rSrcRange").textContent = `${result?.chunk_count || 0}개 청크`;
      if (document.getElementById("rSrcReason")) document.getElementById("rSrcReason").textContent = result?.summary || "";

      if (typeof countUp === "function") {
        countUp("rTodo", todosList.length, 800);
        countUp("rIssue", issuesList.length, 1000);
        countUp("rBlocked", 0, 600);
      }

      document.getElementById("resultSection").style.display = "block";

      if (window.G?.analysisHistory) {
        window.G.analysisHistory.unshift({
          name: fname,
          type: "meeting",
          date: new Date().toLocaleDateString(),
          todo: todosList.length,
          issue: issuesList.length,
          blocked: 0,
        });
      }

      if (typeof showToast === "function") showToast("분석이 완료되었습니다.");

      // todos/issues 목록 갱신
      await window.opsRadarApi?.reload();

    } catch (err) {
      console.error("[startAnalysis] 오류:", err);
      document.getElementById("uploadSection").style.display = "block";
      document.getElementById("analysisSection").style.display = "none";
      if (typeof showUploadError === "function") showUploadError("general");
    }
  };

  function initialize() {
    patchTodoActions();
    patchCreateActions();
    patchChatActions();
    window.opsRadarApi.reload().then((results) => {
      const rejected = results.filter((r) => r.status === "rejected");
      if (rejected.length) console.warn("Some OpsRadar API loads failed", rejected);
    });
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();