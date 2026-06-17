// 인수인계 센터(s-knowledge) 화면의 React 버전 (스트랭글러 4번째 — 보고서·캘린더 패턴).
//
// 규칙: 기존 index.html #s-knowledge 의 정적 "셸" HTML(class·id·구조·inline style·텍스트)을
// 100% verbatim 복제(픽셀 동일). createRoot(#s-knowledge) 로 memo 1회 렌더(재렌더 0).
//
// 동작/콘텐츠는 전부 기존 vanilla 가 소유(한 줄도 재작성 X):
//   - handoff.js 가 window.nav 패치 + #knowledgeContent 에 innerHTML 주입 +
//     #s-knowledge 에 data-handoff-view 토글 + <style id="handoffCenterStyle"> 를 document.head 에 주입.
//   - app.js 가 "문서 생성 미리보기" 버튼(텍스트로 스캔)을 click 바인딩.
//   - React 는 이 셸을 1회만 렌더 → 바닐라가 채운 #knowledgeContent / data-handoff-view 를 안 덮어씀.
//
// onClick 처리(보고서·캘린더와 동일 규칙): 원본에 인라인 onclick 이 있으면 미러, 없으면 미부착.
//   - 탭 3개(kbtn-*): 원본 onclick="selectKnowledgeType(...)" 있음 + 런타임 클릭 재바인딩 없음
//     → onClick 미러(전역 호출, click 시점 late-bound = handoff 오버라이드 버전). 이중 바인딩 없음.
//   - "문서 생성 미리보기" 버튼: 원본 onclick 없음 + app.js 가 addEventListener 바인딩 → onClick 미부착.
//
// 보존 ID(바닐라 의존): #s-knowledge(컨테이너), .topbar-title, #kbtn-onboarding/absence/offboard,
// #knowledgeFlowBar/Steps/Hint, "문서 생성 미리보기" .tbtn.primary, #knowledgeContextPanel(빈),
// #knowledgeContent(빈). (handoffDetailRoot/handoffAutoStatus/knowledgeAbsence 는 주입물이라 셸에 없음.)
// 컨테이너(#s-knowledge) 자체의 class/data-handoff-view 속성은 vanilla 소유 → React 는 자식만 렌더.
import { memo } from 'react'

const KnowledgeScreen = memo(function KnowledgeScreen() {
  return (
    <>
      <div className="topbar">
        <div className="topbar-title">인수인계 센터</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div className="tbtn" onClick={() => window.selectKnowledgeType?.('onboarding')} id="kbtn-onboarding"><i className="ti ti-user-plus"></i> 신규 입사자 온보딩</div>
          <div className="tbtn" onClick={() => window.selectKnowledgeType?.('absence')} id="kbtn-absence"><i className="ti ti-user-off"></i> 부재자 업무 인수인계</div>
          <div className="tbtn" onClick={() => window.selectKnowledgeType?.('offboard')} id="kbtn-offboard"><i className="ti ti-logout"></i> 담당자 변경/퇴직 인수인계</div>
        </div>
      </div>

      {/* 공통: 흐름 안내 바 */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} id="knowledgeFlowBar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--mono)' }} id="knowledgeFlowSteps"></div>
        <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text3)' }} id="knowledgeFlowHint"></div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 좌측: 컨텍스트 패널 */}
        <div style={{ width: '220px', borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', padding: '16px', height: '100%' }}>
          {/* Dashboard vs 인수인계 차이 안내 */}
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '14px', fontSize: '11px' }}>
            <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}><i className="ti ti-transfer" style={{ fontSize: '12px', color: 'var(--accent)' }}></i> 인수인계란?</div>
            <div style={{ color: 'var(--text3)', lineHeight: 1.7, fontSize: '10px' }}>
              <div style={{ marginBottom: '4px' }}>· 왜 이렇게 되었는가</div>
              <div style={{ marginBottom: '4px' }}>· 무엇을 조심해야 하는가</div>
              <div>· 다음 담당자가 알아야 할 것</div>
            </div>
          </div>
          {/* AI 생성 미리보기 카드 */}
          <div style={{ background: 'var(--accent-soft)', border: '1px solid rgba(66,99,235,.15)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '14px', fontSize: '11px' }}>
            <div style={{ fontWeight: 500, color: 'var(--accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}><i className="ti ti-sparkles" style={{ fontSize: '12px' }}></i> AI 생성 미리보기</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10px', color: 'var(--text2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}></div>현재 진행 중인 업무</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }}></div>미해결 이슈</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--warn)', flexShrink: 0 }}></div>다음 담당자 주의사항</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }}></div>참고 문서 링크</div>
            </div>
            <div className="tbtn primary" style={{ fontSize: '10px', padding: '5px 0', width: '100%', justifyContent: 'center', marginTop: '8px' }}><i className="ti ti-wand"></i> 문서 생성 미리보기</div>
          </div>
          <div id="knowledgeContextPanel"></div>
        </div>

        {/* 우측: 흐름 콘텐츠 (handoff.js 가 innerHTML 주입) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }} id="knowledgeContent"></div>
      </div>
    </>
  )
})

export default KnowledgeScreen
