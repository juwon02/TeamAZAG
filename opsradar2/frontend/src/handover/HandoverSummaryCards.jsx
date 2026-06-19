export default function HandoverSummaryCards({ documents }) {
  const cards = [
    ["전체 문서", documents.length, "ti-files"],
    ["검토 필요", documents.filter((item) => item.status === "검토 필요").length, "ti-eye-check"],
    ["승인 완료", documents.filter((item) => item.status === "승인 완료").length, "ti-circle-check"],
    ["전달 완료", documents.filter((item) => item.status === "전달 완료").length, "ti-send"],
  ];
  return <section className="hc-summary">{cards.map(([label, value, icon]) => <div className="hc-summary-item" key={label}><i className={`ti ${icon}`} /><div><strong>{value}</strong><span>{label}</span></div></div>)}</section>;
}
