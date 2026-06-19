const cards = [
  ["handoff", "ti-transfer", "WORK TRANSFER", "업무 인수인계 생성", "기존 담당자의 업무를 신규 담당자에게 넘기는 문서를 생성합니다.", "Todo·Issue·Report·Document 연결"],
  ["onboarding", "ti-user-plus", "NEW EMPLOYEE", "신입 온보딩 생성", "신규 입사자 또는 새 담당자를 위한 온보딩 가이드를 생성합니다.", "고객·반복 이슈·우선 Todo 정리"],
  ["archive", "ti-archive", "SAVED DOCUMENTS", "지난 인수인계 보기", "저장한 인수인계서와 온보딩 가이드를 다시 확인합니다.", "조건·선택 자료·결과 문서 보관"]
];
export default function HandoffHome({ archiveCount, onOpen }) {
  return <main className="hc-home"><section className="hc-home-intro"><span>OPERATION CONTINUITY</span><h1>인수인계 센터</h1><p>업무 맥락을 다음 담당자가 바로 이어갈 수 있도록 필요한 자료를 선별하고 문서로 정리합니다.</p></section><section className="hc-home-grid">{cards.map(([mode, icon, eyebrow, title, description, detail]) => <button type="button" className="hc-home-card" key={mode} onClick={() => onOpen(mode)}><div className="hc-home-card-head"><span>{eyebrow}</span><i className={`ti ${icon}`} /></div><div><h2>{title}</h2><p>{description}</p></div><ul><li>{detail}</li><li>{mode === "archive" ? `${archiveCount}건 저장됨` : "3단계 조건 기반 생성"}</li></ul><div className="hc-home-card-action"><span>{mode === "archive" ? "목록 열기" : "시작하기"}</span><i className="ti ti-arrow-right" /></div></button>)}</section></main>;
}
