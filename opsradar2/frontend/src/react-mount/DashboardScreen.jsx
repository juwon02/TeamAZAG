// 대시보드(s-dashboard) 화면의 React 버전 (스트랭글러 — 보고서/캘린더 패턴).
//
// 기존 #s-dashboard 의 두 직계 자식(.topbar, .content)을 verbatim dangerouslySetInnerHTML 로
// "그대로" 렌더한다(클래스·구조·인라인 onclick·스타일 100% 보존, 픽셀 동일). 여분 래퍼가 없어
// flex 레이아웃이 그대로 유지된다. 동작은 전부 vanilla 소유:
//   - renderDashboardLive(4중 몽키패치: ops-workflow-enhancements 정의 → role/todo-calendar/
//     workflow-v2 wrap)가 카운트(textContent)·#db-high-risk-grid·#db-ai-todo-list·#db-member-view
//     (innerHTML)를 채운다.
//   - ops-workflow-enhancements 가 window.nav 를 wrap → nav('dashboard') 마다 renderDashboardLive().
//     + setTimeout(500) + opsRadarApi.reload + workflow init(setTimeout 900/2800) 에서도 실행.
//   - applyRoleVisibility 가 .ops-role-switch 를 런타임 제거 + body.wr-team-member 토글 + switchDbRole
//     로 #db-admin-view/#db-member-view .active 전환. isLead 가 그 .active 를 상태소스로 읽는다.
//
// ⚠️ "재렌더 0"이 이 화면의 핵심: React 가 다시 렌더하면 vanilla 가 제거한 .ops-role-switch 가
//   되살아나고 뷰 .active 토글이 꼬인다. 그래서 memo + createRoot 1회 렌더(MutationObserver 미사용).
// (대시보드엔 이슈 같은 onclick 속성 셀렉터 결합 없음, 차트 라이브러리 없음 → 추가 처리 불요.)
import { memo, useEffect } from 'react'

const TOPBAR_INNER = `
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div class="topbar-title">Dashboard</div>
      <div class="ops-role-switch">
        <div id="db-tab-pm" class="ops-role-tab active" onclick="switchDbRole('pm')"><i class="ti ti-crown"></i> 관리자</div>
        <div id="db-tab-member" class="ops-role-tab" onclick="switchDbRole('member')"><i class="ti ti-user"></i> 팀원</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <div class="notif-btn" onclick="toggleNotif()" title="알림 센터">
        <i class="ti ti-bell" style="font-size:18px;color:var(--text2)"></i>
        <div class="notif-dot" id="notifDot"></div>
      </div>
      <div class="chip" id="todayDate" data-current-date="long">오늘 날짜</div>
    </div>`

const CONTENT_INNER = `
    <div id="db-admin-view" class="ops-dashboard-view active">
      <section>
        <div class="ops-panel">
          <div class="ops-panel-title">Todo 실행 현황</div>
          <div class="ops-stat-row">
            <div onclick="openDashboardTodoTab('inprogress')" style="cursor:pointer"><span class="ops-stat-num blue" id="db-progress-count">0</span><span class="ops-stat-label">진행중</span></div>
            <div onclick="openDashboardTodoTab('rejected')" style="cursor:pointer"><span class="ops-stat-num warn" id="db-rejected-count">0</span><span class="ops-stat-label">반려</span></div>
            <div onclick="openDashboardTodoTab('ai')" style="cursor:pointer"><span class="ops-stat-num" id="db-approval-count">0</span><span class="ops-stat-label">승인대기</span></div>
          </div>
          <div class="ops-progress-stack">
            <div style="width:0%;background:var(--success)" title="완료"></div>
            <div style="width:0%;background:var(--accent-blue)" title="진행중"></div>
            <div id="db-todo-bar" style="width:0%;background:var(--warning)" title="Blocked"></div>
          </div>
        </div>
      </section>

      <section>
        <div class="ops-section-heading">
          <div><i class="ti ti-alert-triangle"></i> 진행 이슈</div>
          <button class="ops-link-btn" onclick="nav('issues')">전체 이슈 보기 <i class="ti ti-arrow-right"></i></button>
        </div>
        <div class="ops-risk-grid" id="db-high-risk-grid">
          <article class="ops-risk-card">
            <div class="ops-risk-card-top"><h3>Risk 데이터 없음</h3><span class="badge b-accent">대기</span></div>
            <p>운영 로그 분석 후 High Risk 이슈가 이 영역에 표시됩니다.</p>
            <div class="ops-risk-meta"><span>Blocked 0</span><span>대기 중</span></div>
            <div class="ops-domino"><strong>도미노 영향</strong><span>분석 데이터 연결 후 영향 흐름이 표시됩니다.</span></div>
            <div class="ops-card-actions"><button onclick="nav('todo')">대응 Todo 생성</button><button onclick="openIssueDetail('payment-api')">상세 보기</button></div>
          </article>
          <article class="ops-risk-card">
            <div class="ops-risk-card-top"><h3>Risk 데이터 없음</h3><span class="badge b-accent">대기</span></div>
            <p>확인된 운영 리스크가 아직 없습니다.</p>
            <div class="ops-risk-meta"><span>Blocked 0</span><span>대기 중</span></div>
            <div class="ops-domino"><strong>도미노 영향</strong><span>분석 데이터 연결 후 영향 흐름이 표시됩니다.</span></div>
            <div class="ops-card-actions"><button onclick="nav('todo')">대응 Todo 생성</button><button onclick="openIssueDetail('db-pool')">상세 보기</button></div>
          </article>
          <article class="ops-risk-card">
            <div class="ops-risk-card-top"><h3>Risk 데이터 없음</h3><span class="badge b-accent">대기</span></div>
            <p>확인된 운영 리스크가 아직 없습니다.</p>
            <div class="ops-risk-meta"><span>Blocked 0</span><span>대기 중</span></div>
            <div class="ops-domino"><strong>도미노 영향</strong><span>분석 데이터 연결 후 영향 흐름이 표시됩니다.</span></div>
            <div class="ops-card-actions"><button onclick="nav('todo')">대응 Todo 생성</button><button onclick="openIssueDetail('deploy-pipeline')">상세 보기</button></div>
          </article>
        </div>
      </section>

      <section class="ops-bottom-grid">
        <div class="ops-panel">
          <div class="ops-panel-title">진행중 Todo</div>
          <div class="ops-approval-list" id="db-ai-todo-list">
            <div class="ops-approval-item" onclick="nav('todo')"><div><strong>승인 대기 항목 없음</strong><span>AI 생성 Todo 승인 요청이 생성되면 표시됩니다.</span></div><i class="ti ti-arrow-right"></i></div>
          </div>
          <div class="ops-muted-line"><span id="db-pending">0</span>건 AI 제안 대기 중</div>
        </div>
      </section>
    </div>

    <div id="db-member-view" class="ops-dashboard-view">
      <section>
        <div class="ops-panel">
          <div class="ops-panel-title">나의 Todo 실행 현황</div>
          <div class="ops-stat-row">
            <div><span class="ops-stat-num blue">0</span><span class="ops-stat-label">진행중</span></div>
            <div><span class="ops-stat-num warn">0</span><span class="ops-stat-label">반려</span></div>
            <div><span class="ops-stat-num">0</span><span class="ops-stat-label">승인대기</span></div>
          </div>
          <div class="ops-progress-stack"><div style="width:0%;background:var(--success)"></div><div style="width:0%;background:var(--accent-blue)"></div><div style="width:0%;background:var(--warning)"></div></div>
        </div>
      </section>
      <section>
        <div class="ops-section-heading"><div><i class="ti ti-alert-triangle"></i> 진행 이슈</div><button class="ops-link-btn" onclick="nav('issues')">전체 이슈 보기 <i class="ti ti-arrow-right"></i></button></div>
        <div class="ops-risk-grid"><article class="ops-risk-card"><div class="ops-risk-card-top"><h3>High Risk 이슈 없음</h3><span class="badge b-success">안정</span></div><p>현재 확정된 High Risk 이슈가 없습니다.</p></article></div>
      </section>
      <section class="ops-bottom-grid"><div class="ops-panel"><div class="ops-panel-title">진행중 Todo</div><div class="ops-approval-list"><div class="ops-approval-item"><div><strong>진행중 Todo 없음</strong><span>진행 Todo가 생성되면 표시됩니다.</span></div></div></div></div></section>
    </div>`

const DashboardScreen = memo(function DashboardScreen() {
  // 날짜 칩([data-current-date])은 app.js renderCurrentDateLabels 가 init 시 1회만 채운다.
  // React 가 그 후 마운트해 placeholder("오늘 날짜")로 덮으므로, 마운트 직후 1회 다시 채운다.
  // (문서 전역·멱등 → 다른 화면 칩도 함께 채워짐). vanilla 무수정.
  useEffect(() => {
    if (typeof window.renderCurrentDateLabels === 'function') window.renderCurrentDateLabels()
  }, [])

  return (
    <>
      <div className="topbar ops-db-topbar" dangerouslySetInnerHTML={{ __html: TOPBAR_INNER }}></div>
      <div className="content ops-dashboard-content" dangerouslySetInnerHTML={{ __html: CONTENT_INNER }}></div>
    </>
  )
})

export default DashboardScreen
