import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendRoot, "..");
const legacyRoot = path.join(repoRoot, "opsradar2", "frontend");
const publicStaticRoot = path.join(frontendRoot, "public", "static");
const legacyModulePath = path.join(frontendRoot, "src", "legacy", "legacyMarkup.js");
const legacyScreensDir = path.join(frontendRoot, "src", "legacy", "screens");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

function replaceAll(source, replacements) {
  let next = source;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  return next;
}

function patchLegacyAppJs() {
  const appPath = path.join(publicStaticRoot, "js", "app.js");
  const apiIntegrationPath = path.join(publicStaticRoot, "js", "api-integration.js");
  const analysisPath = path.join(publicStaticRoot, "js", "analysis.js");
  const calendarPath = path.join(publicStaticRoot, "js", "calendar.js");
  const chatPath = path.join(publicStaticRoot, "js", "chat.js");
  const cleanBootstrapPath = path.join(publicStaticRoot, "js", "clean-bootstrap.js");
  const dashboardPath = path.join(publicStaticRoot, "js", "dashboard.js");
  const handoffPath = path.join(publicStaticRoot, "js", "handoff.js");
  const issueDataPath = path.join(publicStaticRoot, "js", "issue-data.js");
  const issuePath = path.join(publicStaticRoot, "js", "issue.js");
  const miniCalendarChatPath = path.join(publicStaticRoot, "js", "mini-calendar-chat.js");
  const reportPath = path.join(publicStaticRoot, "js", "report.js");
  const runtimeStatePath = path.join(publicStaticRoot, "js", "runtime-state.js");
  const runtimeUtilsPath = path.join(publicStaticRoot, "js", "runtime-utils.js");
  const settingsPath = path.join(publicStaticRoot, "js", "settings.js");
  const shellPath = path.join(publicStaticRoot, "js", "shell.js");
  const todoPath = path.join(publicStaticRoot, "js", "todo.js");
  let appSource = fs.readFileSync(appPath, "utf8");
  let analysisSource = fs.existsSync(analysisPath) ? fs.readFileSync(analysisPath, "utf8") : "";
  let calendarSource = fs.readFileSync(calendarPath, "utf8");
  let cleanBootstrapSource = fs.existsSync(cleanBootstrapPath) ? fs.readFileSync(cleanBootstrapPath, "utf8") : "";
  let dashboardSource = fs.readFileSync(dashboardPath, "utf8");
  let handoffSource = fs.readFileSync(handoffPath, "utf8");
  let issueDataSource = fs.existsSync(issueDataPath) ? fs.readFileSync(issueDataPath, "utf8") : "";
  let issueSource = fs.readFileSync(issuePath, "utf8");
  let miniCalendarChatSource = fs.existsSync(miniCalendarChatPath) ? fs.readFileSync(miniCalendarChatPath, "utf8") : "";
  let reportSource = fs.readFileSync(reportPath, "utf8");
  let runtimeUtilsSource = fs.existsSync(runtimeUtilsPath) ? fs.readFileSync(runtimeUtilsPath, "utf8") : "";
  let settingsSource = fs.readFileSync(settingsPath, "utf8");
  let shellSource = fs.existsSync(shellPath) ? fs.readFileSync(shellPath, "utf8") : "";
  let todoSource = fs.readFileSync(todoPath, "utf8");

  dashboardSource = dashboardSource.replace(/^\s+'switchDbRole',\r?\n/m, "");
  calendarSource = calendarSource.replace(/^\s+'miniChat',\r?\n/m, "");

  // The legacy file has old implementations followed by newer implementations
  // for several functions. Static browser serving tolerated those duplicates,
  // but Vite/Node syntax checks reject them. Keep the later implementation as
  // the public function and rename the first implementation.
  const duplicateLegacyFunctions = [
    "getHandoffPreviewData",
    "generateHandoffPreview",
    "renderHandoffPreview",
    "closeHandoffPreview",
    "renderCalendar",
    "registerCalEvent",
    "openCalModal",
    "addCalTag",
    "deleteCalTag",
    "selectKnowledgeType",
    "addAISuggestEvent",
  ];

  for (const name of duplicateLegacyFunctions) {
    const declaration = new RegExp(`function\\s+${name}\\s*\\(`);
    appSource = appSource.replace(declaration, `function ${name}LegacyInitial(`);
  }

  const extractedReportBlock = extractSourceRange(appSource, "const REPORT_STORAGE_KEY", "function nav(");
  appSource = extractedReportBlock.source;

  for (const name of [
    "getHandoffPreviewDataLegacyInitial",
    "generateHandoffPreviewLegacyInitial",
    "renderHandoffPreviewLegacyInitial",
    "closeHandoffPreviewLegacyInitial",
    "renderCalendarLegacyInitial",
    "registerCalEventLegacyInitial",
    "openCalModalLegacyInitial",
    "addCalTagLegacyInitial",
    "deleteCalTagLegacyInitial",
    "selectKnowledgeTypeLegacyInitial",
    "addAISuggestEventLegacyInitial",
  ]) {
    appSource = extractTopLevelFunction(appSource, name).source;
  }

  for (const name of ["switchDbRole"]) {
    appSource = extractTopLevelFunction(appSource, name).source;
  }

  for (const name of [
    "openIssueDetail",
    "closeIssueDetail",
    "renderDashboardIssueDetail",
    "updateIssueDashboard",
  ]) {
    appSource = extractTopLevelFunction(appSource, name).source;
  }

  const removedTodoRenderFunctions = [
    "getFilteredTodos",
    "renderTodos",
    "priB",
    "statusB",
    "confC",
    "actionB",
    "toggleTodoCheck",
    "selectTodo",
    "renderTodoDetail",
    "toggleAllChk",
    "updateTodoCounts",
    "switchTodoTab",
    "switchTodoView",
    "renderTodoCards",
  ];
  for (const name of removedTodoRenderFunctions) {
    appSource = extractTopLevelFunction(appSource, name).source;
  }

  const migratedTodoActionNames = [
    "approveTodo",
    "rejectTodo",
    "doneTodo",
    "undoTodo",
    "afterTodoAction",
    "bulkApprove",
    "openEditModal",
    "saveEdit",
    "openManualModal",
    "saveManual",
  ];
  const migratedTodoActions = [];
  for (const name of migratedTodoActionNames) {
    const extracted = extractTopLevelFunction(appSource, name);
    appSource = extracted.source;
    migratedTodoActions.push(extracted.functionSource.trim());
  }
  const migratedTodoActionSource = migratedTodoActions.join("\n\n").trim();

  const removedIssueRenderFunctions = [
    "switchIssueTab",
    "renderIssues",
    "selectIssue",
    "renderIssueDetail",
    "hideIssueDetail",
  ];
  for (const name of removedIssueRenderFunctions) {
    appSource = extractTopLevelFunction(appSource, name).source;
  }

  const migratedIssueActionNames = [
    "openTodoCreate",
    "confirmTodoCreate",
    "getIssueApiId",
    "resolveIssue",
    "openConfirmIssue",
    "doConfirmIssue",
    "dismissIssue",
    "doRemoveIssue",
    "openIssueCreateModal",
    "closeIssueCreateModal",
    "saveIssueCreate",
  ];
  const migratedIssueActions = [];
  for (const name of migratedIssueActionNames) {
    const extracted = extractTopLevelFunction(appSource, name);
    appSource = extracted.source;
    migratedIssueActions.push(extracted.functionSource.trim());
  }
  const migratedIssueActionSource = migratedIssueActions.join("\n\n").trim();

  const removedCalendarFunctionNames = [
    "showCalBanner",
    "openAISuggestModal",
    "ensureCalendarState",
    "eventMatchesMonth",
    "filterEventsByMonth",
    "findCalEventForDay",
    "findNewCalEventForDay",
    "updateCalendarHeader",
    "renderCalendar",
    "goToPrevMonth",
    "goToNextMonth",
    "openCalModal",
    "addCalTag",
    "deleteCalTag",
    "registerCalEvent",
    "addAISuggestEvent",
    "initCalendarMonthControls",
    "initCalendarModalOverlayClose",
  ];
  for (const name of removedCalendarFunctionNames) {
    appSource = extractTopLevelFunction(appSource, name).source;
  }

  appSource = extractTopLevelFunction(appSource, "renderKnowledgeAbsence").source;
  const extractedHandoffBlock = extractSourceRange(appSource, "let currentKType = 'onboarding';", "function formatOpsDate");
  appSource = extractedHandoffBlock.source;

  const extractedChatBlock = extractSourceRange(appSource, "function parseScheduleMsg", "function formatOpsDate");
  appSource = extractedChatBlock.source;

  const removedSettingsFunctionNames = [
    "setOpsRadarTheme",
    "setOpsRadarSkin",
    "initOpsRadarSkin",
    "getStoredUserInfo",
    "updateSettingsPage",
    "logout",
  ];
  for (const name of removedSettingsFunctionNames) {
    appSource = extractTopLevelFunction(appSource, name).source;
  }

  const extractedAnalysisBlock = extractSourceRange(appSource, "function ondov", "function applyDashboard");
  appSource = extractedAnalysisBlock.source;

  const dashboardFunctionNames = [
    "applyDashboard",
    "fetchDashboard",
  ];
  const migratedDashboardFunctions = [];

  for (const name of dashboardFunctionNames) {
    const extracted = extractTopLevelFunction(appSource, name);
    appSource = extracted.source;
    migratedDashboardFunctions.push(extracted.functionSource.trim());
  }

  const extractedAnalysisTailBlock = extractSourceRange(appSource, "function resetFlow", "function persistIssues");
  appSource = extractedAnalysisTailBlock.source;
  const extractedIssueDataBlock = extractSourceRange(appSource, "function persistIssues", "function miniChat");
  appSource = extractedIssueDataBlock.source;
  const extractedIssueDetailBlock = extractSourceRange(appSource, "function getIssueDetailData", "(function initOpsRadarCleanVersion");
  appSource = extractedIssueDetailBlock.source;
  const migratedIssueDataSource = [
    extractedIssueDataBlock.rangeSource,
    extractedIssueDetailBlock.rangeSource,
  ].join("\n")
    .replace(/^window\.openIssueDetail = openIssueDetail;\r?\n/gm, "")
    .replace(/^window\.closeIssueDetail = closeIssueDetail;\r?\n/gm, "")
    .replace(/^window\.renderDashboardIssueDetail = renderDashboardIssueDetail;\r?\n/gm, "")
    .replace(/^setTimeout\(initOpsRadarSkin, 0\);\r?\n/gm, "")
    .replace("renderIssueDetail(issue);", "window.renderIssueDetail?.(issue);")
    .trim();
  const extractedMiniCalendarChatBlock = extractSourceRange(appSource, "function miniChat", "function toggleColorPicker");
  appSource = extractedMiniCalendarChatBlock.source;
  let migratedMiniCalendarChatSource = extractedMiniCalendarChatBlock.rangeSource
    .replace(
      "const parsed=parseScheduleMsg(msg);",
      "const parsed=window.parseScheduleMsg?.(msg) || { person: '일정', date: '', type: '일정' };",
    )
    .trim();
  migratedMiniCalendarChatSource = migratedMiniCalendarChatSource
    .replace(
      "await window.opsRadarCreateCalendarEvent({title:`${parsed.person} ${parsed.type}`,day,month,year:G.currentCalYear,color:parsed.type==='부재'?'ct-gray':'ct-info'});",
      "const calendarRuntime=window.getCalendarRuntimeState?.()||{};await window.opsRadarCreateCalendarEvent({title:`${parsed.person} ${parsed.type}`,day,month,year:calendarRuntime.currentCalYear,color:parsed.type==='부재'?'ct-gray':'ct-info'});",
    )
    .replace(
      "G.newCalEvents.push({...parsed,calDate:day,y:G.currentCalYear,m:month});",
      "window.addCalendarRuntimeEvent?.(parsed,day,month);",
    )
    .replace(
      "renderCalendar(G.currentCalYear,G.currentCalMonth);",
      "renderCalendar(calendarRuntime.currentCalYear,calendarRuntime.currentCalMonth);",
    );
  const extractedCleanBootstrapBlock = extractSourceFrom(appSource, "(function initOpsRadarCleanVersion");
  appSource = extractedCleanBootstrapBlock.source;
  let migratedCleanBootstrapSource = extractedCleanBootstrapBlock.rangeSource.trim();
  migratedCleanBootstrapSource = migratedCleanBootstrapSource.replace(
    "if(window.G){ G.calEvents = []; G.newCalEvents = []; G.analysisHistory = []; G.createdTodosFromIssue = []; }",
    "if(window.G){ G.createdTodosFromIssue = []; }\n    window.resetCalendarRuntimeData?.();\n    window.resetAnalysisRuntimeData?.();",
  );
  const extractedRuntimeTextBlock = extractSourceRange(appSource, "function normalizeText", "function nav");
  appSource = extractedRuntimeTextBlock.source;
  const extractedRuntimeDateBlock = extractSourceFrom(appSource, "function formatOpsDate");
  appSource = extractedRuntimeDateBlock.source;
  const migratedRuntimeUtilsSource = [
    extractedRuntimeTextBlock.rangeSource,
    extractedRuntimeDateBlock.rangeSource,
  ].join("\n").trim();
  const extractedCalendarColorBlock = extractSourceFrom(appSource, "function toggleColorPicker");
  appSource = extractedCalendarColorBlock.source;
  const migratedCalendarColorSource = extractedCalendarColorBlock.rangeSource.trim();
  appSource = buildCoreAppSource();

  const migratedDashboardSource = migratedDashboardFunctions
    .join("\n\n")
    .replace(/^window\.(switchDbRole|applyDashboard|fetchDashboard|updateIssueDashboard|openIssueDetail|closeIssueDetail|renderDashboardIssueDetail) = .*;\r?\n?/gm, "")
    .trim();

  appSource = appSource
    .replace(/^window\.switchDbRole = switchDbRole;\r?\n/gm, "")
    .replace(/^window\.fetchDashboard = fetchDashboard;\r?\n/gm, "")
    .replace(/^let todoViewMode = 'table';\r?\n/gm, "")
    .replace(/^updateTodoCounts\(\);\r?\n/gm, "")
    .replace(/^window\.openIssueCreateModal = openIssueCreateModal;\r?\n/gm, "")
    .replace(/^window\.closeIssueCreateModal = closeIssueCreateModal;\r?\n/gm, "")
    .replace(/^window\.saveIssueCreate = saveIssueCreate;\r?\n/gm, "")
    .replace(/^setTimeout\(async \(\) => \{ await fetchIssues\(\); renderIssues\(\); fetchDashboard\(\); \}, 0\);\r?\n/gm, "")
    .replace(/^window\.openIssueDetail = openIssueDetail;\r?\n/gm, "")
    .replace(/^window\.closeIssueDetail = closeIssueDetail;\r?\n/gm, "")
    .replace(/^window\.renderDashboardIssueDetail = renderDashboardIssueDetail;\r?\n/gm, "")
    .replace(/^renderCalendar\(\);\r?\n/gm, "")
    .replace(/^setTimeout\(\(\) => \{ initCalendarMonthControls\(\); renderCalendar\(\); \}, 0\);\r?\n/gm, "")
    .replace(/^setTimeout\(initCalendarModalOverlayClose, 0\);\r?\n/gm, "")
    .replace(
      /  window\.getHandoffPreviewData = function\(type\)\{[\s\S]*?\r?\n  \};\r?\n(?=  window\.getReportDraftData = function\(\)\{)/,
      "",
    )
    .replace("if (screen === 'reports') initReportsScreen();", "if (screen === 'reports') window.initReportsScreen?.();")
    .replace("if (screen === 'chat') initChatSessions();", "if (screen === 'chat') window.initChatSessions?.();")
    .replace("if (screen === 'settings') updateSettingsPage();", "if (screen === 'settings') window.updateSettingsPage?.();")
    .replace(
      /if \(screen === 'knowledge'\) \{[\s\S]*?selectKnowledgeType\('onboarding'\);\r?\n  \}/,
      "if (screen === 'knowledge') window.selectKnowledgeType?.(G.currentKnowledgeType || 'onboarding');",
    )
    .replace(/^setTimeout\(initDocumentGenerationActions, 0\);\r?\n/gm, "setTimeout(() => window.initDocumentGenerationActions?.(), 0);\n")
    .replace(/^setTimeout\(bindRemainingActionButtons, 0\);\r?\n/gm, "setTimeout(() => window.bindRemainingActionButtons?.(), 0);\n")
    .replace(/^window\.setOpsRadarTheme = setOpsRadarTheme;\r?\n/gm, "")
    .replace(/^window\.setOpsRadarSkin = setOpsRadarSkin;\r?\n/gm, "")
    .replace(/^window\.updateSettingsPage = updateSettingsPage;\r?\n/gm, "")
    .replace(/^window\.logout = logout;\r?\n/gm, "")
    .replace(/^setTimeout\(initOpsRadarSkin, 0\);\r?\n/gm, "");

  dashboardSource = `${dashboardSource.trim()}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Keep these globals until dashboard data/detail behavior is fully React-owned.
${migratedDashboardSource}

function mapDashboardIssueToRisk(issue) {
  const issueId = \`manual-\${issue.id}\`;
  ISSUE_DETAIL_MOCK[issueId] = {
    id: issueId,
    title: issue.title,
    severity: issue.severity.toUpperCase(),
    status: issue.status,
    elapsed: \`\${issue.days || 0}일\`,
    assignee: issue.assignee || '미지정',
    reason: issue.desc || '수동 등록된 이슈입니다.',
    dominoImpact: issue.dominoFinal || '영향 분석 대기',
    relatedTodos: [issue.suggestTodo || \`\${issue.title} 대응 Todo\`],
    relatedDocs: [issue.src || '수동 등록'],
    actions: ['대응 Todo 생성', '담당자 지정', '상태 변경'],
  };
  return {
    issueId,
    title: issue.title,
    description: issue.desc || '설명이 없습니다.',
    action: '대응 Todo 생성',
    badge: issue.severity === 'high' ? 'HIGH' : issue.severity.toUpperCase(),
    badgeClass: issue.severity === 'high' ? 'badge b-danger' : issue.severity === 'medium' ? 'badge b-warn' : 'badge b-gray',
    meta: [issue.status, \`\${issue.days || 0}일 경과\`],
    domino: issue.dominoFinal || '영향 분석 대기',
  };
}

function getDashboardRiskSummaries() {
  const confirmed = issues.filter((issue) => issue.type === 'confirmed');
  return confirmed
    .filter((issue) => issue.severity === 'high' && issue.status !== 'resolved')
    .slice(0, 3)
    .map(mapDashboardIssueToRisk);
}

function updateIssueDashboard() {
  const risks = getDashboardRiskSummaries();
  const issueCount = document.getElementById('issueCount');
  if (issueCount) issueCount.textContent = String(risks.length);
  window.dispatchEvent(new CustomEvent('opsradar:dashboard-risks-updated', { detail: { risks } }));
  return risks;
}

window.applyDashboard = applyDashboard;
window.fetchDashboard = fetchDashboard;
window.updateIssueDashboard = updateIssueDashboard;
window.getDashboardRiskSummaries = getDashboardRiskSummaries;
window.getDashboardIssueDetailData = function getDashboardIssueDetailData(issueId) {
  return getIssueDetailData(issueId);
};
window.openIssueDetail = function openIssueDetail(issueId) {
  window.dispatchEvent(new CustomEvent('opsradar:dashboard-issue-detail', { detail: { issueId } }));
};
window.closeIssueDetail = function closeIssueDetail() {
  window.dispatchEvent(new CustomEvent('opsradar:dashboard-issue-detail-close'));
};
window.renderDashboardIssueDetail = function renderDashboardIssueDetail(issueData) {
  window.dispatchEvent(new CustomEvent('opsradar:dashboard-issue-detail-data', { detail: { issueData } }));
};
setTimeout(async () => { await fetchIssues(); window.renderIssues?.(); fetchDashboard(); }, 0);
`;

  dashboardSource = dashboardSource.replace(
    "if(detailBtn) detailBtn.setAttribute('onclick', `openIssueDetail('manual-${issue.id}')`);",
    "if(detailBtn){ detailBtn.removeAttribute('onclick'); detailBtn.dataset.dashboardIssueDetail = `manual-${issue.id}`; }",
  );

  fs.writeFileSync(appPath, appSource, "utf8");
  fs.writeFileSync(calendarPath, `${calendarSource.trim()}

${buildCalendarReactBridge()}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Calendar color picker compatibility helpers.
${migratedCalendarColorSource}
window.toggleColorPicker = toggleColorPicker;
window.pickColor = pickColor;
`, "utf8");
  fs.writeFileSync(cleanBootstrapPath, `${cleanBootstrapSource.trim() || "window.OpsRadarFrontend?.registerModule('clean-bootstrap', { file: 'js/clean-bootstrap.js', screen: 'global' });"}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Empty-state fallback and initial clean runtime data bootstrap.
${migratedCleanBootstrapSource}
`, "utf8");
  fs.writeFileSync(dashboardPath, dashboardSource, "utf8");
  fs.writeFileSync(handoffPath, `${handoffSource.trim()}

${buildHandoffReactBridge()}
`, "utf8");
  fs.writeFileSync(issueDataPath, `${issueDataSource.trim() || "window.OpsRadarFrontend?.registerModule('issue-data', { file: 'js/issue-data.js', screen: 'issues' });"}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Issue API normalization, persistence fallback, and detail helper actions.
${migratedIssueDataSource}
`, "utf8");
  fs.writeFileSync(miniCalendarChatPath, `${miniCalendarChatSource.trim() || "window.OpsRadarFrontend?.registerModule('mini-calendar-chat', { file: 'js/mini-calendar-chat.js', screen: 'calendar' });"}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Natural-language mini calendar chat helper used by Calendar.jsx.
${migratedMiniCalendarChatSource}
window.miniChat = miniChat;
`, "utf8");
  fs.writeFileSync(issuePath, `${issueSource.trim()}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
${migratedIssueActionSource}

// React bridge generated by scripts/import-legacy.mjs.
// Active Issue rendering is owned by src/components/Issue.jsx.
(function installIssueReactBridge() {
  function getIssueTab() {
    return G.currentIssueTab || 'confirmed';
  }

  function getIssueCounts() {
    return {
      confirmed: issues.filter((issue) => issue.type === 'confirmed').length,
      candidate: issues.filter((issue) => issue.type === 'candidate').length,
      resolved: issues.filter((issue) => issue.type === 'resolved').length,
    };
  }

  function toIssueViewModel(issue) {
    return {
      ...issue,
      selected: G.selectedIssueId === issue.id,
      hasTodo: G.createdTodosFromIssue.some((todo) => todo.issueId === issue.id),
      createdTodos: G.createdTodosFromIssue.filter((todo) => todo.issueId === issue.id),
      domino: Array.isArray(issue.domino) ? issue.domino : [],
      history: Array.isArray(issue.history) ? issue.history : [],
    };
  }

  function getIssueSnapshot() {
    const currentTab = getIssueTab();
    const selectedIssue = issues.find((issue) => issue.id === G.selectedIssueId);
    return {
      currentTab,
      issues: issues.filter((issue) => issue.type === currentTab).map(toIssueViewModel),
      selectedIssue: selectedIssue ? toIssueViewModel(selectedIssue) : null,
      counts: getIssueCounts(),
    };
  }

  function emitIssueState() {
    window.dispatchEvent(new CustomEvent('opsradar:issue-state-updated', {
      detail: getIssueSnapshot(),
    }));
  }

  window.getIssueSnapshot = getIssueSnapshot;
  window.renderIssues = function renderIssues() {
    emitIssueState();
  };
  window.renderIssueDetail = function renderIssueDetail(id) {
    if (id !== undefined && id !== null) G.selectedIssueId = id;
    emitIssueState();
  };
  window.selectIssue = function selectIssue(id) {
    G.selectedIssueId = id;
    emitIssueState();
  };
  window.hideIssueDetail = function hideIssueDetail() {
    G.selectedIssueId = null;
    emitIssueState();
  };
  window.switchIssueTab = function switchIssueTab(tab) {
    G.currentIssueTab = tab;
    G.selectedIssueId = null;
    emitIssueState();
  };
  window.refreshIssueState = emitIssueState;

  setTimeout(emitIssueState, 0);
})();
`, "utf8");
  fs.writeFileSync(reportPath, `${reportSource.trim()}

${buildReportReactBridge()}
`, "utf8");
  fs.writeFileSync(runtimeStatePath, buildRuntimeStateSource(), "utf8");
  fs.writeFileSync(runtimeUtilsPath, `${runtimeUtilsSource.trim() || "window.OpsRadarFrontend?.registerModule('runtime-utils', { file: 'js/runtime-utils.js', screen: 'global' });"}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Shared text/date helpers used by legacy bridge modules.
${migratedRuntimeUtilsSource}
`, "utf8");
  fs.writeFileSync(analysisPath, `${analysisSource.trim() || "window.OpsRadarFrontend?.registerModule('analysis', { file: 'js/analysis.js', screen: 'analysis' });"}

${buildAnalysisReactBridge()}
`, "utf8");
  fs.writeFileSync(chatPath, buildChatReactBridge(), "utf8");
  fs.writeFileSync(settingsPath, `${settingsSource.trim()}

${buildSettingsReactBridge()}
`, "utf8");
  fs.writeFileSync(shellPath, `${shellSource.trim() || "window.OpsRadarFrontend?.registerModule('shell', { file: 'js/shell.js', screen: 'global' });"}

${buildShellBridge()}
`, "utf8");
  fs.writeFileSync(todoPath, `${todoSource.trim()}

// Migrated from legacy app.js by scripts/import-legacy.mjs.
${migratedTodoActionSource}

// React bridge generated by scripts/import-legacy.mjs.
// Active Todo rendering is owned by src/components/Todo.jsx.
(function installTodoReactBridge() {
  function getTodoCounts() {
    return {
      ai: todos.filter((todo) => todo.status === 'pending').length,
      inprogress: todos.filter((todo) => todo.status === 'approved').length,
      done: todos.filter((todo) => todo.status === 'done' || todo.status === 'rejected').length,
    };
  }

  function getTodoTab() {
    return G.currentTodoTab || 'ai';
  }

  function getTodoViewMode() {
    return window.__opsRadarTodoViewMode || 'table';
  }

  function getFilteredTodoRows() {
    const tab = getTodoTab();
    if (tab === 'ai') return todos.filter((todo) => todo.status === 'pending');
    if (tab === 'inprogress') return todos.filter((todo) => todo.status === 'approved');
    return todos.filter((todo) => todo.status === 'done' || todo.status === 'rejected');
  }

  function toTodoViewModel(todo) {
    const sourceLabel = todo.src ? \`\${todo.src}\${todo.srcChunk ? ' · ' + todo.srcChunk : ''}\` : '수동 등록';
    return {
      ...todo,
      checked: Boolean(G.todoChecked[todo.id]),
      selected: G.selectedTodoId === todo.id,
      sourceLabel,
      shortSource: todo.src || '수동',
      grounds: Array.isArray(todo.grounds) ? todo.grounds : [],
    };
  }

  function getTodoSnapshot() {
    const filtered = getFilteredTodoRows();
    const selectedTodo = todos.find((todo) => todo.id === G.selectedTodoId);
    return {
      currentTab: getTodoTab(),
      viewMode: getTodoViewMode(),
      todos: filtered.map(toTodoViewModel),
      selectedTodo: selectedTodo ? toTodoViewModel(selectedTodo) : null,
      counts: getTodoCounts(),
      allChecked: filtered.length > 0 && filtered.every((todo) => G.todoChecked[todo.id]),
    };
  }

  function emitTodoState() {
    window.dispatchEvent(new CustomEvent('opsradar:todo-state-updated', {
      detail: getTodoSnapshot(),
    }));
  }

  window.getTodoSnapshot = getTodoSnapshot;
  window.renderTodos = function renderTodos() {
    emitTodoState();
  };
  window.renderTodoCards = function renderTodoCards() {
    emitTodoState();
  };
  window.renderTodoDetail = function renderTodoDetail(id) {
    if (id !== undefined && id !== null) G.selectedTodoId = id;
    emitTodoState();
  };
  window.selectTodo = function selectTodo(id) {
    G.selectedTodoId = id;
    emitTodoState();
  };
  window.switchTodoTab = function switchTodoTab(tab) {
    G.currentTodoTab = tab;
    G.selectedTodoId = null;
    emitTodoState();
  };
  window.switchTodoView = function switchTodoView(mode) {
    window.__opsRadarTodoViewMode = mode;
    emitTodoState();
  };
  window.updateTodoCounts = function updateTodoCounts() {
    emitTodoState();
  };
  window.setTodoChecked = function setTodoChecked(id, checked) {
    G.todoChecked[id] = checked;
    emitTodoState();
  };
  window.toggleTodoCheck = function toggleTodoCheck(event, id, fromCheckbox = false) {
    const nextChecked = fromCheckbox && event?.target ? event.target.checked : !G.todoChecked[id];
    G.todoChecked[id] = nextChecked;
    if (fromCheckbox) event?.stopPropagation?.();
    emitTodoState();
  };
  window.toggleAllChk = function toggleAllChk(el) {
    const checked = Boolean(el?.checked);
    getFilteredTodoRows().forEach((todo) => {
      G.todoChecked[todo.id] = checked;
    });
    emitTodoState();
  };

  setTimeout(emitTodoState, 0);
})();
`, "utf8");
  if (fs.existsSync(apiIntegrationPath)) {
    const patchedApiIntegrationSource = fs.readFileSync(apiIntegrationPath, "utf8")
      .replace("    if (!window.G) return;\r\n", "")
      .replace("    if (!window.G) return;\n", "")
      .replace(
        "    window.G.calEvents = Array.from(byDay.values());",
        "    window.replaceCalendarRuntimeEvents?.(Array.from(byDay.values()));",
      )
      .replace(
        "        const tag = window.G?.calEvents?.find((x) => x.d === day)?.tags[index];",
        "        const tag = window.getCalendarRuntimeState?.().calEvents?.find((x) => x.d === day)?.tags[index];",
      );
    fs.writeFileSync(apiIntegrationPath, patchedApiIntegrationSource, "utf8");
  }
  fs.writeFileSync(todoPath, replaceAll(fs.readFileSync(todoPath, "utf8")
    .replace("})();\n\n// Migrated", "})();\n\nvar todoState = window.todoState || { currentTodoTab: 'ai', selectedTodoId: null, todoChecked: {}, editTargetId: null };\nwindow.todoState = todoState;\n\n// Migrated"), [
      ["G.currentTodoTab", "todoState.currentTodoTab"],
      ["G.selectedTodoId", "todoState.selectedTodoId"],
      ["G.todoChecked", "todoState.todoChecked"],
      ["G.editTargetId", "todoState.editTargetId"],
    ]), "utf8");
  fs.writeFileSync(issueDataPath, replaceAll(fs.readFileSync(issueDataPath, "utf8")
    .replace("screen: 'issues' });", "screen: 'issues' });\nvar issueState = window.issueState || { currentIssueTab: 'confirmed', selectedIssueId: null, createIssueId: null, confirmIssueId: null, createdTodosFromIssue: [] };\nwindow.issueState = issueState;"), [
      ["G.createdTodosFromIssue", "issueState.createdTodosFromIssue"],
    ]), "utf8");
  fs.writeFileSync(issuePath, replaceAll(fs.readFileSync(issuePath, "utf8")
    .replace("})();\n\n// Migrated", "})();\n\nvar issueState = window.issueState || { currentIssueTab: 'confirmed', selectedIssueId: null, createIssueId: null, confirmIssueId: null, createdTodosFromIssue: [] };\nwindow.issueState = issueState;\n\n// Migrated"), [
      ["G.currentIssueTab", "issueState.currentIssueTab"],
      ["G.selectedIssueId", "issueState.selectedIssueId"],
      ["G.createIssueId", "issueState.createIssueId"],
      ["G.confirmIssueId", "issueState.confirmIssueId"],
      ["G.createdTodosFromIssue", "issueState.createdTodosFromIssue"],
    ]), "utf8");
  fs.writeFileSync(reportPath, replaceAll(fs.readFileSync(reportPath, "utf8")
    .replace("  const EMPTY_TEXT = '\\ub370\\uc774\\ud130 \\uc5f0\\uacb0 \\ud6c4 \\ud45c\\uc2dc\\ub429\\ub2c8\\ub2e4.';", "  const EMPTY_TEXT = '\\ub370\\uc774\\ud130 \\uc5f0\\uacb0 \\ud6c4 \\ud45c\\uc2dc\\ub429\\ub2c8\\ub2e4.';\n  const reportState = { savedReports: [], reportSearchQuery: '', currentReportPeriod: 'weekly', selectedReportId: null, currentReportDraft: null, sharedReports: [] };"), [
      ["(G.currentDbRole === 'member' ? 'member' : 'admin')", "'admin'"],
      ["G.savedReports", "reportState.savedReports"],
      ["G.reportSearchQuery", "reportState.reportSearchQuery"],
      ["G.currentReportPeriod", "reportState.currentReportPeriod"],
      ["G.selectedReportId", "reportState.selectedReportId"],
      ["G.currentReportDraft", "reportState.currentReportDraft"],
      ["G.sharedReports", "reportState.sharedReports"],
      ["G.currentKnowledgeType || 'onboarding'", "window.getKnowledgeCurrentType?.() || 'onboarding'"],
    ]).replace("  window.getReportSnapshot = getReportSnapshot;", "  window.setReportRuntimeReports = function setReportRuntimeReports(reports) { reportState.savedReports = Array.isArray(reports) ? reports : []; emitReportState(); };\n  window.getReportSnapshot = getReportSnapshot;"), "utf8");
  fs.writeFileSync(handoffPath, replaceAll(fs.readFileSync(handoffPath, "utf8")
    .replace("  const HANDOFF_TYPES = ['onboarding', 'absence', 'offboard'];", "  const HANDOFF_TYPES = ['onboarding', 'absence', 'offboard'];\n  const handoffState = { currentKnowledgeType: 'onboarding', handoffPreviewOpen: false, currentHandoffDraft: null, savedHandoffDraft: null };"), [
      ["G.currentKnowledgeType", "handoffState.currentKnowledgeType"],
      ["G.handoffPreviewOpen", "handoffState.handoffPreviewOpen"],
      ["G.currentHandoffDraft", "handoffState.currentHandoffDraft"],
      ["G.savedHandoffDraft", "handoffState.savedHandoffDraft"],
    ]).replace("  window.getKnowledgeSnapshot = getKnowledgeSnapshot;", "  window.getKnowledgeCurrentType = function getKnowledgeCurrentType() { return handoffState.currentKnowledgeType || 'onboarding'; };\n  window.getKnowledgeSnapshot = getKnowledgeSnapshot;"), "utf8");
  fs.writeFileSync(cleanBootstrapPath, replaceAll(fs.readFileSync(cleanBootstrapPath, "utf8"), [
    ["(window.G && G.currentKnowledgeType) || 'onboarding'", "window.getKnowledgeCurrentType?.() || 'onboarding'"],
    ["if(window.G){ G.createdTodosFromIssue = []; }", "if(window.issueState){ issueState.createdTodosFromIssue = []; }"],
  ]), "utf8");
  if (fs.existsSync(apiIntegrationPath)) {
    fs.writeFileSync(apiIntegrationPath, replaceAll(fs.readFileSync(apiIntegrationPath, "utf8"), [
      ["    if (window.G) window.G.savedReports = reports;", "    window.setReportRuntimeReports?.(reports);"],
    ]), "utf8");
  }
}

function buildCalendarReactBridge() {
  return String.raw`// React bridge generated by scripts/import-legacy.mjs.
// Active Calendar rendering is owned by src/components/Calendar.jsx.
(function installCalendarReactBridge() {
  const now = new Date();
  const legacyCalendarState = window.G || {};
  const calendarState = {
    currentCalYear: typeof legacyCalendarState.currentCalYear === 'number' ? legacyCalendarState.currentCalYear : now.getFullYear(),
    currentCalMonth: typeof legacyCalendarState.currentCalMonth === 'number' ? legacyCalendarState.currentCalMonth : now.getMonth(),
    selectedCalDay: legacyCalendarState.selectedCalDay || null,
    calEvents: Array.isArray(legacyCalendarState.calEvents) ? legacyCalendarState.calEvents : [],
    newCalEvents: Array.isArray(legacyCalendarState.newCalEvents) ? legacyCalendarState.newCalEvents : [],
  };

  function ensureCalendarStateBridge() {
    if (typeof calendarState.currentCalYear !== 'number') calendarState.currentCalYear = now.getFullYear();
    if (typeof calendarState.currentCalMonth !== 'number') calendarState.currentCalMonth = now.getMonth();
    if (!Array.isArray(calendarState.calEvents)) calendarState.calEvents = [];
    if (!Array.isArray(calendarState.newCalEvents)) calendarState.newCalEvents = [];
  }

  function normalizeMonth(month) {
    if (typeof month !== 'number') return calendarState.currentCalMonth;
    return month > 11 ? month - 1 : month;
  }

  function eventMatchesMonthBridge(event, year, month) {
    if (!event) return false;
    const eventYear = typeof event.y === 'number' ? event.y : (typeof event.year === 'number' ? event.year : calendarState.currentCalYear);
    const rawMonth = typeof event.m === 'number' ? event.m : (typeof event.month === 'number' ? event.month : calendarState.currentCalMonth);
    const eventMonth = rawMonth > 11 ? rawMonth - 1 : rawMonth;
    return eventYear === year && eventMonth === month;
  }

  function filterEventsByMonthBridge(year, month) {
    ensureCalendarStateBridge();
    return calendarState.calEvents.filter((event) => eventMatchesMonthBridge(event, year, month));
  }

  function findCalEventBridge(day, year, month) {
    return filterEventsByMonthBridge(year, month).find((event) => event.d === day);
  }

  function hasNewCalEventBridge(day, year, month) {
    ensureCalendarStateBridge();
    return calendarState.newCalEvents.some((event) => {
      const eventYear = typeof event.y === 'number' ? event.y : year;
      const rawMonth = typeof event.m === 'number' ? event.m : month;
      const eventMonth = rawMonth > 11 ? rawMonth - 1 : rawMonth;
      return event.calDate === day && eventYear === year && eventMonth === month;
    });
  }

  function buildCalendarCells(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();
    const today = new Date();
    const cells = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      cells.push({ day: prevLastDate - i, other: true });
    }

    for (let day = 1; day <= lastDate; day += 1) {
      const event = findCalEventBridge(day, year, month);
      cells.push({
        day,
        tags: event?.tags || [],
        today: Boolean(event?.today) || (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day),
        risk: Boolean(event?.risk),
        isNew: hasNewCalEventBridge(day, year, month),
        selected: calendarState.selectedCalDay === day,
      });
    }

    const renderedCells = firstDay + lastDate;
    const trailing = Math.ceil(renderedCells / 7) * 7 - renderedCells;
    for (let day = 1; day <= trailing; day += 1) {
      cells.push({ day, other: true });
    }

    return cells;
  }

  function getAbsenceEvents(year, month) {
    ensureCalendarStateBridge();
    return calendarState.newCalEvents.filter((event) => {
      const eventYear = typeof event.y === 'number' ? event.y : year;
      const rawMonth = typeof event.m === 'number' ? event.m : month;
      const eventMonth = rawMonth > 11 ? rawMonth - 1 : rawMonth;
      return event.type !== '\ud68c\uc758' && eventYear === year && eventMonth === month;
    });
  }

  function getCalendarSnapshot() {
    ensureCalendarStateBridge();
    const year = calendarState.currentCalYear;
    const month = calendarState.currentCalMonth;
    const prevDate = new Date(year, month - 1, 1);
    const nextDate = new Date(year, month + 1, 1);
    const absenceEvents = getAbsenceEvents(year, month);
    return {
      year,
      month,
      monthTitle: String(year) + '\ub144 ' + String(month + 1) + '\uc6d4',
      prevLabel: String(prevDate.getMonth() + 1) + '\uc6d4',
      nextLabel: String(nextDate.getMonth() + 1) + '\uc6d4',
      cells: buildCalendarCells(year, month),
      newEvents: calendarState.newCalEvents || [],
      absenceEvents,
      selectedDay: calendarState.selectedCalDay || null,
    };
  }

  function emitCalendarState() {
    window.dispatchEvent(new CustomEvent('opsradar:calendar-state-updated', {
      detail: getCalendarSnapshot(),
    }));
  }

  function setCalendarBadgeVisible() {
    const badge = document.getElementById('calBadge');
    if (badge) badge.style.display = 'inline-block';
  }

  function getSelectedColor() {
    return typeof calSelectedColor === 'string' && calSelectedColor ? calSelectedColor : 'ct-info';
  }

  function resetSelectedColor() {
    if (typeof calSelectedColor !== 'undefined') calSelectedColor = 'ct-info';
    const dot = document.getElementById('calColorDot');
    if (dot) dot.style.background = 'var(--accent)';
    const label = document.getElementById('calColorLabel');
    if (label) label.textContent = '\uc77c\ubc18';
  }

  function renderModalList(day) {
    const event = findCalEventBridge(day, calendarState.currentCalYear, calendarState.currentCalMonth);
    const tags = event?.tags || [];
    const list = document.getElementById('calModalList');
    if (!list) return;

    if (!tags.length) {
      list.innerHTML = '<div style="font-size:11px;color:var(--text3);text-align:center;padding:16px 0">\ub4f1\ub85d\ub41c \uc77c\uc815\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.</div>';
      return;
    }

    list.innerHTML = tags.map((tag, index) =>
      '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface2);border-radius:var(--radius-sm)">' +
        '<span class="cal-tag ' + (tag.c || 'ct-info') + '" style="flex:1">' + (tag.t || '') + '</span>' +
        '<button type="button" onclick="deleteCalTag(' + day + ',' + index + ')" style="cursor:pointer;color:var(--text3);font-size:12px;padding:2px 6px;border-radius:4px;border:1px solid var(--border);background:var(--surface)" title="\uc0ad\uc81c">\uc0ad\uc81c</button>' +
      '</div>'
    ).join('');
  }

  function showCalBanner() {
    const banner = document.getElementById('calEventBanner');
    const text = document.getElementById('calBannerText');
    const absenceEvents = getAbsenceEvents(calendarState.currentCalYear, calendarState.currentCalMonth);
    if (!banner || !text) return;

    if (!absenceEvents.length) {
      banner.style.display = 'none';
      return;
    }

    const names = [...new Set(absenceEvents.map((event) => event.person).filter(Boolean))].join(', ');
    text.textContent = names ? '\uc774\ubc88 \ub2ec \ubd80\uc7ac \uc77c\uc815: ' + names : '\uc0c8 \uce98\ub9b0\ub354 \uc77c\uc815\uc774 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.';
    banner.style.display = 'flex';
  }

  window.getCalendarSnapshot = getCalendarSnapshot;
  window.filterEventsByMonth = filterEventsByMonthBridge;
  window.findCalEventForDay = findCalEventBridge;
  window.findNewCalEventForDay = function findNewCalEventForDay(day, year, month) {
    return hasNewCalEventBridge(day, year, month);
  };
  window.showCalBanner = showCalBanner;
  window.renderCalendar = function renderCalendar(year, month) {
    ensureCalendarStateBridge();
    if (typeof year === 'number') calendarState.currentCalYear = year;
    if (typeof month === 'number') calendarState.currentCalMonth = normalizeMonth(month);
    emitCalendarState();
  };
  window.goToPrevMonth = function goToPrevMonth() {
    ensureCalendarStateBridge();
    calendarState.currentCalMonth -= 1;
    if (calendarState.currentCalMonth < 0) {
      calendarState.currentCalMonth = 11;
      calendarState.currentCalYear -= 1;
    }
    calendarState.selectedCalDay = null;
    emitCalendarState();
    showCalBanner();
  };
  window.goToNextMonth = function goToNextMonth() {
    ensureCalendarStateBridge();
    calendarState.currentCalMonth += 1;
    if (calendarState.currentCalMonth > 11) {
      calendarState.currentCalMonth = 0;
      calendarState.currentCalYear += 1;
    }
    calendarState.selectedCalDay = null;
    emitCalendarState();
    showCalBanner();
  };
  window.openCalModal = function openCalModal(day) {
    ensureCalendarStateBridge();
    calendarState.selectedCalDay = day;
    const modalDate = document.getElementById('calModalDate');
    if (modalDate) modalDate.textContent = String(calendarState.currentCalYear) + '\ub144 ' + String(calendarState.currentCalMonth + 1) + '\uc6d4 ' + String(day) + '\uc77c';
    renderModalList(day);
    const input = document.getElementById('calModalInput');
    if (input) input.value = '';
    resetSelectedColor();
    window.openModal?.('calModal');
    emitCalendarState();
  };
  window.addCalTag = async function addCalTag() {
    ensureCalendarStateBridge();
    const day = calendarState.selectedCalDay;
    const input = document.getElementById('calModalInput');
    const text = input ? input.value.trim() : '';
    const color = getSelectedColor();
    if (!text || !day) return;

    try {
      if (window.opsRadarCreateCalendarEvent && window.opsRadarApi) {
        await window.opsRadarCreateCalendarEvent({
          title: text,
          day,
          year: calendarState.currentCalYear,
          month: calendarState.currentCalMonth,
          color,
        });
        await window.opsRadarApi.loadCalendar();
      } else {
        const event = findCalEventBridge(day, calendarState.currentCalYear, calendarState.currentCalMonth);
        const tag = { t: text, c: color };
        if (event) event.tags.push(tag);
        else calendarState.calEvents.push({ d: day, y: calendarState.currentCalYear, m: calendarState.currentCalMonth, tags: [tag] });
      }
      if (input) input.value = '';
      emitCalendarState();
      window.openCalModal(day);
      window.showToast?.(String(calendarState.currentCalMonth + 1) + '\uc6d4 ' + String(day) + '\uc77c \uc77c\uc815\uc774 \ucd94\uac00\ub418\uc5c8\uc2b5\ub2c8\ub2e4.', 'info');
    } catch (error) {
      console.warn('Calendar create API failed', error);
      window.showToast?.('\uce98\ub9b0\ub354 \ub4f1\ub85d\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.', 'warn');
    }
  };
  window.deleteCalTag = async function deleteCalTag(day, index) {
    ensureCalendarStateBridge();
    const event = findCalEventBridge(day, calendarState.currentCalYear, calendarState.currentCalMonth);
    if (!event) return;
    const tag = event.tags[index];

    try {
      if (tag?.apiId && window.opsRadarApi) {
        await window.opsRadarApi.request('/calendar/' + tag.apiId, { method: 'DELETE' });
        await window.opsRadarApi.loadCalendar();
      } else {
        event.tags.splice(index, 1);
        if (!event.tags.length) calendarState.calEvents = calendarState.calEvents.filter((entry) => entry !== event);
      }
      emitCalendarState();
      window.openCalModal(day);
      window.showToast?.('\uc77c\uc815\uc774 \uc0ad\uc81c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.', 'info');
    } catch (error) {
      console.warn('Calendar delete API failed', error);
      window.showToast?.('\uce98\ub9b0\ub354 \uc0ad\uc81c\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.', 'warn');
    }
  };
  window.registerCalEvent = function registerCalEvent(parsed, calDate) {
    ensureCalendarStateBridge();
    if (calDate) {
      const event = findCalEventBridge(calDate, calendarState.currentCalYear, calendarState.currentCalMonth);
      const tag = { t: String(parsed.person || '') + ' ' + String(parsed.type || ''), c: 'ct-new' };
      if (event) event.tags.push(tag);
      else calendarState.calEvents.push({ d: calDate, y: calendarState.currentCalYear, m: calendarState.currentCalMonth, tags: [tag] });
      calendarState.newCalEvents.push({ ...parsed, calDate, y: calendarState.currentCalYear, m: calendarState.currentCalMonth });
    }
    setCalendarBadgeVisible();
    emitCalendarState();
    showCalBanner();
  };
  window.addAISuggestEvent = function addAISuggestEvent(title, reason) {
    ensureCalendarStateBridge();
    window.closeModal?.('aiSuggestModal');
    const calDate = Math.min(new Date().getDate() + 2, new Date(calendarState.currentCalYear, calendarState.currentCalMonth + 1, 0).getDate());
    const event = findCalEventBridge(calDate, calendarState.currentCalYear, calendarState.currentCalMonth);
    const tag = { t: title, c: 'ct-info' };
    if (event) event.tags.push(tag);
    else calendarState.calEvents.push({ d: calDate, y: calendarState.currentCalYear, m: calendarState.currentCalMonth, tags: [tag] });
    calendarState.newCalEvents.push({ person: title, date: String(calendarState.currentCalMonth + 1) + '/' + String(calDate), type: '\ud68c\uc758', impact: reason, calDate, y: calendarState.currentCalYear, m: calendarState.currentCalMonth });
    setCalendarBadgeVisible();
    window.addNotif?.('"' + title + '" \uc77c\uc815\uc774 \uce98\ub9b0\ub354\uc5d0 \ucd94\uac00\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \ucd9c\ucc98: ' + reason, 'success');
    window.showToast?.('"' + title + '" \uce98\ub9b0\ub354\uc5d0 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.', 'success');
    emitCalendarState();
    showCalBanner();
  };
  window.openAISuggestModal = function openAISuggestModal() {
    const modal = document.getElementById('aiSuggestModal');
    if (modal) modal.classList.add('show');
  };
  window.refreshCalendarState = emitCalendarState;
  window.getCalendarRuntimeState = function getCalendarRuntimeState() {
    ensureCalendarStateBridge();
    return calendarState;
  };
  window.addCalendarRuntimeEvent = function addCalendarRuntimeEvent(parsed, calDate, month) {
    ensureCalendarStateBridge();
    const normalizedMonth = typeof month === 'number' ? normalizeMonth(month) : calendarState.currentCalMonth;
    if (!calDate) return null;
    const event = findCalEventBridge(calDate, calendarState.currentCalYear, normalizedMonth);
    const tag = { t: String(parsed?.person || '') + ' ' + String(parsed?.type || ''), c: 'ct-new' };
    if (event) event.tags.push(tag);
    else calendarState.calEvents.push({ d: calDate, y: calendarState.currentCalYear, m: normalizedMonth, tags: [tag] });
    calendarState.newCalEvents.push({ ...(parsed || {}), calDate, y: calendarState.currentCalYear, m: normalizedMonth });
    setCalendarBadgeVisible();
    emitCalendarState();
    showCalBanner();
    return { year: calendarState.currentCalYear, month: normalizedMonth, day: calDate };
  };
  window.replaceCalendarRuntimeEvents = function replaceCalendarRuntimeEvents(events) {
    ensureCalendarStateBridge();
    calendarState.calEvents = Array.isArray(events) ? events : [];
    emitCalendarState();
    showCalBanner();
  };
  window.resetCalendarSelection = function resetCalendarSelection() {
    calendarState.selectedCalDay = null;
    emitCalendarState();
  };
  window.resetCalendarRuntimeData = function resetCalendarRuntimeData() {
    calendarState.calEvents = [];
    calendarState.newCalEvents = [];
    calendarState.selectedCalDay = null;
    emitCalendarState();
  };

  setTimeout(() => {
    emitCalendarState();
    showCalBanner();
  }, 0);
})();`;
}

function buildShellBridge() {
  return String.raw`// React bridge generated by scripts/import-legacy.mjs.
// Shared shell UI helpers for modals, toast, notifications, and floating AI.
(function installShellBridge() {
  const notifications = [];
  const floatCtx = {
    dashboard: { label: 'Dashboard 기반으로 답변합니다.', qs: ['현재 가장 위험한 이슈는?', '이번 주 마감 현황 알려줘', '팀원 부재 확인해줘'] },
    analysis: { label: '운영 로그 분석 화면입니다.', qs: ['분석한 파일 요약해줘', '추출된 이슈 설명해줘'] },
    todo: { label: 'Todo 화면 기반으로 답변합니다.', qs: ['내 Todo 요약해줘', '승인 대기 Todo 알려줘', '가장 급한 Todo는?'] },
    issues: { label: '이슈 로그 기반으로 답변합니다.', qs: ['미해결 이슈 요약해줘', '담당자 미지정 이슈는?', 'High Risk 이슈 알려줘'] },
    calendar: { label: '캘린더 기반으로 답변합니다.', qs: ['이번 달 리스크 구간 알려줘', '부재 일정 추가해줘'] },
    knowledge: { label: '인수인계 센터 기반입니다.', qs: ['인수인계 문서 생성해줘', '부재자 업무 누가 커버해?'] },
    reports: { label: '보고서 화면입니다.', qs: ['주간 보고서 초안 생성해줘', '이번 주 운영 요약해줘'] },
    chat: { label: 'AI Assistant 화면입니다.', qs: ['OpsRadar 사용법 알려줘'] },
    settings: { label: '설정 화면입니다.', qs: ['현재 세션 상태 알려줘'] },
  };

  function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
  }

  function openModal(id) {
    document.getElementById(id)?.classList.add('show');
  }

  function showTransition(msg) {
    const msgEl = document.getElementById('transitionMsg');
    const transition = document.getElementById('transition');
    if (msgEl) msgEl.textContent = msg || '';
    transition?.classList.add('show');
  }

  function hideTransition() {
    document.getElementById('transition')?.classList.remove('show');
  }

  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const text = document.getElementById('toastMsg');
    if (!toast || !icon || !text) return;
    text.textContent = msg || '';
    icon.className = 'ti ' + (type === 'success' ? 'ti-check' : type === 'warn' ? 'ti-x' : 'ti-info-circle');
    icon.style.color = type === 'success' ? 'var(--success)' : type === 'warn' ? 'var(--danger)' : 'var(--accent)';
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function toggleFloatAI() {
    const panel = document.getElementById('floatPanel');
    if (!panel) return;
    panel.classList.toggle('show');
    if (!panel.classList.contains('show')) return;
    const ctx = floatCtx[G.currentScreen] || floatCtx.dashboard;
    const label = document.getElementById('floatCtxLabel');
    const suggestions = document.getElementById('floatSuggestions');
    if (label) label.textContent = ctx.label;
    if (suggestions) {
      suggestions.innerHTML = ctx.qs.map((q) => '<button class="float-sq" type="button" data-float-question="' + escapeHtml(q) + '">' + escapeHtml(q) + '</button>').join('');
    }
  }

  function floatAsk(question) {
    document.getElementById('floatPanel')?.classList.remove('show');
    window.nav?.('chat');
    setTimeout(() => window.sendMsg?.(question), 100);
  }

  function floatSend() {
    const input = document.getElementById('floatInput');
    const value = (input?.value || '').trim();
    if (!value) return;
    if (input) input.value = '';
    floatAsk(value);
  }

  function toggleNotif() {
    const panel = document.getElementById('notifPanel');
    panel?.classList.toggle('show');
    document.getElementById('floatPanel')?.classList.remove('show');
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = 'none';
  }

  function clearNotifs() {
    notifications.length = 0;
    renderNotifs();
  }

  function addNotif(msg, type = 'info', actionFnStr) {
    notifications.unshift({ msg, type, actionFnStr, time: Date.now() });
    renderNotifs();
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = 'block';
  }

  function renderNotifs() {
    const list = document.getElementById('notifList');
    if (!list) return;
    if (!notifications.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;font-size:12px;color:var(--text3)"><i class="ti ti-bell" style="font-size:24px;display:block;margin-bottom:8px"></i>아직 알림이 없습니다.</div>';
      return;
    }
    const iconMap = { success: 'ti-check', warn: 'ti-alert-triangle', info: 'ti-sparkles', danger: 'ti-x' };
    const clsMap = { success: 'ni-success', warn: 'ni-warn', info: 'ni-info', danger: 'ni-warn' };
    const timeStr = (time) => {
      const minutes = Math.floor((Date.now() - time) / 60000);
      if (minutes < 1) return '방금 전';
      if (minutes < 60) return minutes + '분 전';
      return Math.floor(minutes / 60) + '시간 전';
    };
    list.innerHTML = notifications.map((item) => (
      '<div class="notif-item ' + (clsMap[item.type] || 'ni-info') + '">' +
      '<i class="ti ' + (iconMap[item.type] || 'ti-sparkles') + '"></i>' +
      '<div style="min-width:0;flex:1"><div class="notif-msg">' + escapeHtml(item.msg) + '</div>' +
      '<div class="notif-time">' + timeStr(item.time) + '</div></div></div>'
    )).join('');
  }

  window.closeModal = closeModal;
  window.openModal = openModal;
  window.showTransition = showTransition;
  window.hideTransition = hideTransition;
  window.showToast = showToast;
  window.toggleFloatAI = toggleFloatAI;
  window.floatAsk = floatAsk;
  window.floatSend = floatSend;
  window.toggleNotif = toggleNotif;
  window.clearNotifs = clearNotifs;
  window.addNotif = addNotif;
  window.renderNotifs = renderNotifs;
})();`;
}

function buildAnalysisReactBridge() {
  return String.raw`// React bridge generated by scripts/import-legacy.mjs.
// Active Analysis rendering is owned by src/components/Analysis.jsx.
(function installAnalysisReactBridge() {
  const initialSteps = [
    { id: 1, icon: 'ti-checkbox', state: 'wait', title: '업무 항목 추출 대기', sub: '회의록/업무 로그에서 Todo 항목 감지 대기' },
    { id: 2, icon: 'ti-alert-triangle', state: 'wait', title: '위험 이슈 확인 대기', sub: '리스크 키워드와 Blocked 상태 감지 대기' },
    { id: 3, icon: 'ti-file-description', state: 'wait', title: '운영 요약 생성 대기', sub: '이슈 확인 완료 후 요약 생성 대기' },
  ];

  const state = {
    stage: 'idle',
    step: 0,
    dragover: false,
    uploadedFiles: [],
    files: [],
    errorReason: null,
    currentFileName: '',
    analysisBadge: '분석 중...',
    flowSteps: initialSteps.map((step) => ({ ...step })),
    result: null,
    historyVisible: false,
    history: [],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emitAnalysisState() {
    window.dispatchEvent(new CustomEvent('opsradar:analysis-state-updated', { detail: getAnalysisSnapshot() }));
  }

  function getAnalysisSnapshot() {
    return {
      ...clone(state),
      history: clone(state.history || []),
    };
  }

  function getUploadErrorMessage(reason) {
    const messages = {
      empty: '파일 내용이 비어 있습니다.',
      unsupported: '지원하지 않는 파일 형식입니다.',
      structure: '날짜, 작성자, 업무 내용 구분을 찾기 어렵습니다.',
      pdfImage: '이미지로만 구성된 PDF는 내용을 읽기 어려울 수 있습니다.',
      general: '업무 기록 구조를 인식하지 못했습니다.',
    };
    return messages[reason] || messages.general;
  }

  function validateUploadedFile(file) {
    if (!file) return { ok: false, reason: 'general' };
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const allowed = ['txt', 'csv', 'docx', 'pdf'];
    if (!allowed.includes(ext)) return { ok: false, reason: 'unsupported' };
    if (file.size === 0) return { ok: false, reason: 'empty' };
    return { ok: true, reason: null };
  }

  function readTextFile(file) {
    return new Promise((resolve) => {
      if (!file || !/\.(txt|csv)$/i.test(file.name)) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

  function looksLikeBusinessRecord(text) {
    const value = normalizeText(text).trim();
    if (!value) return false;
    const hasDate = /\d{4}[-.]\d{1,2}[-.]\d{1,2}|Date\s*:|날짜\s*:/.test(value);
    const hasSpeaker = /[가-힣A-Za-z0-9._%+-]+\s*:|From\s*:|참석자\s*:|작성자\s*:/.test(value);
    const hasContent = /Todo\s*:|Content\s*:|결정사항\s*:|의견\s*:|필요|확인|수정|대응|진행/.test(value);
    return hasDate && (hasSpeaker || hasContent);
  }

  async function validateUploadedFiles(files) {
    for (const file of files) {
      const basic = validateUploadedFile(file);
      if (!basic.ok) return basic;
      if (/\.(txt|csv)$/i.test(file.name)) {
        const text = await readTextFile(file);
        if (!looksLikeBusinessRecord(text)) return { ok: false, reason: 'structure' };
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

  function setStepBar(step) {
    state.step = step;
    emitAnalysisState();
  }

  function resetSteps() {
    state.flowSteps = initialSteps.map((step) => ({ ...step }));
    state.analysisBadge = '분석 중...';
  }

  function setFlow(id, stepState, title, sub) {
    state.flowSteps = state.flowSteps.map((entry) => (
      entry.id === id ? { ...entry, state: stepState, title, sub } : entry
    ));
    emitAnalysisState();
  }

  async function handleFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    state.uploadedFiles = list;
    state.errorReason = null;
    const validation = await validateUploadedFiles(list);
    state.files = list.map((file) => toFileView(file, validation));
    state.stage = validation.ok ? 'selected' : 'error';
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
    if (state.stage === 'error') state.stage = state.files.length ? 'selected' : 'idle';
    emitAnalysisState();
  }

  function showUploadError(reason) {
    state.errorReason = reason || 'general';
    state.stage = 'error';
    emitAnalysisState();
  }

  function resetUploadInput() {
    document.querySelectorAll('#uploadZone input[type="file"]').forEach((input) => { input.value = ''; });
  }

  function resetUpload() {
    state.uploadedFiles = [];
    state.stage = 'idle';
    state.step = 0;
    state.dragover = false;
    state.files = [];
    state.errorReason = null;
    state.currentFileName = '';
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
    window.openModal?.('uploadGuideModal');
  }

  function getResultData(fileName) {
    const key = fileName.includes('meeting') || fileName.includes('회의')
      ? 'meeting'
      : fileName.includes('chat') || fileName.includes('채팅')
        ? 'chat'
        : 'issue';
    const data = {
      meeting: {
        todo: 5,
        issue: 2,
        blocked: 1,
        meta: '회의록 · 1페이지 · chunk #1',
        content: '운영 회의에서 API 응답 지연 5초 초과와 담당자 A 추가 시간이 필요한 상황이 감지되었습니다.',
        highlights: ['API 응답 지연 5초 초과', '담당자 A 추가 시간 필요'],
        reason: '회의록에서 지연, 담당자, 리스크 표현이 반복 감지되었습니다.',
      },
      chat: {
        todo: 3,
        issue: 2,
        blocked: 1,
        meta: '채팅 로그 · chunk #6',
        content: '담당자 A가 운영 API 타임아웃 반복 발생과 재시도 로직 필요를 언급했습니다.',
        highlights: ['운영 API 타임아웃', '재시도 로직 필요'],
        reason: '채팅 로그에서 API 타임아웃 반복 언급이 감지되었습니다.',
      },
      issue: {
        todo: 2,
        issue: 3,
        blocked: 1,
        meta: '이슈 로그 · chunk #8',
        content: '운영 API 응답 지연 5초 초과, 담당자 A 배정, 재시도 로직 추가 필요가 확인되었습니다.',
        highlights: ['5초 초과', '담당자 A', '재시도 로직 추가 필요'],
        reason: '이슈 로그에서 지연과 담당자 미조치 패턴이 감지되었습니다.',
      },
    };
    return { type: key, ...data[key] };
  }

  function formatShortDate() {
    if (typeof window.formatOpsDate === 'function') return window.formatOpsDate('short');
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + d;
  }

  function showAnalysisResult(fileName) {
    const result = getResultData(fileName);
    state.stage = 'result';
    state.step = 3;
    state.analysisBadge = '완료';
    state.result = {
      fileName,
      ...result,
      sourceDoc: result.meta.split(' · ')[0] || '-',
      sourceRange: result.meta.split(' · ')[1] || '-',
    };
    state.history.unshift({
      name: fileName,
      type: result.type,
      date: formatShortDate(),
      todo: result.todo,
      issue: result.issue,
      blocked: result.blocked,
    });
    window.showToast?.('분석이 완료되었습니다.');
    window.addNotif?.('"' + fileName.slice(0, 20) + '..." 분석 완료. Todo와 이슈를 확인하세요.', 'success');
    emitAnalysisState();
  }

  function runFlowStep(step, fileName) {
    const activeTitles = ['업무 항목 추출 중...', '위험 이슈 확인 중...', '운영 요약 생성 중...'];
    const doneTitles = ['업무 항목 추출 완료', '위험 이슈 확인 완료', '운영 요약 생성 완료'];
    const doneSubs = ['Todo 후보를 추출했습니다.', '리스크와 Blocked 상태를 확인했습니다.', '운영 요약을 생성했습니다.'];
    const delays = [500, 650, 500];

    setFlow(step, 'active', activeTitles[step - 1], 'AI 분석 진행 중...');
    window.setTimeout(() => {
      setFlow(step, 'done', doneTitles[step - 1], doneSubs[step - 1]);
      if (step < 3) runFlowStep(step + 1, fileName);
      else showAnalysisResult(fileName);
    }, delays[step - 1]);
  }

  async function startAnalysis() {
    if (!state.uploadedFiles.length) {
      showUploadError('general');
      return;
    }
    const validation = await validateUploadedFiles(state.uploadedFiles);
    if (!validation.ok) {
      showUploadError(validation.reason);
      return;
    }
    const fileName = state.uploadedFiles[0].name;
    state.stage = 'analyzing';
    state.step = 2;
    state.currentFileName = fileName;
    state.result = null;
    state.errorReason = null;
    resetSteps();
    emitAnalysisState();
    runFlowStep(1, fileName);
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
})();`;
}

function buildSettingsReactBridge() {
  return String.raw`// React bridge generated by scripts/import-legacy.mjs.
// Active Settings rendering is owned by src/components/Settings.jsx.
(function installSettingsReactBridge() {
  function getStoredTheme() {
    try {
      return localStorage.getItem('theme') || localStorage.getItem('opsradar-skin') || document.body.dataset.theme || 'dark';
    } catch (error) {
      return document.body.dataset.theme || 'dark';
    }
  }

  function normalizeTheme(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function getStoredUserInfo() {
    let rawUser = null;
    let rawRole = null;
    try {
      rawUser = localStorage.getItem('user');
      rawRole = localStorage.getItem('role');
    } catch (error) {}

    let userName = '관리자';
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        userName = parsed.name || parsed.username || parsed.email || rawUser;
      } catch (error) {
        userName = rawUser;
      }
    }

    const isMember = (rawRole || '').toLowerCase() === 'member' || document.getElementById('db-tab-member')?.classList.contains('active');
    return {
      userName,
      role: isMember ? 'Team Member' : 'Admin',
      roleKo: isMember ? '팀원' : '관리자',
      state: rawUser || rawRole ? '로그인됨' : '로컬 세션',
      avatar: (userName || 'U').trim().slice(0, 1).toUpperCase(),
    };
  }

  function getSettingsSnapshot() {
    const theme = normalizeTheme(getStoredTheme());
    const user = getStoredUserInfo();
    return {
      theme,
      themeLabel: theme === 'light' ? 'Light' : 'Dark',
      user,
      displayRole: user.roleKo + ' · ' + user.role,
      sessionState: user.state,
    };
  }

  function emitSettingsState() {
    window.dispatchEvent(new CustomEvent('opsradar:settings-state-updated', { detail: getSettingsSnapshot() }));
  }

  function setOpsRadarTheme(theme) {
    const selected = normalizeTheme(theme);
    document.body.setAttribute('data-theme', selected);
    document.body.setAttribute('data-skin', selected);
    try {
      localStorage.setItem('theme', selected);
      localStorage.setItem('opsradar-skin', selected);
    } catch (error) {}
    emitSettingsState();
  }

  function setOpsRadarSkin(skin) {
    setOpsRadarTheme(skin);
  }

  function updateSettingsPage() {
    emitSettingsState();
  }

  function initOpsRadarSkin() {
    setOpsRadarTheme(getStoredTheme());
    emitSettingsState();
  }

  function logout() {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
    } catch (error) {}
    emitSettingsState();
    alert('로그아웃했습니다.');
    window.nav?.('dashboard');
  }

  window.getStoredUserInfo = getStoredUserInfo;
  window.getSettingsSnapshot = getSettingsSnapshot;
  window.refreshSettingsState = emitSettingsState;
  window.setOpsRadarTheme = setOpsRadarTheme;
  window.setOpsRadarSkin = setOpsRadarSkin;
  window.initOpsRadarSkin = initOpsRadarSkin;
  window.updateSettingsPage = updateSettingsPage;
  window.logout = logout;

  setTimeout(initOpsRadarSkin, 0);
})();`;
}

function buildChatReactBridge() {
  return String.raw`// React bridge generated by scripts/import-legacy.mjs.
// Active Chat rendering is owned by src/components/Chat.jsx.
(function installChatReactBridge() {
  const CHAT_SESSION_KEY = 'opsradar_chat_sessions';
  const CHAT_CURRENT_KEY = 'opsradar_current_session_id';
  const DEFAULT_TITLE = '새 운영 질문 기록';
  const DEFAULT_SUMMARY = '아직 요약 전입니다.';
  const emptyContext = {
    docs: [],
    todoItems: [],
    issueItems: [],
  };
  const chatResponses = window.chatResponses || {};
  window.chatResponses = chatResponses;
  const chatState = {
    currentSessionId: null,
    lastPrompt: '',
    restoring: false,
    typing: false,
  };

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function safeReadSessions() {
    try {
      const raw = localStorage.getItem(CHAT_SESSION_KEY);
      if (raw) return JSON.parse(raw).filter(Boolean);
    } catch (error) {
      console.warn('Chat session load failed', error);
    }
    return [];
  }

  function saveChatSessions(sessions) {
    try {
      localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(sessions || []));
    } catch (error) {
      console.warn('Chat session save failed', error);
    }
  }

  function formatChatSessionDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\. /g, '.')
      .replace(/\.$/, '');
  }

  function generateSessionTitle(firstUserMessage) {
    const text = cleanText(firstUserMessage);
    if (!text) return DEFAULT_TITLE;
    if (/캘린더|일정|부재|휴가|회의|미팅/.test(text)) return '캘린더 일정 분석';
    if (/위험|리스크|이슈|장애|API|DB/i.test(text)) return '운영 리스크 분석';
    if (/todo|업무|할 일|미완료/i.test(text)) return 'Todo 실행 상태 분석';
    return text.length > 28 ? text.slice(0, 28) + '...' : text;
  }

  function parseScheduleMsg(msg) {
    const text = cleanText(msg);
    const people = ['담당자 A', '담당자 B', '담당자 C', '담당자 D', '관리자'];
    const person = people.find((entry) => text.includes(entry)) || '미확정';
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|다음주\s*[월화수목금토일]요일|이번주\s*[월화수목금토일]요일)/);
    const date = dateMatch ? dateMatch[0] : '날짜 미확정';
    const type = text.includes('외부 일정')
      ? '외부 일정'
      : text.includes('휴가')
        ? '휴가'
        : (text.includes('회의') || text.includes('미팅'))
          ? '회의'
          : '부재';
    return {
      person,
      date,
      type,
      impact: type === '회의' ? '팀 진행상황 공유' : person + ' 담당 업무 공백 예상',
    };
  }

  function summarizeSession(session) {
    const userMessage = (session.messages || []).find((message) => message.role === 'user');
    if (!userMessage) return '아직 질문이 없습니다.';
    return userMessage.content.length > 42 ? userMessage.content.slice(0, 42) + '...' : userMessage.content;
  }

  function ensureCurrentSession() {
    let sessions = safeReadSessions();
    let currentId = localStorage.getItem(CHAT_CURRENT_KEY) || chatState.currentSessionId;
    let session = sessions.find((entry) => entry.id === currentId);
    if (session) {
      chatState.currentSessionId = session.id;
      return session;
    }

    session = {
      id: 'session_' + Date.now(),
      title: DEFAULT_TITLE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: DEFAULT_SUMMARY,
      messages: [],
    };
    sessions = [session, ...sessions].slice(0, 20);
    saveChatSessions(sessions);
    localStorage.setItem(CHAT_CURRENT_KEY, session.id);
    chatState.currentSessionId = session.id;
    return session;
  }

  function getCurrentChatSession() {
    return ensureCurrentSession();
  }

  function getCurrentSessionId() {
    return localStorage.getItem(CHAT_CURRENT_KEY) || chatState.currentSessionId || ensureCurrentSession().id;
  }

  function inferChatContext(text, src) {
    const value = cleanText(text);
    const docs = src
      ? [src]
      : (/위험|리스크|이슈|장애|API|DB|Risk/i.test(value)
        ? ['운영 로그 분석 결과', '이슈 관리 현황']
        : ['운영 데이터 인덱스']);
    const todoItems = /todo|업무|할 일|미완료/i.test(value)
      ? ['Todo 현황 확인', 'Blocked 업무 우선순위 평가']
      : ['필요 시 Todo 생성'];
    const issueItems = /위험|리스크|이슈|장애|API|DB|Risk/i.test(value)
      ? ['High Risk 알림 검토', '운영 영향 범위 확인']
      : [];
    return { docs, todoItems, issueItems };
  }

  function getLatestContext(session) {
    const latestAssistant = [...(session.messages || [])].reverse().find((message) => message.role === 'assistant');
    if (!latestAssistant) return emptyContext;
    return inferChatContext((chatState.lastPrompt || '') + ' ' + (latestAssistant.content || ''), latestAssistant.src || null);
  }

  function getChatSnapshot() {
    const session = ensureCurrentSession();
    const currentId = getCurrentSessionId();
    const sessions = safeReadSessions();
    return {
      currentId,
      sessions: sessions.map((entry) => ({
        ...entry,
        active: entry.id === currentId,
        messageCount: (entry.messages || []).length,
        lastUserMessage: [...(entry.messages || [])].reverse().find((message) => message.role === 'user')?.content || '아직 질문이 없습니다.',
        displayDate: formatChatSessionDate(entry.createdAt),
        updatedDate: formatChatSessionDate(entry.updatedAt || entry.createdAt),
        summary: entry.summary || summarizeSession(entry),
        summarized: (entry.messages || []).length > 8,
      })),
      currentSession: session,
      messages: session.messages || [],
      context: getLatestContext(session),
      typing: !!chatState.typing,
      lastPrompt: chatState.lastPrompt || '',
    };
  }

  function emitChatState() {
    window.dispatchEvent(new CustomEvent('opsradar:chat-state-updated', { detail: getChatSnapshot() }));
  }

  function saveMessageToCurrentSession(role, content, meta = {}) {
    if (chatState.restoring) return null;
    const sessions = safeReadSessions();
    let session = sessions.find((entry) => entry.id === getCurrentSessionId());
    if (!session) session = ensureCurrentSession();
    const message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(16).slice(2),
      role,
      content: cleanText(content),
      createdAt: new Date().toISOString(),
      ...meta,
    };
    session.messages = session.messages || [];
    session.messages.push(message);
    session.updatedAt = message.createdAt;
    if (role === 'user' && (!session.title || session.title === DEFAULT_TITLE)) session.title = generateSessionTitle(content);
    session.summary = session.messages.length > 8 ? session.messages.length + '개 메시지를 요약 카드로 접어 표시 중' : DEFAULT_SUMMARY;
    const next = [session, ...sessions.filter((entry) => entry.id !== session.id)].slice(0, 20);
    saveChatSessions(next);
    localStorage.setItem(CHAT_CURRENT_KEY, session.id);
    chatState.currentSessionId = session.id;
    emitChatState();
    return message;
  }

  function appendChatMsg(role, text, src = null, withBtn = false) {
    return saveMessageToCurrentSession(role === 'ai' ? 'assistant' : role, text, { src, withBtn });
  }

  function createNewChatSession(showNotice = true) {
    const sessions = safeReadSessions();
    const session = {
      id: 'session_' + Date.now(),
      title: DEFAULT_TITLE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: DEFAULT_SUMMARY,
      messages: [],
    };
    saveChatSessions([session, ...sessions].slice(0, 20));
    localStorage.setItem(CHAT_CURRENT_KEY, session.id);
    chatState.currentSessionId = session.id;
    chatState.lastPrompt = '';
    if (showNotice) window.showToast?.('새 분석 세션을 시작했습니다.', 'success');
    emitChatState();
    return session;
  }

  function setCurrentChatSession(sessionId) {
    const session = safeReadSessions().find((entry) => entry.id === sessionId);
    if (!session) return;
    localStorage.setItem(CHAT_CURRENT_KEY, session.id);
    chatState.currentSessionId = session.id;
    chatState.lastPrompt = [...(session.messages || [])].reverse().find((message) => message.role === 'user')?.content || '';
    emitChatState();
  }

  function deleteChatSession(sessionId) {
    if (!confirm('이 분석 세션을 삭제할까요?')) return;
    const sessions = safeReadSessions().filter((entry) => entry.id !== sessionId);
    saveChatSessions(sessions);
    if (getCurrentSessionId() === sessionId) {
      if (sessions[0]) {
        localStorage.setItem(CHAT_CURRENT_KEY, sessions[0].id);
        chatState.currentSessionId = sessions[0].id;
      } else {
        localStorage.removeItem(CHAT_CURRENT_KEY);
        chatState.currentSessionId = null;
      }
    }
    if (!sessions.length) createNewChatSession(false);
    else emitChatState();
    window.showToast?.('분석 세션을 삭제했습니다.', 'success');
  }

  function clearCurrentChatSession() {
    if (!confirm('현재 분석 세션의 모든 내용을 초기화할까요?')) return;
    const sessions = safeReadSessions();
    const currentId = getCurrentSessionId();
    const session = sessions.find((entry) => entry.id === currentId);
    if (session) {
      session.messages = [];
      session.title = DEFAULT_TITLE;
      session.summary = DEFAULT_SUMMARY;
      session.updatedAt = new Date().toISOString();
      saveChatSessions(sessions);
    }
    emitChatState();
  }

  function initChatSessions() {
    const sessions = safeReadSessions();
    if (!sessions.length) createNewChatSession(false);
    else if (!sessions.some((entry) => entry.id === localStorage.getItem(CHAT_CURRENT_KEY))) {
      localStorage.setItem(CHAT_CURRENT_KEY, sessions[0].id);
      chatState.currentSessionId = sessions[0].id;
    } else {
      chatState.currentSessionId = localStorage.getItem(CHAT_CURRENT_KEY);
    }
    emitChatState();
  }

  function renderChatSessionList() {
    emitChatState();
  }

  function renderCurrentChatMessages() {
    emitChatState();
  }

  function renderChatContextList() {
    emitChatState();
  }

  function updateChatContextPanel() {
    emitChatState();
  }

  function resetChatContextPanel() {
    emitChatState();
  }

  function enforceChatLimit() {
    emitChatState();
  }

  function showTyping() {
    chatState.typing = true;
    emitChatState();
  }

  function removeTyping() {
    chatState.typing = false;
    emitChatState();
  }

  function renderScheduleAssistantMessage(msg, parsed, calDate) {
    saveMessageToCurrentSession('assistant', '일정 정보를 운영 캘린더 항목으로 분석했습니다.', {
      kind: 'schedule',
      parsed: parsed || parseScheduleMsg(msg),
      calDate: calDate || null,
      src: 'Calendar 운영 일정',
    });
  }

  function showScheduleConfirm(msg, response) {
    renderScheduleAssistantMessage(msg, response?.parsed || parseScheduleMsg(msg), response?.calDate || null);
  }

  function showScheduleConfirmRaw(msg, parsed) {
    showScheduleConfirm(msg, { parsed, calDate: null });
  }

  async function doRegisterCalEvent(btn, person, date, type, impact, calDate) {
    const dateMatch = String(date || '').match(/(\d+)\/(\d+)/);
    const calendarRuntime = window.getCalendarRuntimeState?.() || {};
    const month = dateMatch ? Number(dateMatch[1]) - 1 : calendarRuntime.currentCalMonth;
    const day = calDate || (dateMatch ? Number(dateMatch[2]) : null);
    try {
      if (!day || !window.opsRadarCreateCalendarEvent || !window.opsRadarApi) throw new Error('Calendar API is not ready');
      await window.opsRadarCreateCalendarEvent({
        title: person + ' ' + type,
        day,
        month,
        year: calendarRuntime.currentCalYear,
        color: type === '부재' ? 'ct-gray' : 'ct-info',
      });
      await window.opsRadarApi.loadCalendar();
      window.addCalendarRuntimeEvent?.({ person, date, type, impact }, day, month);
      window.renderCalendar?.(calendarRuntime.currentCalYear, calendarRuntime.currentCalMonth);
      appendChatMsg('assistant', '캘린더에 등록했습니다. ' + person + ' · ' + date + ' · ' + type, 'Calendar 운영 일정');
      if (type !== '회의') {
        window.setTimeout(() => appendChatMsg('assistant', '인수인계 센터에도 "' + person + ' ' + date + ' ' + type + '"이 반영되었습니다. 업무 공백 대비 인수인계 문서를 생성하시겠어요?', null, true), 300);
      }
      window.showToast?.('캘린더에 등록했습니다. ' + person + ' · ' + date, 'success');
    } catch (error) {
      console.warn('Chat calendar create API failed', error);
      window.showToast?.('캘린더 등록에 실패했습니다.', 'warn');
    }
  }

  async function sendMsg(text) {
    if (chatState.typing) return;
    ensureCurrentSession();
    const input = document.getElementById('chatInput');
    const msg = cleanText(text || input?.value || '');
    if (!msg) return;
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
    chatState.lastPrompt = msg;
    appendChatMsg('user', msg);
    showTyping();

    const localSchedule = /부재|외부 일정|휴가|회의|미팅|일정|추가/.test(msg);
    if (chatResponses[msg] || localSchedule) {
      window.setTimeout(() => {
        removeTyping();
        const response = chatResponses[msg];
        if (response) {
          if (response.type === 'schedule') showScheduleConfirm(msg, response);
          else appendChatMsg('assistant', response.text, response.src || null);
        } else {
          showScheduleConfirmRaw(msg, parseScheduleMsg(msg));
        }
      }, 900 + Math.random() * 400);
      return;
    }

    try {
      const data = await window.opsRadarApi.request('/chat', { method: 'POST', body: JSON.stringify({ message: msg }) });
      removeTyping();
      appendChatMsg('assistant', data.answer || 'AI 응답이 비어 있습니다.', null);
    } catch (error) {
      removeTyping();
      console.warn('AI chat API failed', error);
      appendChatMsg('assistant', 'AI 연결에 실패했습니다. Azure OpenAI 설정과 서버 로그를 확인해주세요.', null);
    }
  }

  function startNewChat() {
    createNewChatSession(true);
  }

  function autoResize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  }

  window.parseScheduleMsg = parseScheduleMsg;
  window.getChatSnapshot = getChatSnapshot;
  window.refreshChatState = emitChatState;
  window.loadChatSessions = safeReadSessions;
  window.saveChatSessions = saveChatSessions;
  window.getCurrentChatSession = getCurrentChatSession;
  window.createNewChatSession = createNewChatSession;
  window.setCurrentChatSession = setCurrentChatSession;
  window.deleteChatSession = deleteChatSession;
  window.clearCurrentChatSession = clearCurrentChatSession;
  window.initChatSessions = initChatSessions;
  window.renderChatSessionList = renderChatSessionList;
  window.renderCurrentChatMessages = renderCurrentChatMessages;
  window.renderChatContextList = renderChatContextList;
  window.updateChatContextPanel = updateChatContextPanel;
  window.resetChatContextPanel = resetChatContextPanel;
  window.enforceChatLimit = enforceChatLimit;
  window.renderScheduleAssistantMessage = renderScheduleAssistantMessage;
  window.showScheduleConfirm = showScheduleConfirm;
  window.showScheduleConfirmRaw = showScheduleConfirmRaw;
  window.doRegisterCalEvent = doRegisterCalEvent;
  window.appendChatMsg = appendChatMsg;
  window.showTyping = showTyping;
  window.removeTyping = removeTyping;
  window.startNewChat = startNewChat;
  window.sendMsg = sendMsg;
  window.autoResize = autoResize;

  setTimeout(initChatSessions, 0);
})();`;
}

function buildReportReactBridge() {
  return String.raw`// React bridge generated by scripts/import-legacy.mjs.
// Active Report rendering is owned by src/components/Report.jsx.
(function installReportReactBridge() {
  const REPORT_STORAGE_KEY = 'opsradar_reports_v1';
  const EMPTY_TEXT = '\ub370\uc774\ud130 \uc5f0\uacb0 \ud6c4 \ud45c\uc2dc\ub429\ub2c8\ub2e4.';
  const SECTION_LABELS = {
    completed: '\uc644\ub8cc\ub41c \uc5c5\ubb34',
    inProgress: '\uc9c4\ud589 \uc911\uc778 \uc5c5\ubb34',
    technical: 'AI \ubc0f \uae30\uc220\uc801 \uc0c1\uc138 \ub0b4\uc6a9',
    risk: '\ub9ac\uc2a4\ud06c \uad00\ub9ac \ubc0f \ud574\uacb0 \ubc29\uc548',
    retrospective: '\ud300 \ud68c\uace0',
    nextPlan: '\ucc28\uc8fc \uacc4\ud68d',
  };
  const SECTION_KEYS = Object.keys(SECTION_LABELS);

  function getReportTypeLabel(type) {
    return type === 'monthly' ? '\uc6d4\uac04 \ubcf4\uace0\uc11c' : '\uc8fc\uac04 \ubcf4\uace0\uc11c';
  }

  function getReportStatusLabel(status) {
    return ({ draft: '\ucd08\uc548', complete: '\uc644\ub8cc', shared: '\uacf5\uc720\ub428' })[status] || '\ucd08\uc548';
  }

  function getReportStatusClass(status) {
    if (status === 'shared') return 'report-status-shared';
    if (status === 'complete') return 'report-status-complete';
    return 'report-status-draft';
  }

  function getReportAuthor() {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      if (stored && (stored.name || stored.username)) return stored.name || stored.username;
    } catch (error) {}
    const role = localStorage.getItem('role') || (G.currentDbRole === 'member' ? 'member' : 'admin');
    return role === 'member' ? '\ud300\uc6d0' : '\uad00\ub9ac\uc790';
  }

  function formatReportDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function formatReportDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function getReportPeriodRange(type) {
    const today = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const fmt = (date) => String(date.getFullYear()) + '.' + pad(date.getMonth() + 1) + '.' + pad(date.getDate());
    if (type === 'monthly') {
      return fmt(new Date(today.getFullYear(), today.getMonth(), 1)) + ' ~ ' + fmt(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    }
    const day = today.getDay() || 7;
    const start = new Date(today);
    start.setDate(today.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return fmt(start) + ' ~ ' + fmt(end);
  }

  function getReportDefaultTitle(type) {
    const today = new Date();
    if (type === 'monthly') return String(today.getFullYear()) + '\ub144 ' + String(today.getMonth() + 1) + '\uc6d4 \uc6d4\uac04 \ubcf4\uace0\uc11c';
    const week = Math.ceil(today.getDate() / 7);
    return String(today.getFullYear()) + '\ub144 ' + String(today.getMonth() + 1) + '\uc6d4 ' + String(week) + '\uc8fc\ucc28 \uc8fc\uac04 \ubcf4\uace0\uc11c';
  }

  function normalizeReportSections(input) {
    const normalized = {
      completed: [],
      inProgress: [],
      technical: [],
      risk: [],
      retrospective: [],
      nextPlan: [],
    };
    if (!input) return normalized;
    if (Array.isArray(input)) {
      input.forEach(([title, items]) => {
        const key = SECTION_KEYS.find((entry) => SECTION_LABELS[entry] === title) || title;
        normalized[key] = Array.isArray(items) ? items : [items];
      });
      return normalized;
    }
    SECTION_KEYS.forEach((key) => {
      const items = input[key];
      normalized[key] = Array.isArray(items) ? items : (items ? [items] : []);
    });
    return normalized;
  }

  function getReportSeedData() {
    const now = new Date().toISOString();
    return [
      { id: 'sample-weekly-report', type: 'weekly', title: '\ucd5c\uadfc \uc8fc\uac04 \uc6b4\uc601 \ubcf4\uace0\uc11c', period: getReportPeriodRange('weekly'), createdAt: now, author: getReportAuthor(), status: 'draft', issues: 0, doneTodos: 0, pendingTodos: 0, sections: normalizeReportSections(), docs: ['\uc5f0\uacb0\ub41c \ubb38\uc11c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.'] },
      { id: 'sample-monthly-report', type: 'monthly', title: '\ucd5c\uadfc \uc6d4\uac04 \uc6b4\uc601 \ubcf4\uace0\uc11c', period: getReportPeriodRange('monthly'), createdAt: now, author: getReportAuthor(), status: 'draft', issues: 0, doneTodos: 0, pendingTodos: 0, sections: normalizeReportSections(), docs: ['\uc5f0\uacb0\ub41c \ubb38\uc11c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.'] },
    ];
  }

  function loadStoredReports() {
    try {
      const raw = localStorage.getItem(REPORT_STORAGE_KEY);
      if (raw) return JSON.parse(raw).filter(Boolean);
    } catch (error) {}
    return getReportSeedData();
  }

  function persistReports(reports) {
    try {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports || []));
    } catch (error) {}
  }

  function fetchReports() {
    G.savedReports = loadStoredReports();
    return G.savedReports;
  }

  function getReportQuery() {
    return (G.reportSearchQuery || '').trim().toLowerCase();
  }

  function filterReportsByType(type) {
    const selected = type || G.currentReportPeriod || 'weekly';
    const query = getReportQuery();
    return fetchReports().filter((report) => {
      const haystack = [report.title, report.author, report.period, getReportStatusLabel(report.status)].join(' ').toLowerCase();
      return report.type === selected && (!query || haystack.includes(query));
    });
  }

  function getSelectedReport(filtered) {
    if (!filtered.length) return null;
    if (!G.selectedReportId || !filtered.some((report) => report.id === G.selectedReportId)) {
      G.selectedReportId = filtered[0].id;
    }
    return filtered.find((report) => report.id === G.selectedReportId) || filtered[0];
  }

  function createReportDraft(type) {
    const selected = type === 'monthly' ? 'monthly' : (G.currentReportPeriod === 'monthly' ? 'monthly' : 'weekly');
    let base = null;
    try {
      if (typeof window.getReportDraftData === 'function') base = window.getReportDraftData();
    } catch (error) {}
    const fallbackSections = SECTION_KEYS.map((key) => [SECTION_LABELS[key], [EMPTY_TEXT]]);
    return {
      id: 'draft-' + Date.now(),
      title: getReportDefaultTitle(selected),
      type: selected,
      period: getReportPeriodRange(selected),
      createdAt: new Date().toISOString(),
      author: getReportAuthor(),
      status: 'draft',
      issues: Number(typeof issues !== 'undefined' ? issues.length : 0),
      doneTodos: Number(typeof todos !== 'undefined' ? todos.filter((todo) => todo.status === 'done').length : 0),
      pendingTodos: Number(typeof todos !== 'undefined' ? todos.filter((todo) => todo.status !== 'done').length : 0),
      sections: Array.isArray(base?.sections) ? base.sections : fallbackSections,
      docs: ['\uc5f0\uacb0\ub41c \ubb38\uc11c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.'],
    };
  }

  function draftToEditorHtml(draft) {
    const sections = Array.isArray(draft.sections) ? draft.sections : Object.entries(normalizeReportSections(draft.sections)).map(([key, items]) => [SECTION_LABELS[key] || key, items]);
    const body = sections.map(([title, items]) => {
      const list = (Array.isArray(items) ? items : [items]).map((item) => '<li class="text-content" style="margin:4px 0">' + escapeHtml(item || EMPTY_TEXT) + '</li>').join('');
      return '<h3 class="text-content" style="font-size:13px;font-weight:700;color:var(--text);margin:14px 0 6px">' + escapeHtml(title) + '</h3><ul style="padding-left:18px;margin:0 0 8px;color:var(--text2)">' + list + '</ul>';
    }).join('');
    return '<div class="text-content" style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:10px">' + escapeHtml(draft.title) + '</div><p style="margin-bottom:12px;color:var(--text2)">' + escapeHtml(getReportTypeLabel(draft.type)) + ' \ucd08\uc548\uc785\ub2c8\ub2e4. \ud544\uc694 \uc2dc \ubcf8\ubb38\uc744 \uc9c1\uc811 \uc218\uc815\ud55c \ub4a4 \uc800\uc7a5\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.</p>' + body;
  }

  function getReportSnapshot() {
    if (!G.currentReportPeriod) G.currentReportPeriod = 'weekly';
    const reports = filterReportsByType(G.currentReportPeriod);
    const selectedReport = G.currentReportDraft ? null : getSelectedReport(reports);
    return {
      currentPeriod: G.currentReportPeriod,
      query: G.reportSearchQuery || '',
      reports,
      selectedReport,
      currentDraft: G.currentReportDraft || null,
      editorHtml: G.currentReportDraft ? (G.currentReportDraft.html || draftToEditorHtml(G.currentReportDraft)) : '',
      labels: {
        type: { weekly: getReportTypeLabel('weekly'), monthly: getReportTypeLabel('monthly') },
      },
    };
  }

  function emitReportState() {
    window.dispatchEvent(new CustomEvent('opsradar:report-state-updated', {
      detail: getReportSnapshot(),
    }));
  }

  function renderReportList() {
    emitReportState();
  }

  function renderReportDetail(report) {
    if (report?.id) {
      G.selectedReportId = report.id;
      G.currentReportDraft = null;
    }
    emitReportState();
  }

  function selectReport(reportId) {
    G.selectedReportId = reportId;
    G.currentReportDraft = null;
    emitReportState();
  }

  function setReportPeriod(period) {
    G.currentReportPeriod = period === 'monthly' ? 'monthly' : 'weekly';
    G.selectedReportId = null;
    G.currentReportDraft = null;
    emitReportState();
  }

  function setReportQuery(query) {
    G.reportSearchQuery = query || '';
    G.selectedReportId = null;
    emitReportState();
  }

  function generateReportDraft() {
    const type = G.currentReportPeriod === 'monthly' ? 'monthly' : 'weekly';
    G.currentReportDraft = createReportDraft(type);
    G.selectedReportId = null;
    window.showToast?.(getReportTypeLabel(type) + ' \ucd08\uc548\uc744 \uc0dd\uc131\ud588\uc2b5\ub2c8\ub2e4.', 'success');
    emitReportState();
  }

  function renderReportDraft(data) {
    G.currentReportDraft = data || createReportDraft(G.currentReportPeriod || 'weekly');
    G.selectedReportId = null;
    emitReportState();
  }

  async function saveReport(report) {
    const editor = document.getElementById('reportEditor') || document.querySelector('#s-reports [contenteditable="true"]');
    const draft = report || G.currentReportDraft || createReportDraft(G.currentReportPeriod || 'weekly');
    const content = editor ? editor.innerHTML : (draft.html || draftToEditorHtml(draft));
    const reports = fetchReports();
    const id = draft.apiId || (draft.id && !String(draft.id).startsWith('draft-') ? draft.id : 'report-' + Date.now());
    const payload = {
      ...draft,
      id,
      apiId: draft.apiId || null,
      type: draft.type || (G.currentReportPeriod || 'weekly'),
      title: draft.title || getReportDefaultTitle(draft.type || G.currentReportPeriod || 'weekly'),
      period: draft.period || getReportPeriodRange(draft.type || G.currentReportPeriod || 'weekly'),
      createdAt: draft.createdAt || new Date().toISOString(),
      author: draft.author || getReportAuthor(),
      status: draft.status || 'draft',
      sections: normalizeReportSections(draft.sections),
      html: content,
    };
    const nextReports = [payload, ...reports.filter((item) => item.id !== id)];
    persistReports(nextReports);
    G.savedReports = nextReports;
    G.currentReportDraft = null;
    G.selectedReportId = id;
    if (window.opsRadarApi?.request) {
      try {
        const generated = payload.apiId ? { report_id: payload.apiId } : await window.opsRadarApi.request('/reports/generate', {
          method: 'POST',
          body: JSON.stringify({ period: payload.type }),
        });
        if (generated?.report_id) {
          await window.opsRadarApi.request('/reports/' + generated.report_id, {
            method: 'PATCH',
            body: JSON.stringify({ content }),
          });
        }
      } catch (error) {
        console.warn('Report save API fallback used', error);
      }
    }
    window.showToast?.('\ubcf4\uace0\uc11c\uac00 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.', 'success');
    emitReportState();
    return payload;
  }

  function editReport(reportId) {
    const report = fetchReports().find((item) => item.id === reportId);
    if (!report) return;
    const sections = Object.entries(normalizeReportSections(report.sections)).map(([key, items]) => [SECTION_LABELS[key] || key, items]);
    G.currentReportDraft = { ...report, sections, html: report.html || draftToEditorHtml({ ...report, sections }) };
    G.selectedReportId = null;
    emitReportState();
  }

  function shareReport(reportId) {
    const reports = fetchReports();
    const targetId = reportId || G.selectedReportId;
    const nextReports = reports.map((item) => item.id === targetId ? { ...item, status: 'shared' } : item);
    persistReports(nextReports);
    G.savedReports = nextReports;
    G.sharedReports = G.sharedReports || [];
    G.sharedReports.unshift({ id: 'mock-share-' + Date.now(), reportId: targetId || null, sharedAt: new Date().toISOString() });
    window.showToast?.('\ubcf4\uace0\uc11c \uacf5\uc720 \ub9c1\ud06c\ub97c \uc0dd\uc131\ud588\uc2b5\ub2c8\ub2e4.', 'success');
    emitReportState();
  }

  function focusReportEditor() {
    const editor = document.getElementById('reportEditor') || document.querySelector('#s-reports [contenteditable="true"]');
    if (editor) editor.focus();
    return editor;
  }

  function formatReport(command) {
    const editor = focusReportEditor();
    if (!editor) return;
    try {
      if (command === 'h1') document.execCommand('formatBlock', false, 'h1');
      else if (command === 'h2') document.execCommand('formatBlock', false, 'h2');
      else if (command === 'list') document.execCommand('insertUnorderedList', false, null);
      else document.execCommand(command, false, null);
      window.showToast?.('\ubcf4\uace0\uc11c \ud3b8\uc9d1 \uc11c\uc2dd\uc744 \uc801\uc6a9\ud588\uc2b5\ub2c8\ub2e4.', 'success');
    } catch (error) {
      window.showToast?.('\ube0c\ub77c\uc6b0\uc800 \ud3b8\uc9d1 \uba85\ub839\uc744 \uc801\uc6a9\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.', 'info');
    }
  }

  function initReportsScreen() {
    if (!G.currentReportPeriod) G.currentReportPeriod = 'weekly';
    fetchReports();
    emitReportState();
    window.bindRemainingActionButtons?.();
    window.initDocumentGenerationActions?.();
  }

  function bindRemainingActionButtons() {
    const issueManual = Array.from(document.querySelectorAll('#s-issues .topbar .tbtn.primary')).find((button) => (button.textContent || '').includes('\uc218\ub3d9 \ub4f1\ub85d'));
    if (issueManual && !issueManual.dataset.boundAction) {
      issueManual.dataset.boundAction = '1';
      issueManual.addEventListener('click', () => window.openIssueCreateModal?.());
    }
  }

  function initDocumentGenerationActions() {
    const knowledgeButtons = Array.from(document.querySelectorAll('#s-knowledge .tbtn'));
    knowledgeButtons.forEach((button) => {
      if ((button.textContent || '').includes('\ubb38\uc11c \uc0dd\uc131 \ubbf8\ub9ac\ubcf4\uae30') && !button.dataset.previewBound) {
        button.dataset.previewBound = '1';
        button.addEventListener('click', () => window.generateHandoffPreview?.(G.currentKnowledgeType || 'onboarding'));
      }
    });
  }

  window.fetchReports = fetchReports;
  window.renderReportList = renderReportList;
  window.selectReport = selectReport;
  window.renderReportDetail = renderReportDetail;
  window.createReportDraft = createReportDraft;
  window.generateReportDraft = generateReportDraft;
  window.renderReportDraft = renderReportDraft;
  window.saveReport = saveReport;
  window.editReport = editReport;
  window.shareReport = shareReport;
  window.formatReport = formatReport;
  window.filterReportsByType = filterReportsByType;
  window.setReportPeriod = setReportPeriod;
  window.setReportQuery = setReportQuery;
  window.initReportsScreen = initReportsScreen;
  window.bindRemainingActionButtons = bindRemainingActionButtons;
  window.initDocumentGenerationActions = initDocumentGenerationActions;
  window.getReportSnapshot = getReportSnapshot;
  window.refreshReportState = emitReportState;

  setTimeout(initReportsScreen, 0);
})();`;
}

function buildHandoffReactBridge() {
  return String.raw`// React bridge generated by scripts/import-legacy.mjs.
// Active Knowledge/Handoff rendering is owned by src/components/Knowledge.jsx.
(function installHandoffReactBridge() {
  const HANDOFF_TYPES = ['onboarding', 'absence', 'offboard'];
  const HANDOFF_LABELS = {
    onboarding: '\uc2e0\uaddc \uc785\uc0ac\uc790 \uc628\ubcf4\ub529',
    absence: '\ubd80\uc7ac\uc790 \uc5c5\ubb34 \uc778\uc218\uc778\uacc4',
    offboard: '\ub2f4\ub2f9\uc790 \ubcc0\uacbd/\ud1f4\uc9c1 \uc778\uc218\uc778\uacc4',
  };

  function normalizeHandoffType(type) {
    return HANDOFF_TYPES.includes(type) ? type : 'onboarding';
  }

  function getAbsenceEvents() {
    const calendarRuntime = window.getCalendarRuntimeState?.();
    if (!Array.isArray(calendarRuntime?.newCalEvents)) return [];
    return calendarRuntime.newCalEvents.filter((event) => event.type !== '\ud68c\uc758');
  }

  function getFlow(type) {
    if (type === 'absence') {
      return {
        steps: ['\ub9e1\uc740 \uc5c5\ubb34 \ud30c\uc545', '\uc5c5\ubb34 \ub9e5\ub77d \uc774\ud574', '\ucc98\ub9ac \uc644\ub8cc \ubcf4\uace0'],
        hint: '\uc678\ubd80 \uc77c\uc815\u00b7\ud734\uac00 \uae30\uac04 \ub3d9\uc548 \uc5c5\ubb34 \uacf5\ubc31 \uc5c6\uc774 \ud300\uc774 \uc6b4\uc601\ub429\ub2c8\ub2e4.',
      };
    }
    if (type === 'offboard') {
      return {
        steps: ['\uc774\uc5b4\ubc1b\uc744 \uc5c5\ubb34 \ud30c\uc545', '\ub9e5\ub77d\u00b7\uacb0\uc815\uc0ac\ud56d \uc774\ud574', '\uac1c\ubc1c \ud658\uacbd \uc138\ud305', '\uc778\uc218 \uc644\ub8cc \ud655\uc778'],
        hint: '\uc804\uc784\uc790\uc758 \uc5c5\ubb34\u00b7\ub9e5\ub77d\u00b7\uacb0\uc815\uc0ac\ud56d\uc744 \ube60\ub974\uac8c \ud30c\uc545\ud558\uace0 \uc989\uc2dc \uc774\uc5b4\ubc1b\uc2b5\ub2c8\ub2e4.',
      };
    }
    return {
      steps: ['\ud504\ub85c\uc81d\ud2b8 \ud30c\uc545', '\uc6b4\uc601 \uc0c1\ud0dc \ud655\uc778', '\ud658\uacbd \uc138\ud305', '\uccab \uc5c5\ubb34 \uc2dc\uc791'],
      hint: '\uc2e0\uaddc \ud300\uc6d0\uc774 \ub3c5\ub9bd\uc801\uc73c\ub85c \uc5c5\ubb34\ub97c \uc2dc\uc791\ud558\ub294 \uc2dc\uac04\uc744 \uc904\uc785\ub2c8\ub2e4.',
    };
  }

  function getContext(type) {
    if (type === 'absence') {
      return {
        title: '\ubd80\uc7ac\uc790 \uc5c5\ubb34',
        description: '\uc784\uc2dc\ub85c \ub9e1\uac8c \ub41c \uc5c5\ubb34\ub97c \ube60\ub974\uac8c \ud30c\uc545\ud558\uace0 \uacf5\ubc31 \uc5c6\uc774 \ucc98\ub9ac\ud569\ub2c8\ub2e4.',
        stats: [['\ubd80\uc7ac \uc77c\uc815', String(getAbsenceEvents().length) + '\uac74'], ['\uc6b0\uc120 \ud655\uc778', 'Todo / Issue']],
      };
    }
    if (type === 'offboard') {
      return {
        title: '\ub2f4\ub2f9\uc790 \ubcc0\uacbd',
        description: '\uc804\uc784\uc790\uc758 \uacb0\uc815 \ub9e5\ub77d, \ubbf8\uc644\ub8cc \uc5c5\ubb34, \ucc38\uace0 \ubb38\uc11c\ub97c \ud568\uaed8 \uc815\ub9ac\ud569\ub2c8\ub2e4.',
        stats: [['\uc774\uc5b4\ubc1b\uc744 \ud56d\ubaa9', '4\uac1c \uc601\uc5ed'], ['\uc810\uac80 \ud3ec\uc778\ud2b8', 'Risk / Docs']],
      };
    }
    return {
      title: '\uc2e0\uaddc \uc785\uc0ac\uc790',
      description: '\ud504\ub85c\uc81d\ud2b8 \uac1c\uc694, \ud604\uc7ac \uc6b4\uc601 \uc0c1\ud0dc, \uccab \uc5c5\ubb34 \uc2dc\uc791 \uc21c\uc11c\ub97c \uc815\ub9ac\ud569\ub2c8\ub2e4.',
      stats: [['\uc628\ubcf4\ub529 \uc9c4\ud589', '0/4'], ['\uccab \ud655\uc778', 'Dashboard']],
    };
  }

  function getCards(type) {
    if (type === 'absence') {
      return [
        { title: '\ub9e1\uc740 \uc5c5\ubb34 \ud30c\uc545', sub: '\uc989\uc2dc \ucc98\ub9ac \ud56d\ubaa9', tone: 'now', items: ['\ud604\uc7ac \uc9c4\ud589 \uc911\uc778 Todo\uc640 Issue\ub97c \uba3c\uc800 \ud655\uc778\ud569\ub2c8\ub2e4.', '\ubd80\uc7ac \uae30\uac04 \uc911 \ub9c8\uac10\uc774 \uacb9\uce58\ub294 \uc791\uc5c5\uc744 \uc6b0\uc120 \uc815\ub9ac\ud569\ub2c8\ub2e4.'] },
        { title: '\uc5c5\ubb34 \ub9e5\ub77d \uc774\ud574', sub: '\ucd9c\ucc98 \ubb38\uc11c / \uacb0\uc815 \uc0ac\ud56d', tone: 'why', items: ['\uad00\ub828 \ubb38\uc11c\uc640 \ucc44\ud305 \uae30\ub85d\uc744 \ud568\uaed8 \ud655\uc778\ud569\ub2c8\ub2e4.', '\uc544\uc9c1 \uc5f0\uacb0\ub41c \ubb38\uc11c\uac00 \uc5c6\uc73c\uba74 \uc218\ub3d9 \ube0c\ub9ac\ud551\uc744 \ub0a8\uae41\ub2c8\ub2e4.'] },
        { title: '\ucc98\ub9ac \uc644\ub8cc \ubcf4\uace0', sub: '\ubcf5\uadc0 \uc804 \uc778\uacc4', tone: 'next', items: ['\ucc98\ub9ac \ub0b4\uc6a9\uc744 \ub0a8\uaca8 \ubcf5\uadc0 \uc2dc AI\uac00 \ube0c\ub9ac\ud551 \ubb38\uc11c\ub97c \uc0dd\uc131\ud560 \uc218 \uc788\uac8c \ud569\ub2c8\ub2e4.'] },
      ];
    }
    if (type === 'offboard') {
      return [
        { title: '\uc774\uc5b4\ubc1b\uc744 \uc5c5\ubb34 \uc804\uccb4 \ud30c\uc545', sub: '\uc7a5\uae30 \uc9c4\ud589 \uc5c5\ubb34', tone: 'why', items: ['\uc7a5\uae30 \uc9c4\ud589 \uc791\uc5c5, \ubbf8\uc644\ub8cc Risk, \ubc18\ubcf5 \uc774\uc288\ub97c \ud568\uaed8 \uc815\ub9ac\ud569\ub2c8\ub2e4.', '\ub2f4\ub2f9\uc790\uac00 \ubc14\ub00c\ub294 \uc2dc\uc810\uc758 \uc6b0\uc120\uc21c\uc704\ub97c \uc7ac\uc815\ub82c\ud569\ub2c8\ub2e4.'] },
        { title: '\ub9e5\ub77d & \uacb0\uc815\uc0ac\ud56d \uc774\ud574', sub: '\ud575\uc2ec \uacb0\uc815 \uae30\ub85d', tone: 'now', items: ['\uc65c \uadf8\ub807\uac8c \uc9c4\ud589\ub410\ub294\uc9c0 \uacb0\uc815 \uadfc\uac70\ub97c \ud655\uc778\ud569\ub2c8\ub2e4.', '\ub300\uc548\uacfc \ubcf4\ub958\ub41c \uc774\uc720\ub97c \ud568\uaed8 \ub0a8\uae41\ub2c8\ub2e4.'] },
        { title: '\uc778\uc218 \uc644\ub8cc \ud655\uc778', sub: '\ub204\ub77d \uc5c5\ubb34 \uc810\uac80', tone: 'next', items: ['AI\uac00 \uc778\uc218 \ud30c\uc545 \uc644\uc131\ub3c4\ub97c \ud3c9\uac00\ud558\uace0 \ub193\uce5c \ud56d\ubaa9\uc744 \uc54c\ub824\uc90d\ub2c8\ub2e4.'] },
      ];
    }
    return [
      { title: '\ud504\ub85c\uc81d\ud2b8 \uac1c\uc694 \uc774\ud574', sub: '\uc6b4\uc601 \uc778\ud154\ub9ac\uc804\uc2a4 \uc804\uccb4 \ub9e5\ub77d', tone: 'why', items: ['OpsRadar\ub294 \uc6b4\uc601 \ub85c\uadf8, Todo, Risk, Calendar, \uc778\uc218\uc778\uacc4 \ubb38\ub9e5\uc744 \uc5f0\uacb0\ud569\ub2c8\ub2e4.', '\ud654\uba74\ubcc4 \uc5ed\ud560\uacfc \ub370\uc774\ud130 \ud750\ub984\uc744 \uba3c\uc800 \ud655\uc778\ud569\ub2c8\ub2e4.'] },
      { title: '\uc6b4\uc601 \uc0c1\ud0dc \ud655\uc778', sub: 'Dashboard / Todo / Issue', tone: 'now', items: ['Dashboard\uc758 High Risk \uce74\ub4dc\ub97c \uba3c\uc800 \ud655\uc778\ud569\ub2c8\ub2e4.', '\ub0b4 Todo\uc640 \uad00\ub828 \ucd9c\ucc98 \ubb38\uc11c\ub97c \uc5f0\uacb0\ud574 \ubcf4\uc138\uc694.'] },
      { title: '\uccab \uc5c5\ubb34 \uc2dc\uc791', sub: '\ubc30\uc815\ub41c Todo / \ucc38\uace0 \ubb38\uc11c', tone: 'next', items: ['\uccab \uc5c5\ubb34\ub294 Risk \ud655\uc778, Todo \uc0c1\ud0dc \ud655\uc778, \ub2f4\ub2f9\uc790 \uacf5\uc720 \uc21c\uc11c\ub85c \uc2dc\uc791\ud569\ub2c8\ub2e4.'] },
    ];
  }

  function getHandoffPreviewData(type) {
    const selected = normalizeHandoffType(type || G.currentKnowledgeType || 'onboarding');
    const label = HANDOFF_LABELS[selected];
    const flow = getFlow(selected);
    const cards = getCards(selected);
    const generatedAt = new Date().toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
    return {
      type: selected,
      title: label + ' \ube0c\ub9ac\ud551',
      target: label,
      sections: [
        ['\ubaa9\uc801', getContext(selected).description],
        ['\uc9c4\ud589 \uc21c\uc11c', flow.steps.join(' -> ')],
        ['\uc989\uc2dc \ud655\uc778 \ud56d\ubaa9', cards.flatMap((card) => card.items).slice(0, 4).join('\n')],
        ['\uad00\ub828 \uc77c\uc815', getAbsenceEvents().length ? getAbsenceEvents().map((event) => String(event.date || '') + ' ' + String(event.person || '') + ' ' + String(event.type || '')).join('\n') : '\uc5f0\uacb0\ub41c \ubd80\uc7ac \uc77c\uc815\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.'],
        ['\uc0dd\uc131\uc77c', generatedAt],
      ],
    };
  }

  function getKnowledgeSnapshot() {
    const selected = normalizeHandoffType(G.currentKnowledgeType || 'onboarding');
    const flow = getFlow(selected);
    return {
      currentType: selected,
      labels: HANDOFF_LABELS,
      flow,
      context: getContext(selected),
      cards: getCards(selected),
      absenceEvents: getAbsenceEvents(),
      preview: G.handoffPreviewOpen ? (G.currentHandoffDraft || getHandoffPreviewData(selected)) : null,
      savedDraft: G.savedHandoffDraft || null,
    };
  }

  function emitKnowledgeState() {
    window.dispatchEvent(new CustomEvent('opsradar:knowledge-state-updated', { detail: getKnowledgeSnapshot() }));
  }

  function selectKnowledgeType(type) {
    G.currentKnowledgeType = normalizeHandoffType(type);
    emitKnowledgeState();
  }

  function selectHandoffType(type) {
    selectKnowledgeType(type);
  }

  function renderKnowledgeFlow(type) {
    if (type) G.currentKnowledgeType = normalizeHandoffType(type);
    emitKnowledgeState();
  }

  function generateHandoffPreview(type) {
    const selected = normalizeHandoffType(type || G.currentKnowledgeType || 'onboarding');
    G.currentKnowledgeType = selected;
    G.currentHandoffDraft = getHandoffPreviewData(selected);
    G.handoffPreviewOpen = true;
    window.showToast?.(HANDOFF_LABELS[selected] + ' \ubbf8\ub9ac\ubcf4\uae30\ub97c \uc0dd\uc131\ud588\uc2b5\ub2c8\ub2e4.', 'success');
    emitKnowledgeState();
    return G.currentHandoffDraft;
  }

  function openHandoffPreview(type) {
    return generateHandoffPreview(type || G.currentKnowledgeType || 'onboarding');
  }

  function renderHandoffPreview(data) {
    G.currentHandoffDraft = data || getHandoffPreviewData(G.currentKnowledgeType || 'onboarding');
    G.handoffPreviewOpen = true;
    emitKnowledgeState();
  }

  function closeHandoffPreview() {
    G.handoffPreviewOpen = false;
    emitKnowledgeState();
  }

  function saveHandoffDraft() {
    if (!G.currentHandoffDraft) G.currentHandoffDraft = getHandoffPreviewData(G.currentKnowledgeType || 'onboarding');
    G.savedHandoffDraft = { ...G.currentHandoffDraft, savedAt: new Date().toISOString() };
    window.showToast?.('\uc778\uc218\uc778\uacc4 \ucd08\uc548\uc744 \uc784\uc2dc \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4.', 'success');
    emitKnowledgeState();
  }

  function editHandoffDraft() {
    window.showToast?.('\ubbf8\ub9ac\ubcf4\uae30 \ub0b4\uc6a9\uc744 \uac80\ud1a0\ud55c \ub4a4 \ud3b8\uc9d1 \ud654\uba74\uc73c\ub85c \uc5f0\uacb0\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.', 'info');
  }

  function shareHandoffDraft() {
    window.showToast?.('\uacf5\uc720 \ub9c1\ud06c\ub97c \uc0dd\uc131\ud588\uc2b5\ub2c8\ub2e4. \uc2e4\uc81c API \uc5f0\uacb0 \uc804\uae4c\uc9c0 mock \ucc98\ub9ac\ub429\ub2c8\ub2e4.', 'success');
  }

  function bindHandoffCenterButtons() {
    emitKnowledgeState();
  }

  function initHandoffPanelEventDelegation() {}

  window.selectHandoffType = selectHandoffType;
  window.selectKnowledgeType = selectKnowledgeType;
  window.renderKnowledgeFlow = renderKnowledgeFlow;
  window.openHandoffPreview = openHandoffPreview;
  window.generateHandoffPreview = generateHandoffPreview;
  window.renderHandoffPreview = renderHandoffPreview;
  window.getHandoffPreviewData = getHandoffPreviewData;
  window.closeHandoffPreview = closeHandoffPreview;
  window.saveHandoffDraft = saveHandoffDraft;
  window.editHandoffDraft = editHandoffDraft;
  window.shareHandoffDraft = shareHandoffDraft;
  window.bindHandoffCenterButtons = bindHandoffCenterButtons;
  window.initHandoffPanelEventDelegation = initHandoffPanelEventDelegation;
  window.getKnowledgeSnapshot = getKnowledgeSnapshot;
  window.refreshKnowledgeState = emitKnowledgeState;

  setTimeout(() => selectKnowledgeType(G.currentKnowledgeType || 'onboarding'), 0);
})();`;
}

function buildCoreAppSource() {
  return `// OpsRadar React 전환 공통 코어.
// 이 파일에는 레거시 런타임 등록소와 화면 이동만 둡니다.
window.OpsRadarFrontend = window.OpsRadarFrontend || {
  modules: {},
  schemas: {},
  registerModule(name, module) {
    if (!name) return;
    this.modules[name] = {
      name,
      loadedAt: new Date().toISOString(),
      ...(module || {}),
    };
  },
};

window.OpsRadarFrontend.registerModule('app-core', {
  file: 'js/app.js',
  screen: 'global',
  owns: [
    '레거시 런타임 등록소',
    '화면 이동',
  ],
});

function nav(screen) {
  document.getElementById('floatPanel')?.classList.remove('show');
  document.getElementById('notifPanel')?.classList.remove('show');

  document.querySelectorAll('.screen').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach((item) => item.classList.remove('active'));
  document.getElementById('s-' + screen)?.classList.add('active');
  document.getElementById('nav-' + screen)?.classList.add('active');
  const state = window.G || {};
  state.currentScreen = screen;

  const floatAI = document.getElementById('floatAI');
  if (floatAI) floatAI.style.display = screen === 'chat' ? 'none' : '';

  if (screen === 'todo') window.renderTodos?.();
  if (screen === 'issues') window.renderIssues?.();
  if (screen === 'calendar') {
    window.renderCalendar?.();
    window.showCalBanner?.();
  }
  if (screen === 'settings') window.updateSettingsPage?.();
  if (screen === 'reports') window.initReportsScreen?.();
  if (screen === 'chat') window.initChatSessions?.();
  if (screen === 'knowledge') window.selectKnowledgeType?.(state.currentKnowledgeType || 'onboarding');
}
window.nav = nav;
`;
}

function buildRuntimeStateSource() {
  return `window.OpsRadarFrontend?.registerModule('runtime-state', {
  file: 'js/runtime-state.js',
  screen: 'global',
  owns: [
    '공유 화면 상태',
    'Todo 공유 배열',
    'Issue 공유 배열',
  ],
});

// 레거시 bridge 호환용 공유 화면 상태입니다.
var G = window.G || {
  currentScreen: 'dashboard',
};
window.G = G;

// 레거시 bridge 호환용 공유 엔티티 배열입니다.
var todos = window.todos || [];
var issues = window.issues || [];
window.todos = todos;
window.issues = issues;
`;
}

function extractTopLevelFunction(source, name) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^(async\\s+)?function\\s+${name}\\s*\\(`).test(line));

  if (start === -1) {
    throw new Error(`Could not find function ${name}.`);
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^(async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(/.test(lines[i])) {
      end = i;
      break;
    }
  }

  return {
    source: [...lines.slice(0, start), ...lines.slice(end)].join("\n"),
    functionSource: lines.slice(start, end).join("\n"),
  };
}

function extractSourceRange(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  if (start === -1) {
    throw new Error(`Could not find source range start: ${startNeedle}.`);
  }
  const end = source.indexOf(endNeedle, start);
  if (end === -1) {
    throw new Error(`Could not find source range end: ${endNeedle}.`);
  }

  return {
    source: source.slice(0, start) + source.slice(end),
    rangeSource: source.slice(start, end),
  };
}

function extractSourceFrom(source, startNeedle) {
  const start = source.indexOf(startNeedle);
  if (start === -1) {
    throw new Error(`Could not find source start: ${startNeedle}.`);
  }

  return {
    source: source.slice(0, start),
    rangeSource: source.slice(start),
  };
}

function escapeTemplate(value) {
  return value.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function transformReactManagedHandlers(markup) {
  return markup
    .replace(/onclick="switchDbRole\('([^']+)'\)"/g, 'data-dashboard-role="$1"')
    .replace(/onclick="openIssueDetail\('([^']+)'\)"/g, 'data-dashboard-issue-detail="$1"')
    .replace(/onclick="applyDashboard\(\)"/g, 'data-dashboard-action="apply"')
    .replace(/onclick="nav\('([^']+)'\)"/g, 'data-legacy-nav="$1"')
    .replace(/onclick="if\(event\.target===this\)closeModal\('([^']+)'\)"/g, 'data-modal-backdrop-close="$1"')
    .replace(/onclick="if\(event\.target===this\)\{closeModal\('calModal'\);G\.selectedCalDay=null;renderCalendar\(\)\}"/g, 'data-modal-backdrop-close="calModal" data-cal-reset="true"')
    .replace(/onclick="if\(event\.target===this\)closeIssueCreateModal\(\)"/g, 'data-modal-backdrop-call="closeIssueCreateModal"')
    .replace(/\sonclick="event\.stopPropagation\(\)"/g, '')
    .replace(/onclick="closeModal\('uploadGuideModal'\);retryUpload\(\)"/g, 'data-modal-close="uploadGuideModal" data-shell-call="retryUpload"')
    .replace(/onclick="closeModal\('calModal'\);G\.selectedCalDay=null;renderCalendar\(\)"/g, 'data-modal-close="calModal" data-cal-reset="true"')
    .replace(/onclick="closeModal\('([^']+)'\)"/g, 'data-modal-close="$1"')
    .replace(/onclick="confirmTodoCreate\(\)"/g, 'data-shell-call="confirmTodoCreate"')
    .replace(/onclick="toggleColorPicker\(\)"/g, 'data-shell-call="toggleColorPicker"')
    .replace(/onclick="pickColor\('([^']+)','([^']+)','([^']+)'\)"/g, 'data-cal-color-value="$1" data-cal-color-label="$2" data-cal-color-css="$3"')
    .replace(/onclick="addCalTag\(\)"/g, 'data-shell-call="addCalTag"')
    .replace(/onclick="saveEdit\(\)"/g, 'data-shell-call="saveEdit"')
    .replace(/onclick="saveManual\(\)"/g, 'data-shell-call="saveManual"')
    .replace(/onclick="closeIssueCreateModal\(\)"/g, 'data-shell-call="closeIssueCreateModal"')
    .replace(/onclick="saveIssueCreate\(\)"/g, 'data-shell-call="saveIssueCreate"')
    .replace(/onclick="dismissIssue\(\)"/g, 'data-shell-call="dismissIssue"')
    .replace(/onclick="doConfirmIssue\(\)"/g, 'data-shell-call="doConfirmIssue"')
    .replace(/onclick="clearNotifs\(\)"/g, 'data-shell-call="clearNotifs"')
    .replace(/onclick="floatSend\(\)"/g, 'data-shell-call="floatSend"')
    .replace(/onclick="toggleFloatAI\(\)"/g, 'data-shell-call="toggleFloatAI"')
    .replace(/onkeydown="if\(event\.key==='Enter'\)floatSend\(\)"/g, 'data-enter-call="floatSend"')
    .replace(/\sonmouseover="this\.style\.background='var\(--surface2\)'"/g, '')
    .replace(/\sonmouseout="this\.style\.background=''"/g, '');
}

function toExportName(screenId) {
  return `${screenId.replace(/-([a-z])/g, (_, char) => char.toUpperCase())}Screen`;
}

function findMatchingDivEnd(source, openDivStart) {
  const divTag = /<\/?div\b[^>]*>/gi;
  divTag.lastIndex = openDivStart;

  let depth = 0;
  let match;

  while ((match = divTag.exec(source))) {
    depth += match[0].startsWith("</") ? -1 : 1;

    if (depth === 0) {
      return divTag.lastIndex;
    }
  }

  throw new Error(`Could not find closing div from offset ${openDivStart}.`);
}

function extractScreens(markup) {
  const screenStart = /<div\b(?=[^>]*\bclass="[^"]*\bscreen\b[^"]*")(?=[^>]*\bid="s-([^"]+)")[^>]*>/gi;
  const screens = [];
  let match;

  while ((match = screenStart.exec(markup))) {
    const start = match.index;
    const end = findMatchingDivEnd(markup, start);
    screens.push({
      id: match[1],
      start,
      end,
      markup: markup.slice(start, end),
    });
    screenStart.lastIndex = end;
  }

  if (!screens.length) {
    throw new Error("No legacy screens were found in index.html.");
  }

  return screens;
}

function writeScreenModules(screens) {
  fs.rmSync(legacyScreensDir, { recursive: true, force: true });
  ensureDir(legacyScreensDir);

  const imports = [];
  const exports = [];

  for (const screen of screens) {
    const exportName = toExportName(screen.id);
    const fileName = `${screen.id}.js`;
    const screenMarkup =
      screen.id === "dashboard" || screen.id === "analysis" || screen.id === "todo" || screen.id === "issues" || screen.id === "calendar" || screen.id === "reports" || screen.id === "knowledge" || screen.id === "chat" || screen.id === "settings"
        ? `<div class="screen${screen.id === "dashboard" ? " active" : ""}" id="s-${screen.id}"></div>`
        : transformReactManagedHandlers(screen.markup);
    const source = `// Generated from opsradar2/frontend/index.html by scripts/import-legacy.mjs.
export const ${exportName} = String.raw\`${escapeTemplate(screenMarkup)}\`;
`;

    fs.writeFileSync(path.join(legacyScreensDir, fileName), source, "utf8");
    imports.push(`import { ${exportName} } from "./${fileName}";`);
    exports.push(exportName);
  }

  const indexSource = `// Generated from opsradar2/frontend/index.html by scripts/import-legacy.mjs.
${imports.join("\n")}

export const legacyScreens = [
  ${exports.join(",\n  ")},
];

export const legacyScreenIds = ${JSON.stringify(screens.map((screen) => screen.id), null, 2)};
`;

  fs.writeFileSync(path.join(legacyScreensDir, "index.js"), indexSource, "utf8");
}

const htmlPath = path.join(legacyRoot, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

if (!bodyMatch) {
  throw new Error("Could not find body in legacy index.html.");
}

const scriptMatches = [...bodyMatch[1].matchAll(/<script\s+src="([^"]+)"><\/script>/g)];
const scriptPaths = scriptMatches.map((match) => match[1]);
const appScriptIndex = scriptPaths.indexOf("/static/js/app.js");
if (!scriptPaths.includes("/static/js/runtime-utils.js")) {
  scriptPaths.splice(appScriptIndex === -1 ? 0 : appScriptIndex + 1, 0, "/static/js/runtime-utils.js");
}
if (!scriptPaths.includes("/static/js/runtime-state.js")) {
  scriptPaths.splice(appScriptIndex === -1 ? 0 : appScriptIndex + 1, 0, "/static/js/runtime-state.js");
}
if (!scriptPaths.includes("/static/js/chat.js")) {
  scriptPaths.splice(appScriptIndex === -1 ? 0 : appScriptIndex + 1, 0, "/static/js/chat.js");
}
if (!scriptPaths.includes("/static/js/analysis.js")) {
  scriptPaths.splice(appScriptIndex === -1 ? 0 : appScriptIndex + 1, 0, "/static/js/analysis.js");
}
if (!scriptPaths.includes("/static/js/shell.js")) {
  scriptPaths.splice(appScriptIndex === -1 ? 0 : appScriptIndex + 1, 0, "/static/js/shell.js");
}
if (!scriptPaths.includes("/static/js/issue-data.js")) {
  scriptPaths.splice(appScriptIndex === -1 ? 0 : appScriptIndex + 1, 0, "/static/js/issue-data.js");
}
const chatScriptIndex = scriptPaths.indexOf("/static/js/chat.js");
if (!scriptPaths.includes("/static/js/mini-calendar-chat.js")) {
  scriptPaths.splice(chatScriptIndex === -1 ? (appScriptIndex === -1 ? 0 : appScriptIndex + 1) : chatScriptIndex + 1, 0, "/static/js/mini-calendar-chat.js");
}
const calendarScriptIndex = scriptPaths.indexOf("/static/js/calendar.js");
if (!scriptPaths.includes("/static/js/clean-bootstrap.js")) {
  scriptPaths.splice(calendarScriptIndex === -1 ? scriptPaths.length : calendarScriptIndex + 1, 0, "/static/js/clean-bootstrap.js");
}
const orderedAfterAppScripts = [
  "/static/js/runtime-state.js",
  "/static/js/runtime-utils.js",
  "/static/js/issue-data.js",
  "/static/js/shell.js",
  "/static/js/analysis.js",
  "/static/js/chat.js",
  "/static/js/mini-calendar-chat.js",
];
const appOrderIndex = scriptPaths.indexOf("/static/js/app.js");
const orderedPresentScripts = orderedAfterAppScripts.filter((src) => scriptPaths.includes(src));
for (const src of orderedPresentScripts) {
  scriptPaths.splice(scriptPaths.indexOf(src), 1);
}
scriptPaths.splice(appOrderIndex === -1 ? 0 : appOrderIndex + 1, 0, ...orderedPresentScripts);
const bodyWithoutScripts = bodyMatch[1]
  .replace(/<script\s+src="[^"]+"><\/script>\s*/g, "")
  .trim();
const screens = extractScreens(bodyWithoutScripts);
const shellBeforeScreens = transformReactManagedHandlers(bodyWithoutScripts.slice(0, screens[0].start));
const shellAfterScreens = transformReactManagedHandlers(bodyWithoutScripts.slice(screens[screens.length - 1].end));

ensureDir(publicStaticRoot);
copyDir(path.join(legacyRoot, "css"), path.join(publicStaticRoot, "css"));
copyDir(path.join(legacyRoot, "js"), path.join(publicStaticRoot, "js"));
patchLegacyAppJs();
ensureDir(path.dirname(legacyModulePath));
writeScreenModules(screens);

const moduleSource = `import { legacyScreens } from "./screens/index.js";

// Generated from opsradar2/frontend/index.html by scripts/import-legacy.mjs.
// Keep the legacy UI whole while React migration happens screen by screen.
export const legacyShellBeforeScreens = String.raw\`${escapeTemplate(shellBeforeScreens)}\`;

export const legacyShellAfterScreens = String.raw\`${escapeTemplate(shellAfterScreens)}\`;

export const legacyMarkup = [
  legacyShellBeforeScreens,
  legacyScreens.join("\\n"),
  legacyShellAfterScreens,
].join("");

export const legacyScripts = ${JSON.stringify(scriptPaths, null, 2)};
`;

fs.writeFileSync(legacyModulePath, moduleSource, "utf8");

console.log(`Imported ${screens.length} legacy screens and ${scriptPaths.length} scripts.`);

