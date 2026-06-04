import { useEffect, useRef, useState } from "react";

const emptySnapshot = {
  stage: "idle",
  step: 0,
  dragover: false,
  files: [],
  errorReason: null,
  currentFileName: "",
  analysisBadge: "분석 중...",
  flowSteps: [
    { id: 1, icon: "ti-checkbox", state: "wait", title: "업무 항목 추출 대기", sub: "회의록/업무 로그에서 Todo 항목 감지 대기" },
    { id: 2, icon: "ti-alert-triangle", state: "wait", title: "위험 이슈 확인 대기", sub: "리스크 키워드와 Blocked 상태 감지 대기" },
    { id: 3, icon: "ti-file-description", state: "wait", title: "운영 요약 생성 대기", sub: "이슈 확인 완료 후 요약 생성 대기" },
  ],
  result: null,
  historyVisible: false,
  history: [],
};

function callLegacy(name, ...args) {
  window[name]?.(...args);
}

function getSnapshot() {
  return window.getAnalysisSnapshot?.() || emptySnapshot;
}

function StepLabel({ active, label }) {
  return <span className={active ? "badge b-accent" : ""}>{label}</span>;
}

function FileRow({ file }) {
  return (
    <div className={`file-row ${file.ok ? "" : "error"}`}>
      <i className="ti ti-file-text" style={{ fontSize: 16, color: file.ok ? "var(--accent)" : "var(--danger)" }} />
      <div style={{ flex: 1, fontWeight: 500, color: "var(--text)" }}>{file.name}</div>
      <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>{file.sizeKb}KB</div>
      <span className={`badge ${file.ok ? "b-gray" : "b-danger"}`}>{file.ok ? "대기" : "확인 필요"}</span>
    </div>
  );
}

function UploadError({ reason }) {
  if (!reason) return null;
  const friendly = window.getUploadErrorMessage?.(reason) || "업무 기록 구조를 인식하지 못했습니다.";

  return (
    <div id="uploadErrorCard" className="upload-error-card">
      <div className="upload-error-head">
        <div className="upload-error-icon"><i className="ti ti-alert-triangle" /></div>
        <div>
          <div className="upload-error-title">파일을 분석할 수 없습니다.</div>
          <div className="upload-error-desc">
            지원하지 않는 파일 형식이거나 업무 기록 구조를 인식하지 못했습니다.<br />
            날짜, 작성자, 내용을 포함한 파일로 다시 업로드해주세요.
          </div>
        </div>
      </div>
      <div className="upload-error-reasons">
        <div className="upload-error-reason"><i className="ti ti-point" /><span>{friendly}</span></div>
        <div className="upload-error-reason"><i className="ti ti-point" /><span>날짜/작성자/내용 구분이 어려울 수 있습니다.</span></div>
        <div className="upload-error-reason"><i className="ti ti-point" /><span>이미지 PDF는 텍스트 확인이 어려울 수 있습니다.</span></div>
        <div className="upload-error-reason"><i className="ti ti-point" /><span>업무 기록이 아닌 일반 문서는 정확도가 낮을 수 있습니다.</span></div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>지원 파일 형식</div>
      <div className="upload-supported"><span>txt</span><span>csv</span><span>docx</span><span>pdf</span></div>
      <div className="upload-error-actions">
        <button className="tbtn primary" type="button" onClick={() => callLegacy("retryUpload")}><i className="ti ti-upload" /> 다시 업로드</button>
        <button className="tbtn" type="button" onClick={() => callLegacy("showUploadGuide")}><i className="ti ti-file-description" /> 지원 형식 보기</button>
      </div>
    </div>
  );
}

function FlowStep({ step }) {
  const icon = step.state === "active" ? "ti-loader-2 spin" : step.state === "done" ? "ti-check" : step.icon;
  return (
    <div className="flow-step">
      <div className={`flow-icon fi-${step.state}`} id={`ficon${step.id}`}>
        <i className={`ti ${icon}`} style={{ fontSize: 11 }} />
      </div>
      <div className="flow-body">
        <div className="flow-title" id={`ftitle${step.id}`}>{step.title}</div>
        <div className={`flow-sub ${step.state === "active" ? "s-active" : step.state === "done" ? "s-done" : ""}`} id={`fsub${step.id}`}>
          {step.sub}
        </div>
      </div>
    </div>
  );
}

function ResultSection({ result }) {
  if (!result) return null;

  return (
    <div id="resultSection" style={{ display: "block", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid var(--success)", borderRadius: "var(--radius)", padding: "14px 16px" }} className="fade-up">
      <div className="card-hd">
        <div className="card-hd-l"><i className="ti ti-sparkles" style={{ color: "var(--success)" }} /> 분석 완료 <span className="badge b-success" style={{ marginLeft: 4 }}>완료</span></div>
        <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }} id="resultFname">{result.fileName}</div>
      </div>
      <div className="three-col" style={{ marginBottom: 14 }}>
        <button className="analysis-stat-tile" type="button" onClick={() => callLegacy("nav", "todo")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--mono)" }} id="rTodo">{result.todo}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>Todo 추출</div>
          <div style={{ fontSize: 9, color: "var(--accent)", marginTop: 2 }}>클릭하여 확인</div>
        </button>
        <button className="analysis-stat-tile" type="button" onClick={() => callLegacy("nav", "issues")}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--danger)", fontFamily: "var(--mono)" }} id="rIssue">{result.issue}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>리스크 감지</div>
          <div style={{ fontSize: 9, color: "var(--danger)", marginTop: 2 }}>클릭하여 확인</div>
        </button>
        <div className="analysis-stat-tile">
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--warn)", fontFamily: "var(--mono)" }} id="rBlocked">{result.blocked}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>Blocked</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>출처 기반 추출 근거</div>
      <div className="chunk-box">
        <div className="chunk-meta"><i className="ti ti-file-text" style={{ fontSize: 11, color: "var(--accent)" }} /><span id="rChunkMeta">{result.meta}</span></div>
        <div id="rChunkContent" className="text-content">{result.content}</div>
        <div className="analysis-highlight-row">
          {(result.highlights || []).map((item) => <span className="chunk-hl" key={item}>{item}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
        <div className="analysis-source-row"><i className="ti ti-file-description" /><div><div>출처 문서</div><strong id="rSrcDoc">{result.sourceDoc}</strong></div></div>
        <div className="analysis-source-row"><i className="ti ti-list-search" /><div><div>관련 구간</div><strong id="rSrcRange">{result.sourceRange}</strong></div></div>
        <div className="analysis-source-row"><i className="ti ti-brain" /><div><div>AI 판단 근거</div><strong id="rSrcReason">{result.reason}</strong></div></div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button className="tbtn" type="button" onClick={() => callLegacy("nav", "todo")} style={{ color: "var(--accent)" }}><i className="ti ti-checkbox" /> Todo 확인</button>
        <button className="tbtn" type="button" onClick={() => callLegacy("nav", "issues")} style={{ color: "var(--danger)" }}><i className="ti ti-alert-triangle" /> 이슈 확인</button>
        <button className="tbtn primary" type="button" onClick={() => callLegacy("applyDashboard")}><i className="ti ti-layout-dashboard" /> Dashboard 반영</button>
        <button className="tbtn" type="button" onClick={() => callLegacy("resetFlow")} style={{ marginLeft: "auto" }}><i className="ti ti-plus" /> 다른 파일 분석</button>
      </div>
    </div>
  );
}

function HistorySection({ history }) {
  if (!history?.length) {
    return <div style={{ fontSize: 11, color: "var(--text3)", padding: 12, textAlign: "center" }}>업로드 이력이 없습니다.</div>;
  }

  return history.map((item) => (
    <div className="analysis-history-row" key={`${item.name}-${item.date}`}>
      <i className="ti ti-file-text" />
      <div style={{ flex: 1 }}>{item.name}</div>
      <div style={{ display: "flex", gap: 4 }}>
        <span className="badge b-accent" style={{ fontSize: 9 }}>Todo {item.todo}</span>
        <span className="badge b-danger" style={{ fontSize: 9 }}>Risk {item.issue}</span>
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>{item.date}</div>
    </div>
  ));
}

export default function Analysis() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleAnalysisState(event) {
      setSnapshot(event.detail || getSnapshot());
    }

    window.addEventListener("opsradar:analysis-state-updated", handleAnalysisState);
    const timer = window.setTimeout(() => setSnapshot(getSnapshot()), 0);

    return () => {
      window.removeEventListener("opsradar:analysis-state-updated", handleAnalysisState);
      window.clearTimeout(timer);
    };
  }, []);

  const showFileList = snapshot.files.length > 0;
  const showAnalyzing = snapshot.stage === "analyzing";
  const showResult = snapshot.stage === "result";

  return (
    <>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="topbar-title">운영 로그 분석</div>
          {snapshot.step > 0 ? (
            <div id="stepBar" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              <StepLabel active={snapshot.step === 1} label="업로드" />
              <span>→</span><StepLabel active={snapshot.step === 2} label="AI 분석" />
              <span>→</span><StepLabel active={snapshot.step === 3} label="결과" />
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="tbtn" type="button" onClick={() => callLegacy("toggleHistory")}><i className="ti ti-history" /> 업로드 이력</button>
          <div className="chip" data-current-date="short">오늘 날짜</div>
        </div>
      </div>

      <div className="content">
        {!showAnalyzing && !showResult ? (
          <div style={{ background: "var(--accent-soft)", border: "1px solid rgba(66,99,235,.12)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 11, color: "var(--text2)", display: "flex", alignItems: "center", gap: 8 }} id="analysisGuide">
            <i className="ti ti-info-circle" style={{ fontSize: 14, color: "var(--accent)" }} />
            운영 기록 파일을 업로드하면 AI가 자동으로 업무 항목을 추출하고 위험 이슈를 감지합니다.
          </div>
        ) : null}

        {!showAnalyzing && !showResult ? (
          <div id="uploadSection">
            <div
              className={`upload-zone ${snapshot.dragover ? "dragover" : ""}`}
              id="uploadZone"
              onDragOver={(event) => callLegacy("ondov", event)}
              onDragLeave={(event) => callLegacy("ondl", event)}
              onDrop={(event) => callLegacy("handleUploadDrop", event)}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.pdf,.csv,.docx"
                multiple
                style={{ display: "none" }}
                onChange={(event) => callLegacy("onFileSelect", event)}
              />
              <i className="ti ti-cloud-upload" style={{ fontSize: 30, color: "var(--text3)", display: "block", marginBottom: 10 }} />
              <p style={{ fontSize: 12, color: "var(--text2)" }}>파일을 드래그하거나 클릭하여 업로드</p>
              <span style={{ fontSize: 11, color: "var(--text3)", display: "block", marginTop: 4 }}>지원 형식: txt · csv · pdf · docx</span>
            </div>

            {showFileList ? (
              <div id="fileList" style={{ display: "block", marginTop: 10 }}>
                <div id="fileItems">{snapshot.files.map((file) => <FileRow file={file} key={file.name} />)}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button className="tbtn" type="button" onClick={() => callLegacy("resetUpload")}><i className="ti ti-x" /> 취소</button>
                  <button className="tbtn primary" type="button" onClick={() => callLegacy("startAnalysis")}><i className="ti ti-sparkles" /> AI 분석 시작</button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <UploadError reason={snapshot.errorReason} />

        {showAnalyzing ? (
          <div id="analysisSection" style={{ display: "block" }}>
            <div className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
              <div className="card-hd">
                <div className="card-hd-l"><i className="ti ti-sparkles" style={{ color: "var(--accent)" }} /> AI 분석 진행 중</div>
                <div className={`badge ${snapshot.analysisBadge === "완료" ? "b-success" : "b-accent"}`} id="analysisBadge">{snapshot.analysisBadge}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--success-soft)", borderRadius: "var(--radius-sm)", marginBottom: 14 }}>
                <i className="ti ti-circle-check" style={{ fontSize: 16, color: "var(--success)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--success)" }}>파일 업로드 완료</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }} id="uploadedFname">AI가 업무 내용을 분석하고 있습니다... · {snapshot.currentFileName}</div>
                </div>
              </div>
              <div className="flow-wrap">
                {snapshot.flowSteps.map((step) => <FlowStep step={step} key={step.id} />)}
              </div>
            </div>
          </div>
        ) : null}

        {showResult ? <ResultSection result={snapshot.result} /> : null}

        {snapshot.historyVisible ? (
          <div id="historySection" style={{ display: "block" }}>
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-l"><i className="ti ti-history" /> 업로드 이력</div>
                <button className="linklike" type="button" onClick={() => callLegacy("toggleHistory")}>닫기</button>
              </div>
              <div id="historyList"><HistorySection history={snapshot.history} /></div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
