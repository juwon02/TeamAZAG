import { useEffect, useMemo, useState } from "react";

const emptySnapshot = {
  currentTab: "confirmed",
  issues: [],
  selectedIssue: null,
  counts: { confirmed: 0, candidate: 0, resolved: 0 },
  reviewFilter: null,
};

function callLegacy(name, ...args) {
  window[name]?.(...args);
}

function severityBadge(issue) {
  if (issue.type === "candidate") {
    return (
      <>
        <span className="badge b-warn">후보</span>
        <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--warn)", fontWeight: 500 }}>
          {issue.confidence ?? 0}%
        </span>
      </>
    );
  }

  const className = issue.severity === "high" ? "b-danger" : issue.severity === "medium" ? "b-warn" : "b-gray";
  const label = issue.severity === "high" ? "High" : issue.severity === "medium" ? "Medium" : "Low";
  return <span className={`badge ${className}`}>{label}</span>;
}

function statusBadge(status) {
  if (status === "in_progress") return <span className="badge b-warn">진행 중</span>;
  if (status === "resolved") return <span className="badge b-success">해결됨</span>;
  if (status === "blocked") return <span className="badge b-danger">차단됨</span>;
  return <span className="badge b-gray">열림</span>;
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
  high_risk: "High Risk",
  pending_review: "검토 대기",
  missing_evidence: "근거 부족",
};

function EmptyIssueList() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
      <i className="ti ti-check" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
      이 탭에 항목이 없습니다.
    </div>
  );
}

function IssueCard({ issue }) {
  const isCandidate = issue.type === "candidate";

  return (
    <article
      className={`issue-card ${issue.selected ? "selected" : ""} ${isCandidate ? "candidate" : ""}`}
      onClick={() => callLegacy("selectIssue", issue.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          callLegacy("selectIssue", issue.id);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="issue-hd">
        {severityBadge(issue)}
        <div className="issue-title">{issue.title}</div>
        {statusBadge(issue.status)}
        {issue.hasTodo ? (
          <span className="badge b-success" style={{ fontSize: 9 }}>
            Todo 생성됨
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <span className="badge b-gray">{issue.src || "자동 감지"}</span>
        {issue.days > 0 ? <span className="badge b-gray">{issue.days}일째</span> : null}
        {issue.assignee ? (
          <span className="badge b-gray">담당: {issue.assignee}</span>
        ) : (
          <span className="badge b-danger" style={{ fontSize: 9 }}>
            담당자 미지정
          </span>
        )}
      </div>
      <div className="issue-desc">{issue.desc}</div>
      <div className="issue-footer">
        <div style={{ fontSize: 10, color: "var(--text3)" }}>AI 자동 탐지</div>
        <div style={{ display: "flex", gap: 5 }}>
          {isCandidate ? (
            <>
              <button
                className="tbtn primary"
                type="button"
                style={{ fontSize: 10, padding: "4px 8px", background: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={(event) => {
                  event.stopPropagation();
                  callLegacy("openConfirmIssue", issue.id);
                }}
              >
                이슈 확정
              </button>
              <button
                className="tbtn"
                type="button"
                style={{ fontSize: 10, padding: "4px 8px", color: "var(--text3)" }}
                onClick={(event) => {
                  event.stopPropagation();
                  callLegacy("markIssueNeedsRevision", issue.id);
                }}
              >
                보완 필요
              </button>
            </>
          ) : issue.type === "resolved" ? null : (
            <button
              className="tbtn"
              type="button"
              style={{ fontSize: 10, padding: "4px 8px" }}
              onClick={(event) => {
                event.stopPropagation();
                callLegacy("openTodoCreate", issue.id);
              }}
            >
              <i className="ti ti-plus" /> 대응 Todo 생성
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function IssueDetail({ issue }) {
  if (!issue) {
    return (
      <div className="detail-empty" id="issueDetailEmpty">
        <i className="ti ti-hand-click" />
        <span>
          이슈를 클릭하면
          <br />
          상세 내용이 표시됩니다
        </span>
      </div>
    );
  }

  const evidence = issue.evidence || {};
  const review = issue.review || {};

  return (
    <>
      <div id="issueDetailContent" className="fade-up" style={{ display: "block", padding: 14, overflowY: "auto", flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", marginBottom: 10, lineHeight: 1.5 }}>
          {issue.title}
        </div>
        <div className="detail-section">검토 상태</div>
        <ReviewBadges review={review} />
        <div className="detail-section">근거 패널</div>
        <div className="chunk-box">
          <div className="chunk-meta">
            <i className="ti ti-file-text" style={{ fontSize: 11, color: "var(--accent)" }} />
            {evidence.fileName || issue.src || "출처 문서 없음"} {evidence.chunkId ? `· ${evidence.chunkId}` : ""}
          </div>
          {evidence.snippet || issue.chunk || "연결된 근거 문장이 없습니다. 보완 필요로 표시하세요."}
        </div>
        {issue.domino?.length ? (
          <>
            <div className="detail-section">도미노 영향</div>
            <div className="domino">
              <div className="domino-lbl">왜 위험한가</div>
              {issue.domino.map((item) => (
                <div key={item}>→ {item}</div>
              ))}
              {issue.dominoFinal ? (
                <div className="domino-final" style={{ marginTop: 4 }}>
                  → {issue.dominoFinal}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {issue.history?.length ? (
          <>
            <div className="detail-section">상태 변화 이력</div>
            {issue.history.map((item) => (
              <div className="history-row" key={`${item.date}-${item.s}-${item.note}`}>
                <div className="history-date">{item.date}</div>
                <span className={`badge ${item.s === "Open" ? "b-gray" : item.s === "Resolved" ? "b-success" : "b-warn"}`}>
                  {item.s}
                </span>
                <div className={item.cls} style={{ flex: 1, fontSize: 10, color: item.cls ? "inherit" : "var(--text3)" }}>
                  {item.note}
                </div>
              </div>
            ))}
          </>
        ) : null}
        {issue.createdTodos?.length ? (
          <>
            <div className="detail-section">생성된 대응 Todo</div>
            {issue.createdTodos.map((todo) => (
              <div
                key={todo.id}
                style={{
                  background: "var(--success-soft)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
                  fontSize: 11,
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <i className="ti ti-checkbox" style={{ fontSize: 12 }} />
                {todo.title}
              </div>
            ))}
          </>
        ) : null}
      </div>
      {issue.type === "confirmed" && issue.status !== "resolved" ? (
        <div id="issueDetailActions" style={{ display: "flex", padding: "12px 14px", borderTop: "1px solid var(--border)", flexDirection: "column", gap: 6 }}>
          <>
            <button className="tbtn primary" type="button" onClick={() => callLegacy("openTodoCreate", issue.id)} style={{ justifyContent: "center" }}>
              <i className="ti ti-plus" /> 대응 Todo 생성
            </button>
            <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
              <button className="tbtn" type="button" style={{ flex: 1, justifyContent: "center", color: "var(--success)" }} onClick={() => callLegacy("resolveIssue", issue.id)}>
                <i className="ti ti-check" /> 해결 완료
              </button>
            </div>
          </>
        </div>
      ) : issue.type === "candidate" ? (
        <div id="issueDetailActions" style={{ display: "flex", padding: "12px 14px", borderTop: "1px solid var(--border)", flexDirection: "column", gap: 6 }}>
          <>
            <button
              className="tbtn primary"
              type="button"
              onClick={() => callLegacy("openConfirmIssue", issue.id)}
              style={{ justifyContent: "center", background: "var(--danger)", borderColor: "var(--danger)" }}
            >
              <i className="ti ti-alert-triangle" /> 이슈 확정
            </button>
            <button className="tbtn" type="button" onClick={() => callLegacy("doRemoveIssue", issue.id)} style={{ justifyContent: "center", color: "var(--text3)", marginTop: 4 }}>
              제외
            </button>
            <button className="tbtn" type="button" onClick={() => callLegacy("markIssueNeedsRevision", issue.id)} style={{ justifyContent: "center", color: "var(--warn)", marginTop: 4 }}>
              보완 필요
            </button>
          </>
        </div>
      ) : null}
    </>
  );
}

export default function Issue() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);

  useEffect(() => {
    function handleIssueState(event) {
      setSnapshot({ ...emptySnapshot, ...event.detail });
    }

    window.addEventListener("opsradar:issue-state-updated", handleIssueState);
    const timer = window.setTimeout(() => callLegacy("renderIssues"), 0);

    return () => {
      window.removeEventListener("opsradar:issue-state-updated", handleIssueState);
      window.clearTimeout(timer);
    };
  }, []);

  const counts = snapshot.counts || emptySnapshot.counts;
  const currentTab = snapshot.currentTab || "confirmed";
  const reviewFilter = snapshot.reviewFilter;
  const tabs = useMemo(
    () => [
      { id: "confirmed", label: "확정 이슈", count: counts.confirmed, badge: "b-danger" },
      { id: "candidate", label: "이슈 후보", count: counts.candidate, badge: "b-warn" },
      { id: "resolved", label: "해결됨", count: counts.resolved, badge: "b-gray" },
    ],
    [counts.candidate, counts.confirmed, counts.resolved],
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">이슈 로그</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="tbtn primary" type="button" onClick={() => callLegacy("openIssueCreateModal")}>
            <i className="ti ti-plus" /> 수동 등록
          </button>
          <div className="chip" data-current-date="short">오늘 날짜</div>
        </div>
      </div>
      <div className="ctx-banner" id="issuectxBanner">
        <i className="ti ti-circle-check" />
        <span id="issuectxText">Todo가 생성되었습니다. Todo 화면에서 확인하세요.</span>
        <button
          className="tbtn"
          type="button"
          onClick={() => callLegacy("nav", "todo")}
          style={{ marginLeft: "auto", fontSize: 10, padding: "3px 8px", color: "var(--success)", borderColor: "var(--success)" }}
        >
          Todo 확인 →
        </button>
      </div>
      <div className="tabs">
        {tabs.map((tab) => (
          <button className={`tab${currentTab === tab.id ? " active" : ""}`} type="button" key={tab.id} onClick={() => callLegacy("switchIssueTab", tab.id)}>
            {tab.label} <span className={`badge ${tab.badge}`} id={tab.id === "confirmed" ? "i-conf-cnt" : tab.id === "candidate" ? "i-cand-cnt" : undefined}>{tab.count}</span>
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
          <button className="tbtn" type="button" onClick={() => callLegacy("clearIssueReviewFilter")} style={{ marginLeft: "auto", fontSize: 10, padding: "3px 8px" }}>
            필터 해제
          </button>
        </div>
      ) : null}
      <div className="body-wrap">
        <div className="issue-list" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }} id="issueList">
          {snapshot.issues?.length ? snapshot.issues.map((issue) => <IssueCard issue={issue} key={issue.id} />) : <EmptyIssueList />}
        </div>
        <div className="detail-panel">
          <IssueDetail issue={snapshot.selectedIssue} />
        </div>
      </div>
    </>
  );
}
