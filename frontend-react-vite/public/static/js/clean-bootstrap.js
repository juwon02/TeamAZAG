window.OpsRadarFrontend?.registerModule('clean-bootstrap', { file: 'js/clean-bootstrap.js', screen: 'global' });

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Empty-state fallback and initial clean runtime data bootstrap.
(function initOpsRadarCleanVersion(){
  const CLEAN_EMPTY = '데이터 연결 후 표시됩니다.';
  function setText(selector, value){ const el = document.querySelector(selector); if(el) el.textContent = value; }
  function setAll(selector, value){ document.querySelectorAll(selector).forEach(el => el.textContent = value); }
  function clearDashboardRuntimeData(){
    setText('#pendingCount', '0');
    setText('#issueCount', '0');
    setText('#calBadge', '');
    const history = document.getElementById('historyList');
    if(history) history.innerHTML = '<div style="font-size:11px;color:var(--text3);padding:12px;text-align:center">업로드 이력이 없습니다.</div>';
    const riskSide = document.querySelector('#s-calendar .cal-side > div');
    if(riskSide) {
      riskSide.innerHTML = '<div style="font-size:11px;font-weight:500;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:5px"><i class="ti ti-alert-triangle" style="font-size:13px;color:var(--text2)"></i> 리스크 구간</div><div style="font-size:11px;color:var(--text3);padding:10px 0;border-bottom:1px solid var(--border)">등록된 리스크 구간이 없습니다.</div><div style="font-size:11px;font-weight:500;color:var(--text);margin:14px 0 8px;display:flex;align-items:center;gap:5px"><i class="ti ti-user-off" style="font-size:13px;color:var(--text2)"></i> 부재 현황</div><div style="font-size:11px;color:var(--text3);padding:10px 0;border-bottom:1px solid var(--border)">등록된 부재 일정이 없습니다.</div><div style="font-size:11px;font-weight:500;color:var(--text);margin:14px 0 8px;display:flex;align-items:center;gap:5px"><i class="ti ti-flag" style="font-size:13px;color:var(--text2)"></i> 마일스톤</div><div style="font-size:11px;color:var(--text3);padding:10px 0">등록된 마일스톤이 없습니다.</div>';
    }
  }
  window.getHandoffPreviewData = function(type){
    const generatedAt = new Date().toLocaleString('ko-KR', { dateStyle:'medium', timeStyle:'short' });
    const labels = { onboarding:'신규 입사자 온보딩', absence:'부재자 업무 인수인계', offboard:'담당자 변경·퇴직 인수인계' };
    const selected = labels[type] ? type : window.getKnowledgeCurrentType?.() || 'onboarding';
    return {
      title: labels[selected] + ' 브리핑',
      target: labels[selected],
      sections: [
        ['현재 진행 업무', CLEAN_EMPTY],
        ['최근 주요 결정', CLEAN_EMPTY],
        ['반복 발생 이슈', CLEAN_EMPTY],
        ['미해결 Risk', CLEAN_EMPTY],
        ['다음 담당자 주의사항', CLEAN_EMPTY],
        ['관련 문서', '연결된 문서가 없습니다.'],
        ['생성일', generatedAt]
      ]
    };
  };
  window.getReportDraftData = function(){
    return {
      title:'운영 보고서 초안',
      sections:[
        ['완료된 업무', CLEAN_EMPTY],
        ['진행 중인 업무', CLEAN_EMPTY],
        ['AI 및 기술적 상세 내용', CLEAN_EMPTY],
        ['리스크 관리 및 해결 방안', CLEAN_EMPTY],
        ['팀 회고', CLEAN_EMPTY],
        ['차주 계획', CLEAN_EMPTY]
      ]
    };
  };
  setTimeout(function(){
    if(window.issueState){ issueState.createdTodosFromIssue = []; }
    window.resetCalendarRuntimeData?.();
    window.resetAnalysisRuntimeData?.();
    clearDashboardRuntimeData();
    if(typeof renderCalendar === 'function') renderCalendar();
    setAll('.ops-risk-card .badge', '대기');
  }, 0);
})();
