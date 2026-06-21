// 캘린더(s-calendar) 화면의 React 버전 (스트랭글러 3번째 — 보고서 패턴).
//
// React는 캘린더 화면의 레이아웃과 우측 일정 패널을 담당한다.
// 날짜/일정 데이터와 상세 모달은 기존 vanilla renderCalendar/openCalModal을 재사용한다.
// grid 변경을 관찰해 일정 칩을 압축하고, 우측 패널에는 선택일 또는 이번 달 핵심 일정을 표시한다.
import { memo, useEffect } from 'react'

const MAX_TAGS = 2

function escapeCalendarText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function calendarTagTone(tag) {
  const className = String(tag?.c || '')
  if (className.includes('risk') || className.includes('danger')) return 'risk'
  if (className.includes('warn')) return 'warn'
  if (tag?.eventType === 'absence' || String(tag?.sourceType || '').startsWith('absence:')) return 'absence'
  if (className.includes('new')) return 'new'
  return 'normal'
}

function renderCalendarAgenda(panel) {
  if (!panel) return
  const grid = document.getElementById('calGrid')
  const state = window.G || {}
  const year = state.currentCalYear
  const month = state.currentCalMonth
  const selectedDay = state.selectedCalDay
  const items = []

  ;(state.calEvents || []).forEach((event) => {
    const eventYear = typeof event.y === 'number' ? event.y : year
    const rawMonth = typeof event.m === 'number' ? event.m : month
    const eventMonth = rawMonth > 11 ? rawMonth - 1 : rawMonth
    if (eventYear !== year || eventMonth !== month) return
    ;(event.tags || []).forEach((tag) => {
      if (tag.hideOnCalendar || window.isCalendarTagVisible?.(tag) === false) return
      items.push({ day: event.d, tag, label: tag.rangeLabel || tag.t || '일정 확인 필요' })
    })
  })

  const title = panel.querySelector('[data-calendar-agenda-title]')
  const subtitle = panel.querySelector('[data-calendar-agenda-subtitle]')
  const list = panel.querySelector('[data-calendar-agenda-list]')
  if (!title || !subtitle || !list) return

  const scopedItems = selectedDay
    ? items.filter((item) => item.day === selectedDay)
    : items.slice()
  const seen = new Set()
  const focusItems = scopedItems
    .sort((left, right) => left.day - right.day)
    .filter((item) => {
      const identity = item.tag.isAbsenceRange
        ? `range:${item.tag.rangeLabel || item.tag.t}`
        : item.tag.apiId || `${item.day}:${item.label}`
      if (seen.has(identity)) return false
      seen.add(identity)
      return true
    })
    .slice(0, 6)
  const monthLabel = `${year || ''}년 ${(month ?? -1) + 1}월`
  title.textContent = selectedDay ? `${selectedDay}일 일정` : '이번 달 핵심 일정'
  subtitle.textContent = selectedDay
    ? `${monthLabel} · 해당 날짜에 연결된 일정`
    : `${monthLabel} · 일정 ${items.length}건`;

  list.innerHTML = focusItems.length
    ? focusItems.map((item) => `
        <button type="button" class="calendar-agenda-item" data-calendar-day="${item.day}">
          <span class="calendar-agenda-date">${item.day}일</span>
          <span class="calendar-agenda-copy">
            <strong class="calendar-agenda-title calendar-agenda-${calendarTagTone(item.tag)}">${escapeCalendarText(item.label)}</strong>
            <small>${escapeCalendarText(item.tag.eventType === 'absence' ? '부재 일정' : item.tag.todoStatus === 'approved' ? '진행 Todo 마감' : '운영 일정')}</small>
          </span>
          <i class="ti ti-chevron-right" aria-hidden="true"></i>
        </button>`).join('')
    : '<div class="calendar-agenda-empty">표시할 일정이 없습니다. 날짜를 선택하거나 새 일정을 등록하세요.</div>'

  list.querySelectorAll('[data-calendar-day]').forEach((button) => {
    button.addEventListener('click', () => window.openCalModal?.(Number(button.dataset.calendarDay)))
  })
  grid?.setAttribute('data-calendar-agenda-ready', 'true')
}

function capTags(grid) {
  grid.querySelectorAll('.cal-cell').forEach((cell) => {
    const wrap = cell.querySelector('.cal-tags')
    if (!wrap) return
    // 멱등: 이전 후처리 흔적 초기화
    wrap.querySelectorAll('.cal-more-badge').forEach((b) => b.remove())
    const tags = Array.from(wrap.querySelectorAll('.cal-tag')).filter(
      (t) => !t.classList.contains('cal-more-badge'),
    )
    tags.forEach((t) => { t.style.display = '' })
    if (tags.length > MAX_TAGS) {
      tags.forEach((t, i) => { if (i >= MAX_TAGS) t.style.display = 'none' })
      const more = document.createElement('span')
      more.className = 'cal-tag cal-more-badge'
      more.textContent = `+${tags.length - MAX_TAGS}`
      more.title = `일정 ${tags.length - MAX_TAGS}건 더 보기`
      more.style.cursor = 'pointer'
      more.style.opacity = '0.8'
      wrap.appendChild(more) // 셀 클릭 버블 → 기존 openCalModal(d) 가 전체 일정 표시
    }
  })
}

function CalendarScreen() {
  useEffect(() => {
    const grid = document.getElementById('calGrid')
    const agenda = document.getElementById('calendarAgendaPanel')
    if (!grid) return
    window.dispatchEvent(new Event('opsradar:calendar-ready'))
    const run = () => {
      capTags(grid)
      renderCalendarAgenda(agenda)
    }
    run()
    // childList(직계 .cal-cell 추가/제거)만 관찰 → 후처리(셀 내부 변경)는 재트리거 안 함(루프 방지).
    const obs = new MutationObserver(run)
    obs.observe(grid, { childList: true })
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <div className="topbar calendar-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="topbar-title">캘린더 — 운영 리스크 예측</div>
          <span id="calUpdatedBadge" className="badge b-success" style={{ display: 'none' }}>방금 업데이트됨</span>
        </div>
        <div className="calendar-top-actions">
          <select id="calendarTeamFilter" className="calendar-team-filter" aria-label="캘린더 팀 필터" defaultValue="전체" onChange={(event) => window.setCalendarTeamFilter?.(event.target.value)}>
            <option value="전체">전체</option><option value="영업관리팀">영업관리팀</option><option value="구매팀">구매팀</option><option value="품질 클레임팀">품질 클레임팀</option><option value="물류팀">물류팀</option>
          </select>
          <div className="tbtn primary" onClick={() => window.openAISuggestModal?.()} style={{ gap: '5px' }}>
            <i className="ti ti-sparkles"></i> AI 추천 일정 생성
          </div>
          <div className="calendar-month-nav" aria-label="월 이동">
            <button id="calPrevBtn" className="calendar-month-icon" type="button" title="이전 달"><i className="ti ti-chevron-left"></i></button>
            <div id="calMonthTitle" className="calendar-month-title">2026년 5월</div>
            <button id="calNextBtn" className="calendar-month-icon" type="button" title="다음 달"><i className="ti ti-chevron-right"></i></button>
          </div>
        </div>
      </div>
      {/* AI 추천 일정 모달 */}
      <div className="modal-overlay" id="aiSuggestModal">
        <div className="modal slide-up" style={{ width: '400px' }}>
          <div className="modal-title">AI 추천 일정 생성</div>
          <div className="modal-sub">운영 데이터 기반으로 AI가 추천하는 일정을 선택하세요.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(224,62,62,.12)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer', transition: 'all .15s' }} onClick={() => window.addAISuggestEvent?.('긴급 대응 회의', 'High Risk 이슈 기반')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><span className="badge b-danger">High Risk 기반</span></div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>High Risk 이슈 대응 회의 생성</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>현재 미해결 이슈를 기반으로 긴급 대응 회의를 추천합니다.</div>
            </div>
            <div style={{ background: 'var(--accent-soft)', border: '1px solid rgba(66,99,235,.12)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer', transition: 'all .15s' }} onClick={() => window.addAISuggestEvent?.('Todo 마감 점검', 'Todo 마감 집중 기반')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><span className="badge b-accent">마감 집중 기반</span></div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>Todo 마감 일정 추가</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>이번 주 마감 집중 구간에 점검 일정을 자동 추가합니다.</div>
            </div>
            <div style={{ background: 'var(--warn-soft)', border: '1px solid rgba(196,124,0,.12)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', cursor: 'pointer', transition: 'all .15s' }} onClick={() => window.addAISuggestEvent?.('인수인계 미팅', '부재자 인수인계 기반')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><span className="badge b-warn">부재 기반</span></div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>부재자 인수인계 일정 생성</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>팀원 부재 전 인수인계 미팅을 자동으로 추천합니다.</div>
            </div>
          </div>
          <div className="modal-actions"><div className="tbtn" onClick={() => window.closeModal?.('aiSuggestModal')}>닫기</div></div>
        </div>
      </div>
      <div id="calEventBanner" style={{ display: 'flex', background: 'var(--success-soft)', borderBottom: '1px solid rgba(26,158,106,.15)', padding: '10px 16px', fontSize: '11px', color: 'var(--success)', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <i className="ti ti-calendar-plus" style={{ fontSize: '16px' }}></i><span id="calBannerText"></span>
      </div>
      <div className="calendar-workspace">
        <div className="calendar-main-pane">
          <div className="calendar-insight-strip">
            <div className="calendar-insight-label"><i className="ti ti-sparkles"></i> 운영 신호</div>
            <span id="calAIText">운영 로그 업로드 후 AI가 이번 달 리스크 예측을 자동으로 생성합니다.</span>
          </div>
          <div className="cal-grid" id="calGrid">
            <div className="cal-dow">월</div><div className="cal-dow">화</div><div className="cal-dow">수</div><div className="cal-dow">목</div><div className="cal-dow">금</div><div className="cal-dow weekend">토</div><div className="cal-dow weekend">일</div>
          </div>
          <div className="calendar-legend">
            <span className="calendar-legend-item risk">High Risk</span>
            <span className="calendar-legend-item warn">주의</span>
            <span className="calendar-legend-item absence">부재</span>
            <span className="calendar-legend-item new">신규 등록</span>
          </div>
        </div>
        <aside className="cal-side calendar-side">
          <section className="calendar-agenda-panel" id="calendarAgendaPanel">
            <div className="calendar-agenda-head">
              <div>
                <div className="calendar-agenda-eyebrow">SCHEDULE FOCUS</div>
                <strong data-calendar-agenda-title>이번 달 핵심 일정</strong>
                <span data-calendar-agenda-subtitle>일정을 불러오는 중입니다.</span>
              </div>
              <i className="ti ti-calendar-event"></i>
            </div>
            <div className="calendar-agenda-list" data-calendar-agenda-list></div>
          </section>
          <div className="cal-mini-chat calendar-register-helper">
            <div className="mini-chat-hd"><i className="ti ti-sparkles" style={{ fontSize: '13px', color: 'var(--accent)' }}></i><span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--accent)' }}>일정 등록</span></div>
            <div className="mini-log" id="miniLog">
              <div style={{ fontSize: '10px', color: 'var(--text3)', lineHeight: 1.5 }}>일정을 입력하면 내용을 검토하고 수정한 뒤 등록합니다.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                <div className="sq" style={{ fontSize: '9px', padding: '2px 6px' }} onClick={() => window.miniChat?.('김도윤 6/15-19 휴가')}>김도윤 6/15-19 휴가</div>
                <div className="sq" style={{ fontSize: '9px', padding: '2px 6px' }} onClick={() => window.miniChat?.('6/25 10:00 주간 운영 회의')}>6/25 10:00 주간 운영 회의</div>
              </div>
            </div>
            <div className="mini-input-row">
              <input className="mini-input" id="miniInput" placeholder="예: 김도윤 6/15-19 휴가" onKeyDown={(e) => { if (e.key === 'Enter') window.miniChat?.() }} />
              <button className="mini-send" title="일정 해석" onClick={() => window.miniChat?.()}><i className="ti ti-send" style={{ fontSize: '12px' }}></i></button>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

export default memo(CalendarScreen)
