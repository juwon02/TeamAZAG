(function () {
  const TEAMS = ["전체", "영업관리팀", "구매팀", "품질 클레임팀", "물류팀"];
  const LEAD_ROLES = ["admin", "pm", "leader", "lead", "시스템 관리자", "운영총괄"];

  const session = () => {
    try { return JSON.parse(localStorage.getItem("opsradar_session") || "{}"); } catch (_) { return {}; }
  };
  const user = () => session().user || {};
  const members = () => (window.opsRadarMembers || []).filter((member) => (member.status || "active") === "active");
  const actorKey = () => {
    const actor = user();
    return String(actor.id || actor.user_id || actor.username || actor.name || "anonymous");
  };
  const memberFor = (value) => members().find((member) => (
    String(member.user_id || "") === String(value?.id || value?.user_id || "")
    || String(member.username || "") === String(value?.username || "")
    || String(member.name || "") === String(value?.name || "")
  ));
  const storageKey = () => {
    const actor = user();
    return `workrader_calendar_team_filter:${actor.id || actor.user_id || actor.username || actor.name || "anonymous"}`;
  };
  const validTeam = (value) => TEAMS.includes(value);

  function memberTeam(member) {
    const team = String(member?.team_name || "").trim();
    return validTeam(team) && team !== "전체" ? team : "";
  }

  function isAllCalendarUser() {
    const actor = user();
    const member = memberFor(actor);
    const roles = [member?.project_role, member?.role, member?.user_role, actor.role, actor.project_role, actor.user_role]
      .map((role) => String(role || "").toLowerCase());
    return actor.name === "김도윤" || member?.name === "김도윤" || roles.some((role) => LEAD_ROLES.includes(role));
  }

  function defaultTeam() {
    if (isAllCalendarUser()) return "전체";
    const team = memberFor(user())?.team_name;
    return validTeam(team) && team !== "전체" ? team : "전체";
  }

  function currentTeam() {
    if (window.G?.calendarTeamFilterActor === actorKey() && validTeam(window.G.calendarTeamFilter)) {
      return window.G.calendarTeamFilter;
    }
    if (!members().length) return "전체";
    const stored = localStorage.getItem(storageKey());
    const team = validTeam(stored) ? stored : defaultTeam();
    if (window.G) {
      window.G.calendarTeamFilter = team;
      window.G.calendarTeamFilterActor = actorKey();
    }
    return team;
  }

  function tagTeam(tag) {
    if (memberTeam({ team_name: tag?.teamName })) return tag.teamName;
    const memberId = String(tag?.memberId || tag?.member_id || "");
    if (memberId) {
      const assignedMember = members().find((member) => String(member.member_id || member.id || "") === memberId);
      if (assignedMember) return memberTeam(assignedMember);
    }
    const person = tag?.person || tag?.assignee || "";
    const assignedMember = members().find((member) => member.name === person)
      || members().find((member) => person && String(tag?.t || "").startsWith(`${member.name} `));
    return memberTeam(assignedMember);
  }

  window.isCalendarTagVisible = function (tag) {
    const team = currentTeam();
    if (team === "전체") return true;
    const assignedTeam = tagTeam(tag);
    return !assignedTeam || assignedTeam === team;
  };

  function syncControl() {
    const control = document.getElementById("calendarTeamFilter");
    if (control) control.value = currentTeam();
  }

  window.setCalendarTeamFilter = function (team) {
    const next = validTeam(team) ? team : "전체";
    if (window.G) {
      window.G.calendarTeamFilter = next;
      window.G.calendarTeamFilterActor = actorKey();
    }
    localStorage.setItem(storageKey(), next);
    syncControl();
    if (typeof renderCalendar === "function" && window.G) renderCalendar(window.G.currentCalYear, window.G.currentCalMonth);
    if (window.G?.selectedCalDay && typeof openCalModal === "function") openCalModal(window.G.selectedCalDay);
  };

  window.refreshCalendarTeamFilter = function () {
    if (!members().length) return;
    currentTeam();
    syncControl();
    if (window.G?.currentScreen === "calendar" && typeof renderCalendar === "function") {
      renderCalendar(window.G.currentCalYear, window.G.currentCalMonth);
    }
  };

  const baseNav = window.nav;
  window.nav = nav = function (screen) {
    const result = baseNav(screen);
    if (screen === "calendar") setTimeout(window.refreshCalendarTeamFilter, 0);
    return result;
  };

  document.addEventListener("DOMContentLoaded", () => setTimeout(window.refreshCalendarTeamFilter, 0));
  window.addEventListener("opsradar:calendar-ready", () => setTimeout(window.refreshCalendarTeamFilter, 0));
})();
