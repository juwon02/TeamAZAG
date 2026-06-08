import { useEffect, useState } from "react";

const emptySnapshot = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  monthTitle: "",
  prevLabel: "",
  nextLabel: "",
  cells: [],
  newEvents: [],
  absenceEvents: [],
  selectedDay: null,
};

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

function callLegacy(name, ...args) {
  window[name]?.(...args);
}

function SuggestionCard({ badge, badgeClass, title, description, eventTitle, reason, style }) {
  return (
    <button
      type="button"
      className="calendar-suggestion"
      style={style}
      onClick={() => callLegacy("addAISuggestEvent", eventTitle, reason)}
    >
      <span className={`badge ${badgeClass}`}>{badge}</span>
      <strong>{title}</strong>
      <span>{description}</span>
    </button>
  );
}

function CalendarCell({ cell }) {
  if (cell.other) {
    return (
      <div className="cal-cell other">
        <div className="cal-date">{cell.day}</div>
      </div>
    );
  }

  const className = [
    "cal-cell",
    cell.today ? "today" : "",
    cell.risk ? "risk" : "",
    cell.isNew ? "new-event" : "",
    cell.selected ? "cal-selected" : "",
  ].filter(Boolean).join(" ");

  return (
    <button className={className} type="button" onClick={() => callLegacy("openCalModal", cell.day)}>
      <div className="cal-date">{cell.day}</div>
      <div className="cal-tags">
        {(cell.tags || []).map((tag, index) => (
          <span className={`cal-tag ${tag.c || "ct-info"}`} key={`${tag.t}-${index}`}>
            {tag.t}
          </span>
        ))}
      </div>
      {cell.risk ? <div className="risk-dot" /> : null}
    </button>
  );
}

export default function Calendar() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);

  useEffect(() => {
    function handleCalendarState(event) {
      setSnapshot({ ...emptySnapshot, ...event.detail });
    }

    window.addEventListener("opsradar:calendar-state-updated", handleCalendarState);
    const timer = window.setTimeout(() => callLegacy("renderCalendar"), 0);

    return () => {
      window.removeEventListener("opsradar:calendar-state-updated", handleCalendarState);
      window.clearTimeout(timer);
    };
  }, []);

  const absenceEvents = snapshot.absenceEvents || [];
  const absenceNames = [...new Set(absenceEvents.map((event) => event.person).filter(Boolean))].join(", ");
  const aiText = absenceNames
    ? `${snapshot.month + 1}월 주요 부재 일정: ${absenceNames}. 운영 리스크 연결을 확인하세요.`
    : "운영 로그를 업로드하면 AI가 이번 달 리스크 일정을 자동으로 생성합니다.";

  return (
    <>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="topbar-title">캘린더 · 운영 리스크 예측</div>
          <span id="calUpdatedBadge" className="badge b-success" style={{ display: "none" }}>방금 업데이트됨</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="tbtn primary" type="button" onClick={() => callLegacy("openAISuggestModal")} style={{ gap: 5 }}>
            <i className="ti ti-sparkles" /> AI 추천 일정 생성
          </button>
          <button className="tbtn" id="calPrevBtn" type="button" onClick={() => callLegacy("goToPrevMonth")}>
            {snapshot.prevLabel || "이전"}
          </button>
          <div className="chip" id="calMonthTitle">{snapshot.monthTitle}</div>
          <button className="tbtn" id="calNextBtn" type="button" onClick={() => callLegacy("goToNextMonth")}>
            {snapshot.nextLabel || "다음"}
          </button>
        </div>
      </div>

      <div className="modal-overlay" id="aiSuggestModal">
        <div className="modal slide-up" style={{ width: 400 }}>
          <div className="modal-title">AI 추천 일정 생성</div>
          <div className="modal-sub">운영 데이터를 기반으로 추천 일정을 선택하세요.</div>
          <div className="calendar-suggestion-list">
            <SuggestionCard
              badge="High Risk"
              badgeClass="b-danger"
              title="High Risk 이슈 대응 회의"
              description="현재 미해결 이슈를 기준으로 긴급 대응 회의를 추천합니다."
              eventTitle="긴급 대응 회의"
              reason="High Risk 이슈 기반"
              style={{ background: "var(--danger-soft)", border: "1px solid rgba(224,62,62,.12)" }}
            />
            <SuggestionCard
              badge="마감 집중"
              badgeClass="b-accent"
              title="Todo 마감 점검"
              description="이번 주 마감이 몰린 구간에 점검 일정을 추가합니다."
              eventTitle="Todo 마감 점검"
              reason="Todo 마감 집중 기반"
              style={{ background: "var(--accent-soft)", border: "1px solid rgba(66,99,235,.12)" }}
            />
            <SuggestionCard
              badge="부재 기반"
              badgeClass="b-warn"
              title="부재자 인수인계"
              description="주요 담당자 부재 전에 인수인계 미팅을 추천합니다."
              eventTitle="인수인계 미팅"
              reason="부재자 인수인계 기반"
              style={{ background: "var(--warn-soft)", border: "1px solid rgba(196,124,0,.12)" }}
            />
          </div>
          <div className="modal-actions">
            <button className="tbtn" type="button" onClick={() => callLegacy("closeModal", "aiSuggestModal")}>닫기</button>
          </div>
        </div>
      </div>

      <div id="calEventBanner" className="calendar-event-banner">
        <i className="ti ti-calendar-plus" style={{ fontSize: 16 }} />
        <span id="calBannerText" />
      </div>

      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="calendar-ai-summary">
            <div>
              <i className="ti ti-sparkles" style={{ fontSize: 13 }} /> AI 추론 · {snapshot.month + 1}월 리스크 예측
            </div>
            <span id="calAIText">{aiText}</span>
          </div>

          <div className="cal-grid" id="calGrid">
            {weekDays.map((day, index) => (
              <div className={`cal-dow${index === 0 || index === 6 ? " weekend" : ""}`} key={day}>{day}</div>
            ))}
            {(snapshot.cells || []).map((cell, index) => (
              <CalendarCell cell={cell} key={`${cell.other ? "o" : "d"}-${cell.day}-${index}`} />
            ))}
          </div>

          <div className="calendar-legend">
            <span><i className="legend-box legend-danger" /> High Risk</span>
            <span><i className="legend-box legend-warn" /> 주의</span>
            <span><i className="legend-box legend-gray" /> 부재</span>
            <span className="legend-success"><i className="legend-box legend-new" /> 신규 등록</span>
          </div>
        </div>

        <aside className="cal-side">
          <div className="calendar-side-scroll">
            <section>
              <h3><i className="ti ti-alert-triangle" /> 리스크 구간</h3>
              <div className="calendar-side-item">
                <code>등록된 리스크 구간 없음</code>
                <span>운영 데이터 연결 후 표시됩니다.</span>
              </div>
            </section>

            <section>
              <h3><i className="ti ti-user-off" /> 부재 현황</h3>
              <div id="calAbsenceList">
                {absenceEvents.length ? absenceEvents.map((event, index) => (
                  <div className="calendar-side-item" key={`${event.person}-${event.date}-${index}`}>
                    <code>{event.date} {event.person} 부재</code>
                    <span>{event.type} · {event.impact}</span>
                  </div>
                )) : (
                  <div className="calendar-empty">등록된 부재 일정이 없습니다.</div>
                )}
              </div>
            </section>

            <section>
              <h3><i className="ti ti-flag" /> 마일스톤</h3>
              <div className="calendar-side-item">
                <code>5/29</code>
                <span>4주차 시연</span>
                <b className="badge b-accent">준비</b>
              </div>
              <div className="calendar-side-item">
                <code>6/26</code>
                <span>MVP 최종 시연</span>
                <b className="badge b-accent">중요</b>
              </div>
            </section>
          </div>

          <div className="cal-mini-chat">
            <div className="mini-chat-hd">
              <i className="ti ti-sparkles" style={{ fontSize: 13, color: "var(--accent)" }} />
              <span>일정 등록</span>
            </div>
            <div className="mini-log" id="miniLog">
              <div>간단한 문장으로 일정을 알려주세요.</div>
              <div className="calendar-quick-row">
                <button className="sq" type="button" onClick={() => callLegacy("miniChat", "담당자 A 5/26 부재")}>담당자 A 5/26 부재</button>
                <button className="sq" type="button" onClick={() => callLegacy("miniChat", "6/3 대응 회의")}>6/3 대응 회의</button>
              </div>
            </div>
            <div className="mini-input-row">
              <input
                className="mini-input"
                id="miniInput"
                placeholder="예: 담당자 A 5/28 부재"
                onKeyDown={(event) => {
                  if (event.key === "Enter") callLegacy("miniChat");
                }}
              />
              <button className="mini-send" type="button" onClick={() => callLegacy("miniChat")}>
                <i className="ti ti-send" style={{ fontSize: 12 }} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
