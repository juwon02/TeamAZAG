// OpsRadar React 전환 공통 코어.
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
