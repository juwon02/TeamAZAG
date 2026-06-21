export default function HandoverStatusBadge({ status }) {
  const tone = { "작성중": "draft", "검토 필요": "review", "승인 완료": "approved", "전달 완료": "delivered" }[status] || "draft";
  return <span className={`hc-status ${tone}`}>{status}</span>;
}
