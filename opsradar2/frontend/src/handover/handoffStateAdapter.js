let controller = null;

const normalizeMode = (type) => {
  if (type === "onboarding") return "onboarding";
  if (type === "archive" || type === "history") return "archive";
  if (type === "home" || !type) return "home";
  return "handoff";
};

const dispatchCommand = (command, detail = {}) => {
  window.dispatchEvent(new CustomEvent("opsradar:handoff-command", {
    detail: { command, ...detail },
  }));
};

export function installHandoffCompatibility() {
  window.__HANDOFF_REACT_ENABLED__ = true;
  window.initHandoffCenter = function initHandoffCenterCompat() {
    dispatchCommand("open", { mode: "home" });
  };
  window.selectKnowledgeType = function selectKnowledgeTypeCompat(type) {
    const mode = normalizeMode(type);
    controller?.openMode(mode);
    if (!controller) dispatchCommand("open", { mode });
  };
  window.openHandoffPreview = function openHandoffPreviewCompat(type) {
    const mode = normalizeMode(type) === "onboarding" ? "onboarding" : "handoff";
    if (controller) return controller.openPreview(mode);
    dispatchCommand("preview", { mode });
    return null;
  };
  window.generateHandoffPreview = window.openHandoffPreview;
  window.getHandoffPreviewData = function getHandoffPreviewDataCompat(type) {
    return controller?.getPreviewData(type) || null;
  };
}

export function setHandoffController(nextController) {
  controller = nextController;
  window.__handoffReactState = nextController;
  return () => {
    if (controller === nextController) controller = null;
    if (window.__handoffReactState === nextController) delete window.__handoffReactState;
  };
}

export { normalizeMode };
