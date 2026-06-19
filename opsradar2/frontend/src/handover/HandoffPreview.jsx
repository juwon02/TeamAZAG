import { useState } from "react";

const copyPreview = (value) => ({ ...value, sections: value.sections.map(([title, items]) => [title, [...items]]) });

export default function HandoffPreview({ previewData, type, savedDraftId, onPreviewChange, onRegenerate, onShare, onSave, onOpenArchive, archived = false }) {
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [editablePreviewData, setEditablePreviewData] = useState(null);
  const startEditing = () => { setEditablePreviewData(copyPreview(previewData)); setIsEditingPreview(true); };
  const updateSection = (index, value) => setEditablePreviewData((current) => ({ ...current, sections: current.sections.map((section, sectionIndex) => sectionIndex === index ? [section[0], value.split("\n")] : section) }));
  const saveEditing = () => {
    const next = { ...editablePreviewData, sections: editablePreviewData.sections.map(([title, items]) => [title, items.map((item) => item.trim()).filter(Boolean)]) };
    onPreviewChange(next); setEditablePreviewData(null); setIsEditingPreview(false);
  };
  const cancelEditing = () => { setEditablePreviewData(null); setIsEditingPreview(false); };
  const displayed = isEditingPreview ? editablePreviewData : previewData;

  return <article className={`hc-preview${isEditingPreview ? " editing" : ""}`}>
    <header className="hc-preview-head"><div><span>{isEditingPreview ? "DOCUMENT EDIT MODE" : archived ? "ARCHIVED DOCUMENT" : "AI GENERATED PREVIEW"}</span><h2>{displayed.title}</h2></div><span className="hc-status">{isEditingPreview ? "편집 중" : "초안"}</span></header>
    <div className="hc-preview-body">{displayed.sections.map(([label, values], index) => <section className="hc-preview-section" key={`${label}-${index}`}><h3>{label}</h3>{isEditingPreview ? <textarea value={values.join("\n")} onChange={(event) => updateSection(index, event.target.value)} aria-label={`${label} 내용 편집`} /> : <ul>{values.map((value, itemIndex) => <li key={`${label}-${itemIndex}`}>{value}</li>)}</ul>}</section>)}</div>
    <footer className="hc-preview-actions">{isEditingPreview ? <><button type="button" onClick={cancelEditing}><i className="ti ti-x" />취소</button><button type="button" className="primary" onClick={saveEditing}><i className="ti ti-device-floppy" />저장</button></> : <><button type="button" onClick={startEditing}><i className="ti ti-edit" />수정하기</button>{!archived && <><button type="button" onClick={() => onRegenerate(type)}><i className="ti ti-refresh" />다시 생성</button><button type="button" onClick={onShare}><i className="ti ti-share" />공유하기</button><button type="button" className="primary" onClick={onSave}><i className="ti ti-device-floppy" />초안 저장</button></>}</>}</footer>
    {!archived && savedDraftId && <div className="hc-save-followup"><span><i className="ti ti-circle-check" />초안이 인수인계 문서함에 저장되었습니다.</span><button type="button" onClick={onOpenArchive}>문서함 보기<i className="ti ti-arrow-right" /></button></div>}
  </article>;
}
