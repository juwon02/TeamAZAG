window.OpsRadarFrontend?.registerModule("analysis", { file: "js/analysis.js", screen: "analysis" });

(function installAnalysisReactBridge() {
  const API = window.OPSRADAR_API_BASE || "/api/v1";
  const initialSteps = [
    { id: 1, icon: "ti-cloud-upload", state: "wait", title: "문서 업로드 대기", sub: "운영 기록을 백엔드에 업로드합니다." },
    { id: 2, icon: "ti-brain", state: "wait", title: "AI 분석 대기", sub: "문서 상태와 분석 진행률을 확인합니다." },
    { id: 3, icon: "ti-file-description", state: "wait", title: "결과 반영 대기", sub: "Todo, 리스크, 근거 구간을 화면에 반영합니다." },
  ];

  const state = {
    stage: "idle",
    step: 0,
    dragover: false,
    uploadedFiles: [],
    files: [],
    errorReason: null,
    currentFileName: "",
    analysisBadge: "대기",
    uploadProgress: 0,
    documentId: null,
    flowSteps: initialSteps.map((step) => ({ ...step })),
    result: null,
    historyVisible: false,
    history: [],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emitAnalysisState() {
    window.dispatchEvent(new CustomEvent("opsradar:analysis-state-updated", { detail: getAnalysisSnapshot() }));
  }

  function getAnalysisSnapshot() {
    return {
      ...clone(state),
      history: clone(state.history || []),
    };
  }

  function getUploadErrorMessage(reason) {
    const messages = {
      empty: "파일 내용이 비어 있습니다.",
      unsupported: "지원하지 않는 파일 형식입니다.",
      structure: "날짜, 작성자, 업무 내용 구분을 찾기 어렵습니다.",
      pdfImage: "이미지로만 구성된 PDF는 텍스트 추출이 어려울 수 있습니다.",
      network: "백엔드 업로드 요청에 실패했습니다.",
      timeout: "분석 완료 대기 시간이 초과되었습니다.",
      backend: "백엔드 분석 중 오류가 발생했습니다.",
      general: "업무 기록 구조를 인식하지 못했습니다.",
    };
    return messages[reason] || messages.general;
  }

  function validateUploadedFile(file) {
    if (!file) return { ok: false, reason: "general" };
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowed = ["txt", "csv", "docx", "pdf"];
    if (!allowed.includes(ext)) return { ok: false, reason: "unsupported" };
    if (file.size === 0) return { ok: false, reason: "empty" };
    return { ok: true, reason: null };
  }

  function readTextFile(file) {
    return new Promise((resolve) => {
      if (!file || !/\.(txt|csv)$/i.test(file.name)) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsText(file);
    });
  }

  function looksLikeBusinessRecord(text) {
    const value = (window.normalizeText?.(text) || text || "").trim();
    if (!value) return false;
    const hasDate = /\d{4}[-.]\d{1,2}[-.]\d{1,2}|Date\s*:|날짜\s*:/i.test(value);
    const hasSpeaker = /[가-힣A-Za-z0-9._%+-]+\s*:|From\s*:|참석자\s*:|작성자\s*:/i.test(value);
    const hasContent = /Todo\s*:|Content\s*:|결정사항\s*:|의견\s*:|필요|확인|수정|대응|진행|이슈|리스크/i.test(value);
    return hasDate && (hasSpeaker || hasContent);
  }

  async function validateUploadedFiles(files) {
    for (const file of files) {
      const basic = validateUploadedFile(file);
      if (!basic.ok) return basic;
      if (/\.(txt|csv)$/i.test(file.name)) {
        const text = await readTextFile(file);
        if (!looksLikeBusinessRecord(text)) return { ok: false, reason: "structure" };
      }
    }
    return { ok: true };
  }

  function toFileView(file, validation) {
    return {
      name: file.name,
      sizeKb: (file.size / 1024).toFixed(1),
      ok: validation.ok,
      reason: validation.reason,
    };
  }

  function setFlow(id, stepState, title, sub) {
    state.flowSteps = state.flowSteps.map((entry) => (
      entry.id === id ? { ...entry, state: stepState, title, sub } : entry
    ));
    emitAnalysisState();
  }

  function resetSteps() {
    state.flowSteps = initialSteps.map((step) => ({ ...step }));
    state.analysisBadge = "대기";
    state.uploadProgress = 0;
  }

  function setStepBar(step) {
    state.step = step;
    emitAnalysisState();
  }

  function showUploadError(reason) {
    state.errorReason = reason || "general";
    state.stage = "error";
    state.analysisBadge = "오류";
    emitAnalysisState();
  }

  async function handleFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    state.uploadedFiles = list;
    state.errorReason = null;
    const validation = await validateUploadedFiles(list);
    state.files = list.map((file) => toFileView(file, validation));
    state.stage = validation.ok ? "selected" : "error";
    state.step = 1;
    state.errorReason = validation.ok ? null : validation.reason;
    emitAnalysisState();
  }

  function onFileSelect(event) {
    handleFiles(Array.from(event.target.files || []));
  }

  function ondov(event) {
    event.preventDefault();
    state.dragover = true;
    emitAnalysisState();
  }

  function ondl(event) {
    event?.preventDefault?.();
    state.dragover = false;
    emitAnalysisState();
  }

  function handleUploadDrop(event) {
    event.preventDefault();
    state.dragover = false;
    handleFiles(Array.from(event.dataTransfer.files || []));
  }

  function hideUploadError() {
    state.errorReason = null;
    if (state.stage === "error") state.stage = state.files.length ? "selected" : "idle";
    emitAnalysisState();
  }

  function resetUploadInput() {
    document.querySelectorAll('#uploadZone input[type="file"]').forEach((input) => { input.value = ""; });
  }

  function resetUpload() {
    state.uploadedFiles = [];
    state.stage = "idle";
    state.step = 0;
    state.dragover = false;
    state.files = [];
    state.errorReason = null;
    state.currentFileName = "";
    state.documentId = null;
    state.result = null;
    resetSteps();
    resetUploadInput();
    emitAnalysisState();
  }

  function resetFlow() {
    resetUpload();
  }

  function retryUpload() {
    resetUpload();
    window.setTimeout(() => document.querySelector('#uploadZone input[type="file"]')?.click(), 0);
  }

  function showUploadGuide() {
    window.openModal?.("uploadGuideModal");
  }

  function formatShortDate() {
    if (typeof window.formatOpsDate === "function") return window.formatOpsDate("short");
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  }

  function inferDocType(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes("meeting") || name.includes("회의")) return "meeting";
    if (name.includes("chat") || name.includes("채팅")) return "chat";
    if (name.includes("issue") || name.includes("이슈")) return "issue_log";
    if (name.includes("handoff") || name.includes("인수")) return "handoff";
    return "report";
  }

  async function request(path, options = {}) {
    if (window.opsRadarApi?.request && !(options.body instanceof FormData)) {
      return window.opsRadarApi.request(path, options);
    }
    const res = await fetch(`${API}${path}`, options);
    if (!res.ok) {
      let detail = "";
      try {
        const data = await res.json();
        detail = data.detail || data.message || "";
      } catch {
        detail = await res.text().catch(() => "");
      }
      throw new Error(detail || `${res.status} ${res.statusText}`);
    }
    return res.status === 204 ? null : res.json();
  }

  async function uploadDocument(file) {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", inferDocType(file.name));
    return request("/documents/upload", {
      method: "POST",
      body: form,
    });
  }

  async function getDocumentStatus(documentId) {
    return request(`/documents/${documentId}/status`);
  }

  async function getDocumentChunks(documentId) {
    return request(`/documents/${documentId}/chunks`);
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function waitForDocument(documentId) {
    let lastStatus = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const status = await getDocumentStatus(documentId);
      lastStatus = status;
      const progress = Number(status.progress || 0);
      state.uploadProgress = Math.max(state.uploadProgress || 0, progress);
      state.analysisBadge = status.analysis_status === "completed" ? "완료" : "분석 중";
      setFlow(2, "active", "AI 분석 진행 중", `백엔드 분석 상태: ${status.analysis_status || "processing"} · ${state.uploadProgress}%`);

      if (status.analysis_status === "completed") return status;
      if (status.analysis_status === "failed" || status.status === "failed") {
        throw new Error(status.error || "document analysis failed");
      }
      await sleep(attempt < 5 ? 800 : 1500);
    }
    const error = new Error(lastStatus?.error || "analysis timeout");
    error.reason = "timeout";
    throw error;
  }

  function summarizeChunks(chunks) {
    const first = chunks[0] || {};
    const content = first.content || "분석된 문서 chunk가 아직 없습니다. Todo/리스크 목록을 확인해 주세요.";
    return {
      meta: `${first.section_title || "분석 문서"} · chunk #${Number(first.chunk_index || 0) + 1}`,
      content: content.length > 240 ? `${content.slice(0, 240)}...` : content,
      sourceRange: first.section_title || `chunk #${Number(first.chunk_index || 0) + 1}`,
    };
  }

  async function countCurrentData() {
    const [todosResult, issuesResult] = await Promise.allSettled([
      request("/todos"),
      request("/issues"),
    ]);
    const todos = todosResult.status === "fulfilled" ? todosResult.value.todos || [] : [];
    const issues = issuesResult.status === "fulfilled" ? issuesResult.value.issues || [] : [];
    const blocked = [
      ...todos.filter((todo) => todo.status === "blocked"),
      ...issues.filter((issue) => issue.status === "blocked" || issue.risk_level === "high" || issue.severity === "high"),
    ].length;
    return { todo: todos.length, issue: issues.length, blocked };
  }

  async function refreshOperationalData() {
    if (window.opsRadarApi?.reload) {
      await window.opsRadarApi.reload();
      return;
    }
    await Promise.allSettled([
      window.opsRadarApi?.loadTodos?.(),
      window.opsRadarApi?.loadIssues?.(),
      window.opsRadarApi?.loadReports?.(),
      window.opsRadarApi?.loadCalendar?.(),
    ]);
  }

  async function showAnalysisResult(fileName, documentId) {
    const [chunkData, counts] = await Promise.all([
      getDocumentChunks(documentId).catch(() => ({ chunks: [] })),
      countCurrentData(),
    ]);
    const chunks = chunkData.chunks || [];
    const chunkSummary = summarizeChunks(chunks);
    const result = {
      fileName,
      documentId,
      todo: counts.todo,
      issue: counts.issue,
      blocked: counts.blocked,
      meta: chunkSummary.meta,
      content: chunkSummary.content,
      highlights: ["백엔드 업로드 완료", "문서 분석 파이프라인 실행", "운영 데이터 갱신"],
      reason: "업로드된 문서를 백엔드 분석 파이프라인에 전달하고, 생성된 운영 데이터를 화면에 반영했습니다.",
      sourceDoc: fileName,
      sourceRange: chunkSummary.sourceRange,
    };

    state.stage = "result";
    state.step = 3;
    state.analysisBadge = "완료";
    state.uploadProgress = 100;
    state.result = result;
    state.history.unshift({
      name: fileName,
      documentId,
      type: inferDocType(fileName),
      date: formatShortDate(),
      todo: result.todo,
      issue: result.issue,
      blocked: result.blocked,
    });
    window.showToast?.("문서 분석이 완료되었습니다.", "success");
    window.addNotif?.(`"${fileName.slice(0, 20)}..." 분석 완료. Todo와 리스크를 확인하세요.`, "success");
    emitAnalysisState();
  }

  async function startAnalysis() {
    if (!state.uploadedFiles.length) {
      showUploadError("general");
      return;
    }
    const validation = await validateUploadedFiles(state.uploadedFiles);
    if (!validation.ok) {
      showUploadError(validation.reason);
      return;
    }

    const file = state.uploadedFiles[0];
    const fileName = file.name;
    state.stage = "analyzing";
    state.step = 2;
    state.currentFileName = fileName;
    state.result = null;
    state.errorReason = null;
    state.documentId = null;
    state.uploadProgress = 0;
    resetSteps();
    setFlow(1, "active", "문서 업로드 중", "백엔드 /documents/upload 엔드포인트로 파일을 전송합니다.");
    emitAnalysisState();

    try {
      const uploaded = await uploadDocument(file);
      const documentId = uploaded.document_id;
      if (!documentId) throw new Error("document_id missing from upload response");

      state.documentId = documentId;
      state.uploadProgress = Number(uploaded.progress || 5);
      state.analysisBadge = "분석 중";
      setFlow(1, "done", "문서 업로드 완료", `document_id: ${documentId}`);
      setFlow(2, "active", "AI 분석 진행 중", "백엔드 문서 분석 상태를 확인하고 있습니다.");

      await waitForDocument(documentId);
      setFlow(2, "done", "AI 분석 완료", "문서 chunk와 후보 Todo/리스크 생성을 완료했습니다.");
      setFlow(3, "active", "결과 반영 중", "최신 Todo, 리스크, 보고서 데이터를 다시 불러옵니다.");
      await refreshOperationalData();
      setFlow(3, "done", "결과 반영 완료", "화면 데이터가 최신 상태로 갱신되었습니다.");
      await showAnalysisResult(fileName, documentId);
    } catch (error) {
      console.warn("Analysis upload failed", error);
      const reason = error.reason || (String(error.message || "").includes("timeout") ? "timeout" : "network");
      showUploadError(reason);
      window.showToast?.(getUploadErrorMessage(reason), "warn");
    }
  }

  function toggleHistory() {
    state.historyVisible = !state.historyVisible;
    emitAnalysisState();
  }

  function renderHistory() {
    emitAnalysisState();
  }

  function countUp() {}

  function resetAnalysisRuntimeData() {
    state.uploadedFiles = [];
    state.history = [];
    emitAnalysisState();
  }

  window.getAnalysisSnapshot = getAnalysisSnapshot;
  window.refreshAnalysisState = emitAnalysisState;
  window.getUploadErrorMessage = getUploadErrorMessage;
  window.validateUploadedFile = validateUploadedFile;
  window.showUploadError = showUploadError;
  window.hideUploadError = hideUploadError;
  window.resetUploadInput = resetUploadInput;
  window.retryUpload = retryUpload;
  window.showUploadGuide = showUploadGuide;
  window.ondov = ondov;
  window.ondl = ondl;
  window.handleUploadDrop = handleUploadDrop;
  window.onFileSelect = onFileSelect;
  window.handleFiles = handleFiles;
  window.startAnalysis = startAnalysis;
  window.resetFlow = resetFlow;
  window.resetUpload = resetUpload;
  window.setStepBar = setStepBar;
  window.toggleHistory = toggleHistory;
  window.renderHistory = renderHistory;
  window.countUp = countUp;
  window.resetAnalysisRuntimeData = resetAnalysisRuntimeData;

  setTimeout(emitAnalysisState, 0);
})();
