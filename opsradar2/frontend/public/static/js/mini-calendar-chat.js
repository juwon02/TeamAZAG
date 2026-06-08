window.OpsRadarFrontend?.registerModule('mini-calendar-chat', { file: 'js/mini-calendar-chat.js', screen: 'calendar' });

// Migrated from legacy app.js by scripts/import-legacy.mjs.
// Natural-language mini calendar chat helper used by Calendar.jsx.
function miniChat(text){
  const input=document.getElementById('miniInput');const msg=text||input.value.trim();if(!msg)return;input.value='';
  const log=document.getElementById('miniLog');
  const u=document.createElement('div');u.className='mini-bubble mini-bubble-user';u.textContent=msg;log.appendChild(u);log.scrollTop=log.scrollHeight;
  setTimeout(async ()=>{
    const parsed=window.parseScheduleMsg?.(msg) || { person: '일정', date: '', type: '일정' };
    const reply=(msg.includes('부재')||msg.includes('외부 일정'))?`✅ ${parsed.person} ${parsed.date} ${parsed.type}을 캘린더에 등록했습니다.`:'✅ 일정을 캘린더에 추가했습니다.';
    const dateMatch=msg.match(/(\d+)\/(\d+)/);
    try{
      if(!dateMatch || !window.opsRadarCreateCalendarEvent || !window.opsRadarApi) throw new Error('Calendar API is not ready');
      const month=Number(dateMatch[1])-1;
      const day=Number(dateMatch[2]);
      const calendarRuntime=window.getCalendarRuntimeState?.()||{};await window.opsRadarCreateCalendarEvent({title:`${parsed.person} ${parsed.type}`,day,month,year:calendarRuntime.currentCalYear,color:parsed.type==='부재'?'ct-gray':'ct-info'});
      await window.opsRadarApi.loadCalendar();
      window.addCalendarRuntimeEvent?.(parsed,day,month);
      renderCalendar(calendarRuntime.currentCalYear,calendarRuntime.currentCalMonth);
      const a=document.createElement('div');a.className='mini-bubble mini-bubble-ai';a.textContent=reply;log.appendChild(a);log.scrollTop=log.scrollHeight;
      showToast(reply);
    }catch(error){
      console.warn('Mini calendar create API failed',error);
      const a=document.createElement('div');a.className='mini-bubble mini-bubble-ai';a.textContent='일정 등록에 실패했습니다. DB 연결을 확인해주세요.';log.appendChild(a);log.scrollTop=log.scrollHeight;
      showToast('캘린더 등록에 실패했습니다.','warn');
    }
  },300);
}
window.miniChat = miniChat;
