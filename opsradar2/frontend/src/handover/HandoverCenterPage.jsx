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
  const [previewOverrides, setPreviewOverrides] = useState({ handoff: null, onboarding: null });
  const [savedDraftId, setSavedDraftId] = useState("");

  const activeConditions = mode === "onboarding" ? onboarding : handoff;
  const activeCandidates = mode === "onboarding" ? ONBOARDING_CANDIDATES : HANDOFF_CANDIDATES;
  const activeIds = mode === "onboarding" ? onboardingIds : handoffIds;
  const generatedHandoffPreview = useMemo(() => buildPreviewData("handoff", handoff, HANDOFF_CANDIDATES, handoffIds), [handoff, handoffIds]);
  const generatedOnboardingPreview = useMemo(() => buildPreviewData("onboarding", onboarding, ONBOARDING_CANDIDATES, onboardingIds), [onboarding, onboardingIds]);
  const previewType = mode === "onboarding" ? "onboarding" : "handoff";
  const preview = previewOverrides[previewType] || (previewType === "onboarding" ? generatedOnboardingPreview : generatedHandoffPreview);
  const openMode = (next) => { const normalized = normalizeMode(next); setMode(normalized); setArchiveId(""); setSavedDraftId(""); setStep(1); window.G && (window.G.currentKnowledgeType = normalized); };
  const getPreviewData = (type) => { const normalized = normalizeMode(type) === "onboarding" ? "onboarding" : "handoff"; return previewOverrides[normalized] || (normalized === "onboarding" ? generatedOnboardingPreview : generatedHandoffPreview); };
  const openPreview = (type) => { const normalized = normalizeMode(type) === "onboarding" ? "onboarding" : "handoff"; setMode(normalized); setStep(3); return getPreviewData(normalized); };

  useEffect(() => setHandoffController({ openMode, openPreview, getPreviewData }), [generatedHandoffPreview, generatedOnboardingPreview, previewOverrides]);
  useEffect(() => { const command = (event) => event.detail?.command === "preview" ? openPreview(event.detail.mode) : openMode(event.detail?.mode || "home"); const nav = () => openMode("home"); window.addEventListener("opsradar:handoff-command", command); window.addEventListener("opsradar:open-handover", nav); return () => { window.removeEventListener("opsradar:handoff-command", command); window.removeEventListener("opsradar:open-handover", nav); }; }, [generatedHandoffPreview, generatedOnboardingPreview, previewOverrides]);

  const resetEditedPreview = (type = previewType) => { setSavedDraftId(""); setPreviewOverrides((current) => ({ ...current, [type]: null })); };
  const changeCondition = (key, value) => { resetEditedPreview(); (mode === "onboarding" ? setOnboarding : setHandoff)((current) => ({ ...current, [key]: value })); };
  const toggleInclude = (value) => changeCondition("includes", activeConditions.includes.includes(value) ? activeConditions.includes.filter((item) => item !== value) : [...activeConditions.includes, value]);
  const toggleCandidate = (id) => { resetEditedPreview(); (mode === "onboarding" ? setOnboardingIds : setHandoffIds)((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); };
  const share = () => toast("공유 링크를 준비했습니다.");
  const save = () => {
    const record = { id: `${mode}-${Date.now()}`, type: mode, title: preview.title, status: "draft", createdAt: new Date().toISOString(), createdBy: localStorage.getItem("opsradar_user_name") || "김희진", owner: activeConditions.owner || "", receiver: activeConditions.receiver || "", target: activeConditions.target || "", department: activeConditions.department, customer: activeConditions.customer || "전체", supplier: activeConditions.supplier || "전체", scope: activeConditions.scope || "", period: activeConditions.period, conditions: activeConditions, selectedIds: activeIds, selectedCandidates: activeCandidates.filter((item) => activeIds.includes(item.id)), previewData: preview };
    const next = [record, ...archives]; setArchives(next); writeArchives(next); setSavedDraftId(record.id); toast("초안을 인수인계 문서함에 저장했습니다.");
  };
  const clone = (record) => { if (record.type === "onboarding") { setOnboarding({ ...DEFAULT_ONBOARDING_CONDITIONS, ...record.conditions }); setOnboardingIds(record.selectedIds || []); } else { setHandoff({ ...DEFAULT_HANDOFF_CONDITIONS, ...record.conditions }); setHandoffIds(record.selectedIds || []); } openMode(record.type); };
  const updateArchivePreview = (id, previewData) => { const editedRecord = archives.find((record) => record.id === id); const next = archives.map((record) => record.id === id ? { ...record, title: previewData.title, previewData } : record); setArchives(next); writeArchives(next); if (editedRecord) setPreviewOverrides((current) => ({ ...current, [editedRecord.type]: previewData })); toast("저장된 문서를 수정했습니다."); };
  const selectedArchive = archives.find((item) => item.id === archiveId);

  if (mode === "home") return <HandoffHome archiveCount={archives.length} onOpen={openMode} />;
  if (mode === "archive") return <HandoffArchive archives={archives} filter={archiveFilter} selected={selectedArchive} onFilter={setArchiveFilter} onOpen={setArchiveId} onBack={() => openMode("home")} onList={() => setArchiveId("")} onClone={clone} onShare={share} onPreviewChange={updateArchivePreview} />;
  return <HandoffDetail type={mode} step={step} conditions={activeConditions} candidates={activeCandidates} selectedIds={activeIds} previewData={preview} savedDraftId={savedDraftId} onBack={() => openMode("home")} onStep={setStep} onCondition={changeCondition} onInclude={toggleInclude} onToggle={toggleCandidate} onEdit={(nextPreview) => { setSavedDraftId(""); setPreviewOverrides((current) => ({ ...current, [previewType]: nextPreview })); }} onRegenerate={() => { resetEditedPreview(); toast("최신 업무 자료로 미리보기를 다시 생성했습니다."); }} onShare={share} onSave={save} onOpenArchive={() => openMode("archive")} />;
}
