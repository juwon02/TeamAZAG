// 설정(s-settings) 화면의 React 버전 (스트랭글러 1번째 전환).
//
// 규칙: 기존 index.html #s-settings 의 HTML 구조/class 를 100% 그대로 복제한다.
// (ID는 CSS가 클래스 기반이라 생략 — 숨김 #s-settings-legacy 와의 중복 ID도 회피)
// 데이터/동작은 기존 전역 함수를 그대로 재사용한다(재작성 금지):
//   - window.getStoredUserInfo()  : 프로필 정보 (app.js, 1줄 노출)
//   - window.setOpsRadarTheme()   : 테마 적용 + localStorage 저장 (app.js)
//   - window.logout()             : 세션 정리/리로드 (app.js)
import { memo, useEffect, useState } from 'react'

// 담당자 관리(멤버) 패널의 "껍데기"만 React가 렌더한다.
// 기존 api-integration.js 의 ensureMemberAdminPanel() innerHTML 과 동일 class·id·구조.
// 리스트(#memberAdminList)와 CRUD 는 기존 vanilla 가 그대로 소유한다:
//   - React 는 이 컴포넌트를 memo 로 1회만 렌더하고 절대 재렌더하지 않는다.
//     → React 가 #memberAdminList 내부를 건드리지 않으므로 vanilla 가 채운 행이 보존됨(깜빡임 제거).
//   - 버튼은 기존 전역(window.loadOpsRadarMembers / createOpsRadarMember) 그대로 호출.
//   - 마운트 시 window.loadOpsRadarMembers() 1회로 목록 초기 로드.
const MemberAdminPanel = memo(function MemberAdminPanel() {
  useEffect(() => {
    // 기존 vanilla 가 #memberAdminList 를 채우도록 한 번 트리거(API/CRUD 는 vanilla 소유).
    if (typeof window.loadOpsRadarMembers === 'function') window.loadOpsRadarMembers()
  }, [])

  return (
    <section className="settings-panel" id="memberAdminPanel">
      <div className="settings-card-inner">
        <div className="settings-panel-head">
          <div>
            <div className="settings-eyebrow">Members</div>
            <h3>담당자 관리</h3>
            <p className="settings-panel-sub">Todo와 Issue 배정에 사용할 실제 프로젝트 담당자를 관리합니다.</p>
          </div>
          <button type="button" className="tbtn" onClick={() => window.loadOpsRadarMembers?.()}>
            <i className="ti ti-refresh"></i> 새로고침
          </button>
        </div>
        <div className="form-row" style={{ alignItems: 'end', marginBottom: '12px' }}>
          <div>
            <div className="form-label">이름</div>
            <input className="form-input" id="memberNewName" type="text" placeholder="예: 이성우" />
          </div>
          <div>
            <div className="form-label">이메일</div>
            <input className="form-input" id="memberNewEmail" type="email" placeholder="name@opsradar.local" />
          </div>
          <div>
            <div className="form-label">역할</div>
            <select className="form-input" id="memberNewRole" defaultValue="member">
              <option value="member">member</option>
              <option value="admin">admin</option>
              <option value="pm">pm</option>
            </select>
          </div>
          <button type="button" className="tbtn primary" onClick={() => window.createOpsRadarMember?.()}>
            <i className="ti ti-plus"></i> 추가
          </button>
        </div>
        {/* 이 노드는 vanilla(renderMemberAdminPanel)가 채운다. memo 덕분에 React 가 다시 안 건드림. */}
        <div id="memberAdminList" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}></div>
      </div>
    </section>
  )
})

function readTheme() {
  try {
    return (
      localStorage.getItem('theme') ||
      localStorage.getItem('opsradar-skin') ||
      document.body.dataset.theme ||
      'dark'
    )
  } catch (_) {
    return 'dark'
  }
}

export default function SettingsScreen() {
  const info =
    typeof window.getStoredUserInfo === 'function'
      ? window.getStoredUserInfo()
      : { userName: '관리자', role: 'Admin', roleKo: '관리자' }

  const [theme, setTheme] = useState(() => (readTheme() === 'light' ? 'light' : 'dark'))

  const avatar = (info.userName || 'U').trim().slice(0, 1).toUpperCase()
  const displayRole = `${info.roleKo} · ${info.role}`
  const themeLabel = theme === 'light' ? 'Light' : 'Dark'

  const chooseTheme = (t) => {
    const selected = t === 'light' ? 'light' : 'dark'
    if (typeof window.setOpsRadarTheme === 'function') window.setOpsRadarTheme(selected)
    setTheme(selected)
  }

  const doLogout = () => {
    if (typeof window.logout === 'function') window.logout()
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">설정</div>
        <span className="badge b-accent">Front-end only</span>
      </div>
      <div className="content settings-content">
        <section className="settings-panel">
          <div className="settings-card-inner">
            <div className="settings-panel-head">
              <div>
                <div className="settings-eyebrow">Profile</div>
                <h3>계정 프로필</h3>
                <p className="settings-panel-sub">현재 접속한 사용자와 운영 권한 정보를 확인합니다.</p>
              </div>
              <span className="settings-status-badge">로그인됨</span>
            </div>
            <div className="settings-profile-card">
              <div className="settings-avatar">{avatar}</div>
              <div className="settings-profile-main">
                <div className="settings-profile-name">{info.userName}</div>
                <div className="settings-profile-meta">
                  <span className="settings-role-badge">{displayRole}</span>
                  <span className="settings-status-badge">로그인됨</span>
                </div>
              </div>
            </div>
            <div className="settings-info-strip">
              <div className="settings-info-card"><span>사용자</span><strong>{info.userName}</strong></div>
              <div className="settings-info-card"><span>역할</span><strong>{info.role}</strong></div>
              <div className="settings-info-card"><span>세션</span><strong>Active</strong></div>
            </div>
          </div>
        </section>

        <section className="settings-panel">
          <div className="settings-card-inner">
            <div className="settings-panel-head">
              <div>
                <div className="settings-eyebrow">Appearance</div>
                <h3>화면 테마</h3>
                <p className="settings-panel-sub">운영 관제 화면의 밝기와 대비를 선택합니다.</p>
              </div>
              <span className="settings-current-theme">{themeLabel}</span>
            </div>
            <div className="settings-appearance-row">
              <div className="settings-appearance-copy">
                <strong>인터페이스 모드</strong>
                <p>선택한 테마는 브라우저 localStorage에 저장되며 새로고침 후에도 유지됩니다.</p>
              </div>
              <div className="settings-pill-toggle" role="group" aria-label="테마 선택">
                <button
                  type="button"
                  className={'settings-pill-option' + (theme === 'dark' ? ' active' : '')}
                  data-theme-choice="dark"
                  onClick={() => chooseTheme('dark')}
                >
                  <i className="ti ti-moon"></i> Dark
                </button>
                <button
                  type="button"
                  className={'settings-pill-option' + (theme === 'light' ? ' active' : '')}
                  data-theme-choice="light"
                  onClick={() => chooseTheme('light')}
                >
                  <i className="ti ti-sun"></i> Light
                </button>
              </div>
            </div>
          </div>
        </section>

        <MemberAdminPanel />

        <section className="settings-panel danger-zone">
          <div className="settings-card-inner">
            <div className="settings-panel-head">
              <div>
                <div className="settings-eyebrow">Session</div>
                <h3>위험 액션</h3>
                <p className="settings-panel-sub">현재 브라우저에 저장된 로그인 정보를 정리합니다.</p>
              </div>
            </div>
            <div className="settings-logout-row">
              <div>
                <strong>현재 세션 종료</strong>
                <p>프론트 localStorage의 access_token, role, user 정보를 제거합니다. 백엔드/DB에는 영향을 주지 않습니다.</p>
              </div>
              <button type="button" className="settings-logout-btn" onClick={doLogout}>
                <i className="ti ti-logout"></i> 로그아웃
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
