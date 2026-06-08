window.OpsRadarFrontend?.registerModule('runtime-state', {
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
