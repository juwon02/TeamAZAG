import { useEffect, useState } from "react";

const emptySnapshot = {
  currentType: "onboarding",
  labels: {
    onboarding: "신규 입사자 온보딩",
    absence: "부재자 업무 인수인계",
    offboard: "담당자 변경/퇴직 인수인계",
  },
  flow: { steps: [], hint: "" },
  context: { title: "", description: "", stats: [] },
  cards: [],
  absenceEvents: [],
  preview: null,
  savedDraft: null,
};

const typeIcons = {
  onboarding: "ti-user-plus",
  absence: "ti-user-off",
  offboard: "ti-logout",
};

function callLegacy(name, ...args) {
  window[name]?.(...args);
}

function ToneBox({ tone, children }) {
  const className = tone === "now" ? "kb-now" : tone === "next" ? "kb-next" : "kb-why";
  const icon = tone === "now" ? "ti-alert-triangle" : tone === "next" ? "ti-arrow-right" : "ti-info-circle";
  return (
    <div className={className}>
      <i className={`ti ${icon}`} style={{ fontSize: 13, flexShrink: 0 }} />
      <div>{children}</div>
    </div>
  );
}

function KnowledgeCard({ card, index }) {
  return (
    <article className="kcard open">
      <div className="kcard-hd">
        <div className="knowledge-step-num">{index + 1}</div>
        <div style={{ flex: 1 }}>
          <div className="kcard-title">{card.title}</div>
          <div className="kcard-sub">{card.sub}</div>
        </div>
        <i className="ti ti-chevron-down kcard-arrow" />
      </div>
      <div className="kcard-body">
        <ToneBox tone={card.tone}>{card.items?.[0] || "데이터 연결 후 표시됩니다."}</ToneBox>
        {(card.items || []).slice(1).map((item, itemIndex) => (
          <div className="kb-item" key={`${card.title}-${itemIndex}`}>
            <i className="ti ti-point" />
            <span>{item}</span>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <button className="tbtn primary" type="button" style={{ fontSize: 11 }} onClick={() => callLegacy("openHandoffPreview")}>
            <i className="ti ti-wand" /> 브리핑 생성
          </button>
        </div>
      </div>
    </article>
  );
}

function PreviewPanel({ preview }) {
  if (!preview) return null;

  return (
    <div className="handoff-slide-panel show" id="handoffPreviewPanel">
      <button className="handoff-slide-backdrop" type="button" aria-label="닫기" onClick={() => callLegacy("closeHandoffPreview")} />
      <aside className="handoff-slide-sheet" role="dialog" aria-modal="true" aria-label="인수인계 문서 미리보기">
        <div className="handoff-slide-head">
          <div>
            <div className="handoff-preview-eyebrow">AI GENERATED PREVIEW</div>
            <div className="handoff-preview-title text-content">{preview.title}</div>
          </div>
          <button className="handoff-slide-close" type="button" aria-label="닫기" onClick={() => callLegacy("closeHandoffPreview")}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="handoff-slide-meta">
          <span className="badge b-accent text-content">{preview.target}</span>
          <span><i className="ti ti-clock" /> {new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>
        <div className="handoff-slide-body">
          <div className="handoff-preview-body">
            {(preview.sections || []).map(([label, value], index) => (
              <div className="handoff-preview-row" key={`${label}-${index}`}>
                <div className="handoff-preview-label text-content">{label}</div>
                <div className="handoff-preview-value text-content">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="handoff-slide-actions">
          <button className="tbtn" type="button" onClick={() => callLegacy("editHandoffDraft")}><i className="ti ti-pencil" /> 수정하기</button>
          <button className="tbtn" type="button" onClick={() => callLegacy("shareHandoffDraft")}><i className="ti ti-share" /> 공유하기</button>
          <button className="tbtn" type="button" onClick={() => callLegacy("generateHandoffPreview")}><i className="ti ti-refresh" /> 다시 생성</button>
          <button className="tbtn primary" type="button" onClick={() => callLegacy("saveHandoffDraft")}><i className="ti ti-device-floppy" /> 초안 저장</button>
        </div>
      </aside>
    </div>
  );
}

export default function Knowledge() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);

  useEffect(() => {
    function handleKnowledgeState(event) {
      setSnapshot({ ...emptySnapshot, ...event.detail });
    }

    window.addEventListener("opsradar:knowledge-state-updated", handleKnowledgeState);
    const timer = window.setTimeout(() => callLegacy("selectKnowledgeType", window.G?.currentKnowledgeType || "onboarding"), 0);

    return () => {
      window.removeEventListener("opsradar:knowledge-state-updated", handleKnowledgeState);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">인수인계 센터</div>
        <div className="knowledge-type-tabs">
          {Object.entries(snapshot.labels).map(([type, label]) => (
            <button
              className={`tbtn ${snapshot.currentType === type ? "active" : ""}`}
              id={`kbtn-${type}`}
              key={type}
              type="button"
              onClick={() => callLegacy("selectKnowledgeType", type)}
            >
              <i className={`ti ${typeIcons[type]}`} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="knowledge-flow-bar" id="knowledgeFlowBar">
        <div className="knowledge-flow-steps" id="knowledgeFlowSteps">
          {(snapshot.flow.steps || []).map((step, index) => (
            <span className={`kflow-step ${index === 0 ? "active" : index < 1 ? "done" : ""}`} key={step}>
              {step}
            </span>
          ))}
        </div>
        <div className="knowledge-flow-hint" id="knowledgeFlowHint">{snapshot.flow.hint}</div>
      </div>

      <div className="knowledge-layout">
        <aside className="knowledge-side">
          <section className="knowledge-side-note">
            <div className="knowledge-side-title"><i className="ti ti-transfer" /> 인수인계란?</div>
            <p>어떤 일이 왜 이렇게 진행됐는지, 무엇을 조심해야 하는지, 다음 담당자가 바로 이어받을 수 있게 정리하는 과정입니다.</p>
          </section>

          <section className="knowledge-preview-card">
            <div className="knowledge-side-title"><i className="ti ti-sparkles" /> AI 생성 미리보기</div>
            <div className="knowledge-bullet"><i />현재 진행 중인 업무</div>
            <div className="knowledge-bullet danger"><i />미해결 이슈</div>
            <div className="knowledge-bullet warn"><i />다음 담당자 주의사항</div>
            <div className="knowledge-bullet success"><i />참고 문서 링크</div>
            <button className="tbtn primary knowledge-preview-button" type="button" onClick={() => callLegacy("openHandoffPreview")}>
              <i className="ti ti-wand" /> 문서 생성 미리보기
            </button>
          </section>

          <section id="knowledgeContextPanel" className="knowledge-context-panel">
            <h3>{snapshot.context.title}</h3>
            <p>{snapshot.context.description}</p>
            {(snapshot.context.stats || []).map(([label, value]) => (
              <div className="knowledge-stat" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
            {snapshot.savedDraft ? <div className="knowledge-saved">최근 초안 저장됨</div> : null}
          </section>
        </aside>

        <main id="knowledgeContent" className="knowledge-content">
          {snapshot.absenceEvents.length ? (
            <section className="knowledge-absence-strip" id="knowledgeAbsence">
              {snapshot.absenceEvents.map((event, index) => (
                <div className="knowledge-absence-item" key={`${event.person}-${event.date}-${index}`}>
                  <strong>{event.person || "담당자"} 부재</strong>
                  <span>{event.date} · {event.type}</span>
                </div>
              ))}
            </section>
          ) : null}
          {(snapshot.cards || []).map((card, index) => (
            <KnowledgeCard card={card} index={index} key={card.title} />
          ))}
        </main>
      </div>

      <PreviewPanel preview={snapshot.preview} />
    </>
  );
}
