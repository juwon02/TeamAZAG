import { useEffect, useState } from "react";

const emptySnapshot = {
  theme: "dark",
  themeLabel: "Dark",
  user: {
    userName: "관리자",
    role: "Admin",
    roleKo: "관리자",
    state: "로컬 세션",
    avatar: "관",
  },
  displayRole: "관리자 · Admin",
  sessionState: "로컬 세션",
};

function callLegacy(name, ...args) {
  window[name]?.(...args);
}

function getSnapshot() {
  return window.getSettingsSnapshot?.() || emptySnapshot;
}

function ThemeButton({ active, icon, label, value }) {
  return (
    <button
      type="button"
      className={`settings-pill-option ${active ? "active" : ""}`}
      data-theme-choice={value}
      onClick={() => callLegacy("setOpsRadarTheme", value)}
    >
      <i className={`ti ${icon}`} /> {label}
    </button>
  );
}

export default function Settings() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);

  useEffect(() => {
    function handleSettingsState(event) {
      setSnapshot(event.detail || getSnapshot());
    }

    window.addEventListener("opsradar:settings-state-updated", handleSettingsState);
    const timer = window.setTimeout(() => {
      callLegacy("updateSettingsPage");
      setSnapshot(getSnapshot());
    }, 0);

    return () => {
      window.removeEventListener("opsradar:settings-state-updated", handleSettingsState);
      window.clearTimeout(timer);
    };
  }, []);

  const user = snapshot.user || emptySnapshot.user;

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
              <span className="settings-status-badge" id="settingsLoginStatus">{snapshot.sessionState || "로컬 세션"}</span>
            </div>

            <div className="settings-profile-card">
              <div className="settings-avatar" id="settingsUserAvatar">{user.avatar || "U"}</div>
              <div className="settings-profile-main">
                <div className="settings-profile-name" id="settingsUserName">{user.userName || "관리자"}</div>
                <div className="settings-profile-meta">
                  <span className="settings-role-badge" id="settingsUserRole">{snapshot.displayRole || "관리자 · Admin"}</span>
                  <span className="settings-status-badge" id="settingsUserState">{snapshot.sessionState || "로컬 세션"}</span>
                </div>
              </div>
            </div>

            <div className="settings-info-strip">
              <div className="settings-info-card"><span>사용자</span><strong id="settingsUserNameMirror">{user.userName || "관리자"}</strong></div>
              <div className="settings-info-card"><span>역할</span><strong id="settingsUserRoleMirror">{user.role || "Admin"}</strong></div>
              <div className="settings-info-card"><span>세션</span><strong id="settingsUserStateMirror">{snapshot.sessionState || "로컬 세션"}</strong></div>
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
              <span className="settings-current-theme" id="settingsThemeLabel">{snapshot.themeLabel || "Dark"}</span>
            </div>

            <div className="settings-appearance-row">
              <div className="settings-appearance-copy">
                <strong>인터페이스 모드</strong>
                <p>선택한 테마는 브라우저 localStorage에 저장되며 새로고침 후에도 유지됩니다.</p>
              </div>
              <div className="settings-pill-toggle" role="group" aria-label="테마 선택">
                <ThemeButton active={snapshot.theme !== "light"} icon="ti-moon" label="Dark" value="dark" />
                <ThemeButton active={snapshot.theme === "light"} icon="ti-sun" label="Light" value="light" />
              </div>
            </div>
          </div>
        </section>

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
                <p>프론트 localStorage의 access_token, role, user 정보를 제거합니다. 백엔드 DB에는 영향을 주지 않습니다.</p>
              </div>
              <button type="button" className="settings-logout-btn" onClick={() => callLegacy("logout")}>
                <i className="ti ti-logout" /> 로그아웃
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
