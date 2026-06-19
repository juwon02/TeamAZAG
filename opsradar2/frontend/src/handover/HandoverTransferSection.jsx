export default function HandoverTransferSection({ onOpen }) {
  return <button className="hc-flow" type="button" onClick={onOpen}><i className="ti ti-transfer" /><div><strong>기존 담당자 인수인계</strong><span>담당자 변경, 부서 이동, 퇴직에 필요한 운영 맥락을 정리합니다.</span></div><i className="ti ti-chevron-right" /></button>;
}
