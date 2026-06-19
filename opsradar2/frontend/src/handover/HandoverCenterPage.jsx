import { useEffect, useMemo, useState } from "react";
import HandoffHome from "./HandoffHome";
import HandoffDetail from "./HandoffDetail";
import HandoffArchive from "./HandoffArchive";
import { DEFAULT_HANDOFF_CONDITIONS, DEFAULT_ONBOARDING_CONDITIONS, HANDOFF_CANDIDATES, ONBOARDING_CANDIDATES, buildPreviewData, readArchives, writeArchives } from "./handoverData";
import { normalizeMode, setHandoffController } from "./handoffStateAdapter";
import "./handover.css";

const toast = (message) => window.showToast?.(message) || console.info(message);
export default function HandoverCenterPage() {
  const [mode, setMode] = useState("home");
  const [step, setStep] = useState(1);
  const [handoff, setHandoff] = useState(() => ({ ...DEFAULT_HANDOFF_CONDITIONS }));
  const [onboarding, setOnboarding] = useState(() => ({ ...DEFAULT_ONBOARDING_CONDITIONS }));
  const [handoffIds, setHandoffIds] = useState(() => HANDOFF_CANDIDATES.map((v) => v.id));
  const [onboardingIds, setOnboardingIds] = useState(() => ONBOARDING_CANDIDATES.map((v) => v.id));
  const [archives, setArchives] = useState(readArchives);
  const [archiveFilter, setArchiveFilter] = useState("all");
  const [archiveId, setArchiveId] = useState("");

  const activeConditions = mode === "onboarding" ? onboarding : handoff;
  const activeCandidates = mode === "onboarding" ? ONBOARDING_CANDIDATES : HANDOFF_CANDIDATES;
  const activeIds = mode === "onboarding" ? onboardingIds : handoffIds;
  const preview = useMemo(() => buildPreviewData(mode === "onboarding" ? "onboarding" : "handoff", activeConditions, activeCandidates, activeIds), [mode, activeConditions, activeCandidates, activeIds]);
  const openMode = (next) => { const normalized = normalizeMode(next); setMode(normalized); setArchiveId(""); setStep(1); window.G && (window.G.currentKnowledgeType = normalized); };
  const openPreview = (type) => { const normalized = normalizeMode(type) === "onboarding" ? "onboarding" : "handoff"; setMode(normalized); setStep(3); return buildPreviewData(normalized, normalized === "onboarding" ? onboarding : handoff, normalized === "onboarding" ? ONBOARDING_CANDIDATES : HANDOFF_CANDIDATES, normalized === "onboarding" ? onboardingIds : handoffIds); };
  const getPreviewData = (type) => { const normalized = normalizeMode(type) === "onboarding" ? "onboarding" : "handoff"; return buildPreviewData(normalized, normalized === "onboarding" ? onboarding : handoff, normalized === "onboarding" ? ONBOARDING_CANDIDATES : HANDOFF_CANDIDATES, normalized === "onboarding" ? onboardingIds : handoffIds); };

  useEffect(() => setHandoffController({ openMode, openPreview, getPreviewData }), [handoff, onboarding, handoffIds, onboardingIds]);
  useEffect(() => { const command = (event) => event.detail?.command === "preview" ? openPreview(event.detail.mode) : openMode(event.detail?.mode || "home"); const nav = () => openMode("home"); window.addEventListener("opsradar:handoff-command", command); window.addEventListener("opsradar:open-handover", nav); return () => { window.removeEventListener("opsradar:handoff-command", command); window.removeEventListener("opsradar:open-handover", nav); }; }, [handoff, onboarding, handoffIds, onboardingIds]);

  const changeCondition = (key, value) => (mode === "onboarding" ? setOnboarding : setHandoff)((current) => ({ ...current, [key]: value }));
  const toggleInclude = (value) => changeCondition("includes", activeConditions.includes.includes(value) ? activeConditions.includes.filter((item) => item !== value) : [...activeConditions.includes, value]);
  const toggleCandidate = (id) => (mode === "onboarding" ? setOnboardingIds : setHandoffIds)((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const share = () => toast("공유 링크를 준비했습니다.");
  const save = () => {
    const record = { id: `${mode}-${Date.now()}`, type: mode, title: preview.title, status: "draft", createdAt: new Date().toISOString(), createdBy: localStorage.getItem("opsradar_user_name") || "김희진", owner: activeConditions.owner || "", receiver: activeConditions.receiver || "", target: activeConditions.target || "", department: activeConditions.department, customer: activeConditions.customer || "전체", supplier: activeConditions.supplier || "전체", scope: activeConditions.scope || "", period: activeConditions.period, conditions: activeConditions, selectedIds: activeIds, selectedCandidates: activeCandidates.filter((item) => activeIds.includes(item.id)), previewData: preview };
    const next = [record, ...archives]; setArchives(next); writeArchives(next); toast("인수인계 초안을 저장했습니다.");
  };
  const clone = (record) => { if (record.type === "onboarding") { setOnboarding({ ...DEFAULT_ONBOARDING_CONDITIONS, ...record.conditions }); setOnboardingIds(record.selectedIds || []); } else { setHandoff({ ...DEFAULT_HANDOFF_CONDITIONS, ...record.conditions }); setHandoffIds(record.selectedIds || []); } openMode(record.type); };
  const selectedArchive = archives.find((item) => item.id === archiveId);

  if (mode === "home") return <HandoffHome archiveCount={archives.length} onOpen={openMode} />;
  if (mode === "archive") return <HandoffArchive archives={archives} filter={archiveFilter} selected={selectedArchive} onFilter={setArchiveFilter} onOpen={setArchiveId} onBack={() => openMode("home")} onList={() => setArchiveId("")} onClone={clone} onShare={share} />;
  return <HandoffDetail type={mode} step={step} conditions={activeConditions} candidates={activeCandidates} selectedIds={activeIds} previewData={preview} onBack={() => openMode("home")} onStep={setStep} onCondition={changeCondition} onInclude={toggleInclude} onToggle={toggleCandidate} onEdit={() => setStep(1)} onRegenerate={() => toast("최신 업무 자료로 미리보기를 다시 생성했습니다.")} onShare={share} onSave={save} />;
}
