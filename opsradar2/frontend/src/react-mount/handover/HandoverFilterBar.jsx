import { DEPARTMENTS, PEOPLE, STATUS_OPTIONS, WORK_TYPES } from "./handoverData";

export default function HandoverFilterBar({ filters, onChange }) {
  const select = (key, label, values) => <label><span>{label}</span><select value={filters[key]} onChange={(event) => onChange(key, event.target.value)}><option value="전체">전체</option>{values.map((value) => <option key={value}>{value}</option>)}</select></label>;
  return <section className="hc-filters">
    <label className="hc-search"><span>문서 검색</span><div><i className="ti ti-search" /><input value={filters.query} onChange={(event) => onChange("query", event.target.value)} placeholder="문서, 고객, 출처 검색" /></div></label>
    {select("owner", "담당자", PEOPLE)}
    {select("department", "부서", DEPARTMENTS)}
    {select("workType", "업무", WORK_TYPES)}
    {select("status", "상태", STATUS_OPTIONS)}
  </section>;
}
