// 보고서(s-reports) 화면의 React 버전 (스트랭글러 2번째 전환).
//
// 규칙: 기존 index.html #s-reports 의 HTML 구조/class/텍스트를 100% 그대로 복제한다(픽셀 동일).
// 동작은 기존 바닐라(app.js + report.js + api-integration.js)가 그대로 소유한다(재작성 금지):
//   - nav('reports') 가 매번 initReportsScreen() 를 호출 → 탭/목록/툴바/저장 리스너를
//     idempotent(dataset 가드)하게 (재)바인딩하고 renderReportList() 로 목록을 채운다.
//   - 따라서 React 는 동일 구조를 "한 번만" 렌더하고 절대 재렌더하지 않는다(memo).
//     → 바닐라가 채운 #reportList / #reportEditor / 탭 .active 를 React 가 덮어쓰지 않음.
//
// 두 함정 처리:
//   ① #reportEditor(contenteditable): 한 번만 렌더 + suppressContentEditableWarning →
//      uncontrolled. api-integration.js saveReport 가 innerHTML 을 읽고 renderReportDraft 가
//      innerHTML 을 쓰는 걸 React 가 방해하지 않는다.
//   ② 주간/월간 탭 .active: React 가 state 로 관리하지 않는다. getActiveReportPeriod 가
//      DOM 의 .active 를 단일 소스로 읽고, setReportPeriod/initReportsScreen 가 토글한다.
//
// 인라인 핸들러는 기존 정적 HTML 과 동일 토폴로지로만 복제한다:
//   - "AI 초안 생성" 버튼: 기존 onclick="generateReportDraft()" 미러
//   - 검색 input: 기존 oninput="renderReportList()" 미러
//   - 탭/툴바/공유/저장: 정적 HTML 에 인라인 핸들러 없음 → 바닐라가 바인딩하므로 React 도 미부착.
import { memo } from 'react'

const ReportsScreen = memo(function ReportsScreen() {
  return (
    <>
      <div className="topbar report-topbar">
        <div>
          <div className="topbar-title">보고서 관리</div>
          <div className="report-topbar-sub">주간/월간 운영 보고서 생성 · 저장 · 열람</div>
        </div>
        <div className="report-top-actions">
          <div className="report-period-tabs" role="tablist" aria-label="보고서 유형">
            <button className="tbtn active" type="button" data-report-type="weekly">주간 보고서</button>
            <button className="tbtn" type="button" data-report-type="monthly">월간 보고서</button>
          </div>
          <label className="report-search" aria-label="보고서 검색">
            <i className="ti ti-search"></i>
            <input
              id="reportSearchInput"
              type="search"
              placeholder="제목, 작성자, 기간 검색"
              onInput={() => window.renderReportList && window.renderReportList()}
            />
          </label>
          <button
            className="tbtn primary"
            type="button"
            onClick={() => window.generateReportDraft && window.generateReportDraft()}
          >
            <i className="ti ti-wand"></i> AI 초안 생성
          </button>
        </div>
      </div>
      <div className="content report-content">
        <section className="report-list-panel">
          <div className="report-panel-head">
            <div>
              <div className="report-eyebrow">Archive</div>
              <h3>지난 보고서</h3>
            </div>
            <span className="report-count" id="reportListCount">0건</span>
          </div>
          {/* 이 노드는 vanilla(renderReportList)가 채운다. React 는 한 번만 렌더하고 안 건드림. */}
          <div id="reportList" className="report-list"></div>
        </section>
        <section className="report-detail-panel">
          <div id="reportDetail" className="report-detail-empty">
            아직 생성된 보고서가 없습니다. 운영 로그 분석 후 주간 보고서를 생성해보세요.
          </div>
          {/* 상세/에디터: vanilla(selectReport/renderReportDraft/saveReport)가 소유. */}
          <div id="reportEditorWrap" className="report-editor-wrap" style={{ display: 'none' }}>
            <div className="report-editor-toolbar">
              <div className="tbtn" style={{ fontWeight: 700, padding: '3px 8px' }}>B</div>
              <div className="tbtn" style={{ fontStyle: 'italic', padding: '3px 8px' }}>I</div>
              <div className="tbtn" style={{ padding: '3px 8px' }}>H1</div>
              <div className="tbtn" style={{ padding: '3px 8px' }}>H2</div>
              <div className="report-divider"></div>
              <div className="tbtn" style={{ padding: '3px 8px' }}>
                <i className="ti ti-list" style={{ fontSize: '12px' }}></i>
              </div>
              <div style={{ flex: 1 }}></div>
              <span>AI 초안 · 직접 편집 가능</span>
            </div>
            <div
              id="reportEditor"
              contentEditable="true"
              suppressContentEditableWarning
              className="report-editor text-content"
            >
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>운영 보고서 초안</div>
              <p style={{ marginBottom: '8px' }}>운영 로그 업로드 후 AI가 보고서 초안을 자동으로 생성합니다.</p>
              <ul style={{ paddingLeft: '16px' }}>
                <li>완료된 업무 — 데이터 연결 후 표시</li>
                <li>진행 중인 업무 — 데이터 연결 후 표시</li>
                <li>리스크 관리 — 데이터 연결 후 표시</li>
              </ul>
            </div>
            <div className="report-editor-actions">
              <div className="tbtn"><i className="ti ti-share"></i> 공유</div>
              <div className="tbtn primary"><i className="ti ti-device-floppy"></i> 저장</div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
})

export default ReportsScreen
