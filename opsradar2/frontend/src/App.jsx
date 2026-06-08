import { memo, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import Analysis from "./components/Analysis.jsx";
import Calendar from "./components/Calendar.jsx";
import Chat from "./components/Chat.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Issue from "./components/Issue.jsx";
import Knowledge from "./components/Knowledge.jsx";
import Report from "./components/Report.jsx";
import Settings from "./components/Settings.jsx";
import Todo from "./components/Todo.jsx";
import { legacyMarkup, legacyScripts } from "./legacy/legacyMarkup.js";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Script load failed: ${src}`));
    document.body.appendChild(script);
  });
}

const LegacyShell = memo(function LegacyShell() {
  return (
    <div
      className="legacy-react-host"
      dangerouslySetInnerHTML={{ __html: legacyMarkup }}
    />
  );
});

export default function App() {
  const [dashboardRole, setDashboardRole] = useState("pm");
  const [analysisHost, setAnalysisHost] = useState(null);
  const [calendarHost, setCalendarHost] = useState(null);
  const [chatHost, setChatHost] = useState(null);
  const [dashboardHost, setDashboardHost] = useState(null);
  const [issueHost, setIssueHost] = useState(null);
  const [knowledgeHost, setKnowledgeHost] = useState(null);
  const [reportHost, setReportHost] = useState(null);
  const [settingsHost, setSettingsHost] = useState(null);
  const [todoHost, setTodoHost] = useState(null);

  useEffect(() => {
    if (window.__OPSRADAR_LEGACY_FRONTEND_LOADED__) return;
    window.__OPSRADAR_LEGACY_FRONTEND_LOADED__ = true;

    legacyScripts.reduce(
      (chain, src) => chain.then(() => loadScript(src)),
      Promise.resolve(),
    ).catch((error) => {
      console.error(error);
      window.__OPSRADAR_LEGACY_FRONTEND_LOADED__ = false;
    });
  }, []);

  useLayoutEffect(() => {
    setAnalysisHost(document.getElementById("s-analysis"));
    setCalendarHost(document.getElementById("s-calendar"));
    setChatHost(document.getElementById("s-chat"));
    setDashboardHost(document.getElementById("s-dashboard"));
    setIssueHost(document.getElementById("s-issues"));
    setKnowledgeHost(document.getElementById("s-knowledge"));
    setReportHost(document.getElementById("s-reports"));
    setSettingsHost(document.getElementById("s-settings"));
    setTodoHost(document.getElementById("s-todo"));
  }, []);

  useEffect(() => {
    const host = document.querySelector(".legacy-react-host");
    if (!host) return undefined;

    function handleClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const modalBackdropClose = target.closest("[data-modal-backdrop-close]");
      if (modalBackdropClose && event.target === modalBackdropClose) {
        event.preventDefault();
        window.closeModal?.(modalBackdropClose.dataset.modalBackdropClose);
        if (modalBackdropClose.dataset.calReset === "true") {
          window.resetCalendarSelection?.();
          window.renderCalendar?.();
        }
        return;
      }

      const modalBackdropCall = target.closest("[data-modal-backdrop-call]");
      if (modalBackdropCall && event.target === modalBackdropCall) {
        event.preventDefault();
        window[modalBackdropCall.dataset.modalBackdropCall]?.();
        return;
      }

      const issueTrigger = target.closest("[data-dashboard-issue-detail]");
      if (issueTrigger) {
        event.preventDefault();
        window.openIssueDetail?.(issueTrigger.dataset.dashboardIssueDetail);
        return;
      }

      const dashboardAction = target.closest("[data-dashboard-action]");
      if (dashboardAction?.dataset.dashboardAction === "apply") {
        event.preventDefault();
        window.applyDashboard?.();
        return;
      }

      const modalClose = target.closest("[data-modal-close]");
      if (modalClose) {
        event.preventDefault();
        window.closeModal?.(modalClose.dataset.modalClose);
        if (modalClose.dataset.calReset === "true") {
          window.resetCalendarSelection?.();
          window.renderCalendar?.();
        }
      }

      const calColor = target.closest("[data-cal-color-value]");
      if (calColor) {
        event.preventDefault();
        window.pickColor?.(
          calColor.dataset.calColorValue,
          calColor.dataset.calColorLabel,
          calColor.dataset.calColorCss,
        );
        return;
      }

      const floatQuestion = target.closest("[data-float-question]");
      if (floatQuestion) {
        event.preventDefault();
        window.floatAsk?.(floatQuestion.dataset.floatQuestion);
        return;
      }

      const shellCall = target.closest("[data-shell-call]");
      if (shellCall) {
        event.preventDefault();
        window[shellCall.dataset.shellCall]?.();
        return;
      }

      const navTrigger = target.closest("[data-legacy-nav]");
      if (navTrigger) {
        event.preventDefault();
        window.nav?.(navTrigger.dataset.legacyNav);
      }
    }

    function handleKeyDown(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const enterCall = target.closest("[data-enter-call]");
      if (enterCall && event.key === "Enter") {
        event.preventDefault();
        window[enterCall.dataset.enterCall]?.();
      }
    }

    host.addEventListener("click", handleClick);
    host.addEventListener("keydown", handleKeyDown);
    return () => {
      host.removeEventListener("click", handleClick);
      host.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <LegacyShell />
      {analysisHost ? createPortal(<Analysis />, analysisHost) : null}
      {dashboardHost
        ? createPortal(
            <Dashboard
              role={dashboardRole}
              onRoleChange={setDashboardRole}
              onNav={(screen) => window.nav?.(screen)}
            />,
            dashboardHost,
          )
        : null}
      {todoHost ? createPortal(<Todo />, todoHost) : null}
      {issueHost ? createPortal(<Issue />, issueHost) : null}
      {calendarHost ? createPortal(<Calendar />, calendarHost) : null}
      {chatHost ? createPortal(<Chat />, chatHost) : null}
      {knowledgeHost ? createPortal(<Knowledge />, knowledgeHost) : null}
      {reportHost ? createPortal(<Report />, reportHost) : null}
      {settingsHost ? createPortal(<Settings />, settingsHost) : null}
    </>
  );
}
