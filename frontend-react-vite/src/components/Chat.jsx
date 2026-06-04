import { useEffect, useMemo, useRef, useState } from "react";

const quickPrompts = [
  "현재 가장 위험한 이슈는?",
  "이번주 미완료 Todo 알려줘",
  "담당자 A 5/26 부재",
  "담당자 A 다음주 화요일 외부 일정",
];

const emptySnapshot = {
  currentId: null,
  sessions: [],
  currentSession: null,
  messages: [],
  context: { docs: [], todoItems: [], issueItems: [] },
  typing: false,
};

function callLegacy(name, ...args) {
  window[name]?.(...args);
}

function getSnapshot() {
  return window.getChatSnapshot?.() || emptySnapshot;
}

function ContextList({ items, emptyText }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return <div className="chat-context-empty">{emptyText}</div>;

  return list.map((item) => (
    <div className="chat-context-item text-content" key={item}>
      <strong>{item}</strong>
      <span>AI 답변과 함께 확인할 운영 근거입니다.</span>
    </div>
  ));
}

function SessionItem({ session }) {
  return (
    <article
      className={`chat-session-item ${session.active ? "active" : ""}`}
      onClick={() => callLegacy("setCurrentChatSession", session.id)}
    >
      <div className="chat-session-row">
        <div className="chat-session-title text-content">{session.title || "운영 질문 기록"}</div>
        <button
          className="chat-session-delete"
          type="button"
          title="세션 삭제"
          onClick={(event) => {
            event.stopPropagation();
            callLegacy("deleteChatSession", session.id);
          }}
        >
          <i className="ti ti-trash" />
        </button>
      </div>
      <div className="chat-session-meta">{session.displayDate} · 메시지 {session.messageCount || 0}개</div>
      <div className="chat-session-last text-content">{session.lastUserMessage || "아직 질문이 없습니다."}</div>
      <div className="chat-session-badges">
        <span>{session.summarized ? "요약됨" : "원문"}</span>
        <span>{session.updatedDate} 업데이트</span>
      </div>
    </article>
  );
}

function ChatIntro({ onPrompt }) {
  return (
    <div className="msg chat-intro-msg">
      <div className="msg-av av-ai">
        <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
      </div>
      <div>
        <div className="ai-analysis-card chat-welcome-card">
          <div className="ai-card-kicker">OPS ASSISTANT</div>
          <div className="ai-card-title">운영 데이터 기반으로 질문에 답변드립니다.</div>
          <p><strong>일정 등록도 자연어로</strong> 입력하시면 캘린더에 자동 반영됩니다.</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {quickPrompts.map((prompt) => (
            <button className="sq" type="button" onClick={() => onPrompt(prompt)} key={prompt}>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypingMessage() {
  return (
    <div className="msg" id="typingIndicator">
      <div className="msg-av av-ai">
        <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
      </div>
      <div className="ai-analysis-card">
        <div className="typing"><span /><span /><span /></div>
      </div>
    </div>
  );
}

function ScheduleMessage({ message }) {
  const parsed = message.parsed || {};
  return (
    <div className="msg fade-up" data-chat-item="true">
      <div className="msg-av av-ai">
        <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
      </div>
      <div style={{ maxWidth: "min(760px, 100%)" }}>
        <div className="ai-analysis-card">
          <div className="ai-card-kicker">SCHEDULE ANALYSIS</div>
          <div className="ai-card-title">일정 정보를 운영 캘린더 항목으로 분석했습니다.</div>
          <p>아래 내용으로 캘린더에 등록할 수 있습니다.</p>
        </div>
        <div className="confirm-card">
          <div className="confirm-row"><div className="confirm-lbl">대상</div><div className="confirm-val">{parsed.person || "미확정"}</div></div>
          <div className="confirm-row"><div className="confirm-lbl">날짜</div><div className="confirm-val">{parsed.date || "날짜 미확정"}</div></div>
          <div className="confirm-row"><div className="confirm-lbl">유형</div><div className="confirm-val">{parsed.type || "부재"}</div></div>
          <div className="confirm-row"><div className="confirm-lbl">영향</div><div className="confirm-val" style={{ color: "var(--warn)" }}>{parsed.impact || "업무 영향 확인 필요"}</div></div>
          <div className="confirm-actions">
            <button
              className="tbtn primary"
              type="button"
              onClick={() => callLegacy("doRegisterCalEvent", null, parsed.person, parsed.date, parsed.type, parsed.impact, message.calDate || null)}
            >
              <i className="ti ti-calendar-plus" /> 캘린더 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  if (message.kind === "schedule") return <ScheduleMessage message={message} />;

  if (message.role === "user") {
    return (
      <div className="msg user fade-up" data-chat-item="true">
        <div className="msg-av av-user">
          <i className="ti ti-user" style={{ fontSize: 13 }} />
        </div>
        <div className="bubble bubble-user text-content">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="msg fade-up" data-chat-item="true">
      <div className="msg-av av-ai">
        <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
      </div>
      <div>
        <div className="ai-analysis-card">
          <div className="ai-card-kicker">AI OPERATION ANALYSIS</div>
          <div className="ai-card-title">운영 데이터 기반 분석 결과</div>
          <p className="text-content">{message.content}</p>
          {message.src ? (
            <div className="ai-card-source">
              <i className="ti ti-file-text" style={{ fontSize: 11 }} /> 출처: {message.src}
            </div>
          ) : null}
        </div>
        {message.withBtn ? (
          <div style={{ marginTop: 6 }}>
            <button className="tbtn" type="button" style={{ fontSize: 10, padding: "4px 10px", color: "var(--accent)" }} onClick={() => callLegacy("nav", "knowledge")}>
              <i className="ti ti-transfer" /> 인수인계 문서 생성
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Chat() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [input, setInput] = useState("");
  const areaRef = useRef(null);

  useEffect(() => {
    function handleChatState(event) {
      setSnapshot(event.detail || getSnapshot());
    }

    window.addEventListener("opsradar:chat-state-updated", handleChatState);
    const timer = window.setTimeout(() => {
      callLegacy("initChatSessions");
      setSnapshot(getSnapshot());
    }, 0);

    return () => {
      window.removeEventListener("opsradar:chat-state-updated", handleChatState);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const area = areaRef.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [snapshot.messages, snapshot.typing]);

  const visibleMessages = useMemo(() => {
    const messages = snapshot.messages || [];
    return messages.length > 8 ? messages.slice(-8) : messages;
  }, [snapshot.messages]);

  const hiddenCount = Math.max(0, (snapshot.messages || []).length - visibleMessages.length);

  function send(value = input) {
    const text = value.trim();
    if (!text || snapshot.typing) return;
    setInput("");
    callLegacy("sendMsg", text);
  }

  return (
    <>
      <div className="topbar chat-topbar">
        <div>
          <div className="topbar-title">AI Assistant</div>
          <div className="chat-topbar-sub">운영 데이터 기반 질의응답 · 일정 등록 · 근거 문서 연결</div>
        </div>
        <div className="chat-top-actions">
          <span className="badge b-success" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-circle-filled" style={{ fontSize: 8 }} /> RAG 연결됨
          </span>
          <button className="tbtn" type="button" onClick={() => callLegacy("createNewChatSession", true)}>
            <i className="ti ti-plus" /> 새 분석 세션
          </button>
        </div>
      </div>

      <div className="chat-workspace">
        <aside className="chat-session-panel" id="chatSessionPanel">
          <div className="chat-session-head">
            <div>
              <div className="chat-context-eyebrow">Analysis Sessions</div>
              <strong>운영 질문 기록</strong>
            </div>
            <button className="chat-session-add" type="button" onClick={() => callLegacy("createNewChatSession", true)} title="새 분석 세션">
              <i className="ti ti-plus" />
            </button>
          </div>
          <div className="chat-session-actions">
            <button className="tbtn" type="button" onClick={() => callLegacy("clearCurrentChatSession")}>
              <i className="ti ti-eraser" /> 현재 세션 초기화
            </button>
          </div>
          <div className="chat-session-list" id="chatSessionList">
            {snapshot.sessions?.length ? snapshot.sessions.map((session) => <SessionItem session={session} key={session.id} />) : (
              <div className="chat-session-empty">저장된 운영 질문 기록이 없습니다.</div>
            )}
          </div>
        </aside>

        <section className="chat-main-panel">
          <div className="chat-area" id="chatArea" ref={areaRef}>
            <ChatIntro onPrompt={send} />
            {hiddenCount > 0 ? (
              <div className="chat-summary-card" id="chatSummaryCard" style={{ display: "flex" }}>
                <i className="ti ti-fold" />
                <div>
                  <strong>이전 대화 {hiddenCount}개 요약</strong>
                  <span>전체 원문은 현재 분석 세션에 저장되어 있고, 화면에는 최근 메시지만 표시합니다.</span>
                </div>
              </div>
            ) : null}
            {visibleMessages.map((message, index) => (
              <ChatMessage message={message} key={message.id || `${message.createdAt}-${index}`} />
            ))}
            {snapshot.typing ? <TypingMessage /> : null}
          </div>
          <div className="chat-input-bar">
            <textarea
              className="chat-input"
              id="chatInput"
              rows="1"
              placeholder="운영 상태 질문 또는 일정 등록..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                callLegacy("autoResize", event.currentTarget);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <button className="send-btn" id="sendBtn" type="button" disabled={snapshot.typing} onClick={() => send()}>
              <i className="ti ti-send" style={{ fontSize: 14 }} />
            </button>
          </div>
        </section>

        <aside className="chat-context-panel" id="chatContextPanel">
          <div className="chat-context-head">
            <div>
              <div className="chat-context-eyebrow">Operational Context</div>
              <strong>근거 문서와 연결 항목</strong>
            </div>
            <i className="ti ti-database-search" />
          </div>
          <div className="chat-context-section">
            <div className="chat-context-label">출처 문서</div>
            <div id="chatSourceList" className="chat-context-list">
              <ContextList items={snapshot.context?.docs} emptyText="질문 후 관련 출처가 표시됩니다." />
            </div>
          </div>
          <div className="chat-context-section">
            <div className="chat-context-label">관련 Todo</div>
            <div id="chatTodoList" className="chat-context-list">
              <ContextList items={snapshot.context?.todoItems} emptyText="연결된 Todo 없음" />
            </div>
          </div>
          <div className="chat-context-section">
            <div className="chat-context-label">관련 Issue</div>
            <div id="chatIssueList" className="chat-context-list">
              <ContextList items={snapshot.context?.issueItems} emptyText="연결된 Issue 없음" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
