import HandoverStatusBadge from "./HandoverStatusBadge";
import { STATUS_OPTIONS } from "./handoverData";

export default function HandoverDetailPanel({ document, onStatusChange }) {
  if (!document) return <aside className="hc-detail hc-empty-detail"><i className="ti ti-file-description" /><strong>문서를 선택해 주세요.</strong></aside>;
  return <aside className="hc-detail">
    <div className="hc-detail-head"><div><span>{document.kind === "onboarding" ? "온보딩 가이드" : "인수인계 문서"}</span><h2>{document.title}</h2></div><HandoverStatusBadge status={document.status} /></div>
    <div className="hc-detail-actions"><label><span>상태 관리</span><select value={document.status} onChange={(event) => onStatusChange(document.id, event.target.value)}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></label><button type="button" title="공유"><i className="ti ti-share" /></button><button type="button" title="내보내기"><i className="ti ti-download" /></button></div>
    <section className="hc-ai-summary"><div><i className="ti ti-sparkles" /><strong>AI 핵심 업무 요약</strong></div><p>{document.summary}</p></section>
    <section><h3>담당 업무와 확인 순서</h3><ol>{document.responsibilities.map((item) => <li key={item}>{item}</li>)}</ol></section>
    <section><h3>운영 맥락 연결</h3><div className="hc-contexts">{document.contexts.map((item) => <button key={`${item.type}-${item.title}`} type="button"><span>{item.type}</span><strong>{item.title}</strong><small>{item.status}</small><i className="ti ti-arrow-up-right" /></button>)}</div></section>
    <section><h3>관련 문서 / 출처</h3><div className="hc-sources">{document.sources.map((source) => <button type="button" key={source}><i className="ti ti-file-text" /><span>{source}</span><i className="ti ti-external-link" /></button>)}</div></section>
  </aside>;
}
