import HandoffCandidateList from "./HandoffCandidateList";
import HandoffPreview from "./HandoffPreview";
import { PEOPLE, DEPARTMENTS, CUSTOMERS, SUPPLIERS, PERIODS, HANDOFF_REASONS, HANDOFF_SCOPES, HANDOFF_INCLUDES, ONBOARDING_INCLUDES } from "./handoverData";

const Field = ({ label, value, options, onChange }) => (
  <label className="hc-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
);

export default function HandoffDetail(props) {
  const { type, step, conditions, candidates, selectedIds, previewData, onBack, onStep, onCondition, onInclude, onToggle, onEdit, onRegenerate, onShare, onSave } = props;
  const onboarding = type === "onboarding";
  const includeOptions = onboarding ? ONBOARDING_INCLUDES : HANDOFF_INCLUDES;
  return <main className={`hc-detail-page${onboarding ? " onboarding-detail" : ""}`}>
    <header className="hc-page-head"><button type="button" className="hc-icon-btn" onClick={onBack} title="처음으로"><i className="ti ti-arrow-left" /></button><div><span>{onboarding ? "NEW EMPLOYEE" : "WORK TRANSFER"}</span><h1>{onboarding ? "신입 온보딩 생성" : "업무 인수인계 생성"}</h1></div></header>
    <nav className="hc-steps" aria-label="생성 단계">{["조건 선택", "AI 추출 후보", "결과 미리보기"].map((label, index) => <button type="button" key={label} className={step === index + 1 ? "active" : ""} onClick={() => onStep(index + 1)}><b>{index + 1}</b><span>{label}</span></button>)}</nav>
    <section className={`hc-step-body${step === 3 ? " preview-wide" : ""}`}>
      {step === 1 && <div className="hc-condition-panel"><header><h2>생성 조건</h2><p>업무 기록을 찾을 범위와 결과 문서에 포함할 항목을 선택하세요.</p></header>
        <div className="hc-form-grid">{onboarding ? <>
          <Field label="온보딩 대상" value={conditions.target} options={PEOPLE} onChange={(v) => onCondition("target", v)} /><Field label="소속 팀" value={conditions.department} options={DEPARTMENTS} onChange={(v) => onCondition("department", v)} /><Field label="조회 기간" value={conditions.period} options={PERIODS} onChange={(v) => onCondition("period", v)} />
        </> : <>
          <Field label="기존 담당자" value={conditions.owner} options={PEOPLE} onChange={(v) => onCondition("owner", v)} /><Field label="신규 담당자" value={conditions.receiver} options={PEOPLE} onChange={(v) => onCondition("receiver", v)} /><Field label="소속 팀" value={conditions.department} options={DEPARTMENTS} onChange={(v) => onCondition("department", v)} /><Field label="인수인계 사유" value={conditions.reason} options={HANDOFF_REASONS} onChange={(v) => onCondition("reason", v)} /><Field label="업무 범위" value={conditions.scope} options={HANDOFF_SCOPES} onChange={(v) => onCondition("scope", v)} /><Field label="고객사" value={conditions.customer} options={CUSTOMERS} onChange={(v) => onCondition("customer", v)} /><Field label="구매처" value={conditions.supplier} options={SUPPLIERS} onChange={(v) => onCondition("supplier", v)} /><Field label="자료 필터 부서" value={conditions.filterDepartment} options={["전체", ...DEPARTMENTS]} onChange={(v) => onCondition("filterDepartment", v)} /><Field label="참고 기간" value={conditions.period} options={PERIODS} onChange={(v) => onCondition("period", v)} />
        </>}</div>
        <div className="hc-includes"><h3>포함할 자료</h3><div>{includeOptions.map((value) => <label key={value}><input type="checkbox" checked={conditions.includes.includes(value)} onChange={() => onInclude(value)} /><span><i className="ti ti-check" /></span>{value}</label>)}</div></div>
      </div>}
      {step === 2 && <HandoffCandidateList candidates={candidates} selectedIds={selectedIds} onToggle={onToggle} />}
      {step === 3 && <HandoffPreview previewData={previewData} type={type} onPreviewChange={onEdit} onRegenerate={onRegenerate} onShare={onShare} onSave={onSave} />}
    </section>
    {step < 3 && <footer className="hc-step-footer"><span>{step === 2 ? `${selectedIds.length}개 자료 선택됨` : "조건을 확인한 뒤 다음 단계로 이동하세요."}</span><button type="button" className="primary" onClick={() => onStep(step + 1)}>{step === 1 ? "AI 후보 확인" : "미리보기 생성"}<i className="ti ti-arrow-right" /></button></footer>}
  </main>;
}
