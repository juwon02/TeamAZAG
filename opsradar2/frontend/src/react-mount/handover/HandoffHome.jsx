const cards = [
  ["handoff", "ti-transfer", "WORK TRANSFER", "업무 인수인계 생성", "진행 중인 업무, 리스크, 고객사 이력을 후임자에게 넘길 때 사용하는 인수인계서를 생성합니다.", "Todo·Issue·Report·Document 연결"],
  ["onboarding", "ti-user-plus", "NEW EMPLOYEE", "신입 온보딩 생성", "업무를 처음 맡는 사람이 고객사, 품목, 반복 이슈와 우선 Todo를 순서대로 파악할 수 있는 온보딩 가이드를 생성합니다.", "고객·반복 이슈·우선 Todo 정리"],
  ["archive", "ti-archive", "SAVED DOCUMENTS", "인수인계 문서함", "저장한 인수인계서와 온보딩 가이드를 문서함에서 다시 확인하고 복제할 수 있습니다.", "조건·선택 자료·결과 문서 보관"],
];

export default function HandoffHome({ archiveCount, onOpen }) {
  return <main className="hc-home"><section className="hc-home-intro"><span>OPERATION CONTINUITY</span><h1>인수인계 센터</h1><p>업무 맥락을 다음 담당자가 바로 이어갈 수 있도록 필요한 자료를 선별하고 문서로 정리합니다.</p></section><section className="hc-home-grid">{cards.map(([mode, icon, eyebrow, title, description, detail]) => <button type="button" className="hc-home-card" key={mode} onClick={() => onOpen(mode)}><div className="hc-home-card-head"><span>{eyebrow}</span><i className={`ti ${icon}`} /></div><div><h2>{title}</h2><p>{description}</p></div><ul><li>{detail}</li><li>{mode === "archive" ? `${archiveCount}건 저장됨` : "3단계 조건 기반 생성"}</li></ul><div className="hc-home-card-action"><span>{mode === "archive" ? "문서함 열기" : "시작하기"}</span><i className="ti ti-arrow-right" /></div></button>)}</section></main>;
}
