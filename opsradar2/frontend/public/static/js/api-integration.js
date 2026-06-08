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
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.status === 204 ? null : res.json();
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

  function compactSnippet(value, limit = 260) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
  }

  function normalizeReview(payload = {}) {
    return {
      approvalStatus: payload.approval_status || "approved",
      needsRevision: payload.approval_status === "needs_revision",
      hasEvidence: Boolean(payload.has_evidence),
      missingEvidence: Boolean(payload.missing_evidence),
      missingAssignee: Boolean(payload.missing_assignee),
      missingDueDate: Boolean(payload.missing_due_date),
    };
  }

  function normalizeEvidence(payload = {}) {
    return {
      documentId: payload.document_id || null,
      fileName: payload.file_name || null,
      chunkId: payload.chunk_id || null,
      section: payload.section || null,
      snippet: compactSnippet(payload.snippet || ""),
    };
  }

  function normalizeTodo(todo) {
    const evidence = normalizeEvidence(todo.evidence || {});
    const review = normalizeReview(todo.review || {});
    const sourceLabel = evidence.fileName || todo.source_file_name || todo.document_id || null;
    return {
      id: uiId("todo", todo.id),
      apiId: todo.id,
      title: todo.title || "Untitled",
      src: sourceLabel,
      srcChunk: evidence.chunkId || todo.source_chunk_id || null,
      assignee: todo.assignee || null,
      priority: todo.priority || "medium",
      confidence: todo.confidence == null ? null : Number(todo.confidence),
      status: todo.approval_status === "rejected" ? "rejected" : apiStatusToUi(todo.status),
      type: todo.source || "manual",
      chunk: evidence.snippet || null,
      grounds: [
        review.hasEvidence ? "출처 문서와 근거 chunk가 연결되었습니다." : "근거 chunk 연결이 필요합니다.",
        review.missingAssignee ? "담당자 확인이 필요합니다." : "담당자 정보가 확인되었습니다.",
        review.missingDueDate ? "마감일이 아직 없습니다." : "마감일 정보가 있습니다.",
      ],
      risk: "",
      evidence,
      review,
    };
  }

  function normalizeIssue(issue) {
    const status = issue.status || "open";
    const source = issue.source || "manual";
    const evidence = normalizeEvidence(issue.evidence || {});
    const review = normalizeReview(issue.review || {});
    const sourceLabel = evidence.fileName || issue.source_file_name || issue.document_id || null;
    const approvalStatus = review.approvalStatus;
    const type =
      status === "resolved"
        ? "resolved"
        : approvalStatus === "approved"
          ? "confirmed"
          : approvalStatus === "pending" || approvalStatus === "needs_revision"
            ? "candidate"
            : source === "ai"
              ? "candidate"
              : "confirmed";
    return {
      id: uiId("issue", issue.id),
      apiId: issue.id,
      type,
      severity: issue.risk_level || issue.severity || "medium",
      status,
      confidence: issue.confidence == null ? null : Number(issue.confidence),
      title: issue.title || "Untitled issue",
      src: sourceLabel,
      srcChunk: evidence.chunkId || issue.source_chunk_id || null,
      assignee: issue.assignee || null,
      days: 0,
      desc: issue.description || issue.title || "",
      chunk: evidence.snippet || "",
      history: [],
      domino: [
        review.hasEvidence ? "출처 문서와 근거 chunk가 연결되었습니다." : "근거 chunk 연결이 필요합니다.",
        review.missingAssignee ? "담당자 확인이 필요합니다." : "담당자 정보가 확인되었습니다.",
        review.missingDueDate ? "마감일이 아직 없습니다." : "마감일 정보가 있습니다.",
      ],
      dominoFinal: issue.domino_impact || "",
      suggestTodo: issue.title ? `${issue.title} follow-up` : null,
      suggestAssignee: issue.assignee || null,
      suggestPriority: (issue.risk_level || issue.severity) === "high" ? "high" : "medium",
      evidence,
      review,
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
    const byDay = new Map();
    events.map(normalizeCalendarEvent).filter(Boolean).forEach((event) => {
      const key = `${event.y}-${event.m}-${event.d}`;
      const existing = byDay.get(key);
      if (existing) existing.tags.push(...event.tags);
      else byDay.set(key, event);
    });
    window.replaceCalendarRuntimeEvents?.(Array.from(byDay.values()));
  }

  function normalizeReport(report) {
    const type = report.period === "monthly" ? "monthly" : "weekly";
    return {
      id: report.id,
      apiId: report.id,
      type,
      title: type === "monthly" ? "월간 운영 보고서" : "주간 운영 보고서",
      period: `${report.start_date || report.week_start || "-"} ~ ${report.end_date || report.week_end || "-"}`,
      createdAt: report.created_at,
      author: "OpsRadar",
      status: "draft",
      issues: 0,
      doneTodos: 0,
      pendingTodos: 0,
      sections: {
        completed: [report.content || "저장된 보고서 본문이 없습니다."],
        inProgress: [],
        technical: [],
        risk: [],
        retrospective: [],
        nextPlan: [],
      },
      docs: ["DB 저장 보고서"],
      html: report.content || "",
    };
  }

  async function loadDashboardFromAPI() {
    const data = await request("/dashboard/summary");
    const rateEl = document.getElementById("db-todo-rate");
    const barEl = document.getElementById("db-todo-bar");
    const blockedEl = document.getElementById("db-blocked");
    const pendingEl = document.getElementById("pendingCount");
    const dashboardPendingEl = document.getElementById("db-pending");
    const pendingReviewEl = document.getElementById("db-pending-review");
    const highRiskEl = document.getElementById("db-high-risk");
    const missingEvidenceEl = document.getElementById("db-missing-evidence");
    const missingOwnerEl = document.getElementById("db-missing-owner");
    const missingDueEl = document.getElementById("db-missing-due");
    if (rateEl) rateEl.textContent = `${data.done_todos || 0} / ${data.total_todos || 0}`;
    if (barEl) barEl.style.width = `${data.todo_completion_rate || 0}%`;
    if (blockedEl) blockedEl.textContent = `${data.blocked_count || 0} items`;
    if (pendingEl) pendingEl.textContent = data.pending_todos || 0;
    if (dashboardPendingEl) dashboardPendingEl.textContent = data.pending_review_count || 0;
    if (pendingReviewEl) pendingReviewEl.textContent = data.pending_review_count || 0;
    if (highRiskEl) highRiskEl.textContent = data.high_risk_count || 0;
    if (missingEvidenceEl) missingEvidenceEl.textContent = data.missing_evidence_count || 0;
    if (missingOwnerEl) missingOwnerEl.textContent = data.missing_assignee_count || 0;
    if (missingDueEl) missingDueEl.textContent = data.missing_due_date_count || 0;
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

  async function loadReportsFromAPI() {
    if (typeof persistReports !== "function") return;
    const [data, reviewCheck] = await Promise.all([
      request("/reports"),
      request("/reports/review-check").catch(() => null),
    ]);
    const reports = (data.reports || []).map(normalizeReport);
    persistReports(reports);
    window.setReportRuntimeReports?.(reports);
    if (reviewCheck) window.setReportReviewCheck?.(reviewCheck);
    if (typeof renderReportList === "function") renderReportList();
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
    loadTodos: loadTodosFromAPI,
    loadIssues: loadIssuesFromAPI,
    loadCalendar: loadCalendarFromAPI,
    loadReports: loadReportsFromAPI,
    reload: () => Promise.allSettled([
      loadDashboardFromAPI(),
      loadTodosFromAPI(),
      loadIssuesFromAPI(),
      loadCalendarFromAPI(),
      loadReportsFromAPI(),
    ]),
  };

  window.openOpsReviewQueue = function (queue) {
    if (queue === "high_risk") {
      window.setIssueReviewFilter?.("high_risk");
      window.nav?.("issues");
      showToast?.("High Risk 이슈 큐로 이동했습니다.", "info");
      return;
    }
    window.setTodoReviewFilter?.(queue);
    window.nav?.("todo");
    showToast?.("검토 작업 큐로 이동했습니다.", "info");
  };

  window.OpsRadarFrontend?.registerModule('api-integration', {
    file: 'js/api-integration.js',
    owns: [
      'backend base URL',
      'API request helper',
      'API payload normalization',
      'frontend action patches that persist to the backend',
    ],
  });

  function patchTodoActions() {
    if (typeof approveTodo === "function") {
      const original = approveTodo;
      window.approveTodo = approveTodo = async function (id) {
        const todo = typeof todos === "undefined" ? null : todos.find((x) => x.id === id);
        if (todo?.apiId) {
          try {
            await request(`/todos/${todo.apiId}`, {
              method: "PATCH",
              body: JSON.stringify({ status: uiStatusToApi("approved"), approval_status: "approved" }),
            });
          } catch (error) {
            console.warn("Todo approve API failed", error);
            showToast("Todo 저장에 실패했습니다.", "warn");
            return;
          }
        }
        original(id);
        await window.opsRadarApi?.reload?.();
      };
    }

    if (typeof rejectTodo === "function") {
      const original = rejectTodo;
      window.rejectTodo = rejectTodo = async function (id) {
        const todo = typeof todos === "undefined" ? null : todos.find((x) => x.id === id);
        if (todo?.apiId) {
          try {
            await request(`/todos/${todo.apiId}`, {
              method: "PATCH",
              body: JSON.stringify({ approval_status: "rejected" }),
            });
          } catch (error) {
            console.warn("Todo reject API failed", error);
            showToast("Todo 저장에 실패했습니다.", "warn");
            return;
          }
        }
        original(id);
        await window.opsRadarApi?.reload?.();
      };
    }

    if (typeof doneTodo === "function") {
      const original = doneTodo;
      window.doneTodo = doneTodo = async function (id) {
        const todo = typeof todos === "undefined" ? null : todos.find((x) => x.id === id);
        if (todo?.apiId) {
          try {
            await request(`/todos/${todo.apiId}`, {
              method: "PATCH",
              body: JSON.stringify({ status: uiStatusToApi("done") }),
            });
          } catch (error) {
            console.warn("Todo done API failed", error);
            showToast("Todo 저장에 실패했습니다.", "warn");
            return;
          }
        }
        original(id);
        await window.opsRadarApi?.reload?.();
      };
    }

    window.markTodoNeedsRevision = async function (id) {
      const todo = typeof todos === "undefined" ? null : todos.find((x) => x.id === id);
      if (!todo) return;
      if (todo.apiId) {
        try {
          await request(`/todos/${todo.apiId}`, {
            method: "PATCH",
            body: JSON.stringify({ approval_status: "needs_revision" }),
          });
        } catch (error) {
          console.warn("Todo needs-revision API failed", error);
          showToast("Todo 보완 필요 저장에 실패했습니다.", "warn");
          return;
        }
      }
      todo.review = { ...(todo.review || {}), approvalStatus: "needs_revision", needsRevision: true };
      showToast("보완 필요로 표시했습니다.", "warn");
      await window.opsRadarApi?.reload?.();
    };
  }

  function patchIssueActions() {
    window.markIssueNeedsRevision = async function (id) {
      const issue = typeof issues === "undefined" ? null : issues.find((x) => x.id === id);
      if (!issue) return;
      if (issue.apiId) {
        try {
          await request(`/issues/${issue.apiId}`, {
            method: "PATCH",
            body: JSON.stringify({ approval_status: "needs_revision" }),
          });
        } catch (error) {
          console.warn("Issue needs-revision API failed", error);
          showToast("Issue 보완 필요 저장에 실패했습니다.", "warn");
          return;
        }
      }
      issue.review = { ...(issue.review || {}), approvalStatus: "needs_revision", needsRevision: true };
      issue.type = "candidate";
      showToast("보완 필요로 표시했습니다.", "warn");
      await window.opsRadarApi?.reload?.();
    };
  }

  function patchCreateActions() {
    if (typeof saveManual === "function") {
      const original = saveManual;
      window.saveManual = saveManual = async function () {
        const title = document.getElementById("manualTitle")?.value?.trim();
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
          original();
          await loadTodosFromAPI();
        } catch (error) {
          console.warn("Todo create API failed", error);
          showToast("Todo 등록에 실패했습니다.", "warn");
        }
      };
    }
  }

  function patchCalendarActions() {
    if (typeof deleteCalTag === "function") {
      const original = deleteCalTag;
      window.deleteCalTag = deleteCalTag = async function (day, index) {
        const tag = window.getCalendarRuntimeState?.().calEvents?.find((x) => x.d === day)?.tags[index];
        if (tag?.apiId) {
          try {
            await request(`/calendar/${tag.apiId}`, { method: "DELETE" });
          } catch (error) {
            console.warn("Calendar delete API failed", error);
            showToast("캘린더 삭제에 실패했습니다.", "warn");
            return;
          }
        }
        original(day, index);
      };
    }
  }

  function patchReportActions() {
    if (typeof saveReport !== "function") return;
    const original = saveReport;

    function getReportReviewWarnings() {
      const reviewCheck = window.getReportSnapshot?.().reviewCheck || {};
      const warnings = [
        ["근거 부족", Number(reviewCheck.missing_evidence || 0)],
        ["담당자 누락", Number(reviewCheck.missing_assignee || 0)],
        ["마감일 누락", Number(reviewCheck.missing_due_date || 0)],
        ["상충 가능 기록", Number(reviewCheck.possible_conflicts || 0)],
      ].filter(([, count]) => count > 0);
      return warnings;
    }

    window.saveReport = saveReport = async function (report) {
      const draft = report || window.G?.currentReportDraft || {};
      const period = draft.type === "monthly" ? "monthly" : "weekly";
      const editor = document.getElementById("reportEditor") || document.querySelector('#s-reports [contenteditable="true"]');
      const content = editor?.innerHTML || draft.html || "";
      const warnings = getReportReviewWarnings();
      if (warnings.length) {
        const message = [
          "아직 보완이 필요한 운영 데이터가 있습니다.",
          "",
          ...warnings.map(([label, count]) => `- ${label}: ${count}건`),
          "",
          "그래도 보고서를 최종 저장하시겠습니까?",
        ].join("\n");
        if (!window.confirm(message)) {
          showToast("보고서 저장을 취소했습니다.", "info");
          return null;
        }
      }
      try {
        let reportId = draft.apiId;
        if (!reportId) {
          const generated = await request("/reports/generate", {
            method: "POST",
            body: JSON.stringify({ period }),
          });
          reportId = generated.report_id;
        }
        await request(`/reports/${reportId}`, {
          method: "PATCH",
          body: JSON.stringify({ content }),
        });
        const saved = original({ ...draft, id: reportId, apiId: reportId, html: content });
        await loadReportsFromAPI();
        return saved;
      } catch (error) {
        console.warn("Report save API failed", error);
        showToast("보고서 저장에 실패했습니다.", "warn");
        return null;
      }
    };
  }

  function initialize() {
    patchTodoActions();
    patchIssueActions();
    patchCreateActions();
    patchCalendarActions();
    patchReportActions();
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
