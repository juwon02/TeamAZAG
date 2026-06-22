import HandoverStatusBadge from "./HandoverStatusBadge";

export default function HandoverDocumentList({ documents, selectedId, onSelect }) {
  return <section className="hc-list" aria-label="인수인계 문서 목록">
    <div className="hc-section-title"><div><strong>업무별 인수인계 문서</strong><span>{documents.length}건</span></div></div>
    <div className="hc-list-body">{documents.length ? documents.map((item) => <button className={`hc-document ${selectedId === item.id ? "selected" : ""}`} key={item.id} onClick={() => onSelect(item.id)}>
      <div className="hc-document-top"><span className="hc-kind">{item.kind === "onboarding" ? "신규 입사자 온보딩" : "기존 담당자 인수인계"}</span><HandoverStatusBadge status={item.status} /></div>
      <strong>{item.title}</strong><p>{item.summary}</p>
      <div className="hc-document-meta"><span><i className="ti ti-users" />{item.owner} → {item.receiver}</span><span><i className="ti ti-building" />{item.department}</span><span><i className="ti ti-calendar" />{item.updatedAt}</span></div>
    </button>) : <div className="hc-empty"><i className="ti ti-file-search" /><strong>조건에 맞는 문서가 없습니다.</strong><span>필터를 조정해 다시 확인해 주세요.</span></div>}</div>
  </section>;
}
