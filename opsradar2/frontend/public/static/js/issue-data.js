window.OpsRadarFrontend?.registerModule('issue-data', { file: 'js/issue-data.js', screen: 'issues' });
var issueState = window.issueState || { currentIssueTab: 'confirmed', selectedIssueId: null, createIssueId: null, confirmIssueId: null, createdTodosFromIssue: [] };
window.issueState = issueState;

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Issue API normalization, persistence fallback, and detail helper actions.
function persistIssues(){
  try{ localStorage.setItem('opsradar_issues', JSON.stringify(issues)); }catch(e){}
}
function normalizeIssueStatus(status){
  if(status === 'blocked') return 'in_progress';
  if(status === 'resolved') return 'resolved';
  if(status === 'in_progress') return 'in_progress';
  return 'open';
}
function toIssueModel(data){
  const now = new Date();
  return {
    id: data.id || Date.now(),
    title: normalizeText(data.title || '제목 없는 이슈'),
    desc: normalizeText(data.description || data.desc || ''),
    severity: data.severity || 'high',
    status: normalizeIssueStatus(data.status),
    type: data.status === 'resolved' ? 'resolved' : 'confirmed',
    assignee: normalizeText(data.assignee || ''),
    src: normalizeText(data.source_document || data.src || '수동 등록'),
    days: data.days || 0,
    confidence: data.confidence || 100,
    chunk: data.source_document ? `관련 문서: ${escapeHtml(data.source_document)}` : '',
    domino: normalizeText(data.domino_impact || data.dominoImpact || '').split(/\n|→/).map(v=>v.trim()).filter(Boolean),
    dominoFinal: normalizeText(data.domino_impact || data.dominoImpact || '운영 영향 분석 대기'),
    history: [{ date: now.toLocaleDateString('ko-KR'), s: 'Open', note: '수동 등록', cls: '' }],
    suggestTodo: `${normalizeText(data.title || '이슈')} 대응 Todo`,
    suggestAssignee: normalizeText(data.assignee || '담당자 A'),
    suggestPriority: data.severity === 'low' ? 'low' : data.severity === 'medium' ? 'medium' : 'high'
  };
}
async function createIssue(issueData){
  const body = {
    title: normalizeText(issueData.title),
    description: normalizeText(issueData.description),
    severity: issueData.severity,
    status: issueData.status,
    assignee: normalizeText(issueData.assignee),
    domino_impact: normalizeText(issueData.domino_impact),
    source_document: normalizeText(issueData.source_document)
  };
  try{
    const res = await fetch('/api/v1/issues', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error(`이슈 저장 실패: ${res.status}`);
    const saved = await res.json();
    return toIssueModel({...body, ...saved});
  }catch(e){
    throw e;
  }
}
async function fetchIssues(){
  try{
    const res = await fetch('/api/v1/issues');
    if(res.ok){
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.issues || data.items || data.results || []);
      issues.splice(0, issues.length, ...list.map(toIssueModel));
      persistIssues();
      return issues;
    }
  }catch(e){}
  try{
    const saved = JSON.parse(localStorage.getItem('opsradar_issues') || '[]');
    if(Array.isArray(saved) && saved.length) issues.splice(0, issues.length, ...saved.map(toIssueModel));
  }catch(e){}
  return issues;
}

function getIssueDetailData(issueId){
  return ISSUE_DETAIL_MOCK[issueId] || ISSUE_DETAIL_MOCK['payment-api'];
}
function createTodoFromIssue(issueId){
  const issue = getIssueDetailData(issueId);
  issueState.createdTodosFromIssue = issueState.createdTodosFromIssue || [];
  issueState.createdTodosFromIssue.push({ id:'detail-todo-' + Date.now(), issueId, title:`${issue.title} 대응 Todo`, createdAt:new Date().toISOString() });
  showToast('대응 Todo가 생성되었습니다. Todo 화면에서 확인하세요.', 'success');
}
function assignIssueOwner(issueId){
  const issue = getIssueDetailData(issueId);
  showToast(`${issue.assignee} 담당자로 지정되었습니다.`, 'success');
}
function updateIssueStatus(issueId, status){
  const issue = getIssueDetailData(issueId);
  issue.status = status === 'in_progress' ? 'In Progress' : status;
  window.renderIssueDetail?.(issue);
  showToast('이슈 상태가 변경되었습니다.', 'success');
}
window.createTodoFromIssue = createTodoFromIssue;
window.assignIssueOwner = assignIssueOwner;
window.updateIssueStatus = updateIssueStatus;
