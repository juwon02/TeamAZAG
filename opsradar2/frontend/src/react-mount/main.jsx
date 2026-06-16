// Strangler-fig React entry (see MIGRATION_LOG.md).
//
// 전환된 화면을 기존 바닐라 노드 안에 React로 렌더한다. 현재: 설정(s-settings) 1개.
// 아직 안 옮긴 화면은 전부 바닐라가 그대로 소유한다.
//
// 안전 설계:
//  - window.nav 를 건드리지 않는다. 대신 #s-settings 가 .active 가 되는 것을
//    MutationObserver 로 감지해 React 를 렌더/갱신한다 → 다른 화면 영향 0.
//  - 폴백 스위치: localStorage.opsradar_react_settings = 'off' (+새로고침) 하면
//    React 가 마운트되지 않고 기존 바닐라 설정 화면이 그대로 동작한다.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SettingsScreen from './SettingsScreen.jsx'

const USE_REACT_SETTINGS = (() => {
  try {
    return localStorage.getItem('opsradar_react_settings') !== 'off'
  } catch (_) {
    return true
  }
})()

function mountReactSettings() {
  const el = document.getElementById('s-settings')
  if (!el) return

  const root = createRoot(el)
  // key 를 쓰지 않는다(remount 금지): 재렌더 시 SettingsScreen state(테마)와
  // memo 된 멤버 패널 DOM(vanilla 가 채운 #memberAdminList)이 보존되어야 깜빡임이 없다.
  const render = () => root.render(
    <StrictMode>
      <SettingsScreen />
    </StrictMode>,
  )

  render()

  // 설정 화면이 활성화될 때 프로필을 최신으로 갱신(가벼운 update, remount 아님).
  // memo 멤버 패널은 재렌더에서 skip → vanilla 리스트 그대로 유지.
  // window.nav 래핑 없이 동작 → 다른 화면 흐름과 무관.
  const observer = new MutationObserver(() => {
    if (el.classList.contains('active')) render()
  })
  observer.observe(el, { attributes: true, attributeFilter: ['class'] })
}

if (USE_REACT_SETTINGS) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactSettings, { once: true })
  } else {
    mountReactSettings()
  }
}
