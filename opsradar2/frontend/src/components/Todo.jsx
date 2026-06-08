import { useEffect, useMemo, useState } from "react";

const emptySnapshot = {
  currentTab: "ai",
  viewMode: "table",
  todos: [],
  selectedTodo: null,
  counts: { ai: 0, inprogress: 0, done: 0 },
  allChecked: false,
  reviewFilter: null,
};

function callLegacy(name, ...args) {
  window[name]?.(...args);
}

function priorityBadge(priority) {
  const map = {
    high: ["b-danger", "높음"],
    medium: ["b-warn", "중간"],
    low: ["b-gray", "낮음"],
  };
  const [className, label] = map[priority] || ["b-gray", "미지정"];
  return <span className={`badge ${className}`}>{label}</span>;
}

function statusBadge(status) {
  const map = {
    pending: ["b-warn", "검토 대기"],
    approved: ["b-accent", "승인됨"],
    done: ["b-success", "공식 반영"],
    rejected: ["b-gray", "제외됨"],
  };
  const [className, label] = map[status] || ["b-gray", status || "미지정"];
  return <span className={`badge ${className}`}>{label}</span>;
}

function confidenceColor(confidence) {
  if (confidence === null || confidence === undefined) return "var(--text3)";
  if (confidence >= 85) return "var(--success)";
  if (confidence >= 70) return "var(--warn)";
  return "var(--danger)";
}

function ReviewBadges({ review }) {
  if (!review) return null;
  const badges = [
    review.needsRevision || review.approvalStatus === "needs_revision" ? ["b-warn", "보완 필요"] : null,
    review.approvalStatus === "pending" ? ["b-warn", "검토 대기"] : null,
    review.approvalStatus === "approved" ? ["b-success", "승인됨"] : null,
    review.hasEvidence ? ["b-success", "근거 있음"] : ["b-danger", "근거 부족"],
    review.missingAssignee ? ["b-warn", "담당자 확인 필요"] : ["b-success", "담당자 확인"],
    review.missingDueDate ? ["b-warn", "마감일 없음"] : ["b-success", "마감일 있음"],
  ].filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {badges.map(([className, label]) => (
        <span className={`badge ${className}`} key={label}>{label}</span>
      ))}
    </div>
  );
}

const reviewFilterLabels = {
  pending_review: "검토 대기",
  missing_evidence: "근거 부족",
  missing_assignee: "담당자 누락",
  missing_due_date: "마감일 누락",
};

function ActionButtons({ todo }) {
  if (todo.status === "pending") {
    return (
      <div className="action-btns" onClick={(event) => event.stopPropagation()}>
        <button className="ab ab-approve" type="button" onClick={() => callLegacy("approveTodo", todo.id)}>
          승인
        </button>
        <button className="ab ab-reject" type="button" onClick={() => callLegacy("markTodoNeedsRevision", todo.id)}>
          보완 필요
        </button>
        <button className="ab ab-edit" type="button" onClick={() => callLegacy("openEditModal", todo.id)}>
          수정
        </button>
      </div>
    );
  }

  if (todo.status === "approved") {
    return (
      <div className="action-btns" onClick={(event) => event.stopPropagation()}>
        <button
          className="ab ab-approve"
          type="button"
          style={{ background: "var(--success)", borderColor: "var(--success)" }}
          onClick={() => callLegacy("doneTodo", todo.id)}
        >
          공식 반영
        </button>
        <button className="ab ab-undo" type="button" onClick={() => callLegacy("undoTodo", todo.id)}>
          되돌리기
        </button>
      </div>
    );
  }

  if (todo.status === "rejected") {
    return (
      <div className="action-btns" onClick={(event) => event.stopPropagation()}>
        <button className="ab ab-undo" type="button" onClick={() => callLegacy("undoTodo", todo.id)}>
          ↩ 되돌리기
        </button>
      </div>
    );
  }

  return null;
}

function TodoTable({ allChecked, todos }) {
  return (
    <table className="todo-table">
      <thead>
        <tr>
          <th style={{ width: 28 }}>
              <input
                type="checkbox"
                id="chkAll"
                checked={allChecked}
                onChange={(event) => callLegacy("toggleAllChk", event.currentTarget)}
                style={{ accentColor: "var(--accent)" }}
              />
          </th>
          <th>Todo</th>
          <th style={{ width: 100 }}>근거</th>
          <th style={{ width: 52, textAlign: "center" }}>우선순위</th>
          <th style={{ width: 48, textAlign: "center" }}>신뢰도</th>
          <th style={{ width: 72, textAlign: "center" }}>상태</th>
          <th style={{ width: 130 }}>액션</th>
        </tr>
      </thead>
      <tbody id="todoBody">
        {todos.map((todo) => (
          <tr
            className={`todo-tr ${todo.selected ? "selected" : ""} ${todo.status}`}
            key={todo.id}
            onClick={() => callLegacy("selectTodo", todo.id)}
          >
            <td className="todo-check-cell">
              <input
                type="checkbox"
                className="row-chk"
                id={`chk-${todo.id}`}
                checked={Boolean(todo.checked)}
                onChange={(event) => {
                  event.stopPropagation();
                  callLegacy("setTodoChecked", todo.id, event.currentTarget.checked);
                }}
                onClick={(event) => event.stopPropagation()}
                style={{ accentColor: "var(--accent)", cursor: "pointer" }}
              />
            </td>
            <td className="todo-main-cell">
              <div className={`todo-title ${todo.status === "rejected" ? "done-text" : ""} text-content`}>
                {todo.title}
              </div>
              <div className="todo-src text-content">{todo.sourceLabel}</div>
            </td>
            <td className="todo-source-cell text-content">{todo.shortSource}</td>
            <td className="todo-center-cell">{priorityBadge(todo.priority)}</td>
            <td className="todo-center-cell">
              <span className="todo-confidence" style={{ color: confidenceColor(todo.confidence) }}>
                {todo.confidence === null || todo.confidence === undefined ? "—" : `${todo.confidence}%`}
              </span>
            </td>
            <td className="todo-center-cell">{statusBadge(todo.status)}</td>
            <td className="todo-action-cell">
              <ActionButtons todo={todo} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyTodoGuide() {
  return (
    <div id="todoEmpty" style={{ flex: 1 }}>
      <div className="onboarding-guide">
        <i
          className="ti ti-checkbox"
          style={{
            fontSize: 36,
            color: "var(--text3)",
            display: "block",
            marginBottom: 12,
          }}
        />
        <h3>아직 Todo가 없습니다</h3>
        <p>
          운영 로그 파일을 업로드하면 AI가 자동으로 Todo를 추출합니다.
          <br />
          수동으로 직접 등록할 수도 있습니다.
        </p>
        <div className="og-steps">
          <div className="og-step">
            <div className="og-num">1</div>운영 로그 분석 화면에서 파일 업로드
          </div>
          <div className="og-step">
            <div className="og-num">2</div>AI 분석 완료 후 Todo 자동 추출
          </div>
          <div className="og-step">
            <div className="og-num">3</div>여기서 근거 확인 후 승인 또는 보완 필요 표시
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button className="tbtn primary" type="button" onClick={() => callLegacy("nav", "analysis")}>
            <i className="ti ti-file-analysis" /> 파일 업로드하러 가기
          </button>
          <button className="tbtn" type="button" onClick={() => callLegacy("openManualModal")}>
            <i className="ti ti-plus" /> 수동 등록
          </button>
        </div>
      </div>
    </div>
  );
}

function TodoCards({ todos }) {
  if (!todos.length) {
    return (
      <div
        style={{
          gridColumn: "1/-1",
          padding: 32,
          textAlign: "center",
          color: "var(--text3)",
          fontSize: 12,
        }}
      >
        <i className="ti ti-checkbox" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
        이 탭에 항목이 없습니다.
      </div>
    );
  }

  return todos.map((todo) => (
    <div
      className={`todo-card ${todo.selected ? "selected" : ""}`}
      key={todo.id}
      onClick={() => callLegacy("selectTodo", todo.id)}
    >
      <div className="todo-card-meta">
        {priorityBadge(todo.priority)}
        {statusBadge(todo.status)}
        {todo.confidence !== null && todo.confidence !== undefined ? (
          <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: confidenceColor(todo.confidence) }}>
            {todo.confidence}%
          </span>
        ) : null}
      </div>
      <div className="todo-card-title">{todo.title}</div>
      {todo.sourceLabel ? <div className="todo-card-src">{todo.sourceLabel}</div> : null}
      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 8 }}>
        {todo.assignee || "담당자 미지정"}
      </div>
      <div className="todo-card-actions" onClick={(event) => event.stopPropagation()}>
        <ActionButtons todo={todo} />
      </div>
    </div>
  ));
}

function TodoDetail({ todo }) {
  if (!todo) {
    return (
      <div className="detail-empty" id="todoDetailEmpty">
        <i className="ti ti-hand-click" />
        <span>
          Todo를 클릭하면
          <br />
          상세 내용이 표시됩니다
        </span>
      </div>
    );
  }

  const grounds = todo.grounds?.length ? todo.grounds : ["등록된 분석 근거가 없습니다."];
  const evidence = todo.evidence || {};
  const review = todo.review || {};

  return (
    <div id="todoDetailContent" style={{ display: "flex", flex: 1, flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: 14, flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", marginBottom: 12, lineHeight: 1.5 }}>
          {todo.title}
        </div>
        <div className="detail-grid">
          <div className="detail-cell">
            <div className="detail-label">우선순위</div>
            {priorityBadge(todo.priority)}
          </div>
          <div className="detail-cell">
            <div className="detail-label">신뢰도</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: confidenceColor(todo.confidence), fontFamily: "var(--mono)" }}>
              {todo.confidence === null || todo.confidence === undefined ? "—" : `${todo.confidence}%`}
            </div>
          </div>
          <div className="detail-cell">
            <div className="detail-label">상태</div>
            {statusBadge(todo.status)}
          </div>
          <div className="detail-cell">
            <div className="detail-label">담당자</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text)" }}>
              {todo.assignee || "미지정"}
            </div>
          </div>
        </div>
        <div className="detail-section">검토 상태</div>
        <ReviewBadges review={review} />
        <div className="detail-section">근거 패널</div>
        <div className="chunk-box">
          <div className="chunk-meta">
            <i className="ti ti-file-text" style={{ fontSize: 11, color: "var(--accent)" }} />
            {evidence.fileName || todo.src || "출처 문서 없음"} {evidence.chunkId ? `· ${evidence.chunkId}` : ""}
          </div>
          {evidence.snippet || todo.chunk || "연결된 근거 문장이 없습니다. 보완 필요로 표시하세요."}
        </div>
        <div className="detail-section">AI 분석 근거</div>
        {grounds.map((ground) => (
          <div className="detail-item" key={ground}>
            <i className="ti ti-point" />
            {ground}
          </div>
        ))}
        {todo.risk ? (
          <>
            <div className="detail-section">왜 위험한가</div>
            <div className="risk-box">{todo.risk}</div>
          </>
        ) : null}
      </div>
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 5 }}>
        <ActionButtons todo={todo} />
      </div>
    </div>
  );
}

export default function Todo() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);

  useEffect(() => {
    function applySnapshot(nextSnapshot) {
      setSnapshot({ ...emptySnapshot, ...nextSnapshot });
    }

    function handleTodoState(event) {
      applySnapshot(event.detail);
    }

    window.addEventListener("opsradar:todo-state-updated", handleTodoState);
    const timer = window.setTimeout(() => callLegacy("renderTodos"), 0);

    return () => {
      window.removeEventListener("opsradar:todo-state-updated", handleTodoState);
      window.clearTimeout(timer);
    };
  }, []);

  const counts = snapshot.counts || emptySnapshot.counts;
  const todos = snapshot.todos || [];
  const currentTab = snapshot.currentTab || "ai";
  const viewMode = snapshot.viewMode || "table";
  const reviewFilter = snapshot.reviewFilter;
  const tabs = useMemo(
    () => [
      { id: "ai", label: "AI 제안", count: counts.ai, badge: counts.ai > 0 ? "b-warn" : "b-gray" },
      { id: "inprogress", label: "승인됨", count: counts.inprogress, badge: "b-gray" },
      { id: "done", label: "공식 반영", count: counts.done, badge: "b-gray" },
    ],
    [counts.ai, counts.done, counts.inprogress],
  );

  return (
    <>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="topbar-title">Todo 관리</div>
          <span
            id="todoFromIssueBanner"
            style={{
              display: "none",
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 10,
              background: "var(--success-soft)",
              color: "var(--success)",
              border: "1px solid rgba(26,158,106,.2)",
            }}
          >
            이슈에서 생성된 Todo 있음
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="view-toggle">
            <button
              className={`vt-btn${viewMode === "table" ? " active" : ""}`}
              id="vt-table"
              type="button"
              onClick={() => callLegacy("switchTodoView", "table")}
              title="테이블 뷰"
            >
              <i className="ti ti-table" style={{ fontSize: 13 }} />
            </button>
            <button
              className={`vt-btn${viewMode === "card" ? " active" : ""}`}
              id="vt-card"
              type="button"
              onClick={() => callLegacy("switchTodoView", "card")}
              title="카드 뷰"
            >
              <i className="ti ti-layout-grid" style={{ fontSize: 13 }} />
            </button>
          </div>
          <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5, color: "var(--text2)" }}>
            승인 대기{" "}
            <span style={{ fontWeight: 600, color: "var(--warn)", fontFamily: "var(--mono)" }} id="pendingCount">
              {counts.ai}
            </span>
            건
          </div>
          <button className="tbtn" type="button" onClick={() => callLegacy("bulkApprove")}>
            <i className="ti ti-checks" /> 선택 승인
          </button>
          <button className="tbtn primary" type="button" onClick={() => callLegacy("openManualModal")}>
            <i className="ti ti-plus" /> 수동 등록
          </button>
        </div>
      </div>

      <div className="ctx-banner" id="todoctxBanner">
        <i className="ti ti-link" />
        <span id="todoctxText">이슈에서 연결된 Todo가 최상단에 표시됩니다.</span>
        <button
          className="tbtn"
          type="button"
          onClick={() => callLegacy("nav", "issues")}
          style={{ marginLeft: "auto", fontSize: 10, padding: "3px 8px", color: "var(--accent)", borderColor: "var(--accent)" }}
        >
          ← 이슈 로그로
        </button>
      </div>

      <div className="tabs" id="todoTabs">
        {tabs.map((tab) => (
          <button
            className={`tab${currentTab === tab.id ? " active" : ""}`}
            key={tab.id}
            type="button"
            onClick={() => callLegacy("switchTodoTab", tab.id)}
          >
            {tab.label} <span className={`badge ${tab.badge}`} id={`t-${tab.id === "ai" ? "ai" : tab.id === "inprogress" ? "in" : "done"}-cnt`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {reviewFilter ? (
        <div
          style={{
            background: "var(--warning-soft)",
            borderBottom: "1px solid rgba(245,158,11,.18)",
            padding: "8px 16px",
            fontSize: 11,
            color: "var(--warn)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <i className="ti ti-filter" style={{ fontSize: 13 }} />
          <span>{reviewFilterLabels[reviewFilter] || "검토"} 항목만 보고 있습니다.</span>
          <button className="tbtn" type="button" onClick={() => callLegacy("clearTodoReviewFilter")} style={{ marginLeft: "auto", fontSize: 10, padding: "3px 8px" }}>
            필터 해제
          </button>
        </div>
      ) : null}

      {currentTab === "ai" ? (
        <div
          style={{
            background: "var(--accent-soft)",
            borderBottom: "1px solid rgba(66,99,235,.12)",
            padding: "8px 16px",
            fontSize: 11,
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
          id="todoAINotice"
        >
          <i className="ti ti-sparkles" style={{ fontSize: 13 }} /> AI가 추출한 Todo 제안입니다. 근거를 확인한 뒤 승인하거나 보완 필요로 표시하세요.
        </div>
      ) : null}

      <div className="body-wrap">
        <div
          id="todoTableView"
          style={{
            flex: 1,
            overflowY: "auto",
            display: viewMode === "table" ? "flex" : "none",
            flexDirection: "column",
          }}
        >
          {todos.length ? <TodoTable allChecked={Boolean(snapshot.allChecked)} todos={todos} /> : <EmptyTodoGuide />}
        </div>

        <div id="todoCardView" style={{ display: viewMode === "card" ? "block" : "none", flex: 1, overflowY: "auto" }}>
          <div className="todo-card-grid" id="todoCardGrid">
            <TodoCards todos={todos} />
          </div>
        </div>

        <div className="detail-panel">
          <TodoDetail todo={snapshot.selectedTodo} />
        </div>
      </div>
    </>
  );
}
