import { legacyScreens } from "./screens/index.js";

export const legacyShellBeforeScreens = String.raw`<div style="display:flex;flex:1;overflow:hidden">
<div class="sidebar">
  <div class="sb-logo">
    <div class="sb-logo-name">OpsRadar</div>
    <div class="sb-logo-tag">운영 인텔리전스</div>
  </div>
  <div class="sb-nav">
    <div class="sb-section">운영</div>
    <div class="sb-item active" id="nav-dashboard" data-legacy-nav="dashboard"><i class="ti ti-layout-dashboard"></i> Dashboard</div>
    <div class="sb-item" id="nav-analysis" data-legacy-nav="analysis"><i class="ti ti-file-analysis"></i> 운영 로그 분석</div>
    <div class="sb-item" id="nav-todo" data-legacy-nav="todo">
      <i class="ti ti-checkbox"></i> Todo
      <span id="todoBadge" style="display:none;margin-left:auto" class="badge b-accent">새 항목</span>
    </div>
    <div class="sb-item" id="nav-issues" data-legacy-nav="issues"><i class="ti ti-alert-triangle"></i> 이슈 로그</div>
    <div class="sb-item" id="nav-calendar" data-legacy-nav="calendar">
      <i class="ti ti-calendar"></i> 캘린더
      <span id="calBadge" style="display:none;margin-left:auto" class="badge b-success">업데이트</span>
    </div>
    <div class="sb-section">지식</div>
    <div class="sb-item" id="nav-knowledge" data-legacy-nav="knowledge"><i class="ti ti-transfer"></i> 인수인계 센터</div>
    <div class="sb-item" id="nav-reports" data-legacy-nav="reports"><i class="ti ti-report"></i> 보고서</div>
    <div class="sb-section">AI</div>
    <div class="sb-item" id="nav-chat" data-legacy-nav="chat"><i class="ti ti-message-dots"></i> AI Assistant</div>
    <div class="sb-section">계정</div>
    <div class="sb-item" id="nav-settings" data-legacy-nav="settings"><i class="ti ti-settings"></i> 설정</div>
  </div>
  <div class="sb-footer">
    <div style="display:flex;align-items:center;gap:8px">
      <div class="sb-avatar">희진</div>
      <div>
        <div style="font-size:11px;color:var(--text);font-weight:500">관리자</div>
        <div style="font-size:10px;color:var(--text3)">PM · 팀장</div>
      </div>
    </div>
  </div>
</div>

<div class="main">
`;

export const legacyShellAfterScreens = String.raw`
</div><!-- /main -->
</div>

<div class="modal-overlay" id="uploadGuideModal" data-modal-backdrop-close="uploadGuideModal">
  <div class="modal slide-up upload-guide-modal">
    <div class="modal-title">지원 업로드 양식</div>
    <div class="modal-sub">날짜, 작성자, 내용이 구분된 운영 기록을 권장합니다.</div>
    <div class="upload-guide-grid">
      <div class="upload-guide-example"><strong>[채팅 로그]</strong><pre>2026-05-29 10:21 관리자: Dashboard API 연결 확인 필요
2026-05-29 10:24 담당자 A: 캘린더 CRUD 수정 중</pre></div>
      <div class="upload-guide-example"><strong>[회의록]</strong><pre>날짜: 2026-05-29
참석자: 관리자, 담당자 A, 담당자 B
안건: 운영 로그 분석 기능 점검
결정사항: 업로드 실패 안내 추가
Todo: 파일 형식 검증 로직 추가</pre></div>
      <div class="upload-guide-example"><strong>[메일 스레드]</strong><pre>From: manager@company.com
Date: 2026-05-29
Subject: Dashboard API 일정 확인
Content: API 연결 일정과 담당자 확인이 필요합니다.</pre></div>
    </div>
    <div class="modal-actions"><div class="tbtn" data-modal-close="uploadGuideModal">닫기</div><div class="tbtn primary" data-modal-close="uploadGuideModal" data-shell-call="retryUpload">다시 업로드</div></div>
  </div>
</div>

<div class="modal-overlay" id="todoCreateModal">
  <div class="modal slide-up">
    <div class="modal-title">대응 Todo 생성</div>
    <div class="modal-sub" id="tcModalSub"></div>
    <div style="background:var(--danger-soft);border-radius:var(--radius-sm);padding:8px 10px;font-size:11px;color:var(--danger);margin-bottom:12px;display:flex;align-items:flex-start;gap:6px"><i class="ti ti-alert-triangle" style="font-size:13px;flex-shrink:0"></i><div id="tcModalFrom"></div></div>
    <div><div class="form-label">Todo 제목</div><input class="form-input" id="tcTitle" type="text"></div>
    <div class="form-row"><div><div class="form-label">담당자</div><select class="form-input" id="tcAssignee"><option>담당자 A</option><option>담당자 B</option><option>담당자 C</option><option>담당자 D</option><option>관리자</option></select></div><div><div class="form-label">우선순위</div><select class="form-input" id="tcPriority"><option value="high">높음</option><option value="medium">중간</option><option value="low">낮음</option></select></div></div>
    <div style="margin-top:8px"><div class="form-label">마감일</div><input class="form-input" id="tcDue" type="date" value="2026-05-23"></div>
    <div class="modal-actions"><div class="tbtn" data-modal-close="todoCreateModal">취소</div><div class="tbtn primary" data-shell-call="confirmTodoCreate"><i class="ti ti-plus"></i> Todo 생성 및 이동</div></div>
  </div>
</div>

<div class="modal-overlay" id="calModal" data-modal-backdrop-close="calModal" data-cal-reset="true">
  <div class="modal slide-up" style="min-width:340px;max-width:420px">
    <div class="modal-title" style="display:flex;align-items:center;gap:8px">
      <i class="ti ti-calendar" style="font-size:16px;color:var(--accent)"></i>
      <span id="calModalDate">날짜</span> 일정 관리
    </div>
    <div style="font-size:11px;font-weight:500;color:var(--text2);margin-bottom:8px">등록된 일정</div>
    <div id="calModalList" style="display:flex;flex-direction:column;gap:6px;min-height:40px;margin-bottom:16px"></div>
    <div style="font-size:11px;font-weight:500;color:var(--text2);margin-bottom:8px">일정 추가</div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <input class="form-input" id="calModalInput" type="text" placeholder="일정 내용 입력..." style="flex:1">
    </div>
    <div style="display:flex;gap:6px;margin-bottom:16px;align-items:center">
      <div style="font-size:11px;color:var(--text3);flex-shrink:0">상태</div>
      <div style="flex:1;position:relative" id="calColorPicker">
        <div data-shell-call="toggleColorPicker" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;background:var(--surface);font-size:11px" id="calColorSelected">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0" id="calColorDot"></div>
          <span id="calColorLabel">일반</span>
          <i class="ti ti-chevron-down" style="font-size:11px;color:var(--text3);margin-left:auto"></i>
        </div>
        <div id="calColorDropdown" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);z-index:100;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          <div data-cal-color-value="ct-info" data-cal-color-label="일반" data-cal-color-css="var(--accent)" style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;font-size:11px"><div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0"></div><span>일반</span></div>
          <div data-cal-color-value="ct-warn" data-cal-color-label="주의" data-cal-color-css="var(--warn)" style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;font-size:11px"><div style="width:8px;height:8px;border-radius:50%;background:var(--warn);flex-shrink:0"></div><span>주의</span></div>
          <div data-cal-color-value="ct-danger" data-cal-color-label="위험" data-cal-color-css="var(--danger)" style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;font-size:11px"><div style="width:8px;height:8px;border-radius:50%;background:var(--danger);flex-shrink:0"></div><span>위험</span></div>
          <div data-cal-color-value="ct-success" data-cal-color-label="완료" data-cal-color-css="var(--success)" style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;font-size:11px"><div style="width:8px;height:8px;border-radius:50%;background:var(--success);flex-shrink:0"></div><span>완료</span></div>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <div class="tbtn" data-modal-close="calModal" data-cal-reset="true">닫기</div>
      <div class="tbtn primary" data-shell-call="addCalTag"><i class="ti ti-plus"></i> 일정 추가</div>
    </div>
  </div>
</div>

<div class="modal-overlay" id="editModal">
  <div class="modal slide-up">
    <div class="modal-title">Todo 수정</div>
    <div style="margin-bottom:8px"><div class="form-label">제목</div><input class="form-input" id="editTitle" type="text"></div>
    <div><div class="form-label">담당자</div><select class="form-input" id="editAssignee"><option>담당자 A</option><option>담당자 B</option><option>담당자 C</option><option>담당자 D</option><option>관리자</option></select></div>
    <div class="modal-actions"><div class="tbtn" data-modal-close="editModal">취소</div><div class="tbtn primary" data-shell-call="saveEdit">저장</div></div>
  </div>
</div>

<div class="modal-overlay" id="manualModal">
  <div class="modal slide-up">
    <div class="modal-title">Todo 수동 등록</div>
    <div style="margin-bottom:8px"><div class="form-label">Todo 내용</div><textarea class="form-input" id="manualTitle" rows="3" style="resize:vertical" placeholder="Todo 내용을 입력하세요"></textarea></div>
    <div class="form-row"><div><div class="form-label">담당자</div><select class="form-input" id="manualAssignee"><option>담당자 A</option><option>담당자 B</option><option>담당자 C</option><option>담당자 D</option><option>관리자</option></select></div><div><div class="form-label">우선순위</div><select class="form-input" id="manualPriority"><option value="high">높음</option><option value="medium" selected>중간</option><option value="low">낮음</option></select></div></div>
    <div class="modal-actions"><div class="tbtn" data-modal-close="manualModal">취소</div><div class="tbtn primary" data-shell-call="saveManual">등록</div></div>
  </div>
</div>

<div class="modal-overlay" id="issueCreateModal" data-modal-backdrop-call="closeIssueCreateModal">
  <div class="modal slide-up" style="width:min(520px,92vw)">
    <div class="modal-title">이슈 수동 등록</div>
    <div class="modal-sub">운영 중 확인한 리스크를 직접 등록합니다.</div>
    <div style="margin-bottom:8px"><div class="form-label">제목</div><input class="form-input" id="issueTitle" type="text" placeholder="예: 결제 API 응답 지연"></div>
    <div style="margin-bottom:8px"><div class="form-label">설명</div><textarea class="form-input" id="issueDescription" rows="3" style="resize:vertical" placeholder="이슈 상황과 관찰된 증상을 입력하세요"></textarea></div>
    <div class="form-row">
      <div><div class="form-label">심각도</div><select class="form-input" id="issueSeverity"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
      <div><div class="form-label">상태</div><select class="form-input" id="issueStatus"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="blocked">Blocked</option><option value="resolved">Resolved</option></select></div>
    </div>
    <div class="form-row">
      <div><div class="form-label">담당자</div><input class="form-input" id="issueAssignee" type="text" placeholder="예: Backend"></div>
      <div><div class="form-label">관련 문서</div><input class="form-input" id="issueSourceDocument" type="text" placeholder="optional"></div>
    </div>
    <div style="margin-top:8px"><div class="form-label">도미노 영향</div><textarea class="form-input" id="issueDominoImpact" rows="2" style="resize:vertical" placeholder="예: API 지연 → 실패 증가 → 고객 영향"></textarea></div>
    <div class="modal-actions"><div class="tbtn" data-shell-call="closeIssueCreateModal">취소</div><div class="tbtn primary" data-shell-call="saveIssueCreate"><i class="ti ti-device-floppy"></i> 저장</div></div>
  </div>
</div>

<div class="modal-overlay" id="confirmIssueModal">
  <div class="modal slide-up" style="width:360px">
    <div class="modal-title">이슈 확정</div>
    <div style="font-size:11px;color:var(--text2);margin:10px 0 16px;line-height:1.7" id="confirmIssueText"></div>
    <div class="modal-actions"><div class="tbtn" data-modal-close="confirmIssueModal">취소</div><div class="tbtn" data-shell-call="dismissIssue" style="color:var(--text3)">무시</div><div class="tbtn primary" style="background:var(--danger);border-color:var(--danger)" data-shell-call="doConfirmIssue">이슈 확정</div></div>
  </div>
</div>

<div class="toast" id="toast"><i class="ti ti-check" id="toastIcon" style="color:var(--success)"></i><span id="toastMsg"></span></div>
<div class="screen-transition" id="transition"><i class="ti ti-sparkles" style="font-size:32px;color:var(--accent)"></i><div style="font-size:14px;font-weight:500;color:var(--accent)">처리 중...</div><div style="font-size:11px;color:var(--text3)" id="transitionMsg"></div></div>

<div class="notif-panel" id="notifPanel">
  <div class="notif-hd">
    알림 센터
    <span style="font-size:10px;color:var(--text3);cursor:pointer;font-weight:400" data-shell-call="clearNotifs">모두 읽음</span>
  </div>
  <div id="notifList">
    <div style="padding:20px;text-align:center;font-size:12px;color:var(--text3)">
      <i class="ti ti-bell" style="font-size:24px;display:block;margin-bottom:8px"></i>
      아직 알림이 없습니다.
    </div>
  </div>
</div>

<div class="float-ai" id="floatAI">
  <div class="float-ai-panel" id="floatPanel">
    <div class="float-ai-panel-hd"><i class="ti ti-sparkles" style="font-size:14px"></i> AI에게 바로 질문</div>
    <div style="font-size:10px;color:var(--text3);margin-bottom:8px" id="floatCtxLabel">현재 화면 기반으로 답변합니다.</div>
    <div id="floatSuggestions"></div>
    <div class="float-input-row">
      <input class="float-input" id="floatInput" placeholder="질문을 입력하세요..." data-enter-call="floatSend">
      <button class="float-send" data-shell-call="floatSend"><i class="ti ti-send" style="font-size:12px"></i></button>
    </div>
  </div>
  <button class="float-ai-btn" data-shell-call="toggleFloatAI" title="AI에게 질문">
    <i class="ti ti-message-dots"></i>
  </button>
</div>`;

export const legacyMarkup = [
  legacyShellBeforeScreens,
  legacyScreens.join("\n"),
  legacyShellAfterScreens,
].join("");

export const legacyScripts = [
  "/static/js/frontend-base.js",
  "/static/js/app.js",
  "/static/js/runtime-state.js",
  "/static/js/runtime-utils.js",
  "/static/js/issue-data.js",
  "/static/js/shell.js",
  "/static/js/analysis.js",
  "/static/js/chat.js",
  "/static/js/mini-calendar-chat.js",
  "/static/js/api-integration.js",
  "/static/js/storage.js",
  "/static/js/dashboard.js",
  "/static/js/todo.js",
  "/static/js/issue.js",
  "/static/js/calendar.js",
  "/static/js/clean-bootstrap.js",
  "/static/js/handoff.js",
  "/static/js/report.js",
  "/static/js/assistant.js",
  "/static/js/settings.js"
];
