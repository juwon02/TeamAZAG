(function () {
  window.OpsRadarFrontend?.registerModule('issue', {
    file: 'js/issue.js',
    screen: 'issues',
    owns: [
      'issue list rendering',
      'issue detail rendering',
      'issue create modal',
      'issue approval and resolution workflow',
      'issue-to-todo handoff',
    ],
    legacyGlobals: [
      'renderIssues',
      'renderIssueDetail',
      'switchIssueTab',
      'openIssueCreateModal',
      'closeIssueCreateModal',
      'saveIssueCreate',
      'openConfirmIssue',
      'doConfirmIssue',
      'dismissIssue',
      'resolveIssue',
      'openTodoCreate',
      'confirmTodoCreate',
    ],
  });
})();

var issueState = window.issueState || { currentIssueTab: 'confirmed', selectedIssueId: null, createIssueId: null, confirmIssueId: null, createdTodosFromIssue: [] };
window.issueState = issueState;

// Migrated from legacy app.js by scripts/import-legacy.mjs.
function openTodoCreate(issueId){
  issueState.createIssueId=issueId;
  const issue=issues.find(i=>i.id===issueId);
  document.getElementById('tcModalSub').textContent=`이슈: ${issue.title.slice(0,40)}...`;
  document.getElementById('tcModalFrom').textContent=`이 Todo는 "${issue.title.slice(0,30)}..." 이슈와 연결됩니다.`;
  document.getElementById('tcTitle').value=issue.suggestTodo||'';
  document.getElementById('tcAssignee').value=issue.suggestAssignee||'담당자 A';
  document.getElementById('tcPriority').value=issue.suggestPriority||'high';
  document.getElementById('todoCreateModal').classList.add('show');
}

async function confirmTodoCreate(){
  const title=document.getElementById('tcTitle').value.trim();
  if(!title)return;
  const assignee=document.getElementById('tcAssignee').value;
  const priority=document.getElementById('tcPriority').value;
  const due=document.getElementById('tcDue').value;
  closeModal('todoCreateModal');
  showTransition('이슈 기반 대응 Todo를 생성하고 있습니다');
  setTimeout(async ()=>{
    try{
      const issue=issues.find(i=>i.id===issueState.createIssueId);
      const apiIssueId=getIssueApiId(issue);
      if(apiIssueId){
        const res=await fetch(`/api/v1/issues/${apiIssueId}/todos`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({title,assignee,priority,due_at:due||null,status:'pending'})
        });
        if(!res.ok)throw new Error(`Todo 저장 실패: ${res.status}`);
        if(window.opsRadarApi)await window.opsRadarApi.reload();
      }else{
        todos.unshift({id:Date.now()+1,title,src:`이슈 #${issueState.createIssueId}`,srcChunk:'이슈 연결',assignee,priority,confidence:null,status:'pending',type:'manual',chunk:null,grounds:['이슈 기반 생성'],risk:''});
      }
      issueState.createdTodosFromIssue.push({id:Date.now(),issueId:issueState.createIssueId,title,assignee,priority,dueDate:due,status:'pending'});
      document.getElementById('todoFromIssueBanner').style.display='inline-flex';
      document.getElementById('todoBadge').style.display='inline-block';
      renderIssues();
      if(issueState.selectedIssueId===issueState.createIssueId)renderIssueDetail(issueState.createIssueId);
      nav('todo');
      showToast(`"${title.slice(0,20)}..." Todo가 생성되었습니다.`,'success');
      addNotif(`이슈 기반 대응 Todo "${title.slice(0,20)}..."가 생성되었습니다.`, 'success');
      showCtxBanner('todo', `이슈 #${issueState.createIssueId}에서 생성된 Todo가 최상단에 추가되었습니다.`);
      updateTodoCounts();
    }catch(e){
      alert('Todo 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }finally{
      hideTransition();
    }
  },1200);
}

function getIssueApiId(issue){
  if(!issue)return null;
  if(issue.apiId)return issue.apiId;
  return typeof issue.id==='string'&&/^[0-9a-f-]{36}$/i.test(issue.id)?issue.id:null;
}

async function resolveIssue(id){const issue=issues.find(i=>i.id===id);const apiId=getIssueApiId(issue);if(apiId){const res=await fetch(`/api/v1/issues/${apiId}/resolve`,{method:'PATCH'});if(!res.ok){showToast('이슈 저장에 실패했습니다.','warn');return;}}issue.status='resolved';issue.type='resolved';renderIssues();hideIssueDetail();showToast('이슈가 해결 완료 처리되었습니다.','success');}

function openConfirmIssue(id){issueState.confirmIssueId=id;const issue=issues.find(i=>i.id===id);document.getElementById('confirmIssueText').textContent=`"${issue.title}"을 확정 이슈로 전환합니다. 대응 Todo를 생성할 수 있습니다.`;document.getElementById('confirmIssueModal').classList.add('show');}

async function doConfirmIssue(){const issue=issues.find(i=>i.id===issueState.confirmIssueId);if(issue){const apiId=getIssueApiId(issue);if(apiId){const res=await fetch(`/api/v1/issues/${apiId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({approval_status:'approved'})});if(!res.ok){showToast('이슈 저장에 실패했습니다.','warn');return;}}issue.type='confirmed';closeModal('confirmIssueModal');switchIssueTab('confirmed');showToast('이슈가 확정되었습니다.','warn');}}

async function dismissIssue(){await doRemoveIssue(issueState.confirmIssueId);closeModal('confirmIssueModal');}

async function doRemoveIssue(id){const idx=issues.findIndex(i=>i.id===id);const issue=idx===-1?null:issues[idx];const apiId=getIssueApiId(issue);if(apiId){const res=await fetch(`/api/v1/issues/${apiId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({approval_status:'rejected'})});if(!res.ok){showToast('이슈 저장에 실패했습니다.','warn');return;}}if(idx!==-1)issues.splice(idx,1);renderIssues();hideIssueDetail();showToast('이슈 후보가 무시되었습니다.','info');}

function openIssueCreateModal(){
  const modal = document.getElementById('issueCreateModal');
  if(!modal) return;
  ['issueTitle','issueDescription','issueAssignee','issueSourceDocument','issueDominoImpact'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const sev = document.getElementById('issueSeverity'); if(sev) sev.value='high';
  const st = document.getElementById('issueStatus'); if(st) st.value='open';
  modal.classList.add('show');
  setTimeout(()=>document.getElementById('issueTitle')?.focus(), 0);
}

function closeIssueCreateModal(){ closeModal('issueCreateModal'); }

async function saveIssueCreate(){
  const title = document.getElementById('issueTitle')?.value.trim();
  if(!title){ alert('이슈 제목을 입력해주세요.'); return; }
  const payload = {
    title,
    description: document.getElementById('issueDescription')?.value.trim() || '',
    severity: document.getElementById('issueSeverity')?.value || 'high',
    status: document.getElementById('issueStatus')?.value || 'open',
    assignee: document.getElementById('issueAssignee')?.value.trim() || '',
    domino_impact: document.getElementById('issueDominoImpact')?.value.trim() || '',
    source_document: document.getElementById('issueSourceDocument')?.value.trim() || ''
  };
  try{
    const issue = await createIssue(payload);
    issues.unshift(issue);
    persistIssues();
    closeIssueCreateModal();
    issueState.currentIssueTab = issue.type;
    document.querySelectorAll('#s-issues .tab').forEach((el,i)=>el.classList.toggle('active',['confirmed','candidate','resolved'][i]===issueState.currentIssueTab));
    renderIssues();
    fetchDashboard();
    showToast('이슈가 등록되었습니다.', 'success');
  }catch(e){
    alert('이슈 등록에 실패했습니다. 입력값을 확인해주세요.');
  }
}
window.createIssue = createIssue;
window.openIssueCreateModal = openIssueCreateModal;
window.closeIssueCreateModal = closeIssueCreateModal;
window.saveIssueCreate = saveIssueCreate;
window.fetchIssues = fetchIssues;
window.fetchDashboard = fetchDashboard;
setTimeout(async () => { await fetchIssues(); renderIssues(); fetchDashboard(); }, 0);

// ════════════════════════════════════════════════
// 캘린더
// ════════════════════════════════════════════════

// React bridge generated by scripts/import-legacy.mjs.
// Active Issue rendering is owned by src/components/Issue.jsx.
(function installIssueReactBridge() {
  function getIssueTab() {
    return issueState.currentIssueTab || 'confirmed';
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
      selected: issueState.selectedIssueId === issue.id,
      hasTodo: issueState.createdTodosFromIssue.some((todo) => todo.issueId === issue.id),
      createdTodos: issueState.createdTodosFromIssue.filter((todo) => todo.issueId === issue.id),
      domino: Array.isArray(issue.domino) ? issue.domino : [],
      history: Array.isArray(issue.history) ? issue.history : [],
    };
  }

  function getIssueSnapshot() {
    const currentTab = getIssueTab();
    const selectedIssue = issues.find((issue) => issue.id === issueState.selectedIssueId);
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
    if (id !== undefined && id !== null) issueState.selectedIssueId = id;
    emitIssueState();
  };
  window.selectIssue = function selectIssue(id) {
    issueState.selectedIssueId = id;
    emitIssueState();
  };
  window.hideIssueDetail = function hideIssueDetail() {
    issueState.selectedIssueId = null;
    emitIssueState();
  };
  window.switchIssueTab = function switchIssueTab(tab) {
    issueState.currentIssueTab = tab;
    issueState.selectedIssueId = null;
    emitIssueState();
  };
  window.refreshIssueState = emitIssueState;

  setTimeout(emitIssueState, 0);
})();
