export default function HandoverOnboardingSection({ onOpen }) {
  return <button className="hc-flow" type="button" onClick={onOpen}><i className="ti ti-user-plus" /><div><strong>신규 입사자 온보딩</strong><span>첫날, 첫 주, 첫 달 기준으로 업무와 학습 순서를 구성합니다.</span></div><i className="ti ti-chevron-right" /></button>;
}
