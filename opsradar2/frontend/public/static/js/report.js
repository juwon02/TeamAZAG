// Period-aware report generation and report lifecycle actions.
(function () {
  const labels = {
    completed:"완료된 업무", inProgress:"진행 중인 업무", technical:"AI 및 기술적 상세 내용",
    risk:"리스크 관리 및 해결 방안", retrospective:"팀 회고", nextPlan:"차주 계획"
  };
  const keys = {
    ...Object.fromEntries(Object.entries(labels).map(([key, value]) => [value, key])),
    "주요 발생 이슈":"technical", "주요 운영 이슈":"technical",
    "진행 중 Todo":"inProgress", "미완료 업무":"inProgress",
    "미해결 리스크":"risk", "월간 리스크 분석":"risk",
    "부서별 확인사항":"retrospective", "부서별 진행 현황":"retrospective",
    "다음 액션":"nextPlan", "다음 달 관리 포인트":"nextPlan"
  };

  function escapeMarkdownHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tableCells(line) {
    return String(line || "").trim().replace(/^\||\|$/g, "").split("|").map((cell) => escapeMarkdownHtml(cell.trim()));
  }

  function isTableDivider(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(String(line || ""));
  }

  window.renderReportMarkdown = function (content) {
    const lines = String(content || "").replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let paragraph = [];
    let listType = null;
    const flushParagraph = () => {
      if (paragraph.length) html.push(`<p class="text-content">${paragraph.map(escapeMarkdownHtml).join(" ")}</p>`);
      paragraph = [];
    };
    const closeList = () => {
      if (listType) html.push(`</${listType}>`);
      listType = null;
    };
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const tableHeader = line.trim().startsWith("|") && isTableDivider(lines[index + 1]);
      if (tableHeader) {
        flushParagraph(); closeList();
        const header = tableCells(line);
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].trim().startsWith("|")) {
          rows.push(tableCells(lines[index]));
          index += 1;
        }
        index -= 1;
        html.push(`<div class="report-markdown-table-wrap"><table class="report-markdown-table"><thead><tr>${header.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, cellIndex) => `<td>${row[cellIndex] || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        flushParagraph(); closeList();
        const level = Math.min(heading[1].length + 1, 4);
        html.push(`<h${level} class="report-markdown-h${level}">${escapeMarkdownHtml(heading[2])}</h${level}>`);
        continue;
      }
      const bullet = line.match(/^\s*-\s+(.+)$/);
      const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (bullet || numbered) {
        flushParagraph();
        const nextType = numbered ? "ol" : "ul";
        if (listType && listType !== nextType) closeList();
        if (!listType) { html.push(`<${nextType} class="report-markdown-list">`); listType = nextType; }
        html.push(`<li class="text-content">${escapeMarkdownHtml((bullet || numbered)[1])}</li>`);
        continue;
      }
      if (!line.trim()) { flushParagraph(); closeList(); continue; }
      paragraph.push(line.trim());
    }
    flushParagraph(); closeList();
    return html.join("");
  };

  window.sanitizeStoredReportHtml = function (content) {
    const template = document.createElement("template");
    template.innerHTML = String(content || "");
    template.content.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        if (attribute.name !== "class") node.removeAttribute(attribute.name);
      });
      if (node.hasAttribute("class")) {
        const safeClasses = node.className.split(/\s+/).filter((name) => name === "text-content" || name.startsWith("report-markdown-"));
        if (safeClasses.length) node.className = safeClasses.join(" ");
        else node.removeAttribute("class");
      }
    });
    return template.innerHTML;
  };

  window.parseReportMarkdown = function (content) {
    const sections = Object.fromEntries(Object.keys(labels).map((key) => [key, []]));
    if (String(content || "").includes("<")) {
      const container = document.createElement("div");
      container.innerHTML = String(content || "");
      container.querySelectorAll("h3").forEach((heading) => {
        const key = keys[heading.textContent.trim()];
        const list = heading.nextElementSibling;
        if (key && list) sections[key] = Array.from(list.querySelectorAll("li")).map((item) => item.textContent.trim()).filter(Boolean);
      });
    }
    let current = null;
    String(content || "").split(/\r?\n/).forEach((line) => {
      const heading = line.match(/^##\s+(.+)$/)?.[1]?.trim();
      if (heading) { current = keys[heading] || null; return; }
      const item = line.match(/^\s*-\s+(.+)$/)?.[1]?.trim();
      if (current && item) sections[current].push(item);
    });
    Object.keys(sections).forEach((key) => {
      if (!sections[key].length) sections[key] = ["해당 기간의 데이터가 없습니다."];
    });
    return sections;
  };

  function ensurePeriodModal() {
    if (document.getElementById("reportPeriodModal")) return;
    const modal = document.createElement("div");
    modal.id = "reportPeriodModal";
    modal.className = "modal-overlay";
    modal.onclick = (event) => { if (event.target === modal) closeModal("reportPeriodModal"); };
    modal.innerHTML = `<div class="modal slide-up" style="width:min(460px,92vw)" onclick="event.stopPropagation()">
      <div class="modal-title" id="reportPeriodTitle">보고서 기간 선택</div>
      <div class="modal-sub">선택한 기간 당시의 완료 업무, 진행 업무, AI 분석 및 리스크를 기준으로 초안을 생성합니다.</div>
      <div><div class="form-label" id="reportPeriodLabel">주 선택</div><input class="form-input" id="reportPeriodInput" type="week"></div>
      <div class="modal-actions"><button class="tbtn" onclick="closeModal('reportPeriodModal')">취소</button><button class="tbtn primary" onclick="confirmReportDraftPeriod()"><i class="ti ti-wand"></i> AI 초안 생성</button></div>
    </div>`;
    document.body.appendChild(modal);
  }

  function weekValue(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return `${target.getUTCFullYear()}-W${String(Math.ceil((((target - yearStart) / 86400000) + 1) / 7)).padStart(2, "0")}`;
  }

  function weekStart(value) {
    const [yearText, weekText] = String(value).split("-W");
    const januaryFourth = new Date(Date.UTC(Number(yearText), 0, 4));
    const monday = new Date(januaryFourth);
    monday.setUTCDate(januaryFourth.getUTCDate() - (januaryFourth.getUTCDay() || 7) + 1 + ((Number(weekText) - 1) * 7));
    return monday.toISOString().slice(0, 10);
  }

  window.generateReportDraft = function () {
    ensurePeriodModal();
    const type = getActiveReportPeriod();
    const input = document.getElementById("reportPeriodInput");
    input.type = type === "monthly" ? "month" : "week";
    input.value = type === "monthly" ? new Date().toISOString().slice(0, 7) : weekValue(new Date());
    document.getElementById("reportPeriodTitle").textContent = `${getReportTypeLabel(type)} 기간 선택`;
    document.getElementById("reportPeriodLabel").textContent = type === "monthly" ? "월 선택" : "주 선택";
    openModal("reportPeriodModal");
  };

  window.confirmReportDraftPeriod = async function () {
    const type = getActiveReportPeriod();
    const value = document.getElementById("reportPeriodInput")?.value;
    if (!value) return showToast("보고서 기간을 선택해주세요.", "warn");
    const startDate = type === "monthly" ? `${value}-01` : weekStart(value);
    try {
      const generated = await window.opsRadarApi.request("/reports/generate", {
        method: "POST",
        body: JSON.stringify({ period: type, start_date: startDate }),
      });
      const sections = window.parseReportMarkdown(generated.content);
      const draft = {
        id: generated.report_id, apiId: generated.report_id, type,
        title: type === "monthly" ? `${startDate.slice(0, 7)} 월간 운영 보고서` : `${startDate} 주간 운영 보고서`,
        period: `${generated.start_date} ~ ${generated.end_date}`,
        sections, markdown: generated.content, html: generated.content, createdAt: new Date().toISOString(),
      };
      closeModal("reportPeriodModal");
      await window.opsRadarApi.loadReports();
      window.renderReportDraft({ ...draft, sections: Object.entries(sections).map(([key, items]) => [labels[key], items]) });
      G.currentReportDraft = draft;
      showToast(
        generated.generation_mode === "fallback"
          ? `${getReportTypeLabel(type)} 근거 기반 초안을 생성했습니다. AI 연결 상태를 확인하면 더 풍부한 판단 문서로 생성됩니다.`
          : `${getReportTypeLabel(type)} AI 초안을 생성했습니다.`,
        generated.generation_mode === "fallback" ? "info" : "success",
      );
    } catch (error) {
      console.warn("Report draft generation failed", error);
      showToast(`보고서 초안 생성에 실패했습니다. ${error.message || ""}`, "warn");
    }
  };

  window.deleteReport = async function (reportId) {
    if (!confirm("이 보고서를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.")) return;
    try {
      if (reportId && !String(reportId).startsWith("sample-")) {
        await window.opsRadarApi.request(`/reports/${reportId}`, { method: "DELETE" });
      }
      persistReports(fetchReports().filter((report) => report.id !== reportId));
      G.selectedReportId = null;
      await window.opsRadarApi.loadReports();
      renderReportList();
      showToast("보고서를 삭제했습니다.", "success");
    } catch (error) {
      console.warn("Report delete failed", error);
      showToast("보고서 삭제에 실패했습니다.", "warn");
    }
  };
})();
