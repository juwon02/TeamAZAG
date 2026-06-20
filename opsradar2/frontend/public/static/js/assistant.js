// Grounded Assistant UI. General Q&A always goes through the project-scoped API.
(function () {
  function renderMarkdown(value) {
    const escaped = escapeHtml(value || "");
    const lines = escaped.split("\n");
    const html = [];
    let listOpen = false;
    const closeList = () => { if (listOpen) { html.push("</ul>"); listOpen = false; } };
    lines.forEach((line) => {
      const heading = line.match(/^\*\*(.+?)\*\*$/);
      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+\.\s+(.+)$/);
      if (heading) {
        closeList();
        html.push(`<div class="assistant-answer-heading">${heading[1]}</div>`);
      } else if (bullet || numbered) {
        if (!listOpen) { html.push('<ul class="assistant-answer-list">'); listOpen = true; }
        html.push(`<li>${(bullet || numbered)[1]}</li>`);
      } else if (!line.trim()) {
        closeList();
        html.push('<div class="assistant-answer-space"></div>');
      } else {
        closeList();
        html.push(`<p>${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`);
      }
    });
    closeList();
    return html.join("");
  }

  function relatedLabel(item, kind) {
    if (!item) return "";
    const state = item.status_label || item.status || "확인 필요";
    const owner = item.owner || item.assignee || "미지정";
    const due = kind === "todo" && item.due_at ? ` · 마감 ${item.due_at}` : "";
    return `${item.title || "제목 확인 필요"} · ${state} · ${owner}${due}`;
  }

  function sourceItems(sources) {
    return (Array.isArray(sources) ? sources : [sources]).filter(Boolean);
  }

  function documentSources(sources) {
    const seen = new Set();
    return sourceItems(sources)
      .filter((source) => source && typeof source === "object" && source.type === "document" && source.id)
      .map((source) => ({ id: String(source.id), title: String(source.title || "출처 문서") }))
      .filter((source) => !seen.has(source.id) && seen.add(source.id));
  }

  function sourceDownloadButton(source) {
    return `<button type="button" class="assistant-source-download" data-document-id="${escapeHtml(source.id)}" data-document-name="${escapeHtml(source.title)}" title="원본 문서 다운로드">${escapeHtml(source.title)}</button>`;
  }

  function bindAssistantDocumentDownloads(container) {
    container?.querySelectorAll(".assistant-source-download").forEach((button) => {
      if (button._assistantDownloadBound) return;
      button._assistantDownloadBound = true;
      button.addEventListener("click", async () => {
        if (!window.opsRadarApi?.downloadDocument) {
          window.showToast?.("문서 다운로드 연결을 준비 중입니다. 잠시 후 다시 시도해주세요.", "warn");
          return;
        }
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "다운로드 중...";
        try {
          await window.opsRadarApi.downloadDocument(button.dataset.documentId, button.dataset.documentName || "source-document");
        } catch (error) {
          console.warn("Assistant source document download failed", error);
          window.showToast?.(error.message || "출처 문서를 다운로드하지 못했습니다.", "warn");
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  function renderAssistantDocumentContext(sources) {
    const documents = documentSources(sources);
    const container = document.getElementById("chatSourceList");
    if (!container) return;
    if (!documents.length) {
      renderChatContextList("chatSourceList", normalizeSources(sources), "근거 문서가 연결되지 않았습니다.");
      return;
    }
    container.innerHTML = documents.map((source) => `
      <div class="chat-context-item text-content">
        <strong>${sourceDownloadButton(source)}</strong>
        <span>클릭하면 AI 답변의 원본 문서를 다운로드합니다.</span>
      </div>`).join("");
    bindAssistantDocumentDownloads(container);
  }

  function renderAssistantSourceSummary(sources) {
    const documents = documentSources(sources);
    if (documents.length) {
      return `<div class="ai-card-source"><i class="ti ti-file-text" style="font-size:11px"></i><span>근거 문서</span><div class="assistant-source-download-list">${documents.map(sourceDownloadButton).join("")}</div></div>`;
    }
    const labels = normalizeSources(sources);
    return labels.length ? `<div class="ai-card-source"><i class="ti ti-file-text" style="font-size:11px"></i> 근거: ${escapeHtml(labels.join(", "))}</div>` : "";
  }

  function updateAssistantStatus(mode) {
    const badge = document.getElementById("chatAssistantStatus");
    if (!badge) return;
    badge.className = mode === "ai" ? "badge b-success" : "badge b-warn";
    badge.innerHTML = mode === "ai"
      ? '<i class="ti ti-circle-filled" style="font-size:8px"></i> AI 근거 분석'
      : '<i class="ti ti-alert-circle" style="font-size:12px"></i> 근거 기반 응답';
  }

  window.updateChatContextPanel = function (_text = "", sources = null, context = {}) {
    const todos = (context.related_todos || context.relatedTodos || []).map((item) => relatedLabel(item, "todo"));
    const issues = (context.related_issues || context.relatedIssues || []).map((item) => relatedLabel(item, "issue"));
    renderAssistantDocumentContext(sources);
    renderChatContextList("chatTodoList", todos, "직접 연결된 Todo 없음");
    renderChatContextList("chatIssueList", issues, "직접 연결된 Issue 없음");
  };

  window.appendChatMsg = appendChatMsg = function (role, text, sources = null, withBtn = false, context = {}) {
    const area = document.getElementById("chatArea");
    if (!area) return;
    const div = document.createElement("div");
    div.className = `msg ${role === "user" ? "user" : ""} fade-up`;
    div.dataset.chatItem = "true";
    if (role === "user") {
      div.innerHTML = `<div class="msg-av av-user"><i class="ti ti-user" style="font-size:13px"></i></div><div class="bubble bubble-user text-content">${escapeHtml(text)}</div>`;
      saveMessageToCurrentSession("user", text);
    } else {
      const questions = context.suggested_questions || context.suggestedQuestions || [];
      const questionButtons = questions.length
        ? `<div class="assistant-suggestions">${questions.slice(0, 3).map((question) => `<button type="button" class="assistant-suggestion" data-chat-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`).join("")}</div>`
        : "";
      div.innerHTML = `<div class="msg-av av-ai"><i class="ti ti-sparkles" style="font-size:13px"></i></div><div class="assistant-response-wrap"><div class="ai-analysis-card"><div class="ai-card-kicker">GROUNDED OPERATION ANALYSIS</div><div class="ai-card-title">운영 근거 기반 답변</div><div class="assistant-answer text-content">${renderMarkdown(text)}</div>${renderAssistantSourceSummary(sources)}</div>${questionButtons}${withBtn ? '<div style="margin-top:6px"><div class="tbtn" style="font-size:10px;padding:4px 10px;color:var(--accent)" onclick="nav(\'knowledge\')"><i class="ti ti-transfer"></i> 인수인계 문서 생성</div></div>' : ""}</div>`;
      div.querySelectorAll("[data-chat-question]").forEach((button) => {
        button.addEventListener("click", () => window.sendMsg(button.dataset.chatQuestion));
      });
      bindAssistantDocumentDownloads(div);
      window.updateChatContextPanel(G.lastChatPrompt || "", sources, context);
      saveMessageToCurrentSession("assistant", text, { src: sources, withBtn, context });
    }
    area.appendChild(div);
    enforceChatLimit();
    area.scrollTop = area.scrollHeight;
  };

  function requestHistory() {
    const session = getCurrentChatSession();
    return (session.messages || [])
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-7, -1)
      .map((message) => ({ role: message.role, content: String(message.content || "").slice(0, 1200) }))
      .filter((message) => message.content);
  }

  window.sendMsg = sendMsg = async function (text) {
    if (G.chatTyping) return;
    getCurrentChatSession();
    const input = document.getElementById("chatInput");
    const message = text || input?.value.trim();
    if (!message) return;
    if (input) { input.value = ""; input.style.height = "auto"; }
    G.lastChatPrompt = message;
    appendChatMsg("user", message);
    showTyping();

    // 일정 등록은 확정 전 사용자가 검토할 수 있는 별도 도구 흐름으로 유지한다.
    if (typeof isScheduleCreateRequest === "function" && isScheduleCreateRequest(message)) {
      removeTyping();
      showScheduleConfirmRaw(message, parseScheduleMsg(message));
      return;
    }

    try {
      const data = await window.opsRadarApi.request("/chat", {
        method: "POST",
        body: JSON.stringify({ message, history: requestHistory() }),
      });
      removeTyping();
      updateAssistantStatus(data.mode);
      appendChatMsg("ai", data.answer || "근거 기반 응답을 생성하지 못했습니다.", data.sources || [], false, data);
    } catch (error) {
      removeTyping();
      console.warn("AI chat API failed", error);
      appendChatMsg("ai", "질문에 답할 운영 데이터를 불러오지 못했습니다. 로그인 상태와 백엔드 연결을 확인한 뒤 다시 시도하세요.", [], false, { mode: "fallback" });
      updateAssistantStatus("fallback");
    }
  };
})();
