const pageStack = document.querySelector("#pageStack");
const assistantShell = document.querySelector("#assistantShell");
const heroForm = document.querySelector("#heroForm");
const heroInput = document.querySelector("#heroInput");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const messageList = document.querySelector("#messageList");
const threadList = document.querySelector("#threadList");
const chatTitle = document.querySelector("#chatTitle");
const opsTitle = document.querySelector("#opsTitle");
const opsEyebrow = document.querySelector("#opsEyebrow");
const opsShell = document.querySelector(".ops-shell");
const personalTodoList = document.querySelector("#personalTodoList");
const approvalQueue = document.querySelector("#approvalQueue");
const approvalCount = document.querySelector("#approvalCount");
const assignmentForm = document.querySelector("#assignmentForm");
const analysisFileList = document.querySelector("#analysisFileList");
const taskDetailPanel = document.querySelector("#taskDetailPanel");
const teamChatForm = document.querySelector("#teamChatForm");
const teamChatInput = document.querySelector("#teamChatInput");
const themeToggle = document.querySelector("#themeToggle");

let channels = [];
let activeChannelId = null;
let currentRole = "lead";
let taskSeq = 4;

const opsMeta = {
  dashboard: ["Dashboard", "오늘 봐야 할 운영 신호"],
  todo: ["TODO", "담당자별 업무와 마감"],
  calendar: ["Calendar", "팀 일정 크게 보기"],
  teamchat: ["Team Chat", "팀 대화와 결정사항"],
  analysis: ["AI 분석(자료실)", "자료 업로드와 분석 결과"],
  issues: ["이슈로그", "위험 이슈와 후보 관리"],
  reports: ["보고서", "주간 / 월간 보고서 초안"],
  handoff: ["팀 브리핑", "다음 담당자를 위한 운영 맥락"],
};

const personalTasks = [
  {
    id: "task-1",
    title: "대시보드 최종 화면 구조 반영",
    assignee: "Frontend",
    due: "2026-05-20",
    priority: "High",
    status: "승인됨",
    note: "좌측 메뉴와 캘린더 포함",
  },
  {
    id: "task-2",
    title: "마감 3일 전 이슈 자동 생성 규칙 정의",
    assignee: "PM",
    due: "2026-05-21",
    priority: "High",
    status: "진행중",
    note: "운영 정책 확인 필요",
  },
];

const pendingTasks = [
  {
    id: "task-3",
    title: "캘린더 출장 일정 정리",
    assignee: "Ops",
    due: "2026-05-22",
    priority: "Medium",
    status: "승인 대기",
    note: "팀별 출장/부재 표시",
  },
];

function icon(name) {
  return `<svg><use href="#${name}"></use></svg>`;
}

function jumpTo(pageId) {
  document.querySelector(`#${pageId}`).scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncDots() {
  const pageIndex = Math.round(pageStack.scrollTop / window.innerHeight);
  document.querySelectorAll(".dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === pageIndex);
  });
}

function fitTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
}

function switchOpsView(viewName) {
  if (!opsMeta[viewName]) return;

  document.querySelectorAll(".ops-view").forEach((view) => {
    view.classList.toggle("active", view.id === `ops-view-${viewName}`);
  });

  document.querySelectorAll(".ops-menu-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.opsView === viewName);
  });

  opsEyebrow.textContent = opsMeta[viewName][0];
  opsTitle.textContent = opsMeta[viewName][1];
}

function switchRole(role) {
  currentRole = role;
  opsShell.classList.toggle("role-lead", role === "lead");
  opsShell.classList.toggle("role-member", role === "member");
  document.querySelectorAll(".role-switch [data-role]").forEach((button) => {
    button.classList.toggle("active", button.dataset.role === role);
  });

  if (role === "member") {
    switchTodoTab("personal");
  }
}

function switchTodoTab(tabName) {
  document.querySelectorAll("[data-todo-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.todoTab === tabName);
  });
  document.querySelectorAll(".todo-tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `todo-tab-${tabName}`);
  });
}

function switchReportTab(tabName) {
  document.querySelectorAll("[data-report-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.reportTab === tabName);
  });
  document.querySelectorAll(".report-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `report-${tabName}`);
  });
}

function renderTodoState() {
  personalTodoList.innerHTML = personalTasks.map(renderTaskCard).join("");
  approvalQueue.innerHTML = pendingTasks.length
    ? pendingTasks.map(renderApprovalCard).join("")
    : `<div class="empty-state">승인 대기 업무가 없습니다.</div>`;
  approvalCount.textContent = `${pendingTasks.length}건`;
}

function renderTaskCard(task) {
  return `
    <article class="todo-task">
      <header>
        <h4>${escapeHtml(task.title)}</h4>
        <span class="date-chip">${escapeHtml(task.status)}</span>
      </header>
      <div class="task-meta">
        <span>${escapeHtml(task.assignee)}</span>
        <span>${formatDate(task.due)}</span>
        <span>${escapeHtml(task.priority)}</span>
        <span>${task.id === "task-1" ? "자료에서 추출됨" : "팀장 배정"}</span>
      </div>
      <p>${escapeHtml(task.note || "메모 없음")}</p>
      <button class="task-link" type="button" data-task-detail="${task.id}">확인하기 →</button>
    </article>
  `;
}

function renderApprovalCard(task) {
  return `
    <article class="approval-card">
      <header>
        <h4>${escapeHtml(task.title)}</h4>
        <span class="date-chip">${escapeHtml(task.priority)}</span>
      </header>
      <div class="task-meta">
        <span>담당 ${escapeHtml(task.assignee)}</span>
        <span>${formatDate(task.due)}</span>
        <span>${escapeHtml(task.status)}</span>
      </div>
      <p>${escapeHtml(task.note || "메모 없음")}</p>
      <button class="approve-button" type="button" data-approve-task="${task.id}">승인해서 배정</button>
    </article>
  `;
}

function addCalendarSchedule(task) {
  const travelList = document.querySelector(".travel-list");
  const row = document.createElement("div");
  row.innerHTML = `<strong>${escapeHtml(task.assignee)}</strong><span>${escapeHtml(task.title)} · ${formatDate(task.due)}</span>`;
  travelList.prepend(row);
}

function formatDate(value) {
  return value.replaceAll("-", ".");
}

function openTaskDetail(taskId) {
  const task = [...personalTasks, ...pendingTasks].find((item) => item.id === taskId);
  if (!task) return;

  taskDetailPanel.innerHTML = `
    <span class="section-label">Task Detail</span>
    <h3>${escapeHtml(task.title)}</h3>
    <div class="task-meta">
      <span>담당 ${escapeHtml(task.assignee)}</span>
      <span>${formatDate(task.due)}</span>
      <span>${escapeHtml(task.priority)}</span>
      <span>${escapeHtml(task.status)}</span>
    </div>
    <p>${escapeHtml(task.note || "메모 없음")}</p>
    <div class="detail-actions">
      <button type="button">진행 시작</button>
      <button type="button">완료 처리</button>
      <button type="button">팀채팅 공유</button>
    </div>
  `;
}

function makeTitle(text) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 22 ? `${trimmed.slice(0, 22)}...` : trimmed || "새 대화";
}

function createChannel(seedText) {
  const channel = {
    id: crypto.randomUUID ? crypto.randomUUID() : `channel-${Date.now()}`,
    title: makeTitle(seedText),
    createdAt: new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
    messages: [],
  };

  channels = [channel, ...channels];
  activeChannelId = channel.id;
  assistantShell.classList.add("conversation-mode");
  renderThreads();
  renderMessages();
  return channel;
}

function activeChannel() {
  return channels.find((channel) => channel.id === activeChannelId);
}

function appendMessage(role, text) {
  const channel = activeChannel();
  if (!channel) return;

  channel.messages.push({ role, text });
  renderMessages();
}

function submitPrompt(text) {
  const prompt = text.trim();
  if (!prompt) return;

  if (!activeChannel()) createChannel(prompt);
  appendMessage("user", prompt);
  window.setTimeout(() => appendMessage("assistant", answerFor(prompt)), 180);
}

function renderThreads() {
  threadList.innerHTML = channels
    .map(
      (channel) => `
        <button class="thread-item ${channel.id === activeChannelId ? "active" : ""}" type="button" data-channel="${channel.id}">
          <strong>${escapeHtml(channel.title)}</strong>
          <span>${channel.createdAt}</span>
        </button>
      `
    )
    .join("");
}

function renderMessages() {
  const channel = activeChannel();
  chatTitle.textContent = channel ? channel.title : "새 대화";

  if (!channel) {
    messageList.innerHTML = "";
    return;
  }

  messageList.innerHTML = channel.messages
    .map(
      (message) => `
        <article class="message ${message.role}">
          <strong>${message.role === "user" ? "성호님" : "OpsRadar AI"}</strong>
          <div class="bubble">${escapeHtml(message.text)}</div>
        </article>
      `
    )
    .join("");

  messageList.scrollTop = messageList.scrollHeight;
  renderThreads();
}

function startFresh() {
  activeChannelId = null;
  assistantShell.classList.remove("conversation-mode");
  heroInput.value = "";
  fitTextarea(heroInput);
  window.setTimeout(() => heroInput.focus(), 80);
}

function answerFor(prompt) {
  if (prompt.includes("위험") || prompt.toLowerCase().includes("risk")) {
    return "현재 가장 큰 위험은 Azure API timeout 반복과 근거 문서가 약한 Todo입니다. 먼저 High Risk 2건을 이슈로 고정하고, Blocked 2건은 담당자 확인 플로우로 넘기는 게 좋아요.";
  }

  if (prompt.includes("Blocked") || prompt.includes("blocked") || prompt.includes("블록")) {
    return "Blocked Todo는 RAG 검색 정확도 개선, Dashboard API 응답 속도 개선 2건입니다. 둘 다 백엔드 의존성이 있어 담당자와 마감일을 먼저 확정하는 흐름이 맞습니다.";
  }

  if (prompt.includes("보고서")) {
    return "주간 보고서는 1. 요약, 2. 완료된 Todo, 3. High Risk 이슈, 4. 다음 주 액션 순서로 잡으면 깔끔합니다. 이번 주 핵심 문장은 '위험 이슈를 먼저 닫고 근거 약한 Todo를 분리한다'로 두면 됩니다.";
  }

  if (prompt.includes("timeout") || prompt.includes("API")) {
    return "Azure API timeout은 반복 발생 기록이 있고 사용자 영향도가 높아서 High Risk로 보는 게 맞습니다. 로그 시간대, 재시도 정책, 평균 응답 시간을 같이 묶어 확인하면 원인 추적이 빨라집니다.";
  }

  return "좋아요. 지금 맥락에서는 Todo, 이슈, 보고서 근거를 함께 묶어서 보는 방식이 가장 자연스럽습니다. 필요한 답변을 운영 액션 단위로 정리해드릴게요.";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("click", (event) => {
  const jumpTarget = event.target.closest("[data-jump]");
  if (jumpTarget) {
    jumpTo(jumpTarget.dataset.jump);
    return;
  }

  const promptTarget = event.target.closest("[data-prompt]");
  if (promptTarget) {
    createChannel(promptTarget.dataset.prompt);
    appendMessage("user", promptTarget.dataset.prompt);
    window.setTimeout(() => appendMessage("assistant", answerFor(promptTarget.dataset.prompt)), 180);
    return;
  }

  const dashboardPrompt = event.target.closest("[data-dashboard-prompt]");
  if (dashboardPrompt) {
    jumpTo("assistantPage");
    createChannel(dashboardPrompt.dataset.dashboardPrompt);
    appendMessage("user", dashboardPrompt.dataset.dashboardPrompt);
    window.setTimeout(() => appendMessage("assistant", answerFor(dashboardPrompt.dataset.dashboardPrompt)), 180);
    return;
  }

  const opsTarget = event.target.closest("[data-ops-view]");
  if (opsTarget) {
    switchOpsView(opsTarget.dataset.opsView);
    return;
  }

  const roleTarget = event.target.closest(".role-switch [data-role]");
  if (roleTarget) {
    switchRole(roleTarget.dataset.role);
    return;
  }

  const todoTab = event.target.closest("[data-todo-tab]");
  if (todoTab) {
    switchTodoTab(todoTab.dataset.todoTab);
    return;
  }

  const reportTab = event.target.closest("[data-report-tab]");
  if (reportTab) {
    switchReportTab(reportTab.dataset.reportTab);
    return;
  }

  const approveTarget = event.target.closest("[data-approve-task]");
  if (approveTarget) {
    const index = pendingTasks.findIndex((task) => task.id === approveTarget.dataset.approveTask);
    if (index < 0) return;
    const [task] = pendingTasks.splice(index, 1);
    task.status = "승인됨";
    personalTasks.unshift(task);
    addCalendarSchedule(task);
    renderTodoState();
    switchTodoTab("personal");
    return;
  }

  const detailTarget = event.target.closest("[data-task-detail]");
  if (detailTarget) {
    openTaskDetail(detailTarget.dataset.taskDetail);
    return;
  }

  const thread = event.target.closest("[data-channel]");
  if (thread) {
    activeChannelId = thread.dataset.channel;
    assistantShell.classList.add("conversation-mode");
    renderMessages();
  }
});

heroForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = heroInput.value;
  if (!value.trim()) return;
  createChannel(value);
  submitPrompt(value);
  heroInput.value = "";
  fitTextarea(heroInput);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = chatInput.value;
  submitPrompt(value);
  chatInput.value = "";
});

heroInput.addEventListener("input", () => fitTextarea(heroInput));

heroInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    heroForm.requestSubmit();
  }
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

document.querySelector("#newChatBtn").addEventListener("click", startFresh);
document.querySelector("#railNewChat").addEventListener("click", startFresh);

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "Light" : "Dark";
  themeToggle.setAttribute("aria-label", isDark ? "라이트모드 켜기" : "다크모드 켜기");
});

teamChatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = teamChatInput.value.trim();
  if (!text) return;
  const message = document.createElement("div");
  message.className = "team-message";
  message.innerHTML = `<strong>성호</strong><p>${escapeHtml(text)}</p>`;
  teamChatForm.before(message);
  teamChatInput.value = "";
});

assignmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  pendingTasks.unshift({
    id: `task-${taskSeq++}`,
    title: document.querySelector("#taskInput").value.trim(),
    assignee: document.querySelector("#assigneeInput").value,
    due: document.querySelector("#dueInput").value,
    priority: document.querySelector("#priorityInput").value,
    status: "승인 대기",
    note: document.querySelector("#taskNoteInput").value.trim() || "팀장이 승인하면 개인 TODO와 캘린더에 반영됩니다.",
  });
  assignmentForm.reset();
  document.querySelector("#dueInput").value = "2026-05-21";
  renderTodoState();
  switchTodoTab("approval");
});

document.querySelector("#chooseFile").addEventListener("click", () => {
  document.querySelector("#fileInput").click();
});

document.querySelector("#fileInput").addEventListener("change", (event) => {
  [...event.target.files].forEach((file) => {
    const row = document.createElement("article");
    row.innerHTML = `<strong>${escapeHtml(file.name)}</strong><span>업로드됨 · AI 분석 대기</span>`;
    analysisFileList.prepend(row);
  });
  event.target.value = "";
});

pageStack.addEventListener("scroll", () => {
  window.clearTimeout(window.__dotTimer);
  window.__dotTimer = window.setTimeout(syncDots, 50);
});

window.addEventListener("resize", syncDots);

renderTodoState();
switchRole("lead");
syncDots();
