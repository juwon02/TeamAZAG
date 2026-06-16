// Handoff center overlay for the existing Knowledge screen.
// Keeps the Home -> Detail flow and uses scoped mock controls only inside Detail.
(function () {
  const COMPANY = "AutoParts One Korea";

  const PEOPLE = {
    owners: [
      "박서연 | 영업관리팀",
      "이민재 | 영업관리팀",
      "최유진 | 구매팀",
      "강민호 | 구매팀",
      "한지아 | 품질 클레임팀",
      "송지훈 | 물류팀",
    ],
    nextOwners: [
      "이민재 | 영업관리팀",
      "정하늘 | 영업관리팀",
      "오지훈 | 구매팀",
      "윤태성 | 품질 클레임팀",
      "임가은 | 물류팀",
      "김도윤 | 운영총괄팀장",
    ],
    onboardingTargets: ["정하늘", "오지훈", "윤태성", "임가은", "문태오"],
  };

  const scopeOptions = ["이전 담당 업무 전체", "특정 고객사", "특정 이슈"];
  const reasonOptions = ["담당자 변경", "휴가/부재", "부서 이동", "퇴사"];
  const customerFilterOptions = ["전체", "Hyundai Mobis Tier2", "Daesung Automotive", "Mirae EV Systems", "Hanil Motors", "Global Harness Vietnam"];
  const supplierFilterOptions = ["전체", "TE Connectivity Korea", "KET Supplier", "Yazaki Parts Asia", "JST Components", "Local Cable Works"];
  const departmentFilterOptions = ["전체", "영업관리팀", "구매팀", "품질 클레임팀", "물류팀"];
  const assignmentTeamOptions = ["영업관리팀", "구매팀", "품질 클레임팀", "물류팀", "운영총괄"];
  const periodOptions = ["최근 1개월", "최근 3개월", "최근 6개월", "최근 1년"];
  const includeOptions = ["진행 중 Todo", "미해결 이슈", "최근 보고서", "관련 문서", "일정/마감", "고객별·이슈별 주의사항"];
  const onboardingIncludes = ["주요 고객사", "주요 품목", "반복 이슈", "미해결 Todo", "최근 보고서", "추천 질문"];

  const state = {
    mode: "handoff",
    owner: PEOPLE.owners[0],
    nextOwner: PEOPLE.nextOwners[0],
    handoffDepartment: "영업관리팀",
    filterDepartment: "전체",
    activeDetailStep: "conditions",
    reason: reasonOptions[0],
    scope: scopeOptions[0],
    customer: "전체",
    supplier: "전체",
    period: "최근 6개월",
    issueGroup: "active",
    issueSearch: "",
    selectedIssueId: "mirae-quality-claim",
    onboardingTarget: "정하늘",
    onboardingTeam: "영업관리팀",
  };

  const DEMO_SOURCE = {
    label: "데모 데이터",
    path: "dummy_data/05_db_seed_v2 · expected_handover_sample.md",
    summary: "고객 업무 이관 seed를 기준으로 화면 결과물을 구성합니다.",
  };

  const HOME_FLOWS = {
    handoff: {
      section: "업무 인수인계",
      shortTitle: "인수인계",
      icon: "ti-transfer",
      tone: "b-warn",
      target: "담당자 변경 · 휴가/부재 · 부서 이동 · 퇴사",
      headline: "조건을 선택하면 AI가 업무 흔적을 읽고 인수인계서 초안을 만듭니다.",
      subline: "Todo, 이슈, 보고서, 고객 기록, 일정 자료를 업무 범위와 이슈 기준으로 묶어 다음 담당자가 확인할 초안을 구성합니다.",
      cta: "인수인계서 생성",
      homeResult: "선택 자료 요약, 인수인계서 초안, 관련 부서별 확인사항, 다음 액션",
      homeMetrics: [
        ["업무 범위", "전체 업무 또는 특정 이슈"],
        ["공통 필터", "고객사·구매처·부서·기간"],
        ["최종 결과", "팀장 확인용 인수인계 초안"],
      ],
      centerStats: [
        ["자료 수집", "12건", "Todo, 이슈, 보고서, 문서, 일정"],
        ["업무 후보", "8개", "AI가 넘겨야 할 업무 카드를 구성"],
        ["리스크", "4건", "품질·통관·단가·리드타임"],
        ["확인자", "2명", "팀장 승인 · 후임자 배정 대기"],
      ],
      pipeline: [
        ["자료 연결", "보고서, Todo, 이슈, 일정, ZIP 파일을 한 흐름으로 묶습니다."],
        ["조건 적용", "담당자, 부서, 사유, 업무 범위와 필터를 적용합니다."],
        ["이슈 판단", "진행 중/종료 이슈에서 인계해야 할 맥락을 좁힙니다."],
        ["초안 생성", "팀장이 바로 확인할 수 있는 인수인계서 초안과 다음 액션을 만듭니다."],
      ],
      queueTitle: "센터 처리 현황",
      queue: [
        ["접수", "담당자와 업무 범위 선택"],
        ["AI 분석", "업무 후보와 리스크 자동 추출"],
        ["사람 확인", "팀장 승인과 후임자 배정 대기"],
      ],
      checklistTitle: "사람이 마지막으로 확인할 항목",
      checklist: ["AI가 놓친 업무가 없는지 확인", "고객사 리스크 표현이 맞는지 확인", "후임자와 사수 배정이 맞는지 확인"],
      previewTitle: "업무 인수인계 초안",
    },
    onboarding: {
      section: "신입 온보딩",
      shortTitle: "온보딩",
      icon: "ti-user-plus",
      tone: "b-accent",
      target: "신규입사자 · 내부 이동자 · 후임 담당자",
      headline: "AI가 인수인계 맥락을 첫날·첫주·첫달 적응 순서로 바꿉니다.",
      subline: "신입 담당자가 긴 문서를 뒤지는 대신, 먼저 볼 고객과 반복 이슈, 우선 Todo, 추천 질문을 순서대로 확인합니다.",
      cta: "온보딩 가이드 생성",
      homeResult: "팀/업무 요약, 먼저 파악할 고객사, 반복 이슈, 우선 Todo, 추천 질문",
      homeMetrics: [
        ["입력 자료", "인수인계서·고객 맥락·Todo"],
        ["AI 재구성", "첫날·첫주·첫달 적응 순서"],
        ["최종 결과", "신입 온보딩 가이드"],
      ],
      centerStats: [
        ["기준 문서", "1건", "인수인계 초안 기반"],
        ["고객 맥락", "5곳", "국내외 고객사 운영 맥락"],
        ["학습 단계", "3단계", "첫날 · 첫주 · 첫달"],
        ["교육 일정", "4개", "사수 동행 · 고객 응대 · 리스크 리뷰"],
      ],
      pipeline: [
        ["인수 자료 읽기", "고객 리스트, 미완료 Todo, 업무 맥락, 주의사항을 읽습니다."],
        ["난이도 분리", "첫날 이해, 첫주 실습, 첫달 독립 처리 업무로 나눕니다."],
        ["교육 설계", "사수 동행 업무와 질문 채널, 점검 일정을 제안합니다."],
        ["가이드 생성", "요약, 체크리스트, 교육 일정, 질문 목록을 만듭니다."],
      ],
      queueTitle: "온보딩 처리 현황",
      queue: [
        ["접수", "대상자와 배정 팀 선택"],
        ["AI 재구성", "첫날·첫주·첫달 가이드 생성"],
        ["교육 준비", "사수 교육 일정과 질문 목록 대기"],
      ],
      checklistTitle: "사수와 팀장이 확인할 항목",
      checklist: ["첫날에 볼 자료가 충분한지 확인", "사수 동행 업무가 현실적인지 확인", "독립 처리 기준이 명확한지 확인"],
      previewTitle: "신입 온보딩 가이드",
    },
  };

  const handoffIssues = [
    {
      id: "mirae-quality-claim",
      group: "active",
      title: "Mirae EV Systems 반복 품질 클레임",
      status: "진행 중",
      severity: "High Risk",
      category: "품질",
      relatedTeams: ["품질 클레임팀", "구매팀", "영업관리팀"],
      customer: "Mirae EV Systems",
      supplier: "JST Components",
      product: "AP-SC-330 센서 케이블",
      todoCount: 4,
      documentCount: 12,
      dueLabel: "3일 내 고객 중간 보고",
      summary: "센서 케이블 접촉 불량이 반복되어 8D 리포트와 공급처 원인 분석 회신이 필요한 상태입니다.",
      resultMode: "active",
      result: {
        title: "이슈 인수인계서 - Mirae EV Systems 반복 품질 클레임",
        rows: [
          ["이슈 개요", ["Mirae EV Systems에서 AP-SC-330 센서 케이블 접촉 불량이 7월에만 3회 반복 접수되었습니다.", "공급처 JST Components의 검사 성적서 보완 여부와 동일 LOT 확산 가능성을 함께 확인해야 합니다.", "고객사는 중간 보고 주기를 짧게 가져가길 요청한 상태입니다."]],
          ["현재 진행 중 업무", ["한지아: 불량 샘플 4건 회수 상태 확인", "윤태성: JST Components 원인 분석 회신 마감 관리", "배수민: 8D 리포트 초안 작성 및 증빙 첨부", "최유진: 고객 중간 보고 일정 조율"]],
          ["미해결 리스크", ["동일 LOT 추가 클레임 가능성", "공급처 개선 조치 지연 시 고객 신뢰도 하락", "대체품 검증 일정 지연 가능성", "8D 리포트 제출 지연 시 공식 클레임으로 확대될 가능성"]],
          ["관련 부서별 확인사항", ["품질 클레임팀: 불량 원인 분석, 8D 리포트 작성, 샘플 사진 정리", "구매팀: 공급처 개선 요청 및 대체 공급 가능성 확인", "영업관리팀: 고객 중간 보고 일정과 회신 톤 관리"]],
          ["참고 보고서 / 문서", ["7월 Mirae EV Systems 품질 클레임 접수 로그", "불량 샘플 사진 및 LOT 번호 정리표", "JST Components 검사 성적서 보완 요청 메일", "7월 2주차 품질 대응 회의록"]],
          ["다음 액션", ["샘플 회수 완료 여부 확인", "공급처 회신 마감 확인", "고객 중간 보고 초안 작성", "8D 리포트 제출 일정 확정"]],
          ["팀장 확인 항목", ["고객 보고서에 동일 LOT 확산 가능성이 빠지지 않았는지 확인", "공급처 개선 요청 담당자가 명확한지 확인", "8D 리포트 제출 기한과 고객 중간 보고일이 충돌하지 않는지 확인"]],
        ],
      },
    },
    {
      id: "global-harness-customs",
      group: "active",
      title: "Global Harness Vietnam 통관 지연",
      status: "진행 중",
      severity: "Medium",
      category: "물류",
      relatedTeams: ["물류팀", "영업관리팀"],
      customer: "Global Harness Vietnam",
      supplier: "Yazaki Parts Asia",
      product: "AP-WH-220 와이어하네스",
      todoCount: 3,
      documentCount: 9,
      dueLabel: "통관 서류 재발급 대기",
      summary: "원산지 증명서 보완으로 통관이 지연되어 물류팀 서류 조치와 고객 납기 안내가 필요합니다.",
      resultMode: "active",
      result: {
        title: "이슈 인수인계서 - Global Harness Vietnam 통관 지연",
        rows: [
          ["이슈 개요", ["원산지 증명서 보완으로 AP-WH-220 와이어하네스 통관이 지연되었습니다.", "물류팀의 서류 재발급과 영업관리팀의 고객 안내가 동시에 필요합니다."]],
          ["현재 진행 중 업무", ["원산지 증명서 재발급 요청 상태 확인", "통관 대행사 제출 일정 확인", "고객사 납기 영향 안내 초안 작성"]],
          ["미해결 리스크", ["통관 지연 장기화 가능성", "고객 라인 투입 일정 지연 가능성", "긴급 항공 운송 전환 비용 발생 가능성"]],
          ["관련 부서별 확인사항", ["물류팀: 통관 서류 재발급 및 대행사 제출", "영업관리팀: 고객사 지연 안내 및 대체 일정 공유"]],
          ["참고 보고서 / 문서", ["통관 서류 요청 메일", "물류 대행사 회신", "고객 납기 안내 초안"]],
          ["다음 액션", ["서류 재발급 완료 확인", "통관 예상일 업데이트", "고객 회신 발송"]],
          ["팀장 확인 항목", ["고객 안내 문구에 확정일과 예상일이 혼재되지 않았는지 확인", "항공 운송 전환 시 승인권자가 지정되어 있는지 확인"]],
        ],
      },
    },
    {
      id: "te-price-increase",
      group: "active",
      title: "TE Connectivity Korea 단가 인상",
      status: "진행 중",
      severity: "High Risk",
      category: "단가",
      relatedTeams: ["구매팀", "영업관리팀"],
      customer: "Hyundai Mobis Tier2, Hanil Motors",
      supplier: "TE Connectivity Korea",
      product: "AP-CN-204 커넥터",
      todoCount: 5,
      documentCount: 10,
      dueLabel: "고객 단가 반영 필요",
      summary: "구매처 단가 7% 인상으로 고객 판매가 조정과 기존 수주 마진 영향 검토가 필요한 상태입니다.",
      resultMode: "active",
      result: {
        title: "이슈 인수인계서 - TE Connectivity Korea 단가 인상",
        rows: [
          ["이슈 개요", ["TE Connectivity Korea가 AP-CN-204 커넥터 단가 7% 인상을 통보했습니다.", "고객 판매가 반영 여부와 기존 수주 마진 영향 검토가 필요합니다."]],
          ["현재 진행 중 업무", ["구매 단가 인상 근거 문서 확인", "고객별 적용 단가 산정", "기존 발주분과 신규 발주분 적용 기준 정리"]],
          ["미해결 리스크", ["고객 단가 반영 지연 시 마진 하락", "기존 견적과 신규 견적 간 충돌 가능성", "단가 적용일 오해로 인한 클레임 가능성"]],
          ["관련 부서별 확인사항", ["구매팀: 인상 단가 적용일 및 예외 조건 확인", "영업관리팀: 고객별 단가 반영 안내"]],
          ["참고 보고서 / 문서", ["TE 단가 인상 공문", "고객별 견적 이력", "마진 영향 검토표"]],
          ["다음 액션", ["고객별 단가 변경 초안 작성", "기존 발주 적용 기준 확정", "PM 검토 요청"]],
          ["팀장 확인 항목", ["기존 발주분 적용 기준이 고객별로 일관적인지 확인", "마진 영향 검토표에 주요 고객사가 누락되지 않았는지 확인"]],
        ],
      },
    },
    {
      id: "yazaki-leadtime-rise",
      group: "active",
      title: "Yazaki Parts Asia 리드타임 증가",
      status: "진행 중",
      severity: "Medium",
      category: "구매/납기",
      relatedTeams: ["구매팀", "물류팀", "영업관리팀"],
      customer: "Hyundai Mobis Tier2",
      supplier: "Yazaki Parts Asia",
      product: "AP-RL-450 릴레이",
      todoCount: 3,
      documentCount: 8,
      dueLabel: "대체 일정 검토 중",
      summary: "공급처 리드타임이 2주 증가하여 고객 납기 방어와 운송 옵션 재검토가 필요합니다.",
      resultMode: "active",
      result: {
        title: "이슈 인수인계서 - Yazaki Parts Asia 리드타임 증가",
        rows: [
          ["이슈 개요", ["Yazaki Parts Asia의 AP-RL-450 릴레이 리드타임이 증가했습니다.", "구매팀은 공급 가능일을 재확인하고 물류팀은 운송 옵션을 재검토해야 합니다."]],
          ["현재 진행 중 업무", ["공급처 생산 가능일 재확인", "긴급 운송 옵션 비교", "고객 납기 영향도 업데이트"]],
          ["미해결 리스크", ["고객 생산 계획 지연 가능성", "항공 전환 비용 증가 가능성", "대체품 승인 지연 가능성"]],
          ["관련 부서별 확인사항", ["구매팀: 공급 가능일과 대체 공급처 확인", "물류팀: 운송 전환 비용 및 일정 확인", "영업관리팀: 고객 납기 영향 안내"]],
          ["참고 보고서 / 문서", ["Yazaki 리드타임 변경 공지", "고객 발주 잔량표", "항공 운송 견적서"]],
          ["다음 액션", ["공급처 최종 회신 확인", "항공 전환 승인 필요 여부 확인", "고객 안내 메일 초안 작성"]],
          ["팀장 확인 항목", ["항공 전환 비용 승인 기준이 확인되었는지 확인", "고객 납기 영향도가 최신 발주 잔량 기준인지 확인"]],
        ],
      },
    },
    {
      id: "daesung-urgent-order",
      group: "closed",
      title: "Daesung Automotive 긴급 발주 처리 완료",
      status: "종료",
      severity: "Medium",
      category: "주문/납기",
      relatedTeams: ["영업관리팀", "구매팀", "물류팀"],
      customer: "Daesung Automotive",
      supplier: "KET Supplier",
      product: "AP-CN-204 커넥터",
      todoCount: 0,
      documentCount: 8,
      dueLabel: "처리 완료",
      summary: "긴급 발주 요청에 대한 가능 수량 확인, 구매처 재고 확인, 출고 일정 조율까지 완료된 이슈입니다.",
      resultMode: "closed",
      result: {
        title: "종료 이슈 인수인계 기록 - Daesung Automotive 긴급 발주 처리 완료",
        rows: [
          ["이슈 개요", ["Daesung Automotive에서 AP-CN-204 커넥터 긴급 발주를 요청했습니다.", "구매 가능 수량 확인과 출고 일정 조율을 거쳐 처리 완료되었습니다."]],
          ["처리 과정 요약", ["고객 긴급 발주 수량 접수", "KET Supplier 재고 확인", "물류팀 출고 가능 일정 확인", "고객사 최종 납기 안내"]],
          ["완료된 조치", ["가능 수량 확정", "출고 일정 확정", "고객 회신 완료"]],
          ["재발 주의사항", ["Daesung Automotive 긴급 발주는 월말에 반복될 가능성이 있습니다.", "KET Supplier 재고는 긴급 요청 전 선확인이 필요합니다."]],
          ["참고 보고서 / 문서", ["긴급 발주 요청 메일", "KET 재고 확인 회신", "출고 일정 승인 내역"]],
          ["유사 이슈 발생 시 대응 기준", ["수량 확인, 재고 확인, 물류 일정 확인을 분리해 담당자를 지정합니다.", "고객에게 가능 수량과 확정 납기를 함께 안내합니다."]],
          ["팀장 확인 항목", ["긴급 발주 처리 기준이 다음 담당자에게 전달되었는지 확인", "월말 반복 가능성에 대한 선제 점검 Todo가 남아 있는지 확인"]],
        ],
      },
    },
    {
      id: "ket-shortage-complete",
      group: "closed",
      title: "KET Supplier 재고 부족 대체 수급 완료",
      status: "종료",
      severity: "High Risk",
      category: "구매",
      relatedTeams: ["구매팀", "영업관리팀"],
      customer: "Daesung Automotive",
      supplier: "KET Supplier",
      product: "AP-TM-118 터미널",
      todoCount: 0,
      documentCount: 11,
      dueLabel: "대체 수급 완료",
      summary: "재고 부족으로 납기 지연 가능성이 있었으나 대체 수량 확보와 고객 안내를 통해 종료된 이슈입니다.",
      resultMode: "closed",
      result: {
        title: "종료 이슈 인수인계 기록 - KET Supplier 재고 부족 대체 수급 완료",
        rows: [
          ["이슈 개요", ["KET Supplier AP-TM-118 터미널 재고 부족으로 Daesung Automotive 납기 지연 가능성이 확인되었습니다.", "대체 수급과 고객 납기 재안내를 통해 현재는 종료된 이슈입니다."]],
          ["처리 과정 요약", ["부족 수량 1,200개 확인", "KET Supplier 후속 입고 가능일 확인", "대체 공급 가능 수량 800개 확보", "고객 납기 변경 안내 및 승인 수령", "후속 입고 일정 모니터링 항목 등록"]],
          ["완료된 조치", ["대체 공급처 확인", "고객사 납기 변경 승인", "후속 입고 일정 등록", "월초 선제 재고 확인 Todo 생성"]],
          ["재발 주의사항", ["AP-TM-118 터미널은 안전 재고 기준 재검토가 필요합니다.", "동일 고객 발주가 월초에 몰리면 부족 신호가 늦게 감지될 수 있습니다.", "대체 수급 가능 수량과 실제 출고 가능 수량을 분리해서 확인해야 합니다."]],
          ["참고 보고서 / 문서", ["4월 KET Supplier 재고 부족 리포트", "대체 공급처 확인 메일", "Daesung Automotive 납기 변경 승인 메일", "후속 입고 일정표"]],
          ["유사 이슈 발생 시 대응 기준", ["구매팀이 대체 수급 가능성을 먼저 확인합니다.", "영업관리팀은 고객 납기 영향과 대체안을 함께 안내합니다.", "물류팀은 대체 수량의 실제 출고 가능일을 별도로 확인합니다."]],
          ["팀장 확인 항목", ["안전 재고 기준 재검토가 후속 Todo로 남아 있는지 확인", "고객 승인 내역과 변경 납기가 문서에 함께 남아 있는지 확인", "대체 공급처 사용 기준이 담당자에게 전달되었는지 확인"]],
        ],
      },
    },
    {
      id: "hyundai-air-shipping",
      group: "closed",
      title: "Hyundai Mobis Tier2 항공 운송 승인 및 완료",
      status: "종료",
      severity: "Medium",
      category: "물류/비용",
      relatedTeams: ["물류팀", "구매팀", "영업관리팀"],
      customer: "Hyundai Mobis Tier2",
      supplier: "Yazaki Parts Asia",
      product: "AP-RL-450 릴레이",
      todoCount: 0,
      documentCount: 7,
      dueLabel: "승인 및 운송 완료",
      summary: "납기 지연 방지를 위해 항공 운송으로 전환했고 추가 비용 승인까지 완료된 이슈입니다.",
      resultMode: "closed",
      result: {
        title: "종료 이슈 인수인계 기록 - Hyundai Mobis Tier2 항공 운송 승인 및 완료",
        rows: [
          ["이슈 개요", ["AP-RL-450 릴레이 납기 지연 방지를 위해 항공 운송으로 전환했습니다.", "추가 물류비 승인과 고객 납기 방어까지 완료되었습니다."]],
          ["처리 과정 요약", ["해상 운송 지연 확인", "항공 운송 비용 산정", "비용 승인", "고객 납기 일정 재확인"]],
          ["완료된 조치", ["항공 운송 승인 완료", "운송 완료", "추가 비용 정산 대기 항목 등록"]],
          ["재발 주의사항", ["Yazaki Parts Asia 리드타임 증가 시 조기 경보가 필요합니다.", "항공 전환은 비용 승인 기준을 먼저 확인해야 합니다."]],
          ["참고 보고서 / 문서", ["항공 운송 견적서", "승인 요청 메일", "고객 납기 방어 보고"]],
          ["유사 이슈 발생 시 대응 기준", ["비용 승인, 납기 영향, 고객 안내를 한 번에 정리합니다.", "반복 발생 시 공급처 리드타임 기준을 조정합니다."]],
          ["팀장 확인 항목", ["추가 물류비 정산 대기 항목이 담당자에게 이관되었는지 확인", "항공 전환 승인 기준이 다음 유사 이슈 기준으로 남아 있는지 확인"]],
        ],
      },
    },
  ];

  const fullScopeResult = {
    title: "업무 인수인계서 - 박서연 → 이민재",
    rows: [
      ["인수인계 개요", ["박서연 담당자가 관리하던 Hyundai Mobis Tier2와 Daesung Automotive 고객 업무를 이민재 담당자에게 이관합니다.", "원본 업무자료 업로드 후 AI가 Todo, 리스크, 이슈 로그, 주간·월간 보고서를 분석해 인수인계 문서 초안을 구성한 상태입니다.", "최근 6개월간 발생한 긴급 발주, 납기 지연, 단가 변경, 품질 클레임, 통관 이슈를 포함합니다."]],
      ["인수인계 범위", ["Hyundai Mobis Tier2 월별 대량 주문 관리", "Daesung Automotive 긴급 발주 대응", "고객 납기 변경 안내", "구매팀·물류팀·품질 클레임팀 협업 요청 관리", "보고서 선택 기반 인수인계 문서 자동 생성 결과 검토"]],
      ["담당 고객사 / 구매처 / 품목", ["Hyundai Mobis Tier2: 커넥터, 릴레이, 와이어하네스", "Daesung Automotive: AP-CN-204 커넥터, AP-TM-118 터미널", "Mirae EV Systems: AP-SC-330 센서 케이블", "주요 구매처: KET Supplier, TE Connectivity Korea, Yazaki Parts Asia", "주요 품목: 커넥터, 와이어하네스, 터미널, 센서 케이블, 릴레이"]],
      ["현재 진행 중 Todo", ["Daesung Automotive 긴급 발주 가능 수량 확인", "Hyundai Mobis Tier2 6월 출고 일정 재확인", "TE Connectivity Korea 단가 인상분 고객 안내 초안 작성", "Mirae EV Systems 반복 품질 클레임 8D 리포트 준비", "Global Harness Vietnam 통관 서류 재발급 확인"]],
      ["미해결 이슈", ["KET Supplier AP-TM-118 재고 부족 반복 가능성", "TE Connectivity Korea 단가 인상분 고객 반영 지연", "Hyundai Mobis Tier2 납기 지연 시 패널티 가능성", "Yazaki Parts Asia 리드타임 증가에 따른 선발주 필요성"]],
      ["주요 리스크", ["재고 부족으로 인한 납기 지연", "단가 인상 미반영 시 마진 하락", "긴급 항공 운송 발생 시 추가 비용 승인 필요", "품질 클레임 반복 시 고객 신뢰도 하락"]],
      ["고객별 주의사항", ["Hyundai Mobis Tier2: 납기 변경은 최소 5영업일 전에 사전 공유가 필요합니다.", "Daesung Automotive: 긴급 발주는 가능 수량과 확정 납기를 분리해서 안내해야 합니다.", "Mirae EV Systems: 품질 클레임은 중간 보고 주기를 짧게 가져가야 합니다.", "Global Harness Vietnam: 통관 지연은 서류 보완 상태와 예상 통관일을 함께 안내해야 합니다."]],
      ["관련 부서별 확인사항", ["구매팀: KET 재고와 TE 단가 적용일 확인", "물류팀: 긴급 출고 가능 시간과 항공 운송 비용 확인", "품질 클레임팀: Mirae EV Systems 8D 리포트 제출 일정 확인", "운영총괄: High Risk 항목 승인 여부 확인"]],
      ["참고 보고서 / 문서", ["2월 2주차 Daesung Automotive 긴급 발주 보고", "4월 KET Supplier 재고 부족 리스크 보고", "7월 Mirae EV Systems 품질 클레임 보고서", "9월 Hyundai Mobis Tier2 항공 운송 비용 보고", "10월 TE Connectivity Korea 단가 변경 보고", "12월 연간 운영 리스크 요약 보고서"]],
      ["다음 액션", ["이민재: 고객별 미완료 Todo 확인", "최유진: KET Supplier 재고 확인", "송지훈: Hyundai Mobis Tier2 출고 일정 업데이트", "김도윤: High Risk 항목 승인 여부 확인"]],
      ["팀장 확인 항목", ["인수인계 범위에 누락된 고객사가 없는지 확인", "미완료 Todo 담당자가 올바른지 확인", "High Risk 표현이 과장되거나 누락되지 않았는지 확인", "후임자 이민재에게 우선 처리 업무가 명확히 전달되는지 확인"]],
    ],
  };

  const onboardingResult = {
    title: "신입 온보딩 가이드 - 정하늘",
    rows: [
      ["팀/업무 요약", `${COMPANY} 영업관리팀은 고객 주문 접수, 견적, 납기 조율, 고객 커뮤니케이션, 매출 마감 업무를 담당합니다. 신입 담당자는 고객별 주문 패턴과 반복 리스크를 먼저 이해해야 합니다.`],
      ["먼저 파악해야 할 고객사", ["Hyundai Mobis Tier2: 납기 민감도가 높고 월별 대량 주문이 많습니다.", "Daesung Automotive: 긴급 발주가 자주 발생합니다.", "Hanil Motors: 단가 조정과 견적 변경 요청이 자주 발생합니다.", "Global Harness Vietnam: 통관 지연과 운송 일정 공유가 중요합니다."]],
      ["먼저 파악해야 할 구매처", ["KET Supplier: 안정 공급처이지만 AP-TM-118 터미널 재고 부족이 반복됩니다.", "TE Connectivity Korea: 고품질, 고단가 구매처이며 단가 인상 이슈가 있습니다.", "Yazaki Parts Asia: 해외 공급처로 리드타임이 길고 변동 가능성이 큽니다.", "Local Cable Works: 센서 케이블 품질 확인 요청이 반복됩니다."]],
      ["최근 반복 이슈", ["KET Supplier 재고 부족으로 납기 지연 가능성이 반복되었습니다.", "TE Connectivity Korea 단가 인상으로 고객 단가 반영이 필요했습니다.", "Yazaki Parts Asia 리드타임 증가로 선발주 검토가 필요했습니다.", "Mirae EV Systems 품질 클레임으로 8D 리포트 제출이 반복되었습니다."]],
      ["우선 확인할 Todo", ["Daesung Automotive 긴급 발주 가능 수량 확인", "Hyundai Mobis Tier2 출고 일정 재확인", "TE 단가 인상분 고객 단가 반영 여부 확인", "Mirae EV Systems 8D 리포트 초안 확인"]],
      ["첫날 / 첫주 / 첫달 가이드", ["첫날: 고객사별 주문 패턴과 주요 문서 위치를 확인하고 사수에게 고객별 커뮤니케이션 톤을 묻습니다.", "첫주: 긴급 발주 대응 1건을 사수와 함께 처리하고 납기 리스크 카드 1건을 읽어 대응 흐름을 정리합니다.", "첫달: 미완료 Todo를 독립적으로 업데이트하고 월간 보고서에서 반복 이슈를 찾아 다음 액션을 제안합니다."]],
      ["추천 질문", ["현재 High Risk 고객사는 어디인가?", "최근 3개월간 반복된 납기 지연 원인은 무엇인가?", "Daesung Automotive 긴급 발주는 어떤 순서로 처리하는가?", "고객에게 납기 변경을 안내할 때 주의할 표현은 무엇인가?"]],
      ["사수/팀장 확인 항목", ["신입 담당자가 고객별 업무 차이를 이해했는지 확인", "첫주 실습 업무가 과도하지 않은지 확인", "High Risk 업무를 단독 처리하지 않도록 제한 확인", "월간 보고서에서 반복 이슈를 찾을 수 있는지 확인"]],
    ],
  };

  const candidateItems = {
    todos: [
      { id:"t1", type:"todo", title:"Daesung Automotive 긴급 발주 가능 수량 확인", department:"영업관리팀", owner:"박서연", customer:"Daesung Automotive", riskLevel:"High", checked:true },
      { id:"t2", type:"todo", title:"Hyundai Mobis Tier2 6월 출고 일정 재확인", department:"영업관리팀", owner:"박서연", customer:"Hyundai Mobis Tier2", riskLevel:"Medium", checked:true },
      { id:"t3", type:"todo", title:"TE Connectivity Korea 단가 인상분 고객 안내 초안 작성", department:"구매팀", owner:"최유진", customer:"Hyundai Mobis Tier2", riskLevel:"High", checked:true },
      { id:"t4", type:"todo", title:"Mirae EV Systems 반복 품질 클레임 8D 리포트 준비", department:"품질 클레임팀", owner:"한지아", customer:"Mirae EV Systems", riskLevel:"High", checked:true },
      { id:"t5", type:"todo", title:"Global Harness Vietnam 통관 서류 재발급 확인", department:"물류팀", owner:"송지훈", customer:"Global Harness Vietnam", riskLevel:"Medium", checked:true },
      { id:"t6", type:"todo", title:"종료된 단순 회신 메일 처리", department:"영업관리팀", owner:"박서연", customer:"전체", riskLevel:"Low", checked:false },
    ],
    issues: [
      { id:"i1", type:"issue", title:"KET Supplier AP-TM-118 재고 부족 반복 가능성", department:"구매팀", owner:"최유진", customer:"Daesung Automotive", riskLevel:"High", checked:true },
      { id:"i2", type:"issue", title:"TE Connectivity Korea 단가 인상분 고객 반영 지연", department:"영업관리팀", owner:"박서연", customer:"Hyundai Mobis Tier2", riskLevel:"High", checked:true },
      { id:"i3", type:"issue", title:"Hyundai Mobis Tier2 납기 지연 시 패널티 가능성", department:"영업관리팀", owner:"박서연", customer:"Hyundai Mobis Tier2", riskLevel:"Medium", checked:true },
      { id:"i4", type:"issue", title:"Yazaki Parts Asia 리드타임 증가에 따른 선발주 필요성", department:"구매팀", owner:"강민호", customer:"Hyundai Mobis Tier2", riskLevel:"Medium", checked:true },
    ],
    reports: [
      { id:"r1", type:"report", title:"2월 2주차 Daesung Automotive 긴급 발주 보고", department:"영업관리팀", owner:"박서연", customer:"Daesung Automotive", riskLevel:"Medium", checked:true },
      { id:"r2", type:"report", title:"4월 KET Supplier 재고 부족 리스크 보고", department:"구매팀", owner:"최유진", customer:"Daesung Automotive", riskLevel:"High", checked:true },
      { id:"r3", type:"report", title:"7월 Mirae EV Systems 품질 클레임 보고", department:"품질 클레임팀", owner:"한지아", customer:"Mirae EV Systems", riskLevel:"High", checked:true },
      { id:"r4", type:"report", title:"9월 Hyundai Mobis Tier2 항공 운송 비용 보고", department:"물류팀", owner:"송지훈", customer:"Hyundai Mobis Tier2", riskLevel:"Medium", checked:true },
      { id:"r5", type:"report", title:"10월 TE Connectivity Korea 단가 변경 보고", department:"구매팀", owner:"최유진", customer:"Hyundai Mobis Tier2", riskLevel:"High", checked:true },
      { id:"r6", type:"report", title:"12월 연간 운영 리스크 요약 보고서", department:"영업관리팀", owner:"박서연", customer:"전체", riskLevel:"Medium", checked:false },
    ],
    documents: [
      { id:"d1", type:"document", title:"Hyundai Mobis Tier2 고객별 주문 패턴 정리", department:"영업관리팀", owner:"박서연", customer:"Hyundai Mobis Tier2", riskLevel:"Low", checked:true },
      { id:"d2", type:"document", title:"KET Supplier 재고 현황 및 안전 재고 기준", department:"구매팀", owner:"최유진", customer:"전체", riskLevel:"Medium", checked:true },
      { id:"d3", type:"document", title:"AP-SC-330 불량 샘플 사진 및 LOT 번호 정리표", department:"품질 클레임팀", owner:"한지아", customer:"Mirae EV Systems", riskLevel:"High", checked:true },
      { id:"d4", type:"document", title:"종료된 단순 회신 메일 아카이브", department:"영업관리팀", owner:"박서연", customer:"전체", riskLevel:"Low", checked:false },
    ],
    cautions: [
      { id:"c1", type:"caution", title:"Hyundai Mobis Tier2: 납기 변경은 최소 5영업일 전 사전 공유 필요", department:"영업관리팀", owner:"박서연", customer:"Hyundai Mobis Tier2", riskLevel:"High", checked:true },
      { id:"c2", type:"caution", title:"Daesung Automotive: 긴급 발주는 가능 수량과 확정 납기를 분리 안내 필요", department:"영업관리팀", owner:"박서연", customer:"Daesung Automotive", riskLevel:"Medium", checked:true },
      { id:"c3", type:"caution", title:"Mirae EV Systems: 품질 클레임은 중간 보고 주기를 짧게 유지 필요", department:"품질 클레임팀", owner:"한지아", customer:"Mirae EV Systems", riskLevel:"High", checked:true },
      { id:"c4", type:"caution", title:"Global Harness Vietnam: 통관 지연 시 서류 보완 상태와 예상 통관일 함께 안내", department:"물류팀", owner:"송지훈", customer:"Global Harness Vietnam", riskLevel:"Medium", checked:true },
    ],
  };

  const onboardingCandidates = {
    customers: [
      { id:"oc1", type:"customer", title:"Hyundai Mobis Tier2: 납기 민감도 높음, 월별 대량 주문", checked:true },
      { id:"oc2", type:"customer", title:"Daesung Automotive: 긴급 발주 빈번, 월말 집중", checked:true },
      { id:"oc3", type:"customer", title:"Hanil Motors: 단가 조정·견적 변경 요청 자주 발생", checked:true },
      { id:"oc4", type:"customer", title:"Global Harness Vietnam: 통관 지연·운송 일정 공유 중요", checked:true },
    ],
    suppliers: [
      { id:"os1", type:"supplier", title:"KET Supplier: AP-TM-118 터미널 재고 부족 반복", checked:true },
      { id:"os2", type:"supplier", title:"TE Connectivity Korea: 고단가·단가 인상 이슈", checked:true },
      { id:"os3", type:"supplier", title:"Yazaki Parts Asia: 리드타임 길고 변동 가능성 큼", checked:true },
      { id:"os4", type:"supplier", title:"Local Cable Works: 센서 케이블 품질 확인 반복", checked:true },
    ],
    issues: [
      { id:"oi1", type:"issue", title:"KET Supplier 재고 부족으로 납기 지연 반복", checked:true },
      { id:"oi2", type:"issue", title:"TE Connectivity Korea 단가 인상 → 고객 단가 반영 지연", checked:true },
      { id:"oi3", type:"issue", title:"Yazaki Parts Asia 리드타임 증가 → 선발주 검토 필요", checked:true },
      { id:"oi4", type:"issue", title:"Mirae EV Systems 품질 클레임 8D 리포트 반복", checked:true },
    ],
    todos: [
      { id:"ot1", type:"todo", title:"Daesung Automotive 긴급 발주 가능 수량 확인", checked:true },
      { id:"ot2", type:"todo", title:"Hyundai Mobis Tier2 출고 일정 재확인", checked:true },
      { id:"ot3", type:"todo", title:"TE 단가 인상분 고객 단가 반영 여부 확인", checked:true },
      { id:"ot4", type:"todo", title:"Mirae EV Systems 8D 리포트 초안 확인", checked:true },
    ],
    reports: [
      { id:"or1", type:"report", title:"4월 KET Supplier 재고 부족 리스크 보고", checked:true },
      { id:"or2", type:"report", title:"7월 Mirae EV Systems 품질 클레임 보고", checked:true },
      { id:"or3", type:"report", title:"10월 TE Connectivity Korea 단가 변경 보고", checked:true },
      { id:"or4", type:"report", title:"12월 연간 운영 리스크 요약 보고서", checked:false },
    ],
    questions: [
      { id:"oq1", type:"question", title:"현재 High Risk 고객사는 어디인가?", checked:true },
      { id:"oq2", type:"question", title:"최근 3개월간 반복된 납기 지연 원인은 무엇인가?", checked:true },
      { id:"oq3", type:"question", title:"Daesung Automotive 긴급 발주는 어떤 순서로 처리하는가?", checked:true },
      { id:"oq4", type:"question", title:"고객에게 납기 변경을 안내할 때 주의할 표현은 무엇인가?", checked:true },
    ],
  };

  function normalizeMode(type) {
    if (type === "onboarding") return "onboarding";
    return "handoff";
  }

  function departmentTemplate(department) {
    const templates = {
      "영업관리팀": { label:"영업관리팀 인수인계 포인트", sections:["담당 고객사","고객별 주문 패턴","진행 중 견적/납기 Todo","고객별 주의사항","구매/물류/품질팀 협업 포인트"] },
      "구매팀": { label:"구매팀 인수인계 포인트", sections:["담당 구매처","구매처별 리드타임/단가/MOQ","진행 중 발주 Todo","재고 부족/대체 구매처 이슈","영업관리팀에 공유할 납기 리스크"] },
      "품질 클레임팀": { label:"품질 클레임팀 인수인계 포인트", sections:["담당 클레임","고객별 품질 요구사항","진행 중 원인 분석","8D 리포트 상태","반복 불량 이력","공급처 개선 요청 이력"] },
      "물류팀": { label:"물류팀 인수인계 포인트", sections:["입고/출고 흐름","운송사/통관 관련 주의사항","진행 중 배송 지연","긴급배송/항공 운송 이력","고객 납기 영향"] },
    };
    return templates[department] || templates["영업관리팀"];
  }

  function esc(value) {
    if (typeof window.escapeHtml === "function") return window.escapeHtml(value);
    return String(value ?? "").replace(/[&<>"']/g, (char) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
    ));
  }

  function options(values, selected) {
    return values.map((value) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join("");
  }

  function checks(values) {
    return values.map((value) => `<label class="hf-check-option"><input type="checkbox" checked><span>${esc(value)}</span></label>`).join("");
  }

  function list(value) {
    if (!Array.isArray(value)) return esc(value);
    return `<ul class="hf-result-list">${value.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
  }

  // 동일 키가 여러 번 나올 경우 마지막(가장 상세한) 항목으로 머지
  function dedupeRows(rows) {
    const seen = new Map();
    rows.forEach((row) => seen.set(row[0], row[1]));
    return [...seen.entries()].map(([k, v]) => [k, v]);
  }

  // 레이블 alias 정규화: "참고 자료" → "참고 보고서 / 문서"
  const LABEL_ALIAS = {
    "참고 자료": "참고 보고서 / 문서",
    "현재 진행 중 업무": "현재 진행 중 Todo",
  };
  function normalizeRows(rows) {
    return dedupeRows(
      rows.map((row) => [LABEL_ALIAS[row[0]] || row[0], row[1]])
    );
  }

  function badgeClass(value) {
    if (value === "High Risk") return "b-danger";
    if (value === "진행 중") return "b-accent";
    if (value === "종료") return "b-success";
    return "b-warn";
  }

  function selectedScope() {
    return state.scope;
  }

  function isIssueScope() {
    return selectedScope() === "특정 이슈";
  }

  function selectedIssue() {
    return handoffIssues.find((issue) => issue.id === state.selectedIssueId) || handoffIssues[0];
  }

  function isCustomerScope() {
    return selectedScope() === "특정 고객사";
  }

  function matchesSelectedFilters(item) {
    if (isCustomerScope() && state.customer !== "전체" && item.customer && item.customer !== "전체" && item.customer !== state.customer) return false;
    if (state.filterDepartment !== "전체" && item.department && item.department !== state.filterDepartment) return false;
    return true;
  }

  function checkedTitles(section) {
    const items = candidateItems[section] || [];
    return items.filter(item => item.checked && matchesSelectedFilters(item)).map(item => item.title);
  }

  function checkedOnboardingTitles(section) {
    const items = onboardingCandidates[section] || [];
    return items.filter(item => item.checked).map(item => item.title);
  }

  function withRows(baseRows, replacements) {
    const next = baseRows.filter((row) => !Object.prototype.hasOwnProperty.call(replacements, row[0]));
    Object.keys(replacements).forEach((label) => next.push([label, replacements[label]]));
    return normalizeRows(next);
  }

  function handoffRows() {
    const baseRows = isIssueScope() ? selectedIssue().result.rows : fullScopeResult.rows;
    return withRows(baseRows, {
      "현재 진행 중 Todo": checkedTitles("todos"),
      "미해결 이슈": checkedTitles("issues"),
      "참고 보고서 / 문서": [...checkedTitles("reports"), ...checkedTitles("documents")],
      "고객별 주의사항": checkedTitles("cautions"),
    });
  }

  function onboardingRows() {
    return withRows(onboardingResult.rows, {
      "팀/업무 요약": `${COMPANY} ${state.onboardingTeam}에 배정된 ${state.onboardingTarget} 담당자는 고객/구매처 맥락, 반복 이슈, 우선 Todo, 보고서 근거를 먼저 확인합니다. 참고 기간은 ${state.period}입니다.`,
      "먼저 파악해야 할 고객사": checkedOnboardingTitles("customers"),
      "먼저 파악해야 할 구매처": checkedOnboardingTitles("suppliers"),
      "최근 반복 이슈": checkedOnboardingTitles("issues"),
      "우선 확인할 Todo": checkedOnboardingTitles("todos"),
      "참고 보고서 / 문서": checkedOnboardingTitles("reports"),
      "추천 질문": checkedOnboardingTitles("questions"),
    });
  }

  function issueMatches(issue, keyword) {
    if (!keyword) return true;
    return [issue.title, issue.summary, issue.customer, issue.supplier, issue.product, issue.category, issue.relatedTeams.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(keyword.toLowerCase());
  }

  function currentRows() {
    if (state.mode === "onboarding") return onboardingRows();
    return handoffRows();
  }

  function currentTitle() {
    if (state.mode === "onboarding") return `신입 온보딩 가이드 - ${state.onboardingTarget}`;
    if (isIssueScope()) return selectedIssue().result.title;
    if (isCustomerScope() && state.customer !== "전체") return `업무 인수인계서 - ${state.customer}`;
    return fullScopeResult.title;
  }

  function flow(type) {
    return type === "onboarding" ? HOME_FLOWS.onboarding : HOME_FLOWS.handoff;
  }

  function screen() {
    return document.getElementById("s-knowledge");
  }

  function ensureStyle() {
    if (document.getElementById("handoffCenterStyle")) return;
    const style = document.createElement("style");
    style.id = "handoffCenterStyle";
    style.textContent = `
      #s-knowledge .topbar>div:last-child{display:none!important}
      #s-knowledge[data-handoff-view] #knowledgeContextSidebar{display:none!important}
      #s-knowledge[data-handoff-view] #knowledgeContent{padding:16px!important;width:100%;max-width:100%;height:100%;min-height:0}
      .hf-home{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;width:100%;height:100%;min-height:0}
      .hf-home-card{position:relative;overflow:hidden;border:1px solid var(--border);background:linear-gradient(180deg,var(--surface) 0%,var(--surface2) 100%);border-radius:8px;padding:34px;text-align:left;color:var(--text);cursor:pointer;height:100%;display:flex;flex-direction:column;justify-content:space-between;gap:28px}
      .hf-home-card:before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:var(--accent)}
      .hf-home-card:hover{border-color:var(--accent);box-shadow:0 18px 44px rgba(0,0,0,.16);transform:translateY(-1px)}
      .hf-home-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      .hf-icon{width:64px;height:64px;border-radius:8px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0}
      .hf-home-card h2{font-size:44px;line-height:1.12;margin:26px 0 14px;color:var(--text);letter-spacing:0}
      .hf-home-card p{font-size:17px;line-height:1.68;color:var(--text2);margin:0;max-width:820px}
      .hf-result-box{margin-top:28px;border:1px solid var(--border2);background:var(--surface);border-radius:8px;padding:18px}
      .hf-result-box strong{display:flex;align-items:center;gap:8px;font-size:16px;color:var(--text);margin-bottom:10px}
      .hf-result-box span{display:block;font-size:14px;color:var(--text2);line-height:1.55}
      .hf-home-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
      .hf-home-metrics div{background:var(--surface);border:1px solid var(--border2);border-radius:8px;padding:14px;min-height:88px}
      .hf-home-metrics strong{display:block;font-size:14px;color:var(--text);margin-bottom:7px}
      .hf-home-metrics span{display:block;font-size:12px;color:var(--text3);line-height:1.45}
      .hf-enter{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--border);padding-top:20px;font-size:16px;font-weight:900;color:var(--accent)}
      .hf-detail{display:flex;flex-direction:column;gap:14px;width:100%;min-height:100%}
      .hf-hero{border:1px solid var(--border);background:var(--surface);border-radius:8px;padding:22px;display:block}
      .hf-hero-main{display:flex;flex-direction:column;gap:16px;min-width:0}
      .hf-back{border:1px solid var(--border);background:var(--surface2);color:var(--text2);border-radius:8px;padding:9px 12px;font-size:13px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;gap:6px;width:max-content}
      .hf-kicker{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:900;color:var(--accent)}
      .hf-hero h2{font-size:34px;line-height:1.26;margin:0;color:var(--text);letter-spacing:0}
      .hf-hero p{font-size:15px;line-height:1.7;margin:0;color:var(--text2);max-width:940px}
      .hf-detail-layout{display:grid;grid-template-columns:minmax(280px,320px) minmax(0,1fr);gap:14px;align-items:start}
      .hf-detail-left,.hf-detail-right{min-width:0}
      .hf-panel{border:1px solid var(--border);background:var(--surface);border-radius:8px;padding:18px}
      .hf-panel+.hf-panel{margin-top:12px}
      .hf-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
      .hf-panel h3{font-size:18px;margin:0;color:var(--text);letter-spacing:0}
      .hf-form-grid{display:grid;grid-template-columns:1fr;gap:10px}
      .hf-form-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
      .hf-field label,.hf-form-label{display:block;font-size:11px;font-weight:900;color:var(--text2);margin-bottom:6px}
      .hf-input{width:100%;border:1px solid var(--border);background:var(--surface2);color:var(--text);border-radius:8px;padding:10px 11px;font-size:12px;min-width:0}
      .hf-check-option{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--text2);line-height:1.45;margin-top:7px}
      .hf-issue-picker{border-top:1px solid var(--border);margin-top:12px;padding-top:12px}
      .hf-segment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:10px}
      .hf-issue-list{display:flex;flex-direction:column;gap:8px;margin-top:10px}
      .hf-issue-card{width:100%;text-align:left;border:1px solid var(--border);border-radius:8px;background:var(--surface2);padding:12px;color:var(--text);cursor:pointer}
      .hf-issue-card.selected{border-color:var(--accent);background:linear-gradient(135deg,var(--accent-soft),var(--surface2));box-shadow:0 0 0 1px rgba(99,102,241,.24)}
      .hf-issue-card strong{display:block;font-size:13px;line-height:1.45;margin:8px 0 5px}
      .hf-issue-card p{font-size:11px;line-height:1.55;color:var(--text3);margin:0 0 9px}
      .hf-badges{display:flex;gap:5px;flex-wrap:wrap}
      .hf-issue-meta,.hf-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;font-size:11px;color:var(--text2)}
      .hf-issue-meta b,.hf-summary-grid b{display:block;color:var(--text);font-weight:900;margin-bottom:2px}
      .hf-summary-item{border:1px solid var(--border2);background:var(--surface2);border-radius:8px;padding:10px}
      .hf-result-card{border:1px solid var(--border);background:var(--surface);border-radius:8px;overflow:hidden}
      .hf-result-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 18px;background:var(--accent-soft);border-bottom:1px solid var(--border)}
      .hf-result-eyebrow{font-size:10px;font-weight:900;color:var(--accent);letter-spacing:.08em;margin-bottom:4px}
      .hf-result-title{font-size:17px;font-weight:900;color:var(--text);line-height:1.35}
      .hf-result-body{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:16px}
      .hf-result-row{border:1px solid var(--border);background:var(--surface2);border-radius:8px;padding:13px;min-height:104px}
      .hf-result-row--full{grid-column:1/-1;min-height:auto}
      .hf-result-label{font-size:12px;font-weight:900;color:var(--accent);margin-bottom:7px}
      .hf-result-value{font-size:13px;line-height:1.62;color:var(--text2)}
      .hf-result-list{margin:0;padding-left:16px}
      .hf-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:0 16px 16px}
      .hf-wide-action{width:100%;justify-content:center;margin-top:12px}
      .hf-status{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border2);background:var(--surface2);border-radius:999px;padding:8px 10px;font-size:11px;font-weight:900;color:var(--text2);white-space:nowrap}
      .hf-status i{color:var(--accent)}
      .hf-center-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .hf-stat{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px;min-height:96px}
      .hf-stat small{display:block;font-size:11px;font-weight:900;color:var(--accent);margin-bottom:8px}
      .hf-stat strong{display:block;font-size:22px;color:var(--text);margin-bottom:6px;letter-spacing:0}
      .hf-stat span{display:block;font-size:12px;color:var(--text3);line-height:1.45}
      .hf-pipeline{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .hf-pipe{border:1px solid var(--border);background:var(--surface);border-radius:8px;padding:14px;min-height:112px}
      .hf-pipe b{display:inline-flex;width:24px;height:24px;border-radius:50%;align-items:center;justify-content:center;background:var(--accent);color:#fff;font-size:11px;margin-bottom:10px}
      .hf-pipe strong{display:block;font-size:14px;color:var(--text);margin-bottom:6px}
      .hf-pipe span{display:block;font-size:11px;color:var(--text3);line-height:1.45}
      .hf-lanes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .hf-lane{background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:13px;min-height:180px}
      .hf-lane-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:900;color:var(--text);margin-bottom:12px}
      .hf-lane-title i{font-size:18px;color:var(--accent)}
      .hf-lane-item{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:11px;margin-bottom:9px}
      .hf-lane-item strong{display:block;font-size:12px;color:var(--text);margin-bottom:5px}
      .hf-lane-item span{display:block;font-size:11px;color:var(--text3);line-height:1.45}
      .hf-checks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .hf-check{display:flex;gap:9px;align-items:flex-start;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:11px;font-size:12px;color:var(--text2);line-height:1.45}
      .hf-check i{color:var(--success);font-size:16px;margin-top:1px}
      @media(max-width:1320px){.hf-result-body{grid-template-columns:repeat(2,minmax(0,1fr))}.hf-center-strip,.hf-pipeline{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:960px){.hf-home,.hf-home-metrics,.hf-detail-layout,.hf-result-body,.hf-form-grid.two,.hf-center-strip,.hf-pipeline,.hf-lanes,.hf-checks{grid-template-columns:1fr}.hf-home{height:auto}.hf-home-card{min-height:420px}.hf-home-card h2{font-size:32px}.hf-hero h2{font-size:26px}}
      .hf-step-tabs{display:flex;align-items:center;gap:6px;padding:14px 18px;border:1px solid var(--border);background:var(--surface);border-radius:8px;margin-bottom:0}
      .hf-step-tab{display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--border);background:var(--surface2);border-radius:8px;color:var(--text2);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s}
      .hf-step-tab.active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
      .hf-step-tab:hover:not(.active){border-color:var(--text3);color:var(--text)}
      .hf-step-num{width:20px;height:20px;border-radius:50%;background:var(--border);color:var(--text3);font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0}
      .hf-step-tab.active .hf-step-num{background:var(--accent);color:#fff}
      .hf-step-arrow{color:var(--text3);font-size:14px;padding:0 2px}
      .hf-step-content{display:flex;flex-direction:column;gap:14px}
      .hf-cand-notice{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--accent-soft);border:1px solid rgba(99,102,241,.15);border-radius:8px;font-size:11px;color:var(--text2)}
      .hf-cand-section{border:1px solid var(--border);background:var(--surface);border-radius:8px;overflow:hidden}
      .hf-cand-section-head{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--surface2);border-bottom:1px solid var(--border);font-size:12px;font-weight:700;color:var(--text)}
      .hf-cand-count{margin-left:auto;font-size:10px;color:var(--accent);font-family:var(--mono);font-weight:700}
      .hf-cand-row{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12px;color:var(--text)}
      .hf-cand-row:last-child{border-bottom:none}
      .hf-cand-row:hover{background:var(--surface2)}
      .hf-cand-info{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
      .hf-cand-title{font-size:12px;color:var(--text);line-height:1.4}
      .hf-cand-meta{font-size:10px;color:var(--text3)}
      .hf-cand-actions{display:flex;gap:8px;justify-content:space-between;padding-top:4px}
      .hf-preview-badges{display:flex;gap:6px;align-items:center}
      .hf-dept-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
      .hf-dept-chip{font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;color:var(--text2)}
    `;
    document.head.appendChild(style);
  }

  function metric(label, value) {
    return `<div><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`;
  }

  function renderHomeCard(type) {
    const data = flow(type);
    return `
      <button type="button" class="hf-home-card" onclick="selectKnowledgeType('${type}')">
        <div>
          <div class="hf-home-top">
            <span class="badge ${data.tone}">${esc(data.target)}</span>
            <div class="hf-icon"><i class="ti ${data.icon}"></i></div>
          </div>
          <h2>${esc(data.section)}</h2>
          <p>${esc(data.subline)}</p>
          <div class="hf-result-box">
            <strong><i class="ti ti-sparkles"></i> AI가 만드는 결과물</strong>
            <span>${esc(data.homeResult)}</span>
          </div>
          <div class="hf-home-metrics">${data.homeMetrics.map((row) => metric(row[0], row[1])).join("")}</div>
        </div>
        <div class="hf-enter"><span>${esc(data.section)} 시작</span><i class="ti ti-arrow-right"></i></div>
      </button>`;
  }

  function renderHandoffHome() {
    ensureStyle();
    state.mode = "home";
    const root = screen();
    const content = document.getElementById("knowledgeContent");
    const context = document.getElementById("knowledgeContextPanel");
    const title = document.querySelector("#s-knowledge .topbar-title");
    if (root) root.dataset.handoffView = "home";
    if (title) title.textContent = "인수인계센터";
    if (context) context.innerHTML = "";
    if (content) content.innerHTML = `<section class="hf-home">${renderHomeCard("handoff")}${renderHomeCard("onboarding")}</section>`;
  }

  function field(label, html) {
    return `<div class="hf-field"><label>${esc(label)}</label>${html}</div>`;
  }

  function issueCard(issue) {
    return `
      <button type="button" class="hf-issue-card ${issue.id === state.selectedIssueId ? "selected" : ""}" onclick="selectHandoffIssue('${issue.id}')">
        <div class="hf-badges">
          <span class="badge ${badgeClass(issue.status)}">${esc(issue.status)}</span>
          <span class="badge ${badgeClass(issue.severity)}">${esc(issue.severity)}</span>
          <span class="badge b-accent">${esc(issue.category)}</span>
          ${issue.id === state.selectedIssueId ? '<span class="badge b-success">선택됨</span>' : ""}
        </div>
        <strong>${esc(issue.title)}</strong>
        <p>${esc(issue.summary)}</p>
        <div class="hf-issue-meta">
          <span><b>관련 부서</b>${esc(issue.relatedTeams.join(", "))}</span>
          <span><b>고객사</b>${esc(issue.customer)}</span>
          <span><b>구매처</b>${esc(issue.supplier)}</span>
          <span><b>품목</b>${esc(issue.product)}</span>
          <span><b>관련 Todo</b>${issue.todoCount ? `${issue.todoCount}건` : "잔여 Todo 없음"}</span>
          <span><b>관련 문서</b>${issue.documentCount}건</span>
          <span><b>마감/상태</b>${esc(issue.dueLabel)}</span>
        </div>
      </button>`;
  }

  function issueTabs() {
    return `
      <div class="hf-segment">
        <button type="button" class="tbtn ${state.issueGroup === "active" ? "primary" : ""}" onclick="setHandoffIssueGroup('active')">진행 중 이슈</button>
        <button type="button" class="tbtn ${state.issueGroup === "closed" ? "primary" : ""}" onclick="setHandoffIssueGroup('closed')">종료된 이슈</button>
      </div>`;
  }

  function issueList() {
    const keyword = state.issueSearch.trim().toLowerCase();
    const filtered = handoffIssues
      .filter((issue) => issue.group === state.issueGroup)
      .filter((issue) => issueMatches(issue, keyword));
    return filtered.length ? filtered.map(issueCard).join("") : '<div class="hf-summary-item">검색 조건에 맞는 이슈가 없습니다.</div>';
  }

  function issuePicker() {
    return `
      <div id="handoffIssuePicker" class="hf-issue-picker" style="display:${isIssueScope() ? "block" : "none"}">
        <div class="hf-form-label">특정 이슈 선택</div>
        ${issueTabs()}
        <input class="hf-input" id="handoffIssueSearch" type="search" placeholder="이슈명, 고객사, 구매처, 품목 검색" value="${esc(state.issueSearch)}" oninput="filterHandoffIssues(this.value)">
        <div id="handoffIssueCards" class="hf-issue-list">${issueList()}</div>
      </div>`;
  }

  function summaryCard() {
    if (state.mode === "onboarding") {
      return `
        <div class="hf-summary-grid">
          <div class="hf-summary-item"><b>대상자</b>${esc(state.onboardingTarget)}</div>
          <div class="hf-summary-item"><b>배정 팀</b>${esc(state.onboardingTeam)}</div>
          <div class="hf-summary-item"><b>참고 기간</b>${esc(state.period)}</div>
          <div class="hf-summary-item"><b>추천 질문</b>4건</div>
        </div>`;
    }
    if (isIssueScope()) {
      const issue = selectedIssue();
      return `
        <div class="hf-summary-grid">
          <div class="hf-summary-item"><b>선택 이슈</b>${esc(issue.title)}</div>
          <div class="hf-summary-item"><b>상태</b>${esc(issue.status)}</div>
          <div class="hf-summary-item"><b>리스크</b>${esc(issue.severity)}</div>
          <div class="hf-summary-item"><b>관련 부서</b>${esc(issue.relatedTeams.join(", "))}</div>
          <div class="hf-summary-item"><b>고객사</b>${esc(issue.customer)}</div>
          <div class="hf-summary-item"><b>구매처</b>${esc(issue.supplier)}</div>
          <div class="hf-summary-item"><b>품목</b>${esc(issue.product)}</div>
          <div class="hf-summary-item"><b>마감/상태</b>${esc(issue.dueLabel)}</div>
        </div>`;
    }
    return `
      <div class="hf-summary-grid">
        <div class="hf-summary-item"><b>기존 담당자</b>${esc(state.owner)}</div>
        <div class="hf-summary-item"><b>신규 담당자</b>${esc(state.nextOwner)}</div>
        <div class="hf-summary-item"><b>소속 팀</b>${esc(state.handoffDepartment)}</div>
        <div class="hf-summary-item"><b>인수인계 사유</b>${esc(state.reason)}</div>
        <div class="hf-summary-item"><b>업무 범위</b>${esc(state.scope)}</div>
        <div class="hf-summary-item"><b>고객사</b>${esc(state.customer)}</div>
        <div class="hf-summary-item"><b>구매처</b>${esc(state.supplier)}</div>
        <div class="hf-summary-item"><b>자료 필터 부서</b>${esc(state.filterDepartment)}</div>
        <div class="hf-summary-item"><b>참고 기간</b>${esc(state.period)}</div>
      </div>`;
  }

  // "팀장 확인 항목"처럼 선택적 섹션은 전체 너비로 렌더
  const FULL_WIDTH_SECTIONS = new Set(["팀장 확인 항목", "사수/팀장 확인 항목", "인수인계 개요"]);

  function resultCard(title, rows) {
    const normalized = normalizeRows(rows);
    return `
      <div class="hf-result-card" id="handoffResultCard">
        <div class="hf-result-head">
          <div>
            <div class="hf-result-eyebrow">AI GENERATED PREVIEW</div>
            <div class="hf-result-title">${esc(title)}</div>
          </div>
          <span class="hf-status"><i class="ti ti-sparkles"></i>생성 대기</span>
        </div>
        <div class="hf-result-body">
          ${normalized.map((row) => `
            <div class="hf-result-row${FULL_WIDTH_SECTIONS.has(row[0]) ? " hf-result-row--full" : ""}">
              <div class="hf-result-label">${esc(row[0])}</div>
              <div class="hf-result-value">${list(row[1])}</div>
            </div>`).join("")}
        </div>
        <div class="hf-actions">
          <button class="tbtn" type="button" onclick="saveHandoffDraft()"><i class="ti ti-device-floppy"></i> 초안 저장</button>
          <button class="tbtn" type="button" onclick="editHandoffDraft()"><i class="ti ti-edit"></i> 수정하기</button>
          <button class="tbtn primary" type="button" onclick="openHandoffPreview(G.currentKnowledgeType || 'handoff')"><i class="ti ti-eye"></i> 슬라이드 미리보기</button>
        </div>
      </div>`;
  }

  function renderHandoffContext() {
    return `
      <section class="hf-panel">
        <div class="hf-panel-head"><h3>조건 패널</h3><span class="hf-status"><i class="ti ti-adjustments"></i>업무 인수인계</span></div>
        <div class="hf-form-grid">
          ${field("기존 담당자", `<select class="hf-input" onchange="setHandoffValue('owner', this.value)">${options(PEOPLE.owners, state.owner)}</select>`)}
          ${field("신규 담당자", `<select class="hf-input" onchange="setHandoffValue('nextOwner', this.value)">${options(PEOPLE.nextOwners, state.nextOwner)}</select>`)}
          ${field("소속 팀", `<select class="hf-input" onchange="setHandoffValue('handoffDepartment', this.value)">${options(assignmentTeamOptions, state.handoffDepartment)}</select>`)}
          ${field("인수인계 사유", `<select class="hf-input" onchange="setHandoffValue('reason', this.value)">${options(reasonOptions, state.reason)}</select>`)}
          ${field("업무 범위", `<select class="hf-input" id="handoffScopeSelect" onchange="updateHandoffScopeUI(this.value)">${options(scopeOptions, state.scope)}</select>`)}
          ${issuePicker()}
        </div>
      </section>
      <section class="hf-panel">
        <div class="hf-panel-head"><h3>공통 필터</h3></div>
        <div class="hf-form-grid two">
          ${field("고객사", `<select class="hf-input" onchange="setHandoffValue('customer', this.value)">${options(customerFilterOptions, state.customer)}</select>`)}
          ${field("구매처", `<select class="hf-input" onchange="setHandoffValue('supplier', this.value)">${options(supplierFilterOptions, state.supplier)}</select>`)}
          ${field("자료 필터 부서", `<select class="hf-input" onchange="setHandoffValue('filterDepartment', this.value)">${options(departmentFilterOptions, state.filterDepartment)}</select>`)}
          ${field("참고 기간", `<select class="hf-input" onchange="setHandoffValue('period', this.value)">${options(periodOptions, state.period)}</select>`)}
        </div>
      </section>
      <section class="hf-panel">
        <div class="hf-panel-head"><h3>포함 자료</h3></div>
        ${checks(includeOptions)}
        <button class="tbtn primary hf-wide-action" type="button" onclick="showHandoffDemoResult()"><i class="ti ti-wand"></i> 인수인계서 생성</button>
      </section>`;
  }

  function renderHandoffContent() {
    return `
      <section class="hf-panel">
        <div class="hf-panel-head"><h3>선택 자료 요약</h3><span class="hf-status"><i class="ti ti-list-check"></i>현재 선택값</span></div>
        <div id="handoffSummaryCard">${summaryCard()}</div>
      </section>
      <section id="handoffResultArea">${resultCard(currentTitle(), currentRows())}</section>`;
  }

  function renderOnboardingContext() {
    return `
      <section class="hf-panel">
        <div class="hf-panel-head"><h3>조건 패널</h3><span class="hf-status"><i class="ti ti-user-plus"></i>신입 온보딩</span></div>
        <div class="hf-form-grid">
          ${field("대상자", `<select class="hf-input" onchange="setHandoffValue('onboardingTarget', this.value)">${options(PEOPLE.onboardingTargets, state.onboardingTarget)}</select>`)}
          ${field("배정 팀", `<select class="hf-input" onchange="setHandoffValue('onboardingTeam', this.value)">${options(assignmentTeamOptions, state.onboardingTeam)}</select>`)}
          ${field("참고 기간", `<select class="hf-input" onchange="setHandoffValue('period', this.value)">${options(periodOptions, state.period)}</select>`)}
        </div>
      </section>
      <section class="hf-panel">
        <div class="hf-panel-head"><h3>포함 자료</h3></div>
        ${checks(onboardingIncludes)}
        <button class="tbtn primary hf-wide-action" type="button" onclick="showOnboardingDemoResult()"><i class="ti ti-wand"></i> 온보딩 가이드 생성</button>
      </section>`;
  }

  function renderOnboardingContent() {
    return `
      <section class="hf-panel">
        <div class="hf-panel-head"><h3>온보딩 선택 요약</h3><span class="hf-status"><i class="ti ti-list-check"></i>현재 선택값</span></div>
        <div id="handoffSummaryCard">${summaryCard()}</div>
      </section>
      <section id="handoffResultArea">${resultCard(currentTitle(), currentRows())}</section>`;
  }

  function renderCenterStats(data) {
    return data.centerStats.map((row) => `
      <div class="hf-stat">
        <small>${esc(row[0])}</small>
        <strong>${esc(row[1])}</strong>
        <span>${esc(row[2])}</span>
      </div>`).join("");
  }

  function renderPipeline(data) {
    return data.pipeline.map((row, index) => `
      <div class="hf-pipe">
        <b>${index + 1}</b>
        <strong>${esc(row[0])}</strong>
        <span>${esc(row[1])}</span>
      </div>`).join("");
  }

  function renderQueue(data) {
    return data.queue.map((row) => `<div class="hf-summary-item"><b>${esc(row[0])}</b>${esc(row[1])}</div>`).join("");
  }

  function renderLanes() {
    const issue = selectedIssue();
    const lanes = state.mode === "onboarding"
      ? [
        { icon: "ti-clock-hour-3", title: "첫날", items: [["업무 3분 요약", "팀 역할과 고객 맥락 이해"], ["자료 위치", "메일, 문서, Todo, 이슈 링크"], ["사수 연결", "질문 채널과 첫 동행 일정"]] },
        { icon: "ti-calendar-week", title: "첫주", items: [["업무 실습", "긴급 발주 대응 1건 같이 처리"], ["리스크 읽기", "납기 지연 판단 기준 확인"], ["고객 톤", "단가 협상 안내 문구 검토"]] },
        { icon: "ti-calendar-month", title: "첫달", items: [["독립 처리", "미완료 Todo 날짜별 업데이트"], ["관리 리뷰", "위험 업무 판단 정확도 확인"], ["다음 범위", "추가 고객사 업무 인수 결정"]] },
      ]
      : [
        { icon: "ti-briefcase", title: "업무 카드", items: [["업무 범위", state.scope], ["담당자", `${state.owner} → ${state.nextOwner}`], ["사유", state.reason]] },
        { icon: "ti-alert-triangle", title: "이슈 맥락", items: [[issue.title, issue.summary], ["관련 부서", issue.relatedTeams.join(", ")], ["마감/상태", issue.dueLabel]] },
        { icon: "ti-user-check", title: "사람 확인", items: [["팀장 확인", "AI 확신 낮은 업무 최종 검토"], ["후임자 배정", "고객별 담당자와 사수 연결"], ["보완 요청", "위험 고객사와 마감 업무 승인"]] },
      ];
    return lanes.map((column) => `
      <div class="hf-lane">
        <div class="hf-lane-title"><i class="ti ${column.icon}"></i>${esc(column.title)}</div>
        ${column.items.map((row) => `<div class="hf-lane-item"><strong>${esc(row[0])}</strong><span>${esc(row[1])}</span></div>`).join("")}
      </div>`).join("");
  }

  function renderChecks(data) {
    return data.checklist.map((text) => `<div class="hf-check"><i class="ti ti-circle-check"></i><span>${esc(text)}</span></div>`).join("");
  }

  function renderStepTabs(type) {
    const steps = ["conditions", "candidates", "preview"];
    const labels = ["조건 선택", "AI 추출 후보", normalizeMode(type) === "onboarding" ? "온보딩 가이드 미리보기" : "문서 미리보기"];
    const active = state.activeDetailStep;
    return `
      <div class="hf-step-tabs">
        <button class="hf-step-tab${active === "conditions" ? " active" : ""}" onclick="setDetailStep('conditions','${type}')">
          <span class="hf-step-num">1</span><span>조건 선택</span>
        </button>
        <div class="hf-step-arrow"><i class="ti ti-chevron-right"></i></div>
        <button class="hf-step-tab${active === "candidates" ? " active" : ""}" onclick="setDetailStep('candidates','${type}')">
          <span class="hf-step-num">2</span><span>AI 추출 후보</span>
        </button>
        <div class="hf-step-arrow"><i class="ti ti-chevron-right"></i></div>
        <button class="hf-step-tab${active === "preview" ? " active" : ""}" onclick="setDetailStep('preview','${type}')">
          <span class="hf-step-num">3</span><span>${labels[2]}</span>
        </button>
      </div>`;
  }

  function candidateRow(item, toggleFn) {
    const riskClass = item.riskLevel === "High" ? "b-danger" : (item.riskLevel === "Medium" ? "b-warn" : "b-success");
    return `
      <div class="hf-cand-row">
        <input type="checkbox" ${item.checked ? "checked" : ""} onchange="${toggleFn}('${item.type || ""}','${item.id}',this.checked)">
        <div class="hf-cand-info">
          <div class="hf-cand-title">${esc(item.title)}</div>
          <div class="hf-cand-meta">${item.customer ? esc(item.customer) + " · " : ""}${item.owner ? esc(item.owner) : ""}</div>
        </div>
        <span class="badge ${riskClass}" style="font-size:10px">${esc(item.riskLevel || "")}</span>
      </div>`;
  }

  function candidateSection(title, icon, items, toggleFn) {
    const checkedCount = items.filter(i => i.checked).length;
    return `
      <div class="hf-cand-section">
        <div class="hf-cand-section-head">
          <i class="ti ${icon}"></i>${esc(title)}
          <span class="hf-cand-count">${checkedCount}/${items.length}</span>
        </div>
        ${items.map(item => candidateRow(item, toggleFn)).join("")}
      </div>`;
  }

  function renderConditionsStep(type) {
    if (type === "onboarding") {
      return `
        <div class="hf-step-content">
          <div class="hf-detail-layout">
            <aside class="hf-detail-left">${renderOnboardingContext()}</aside>
            <main class="hf-detail-right">${renderOnboardingContent()}</main>
          </div>
        </div>`;
    }
    return `
      <div class="hf-step-content">
        <div class="hf-detail-layout">
          <aside class="hf-detail-left">${renderHandoffContext()}</aside>
          <main class="hf-detail-right">${renderHandoffContent()}</main>
        </div>
      </div>`;
  }

  function renderCandidatesStep(type) {
    if (type === "onboarding") {
      return `
        <div class="hf-step-content">
          <div class="hf-cand-notice"><i class="ti ti-sparkles"></i>AI가 인수인계 자료를 분석하여 온보딩에 필요한 후보 항목을 추출했습니다. 체크를 해제하면 문서에서 제외됩니다.</div>
          ${candidateSection("주요 고객사", "ti-building-store", onboardingCandidates.customers, "toggleOnboardingCandidate")}
          ${candidateSection("주요 구매처", "ti-truck-delivery", onboardingCandidates.suppliers, "toggleOnboardingCandidate")}
          ${candidateSection("반복 이슈", "ti-alert-triangle", onboardingCandidates.issues, "toggleOnboardingCandidate")}
          ${candidateSection("우선 Todo", "ti-circle-check", onboardingCandidates.todos, "toggleOnboardingCandidate")}
          ${candidateSection("참고 보고서", "ti-file-text", onboardingCandidates.reports, "toggleOnboardingCandidate")}
          ${candidateSection("추천 질문", "ti-help-circle", onboardingCandidates.questions, "toggleOnboardingCandidate")}
          <div class="hf-cand-actions">
            <button class="tbtn" type="button" onclick="setDetailStep('conditions','${type}')"><i class="ti ti-arrow-left"></i> 조건으로 돌아가기</button>
            <button class="tbtn primary" type="button" onclick="setDetailStep('preview','${type}')"><i class="ti ti-arrow-right"></i> 문서 미리보기</button>
          </div>
        </div>`;
    }
    return `
      <div class="hf-step-content">
        <div class="hf-cand-notice"><i class="ti ti-sparkles"></i>AI가 업무 자료를 분석하여 인수인계에 포함할 후보 항목을 추출했습니다. 체크를 해제하면 문서에서 제외됩니다.</div>
        ${candidateSection("진행 중 Todo", "ti-circle-check", candidateItems.todos, "toggleCandidate")}
        ${candidateSection("미해결 이슈", "ti-alert-triangle", candidateItems.issues, "toggleCandidate")}
        ${candidateSection("참고 보고서", "ti-file-text", candidateItems.reports, "toggleCandidate")}
        ${candidateSection("관련 문서", "ti-file", candidateItems.documents, "toggleCandidate")}
        ${candidateSection("고객별 주의사항", "ti-info-circle", candidateItems.cautions, "toggleCandidate")}
        <div class="hf-cand-actions">
          <button class="tbtn" type="button" onclick="setDetailStep('conditions','${type}')"><i class="ti ti-arrow-left"></i> 조건으로 돌아가기</button>
          <button class="tbtn primary" type="button" onclick="setDetailStep('preview','${type}')"><i class="ti ti-arrow-right"></i> 문서 미리보기</button>
        </div>
      </div>`;
  }

  function renderPreviewStep(type) {
    return `
      <div class="hf-step-content">
        ${resultCard(currentTitle(), currentRows())}
        <div class="hf-cand-actions">
          <button class="tbtn" type="button" onclick="setDetailStep('candidates','${type}')"><i class="ti ti-arrow-left"></i> 후보로 돌아가기</button>
        </div>
      </div>`;
  }

  function renderCurrentStep(type) {
    const step = state.activeDetailStep;
    if (step === "candidates") return renderCandidatesStep(type);
    if (step === "preview") return renderPreviewStep(type);
    return renderConditionsStep(type);
  }

  function renderHandoffDetail(type) {
    ensureStyle();
    const selected = normalizeMode(type);
    state.mode = selected;
    state.activeDetailStep = "conditions";
    if (window.G) window.G.currentKnowledgeType = selected;
    const data = flow(selected);
    const root = screen();
    const content = document.getElementById("knowledgeContent");
    const context = document.getElementById("knowledgeContextPanel");
    const title = document.querySelector("#s-knowledge .topbar-title");
    if (root) root.dataset.handoffView = selected;
    if (context) context.innerHTML = "";
    if (title) title.textContent = data.section;
    if (!content) return;

    content.innerHTML = `
      <section class="hf-detail" id="handoffDetailRoot" data-flow="${selected}">
        <div class="hf-hero">
          <div class="hf-hero-main">
            <button type="button" class="hf-back" onclick="selectKnowledgeType('home')"><i class="ti ti-arrow-left"></i> 처음으로</button>
            <div class="hf-kicker"><i class="ti ${data.icon}"></i>${esc(data.section)} · 조건 기반 생성</div>
            <h2>${esc(data.headline)}</h2>
            <p>${esc(data.subline)}</p>
          </div>
        </div>
        ${renderStepTabs(selected)}
        <div id="handoffStepContent">${renderCurrentStep(selected)}</div>
      </section>`;
  }

  function refreshIssueUI() {
    const picker = document.getElementById("handoffIssuePicker");
    if (picker) picker.outerHTML = issuePicker();
    const summary = document.getElementById("handoffSummaryCard");
    const area = document.getElementById("handoffResultArea");
    if (summary) summary.innerHTML = summaryCard();
    if (area) area.innerHTML = resultCard(currentTitle(), currentRows());
  }

  function refreshDetailUI() {
    const summary = document.getElementById("handoffSummaryCard");
    const area = document.getElementById("handoffResultArea");
    if (summary) summary.innerHTML = summaryCard();
    if (area) area.innerHTML = resultCard(currentTitle(), currentRows());
  }

  window.setHandoffValue = function (key, value) {
    if (Object.prototype.hasOwnProperty.call(state, key)) state[key] = value;
    if (key === "scope") {
      window.updateHandoffScopeUI(value);
      return;
    }
    refreshDetailUI();
  };

  window.updateHandoffScopeUI = function (value) {
    state.scope = scopeOptions.includes(value) ? value : scopeOptions[0];
    if (!isIssueScope()) {
      state.issueGroup = "active";
      state.issueSearch = "";
      state.selectedIssueId = handoffIssues.find((issue) => issue.group === "active")?.id || state.selectedIssueId;
    }
    const picker = document.getElementById("handoffIssuePicker");
    if (picker) picker.outerHTML = issuePicker();
    refreshDetailUI();
  };

  window.setHandoffIssueGroup = function (group) {
    state.issueGroup = group === "closed" ? "closed" : "active";
    state.issueSearch = "";
    state.selectedIssueId = handoffIssues.find((issue) => issue.group === state.issueGroup)?.id || state.selectedIssueId;
    refreshIssueUI();
  };

  window.filterHandoffIssues = function (value) {
    state.issueSearch = value || "";
    const cards = document.getElementById("handoffIssueCards");
    if (cards) cards.innerHTML = issueList();
  };

  window.selectHandoffIssue = function (id) {
    const issue = handoffIssues.find((item) => item.id === id);
    if (!issue) return;
    state.selectedIssueId = issue.id;
    state.issueGroup = issue.group;
    refreshIssueUI();
  };

  window.showHandoffDemoResult = function () {
    refreshDetailUI();
    if (typeof window.showToast === "function") window.showToast("인수인계서 초안을 생성했습니다.", "success");
  };

  window.showOnboardingDemoResult = function () {
    refreshDetailUI();
    if (typeof window.showToast === "function") window.showToast("온보딩 가이드를 생성했습니다.", "success");
  };

  function getHandoffPreviewData(type) {
    const requested = type === "onboarding" ? "onboarding" : (type === "home" ? state.mode : "handoff");
    const mode = normalizeMode(requested);
    const issueMode = mode === "handoff" && isIssueScope();
    const issue = issueMode ? selectedIssue() : null;
    const rows = normalizeRows(mode === state.mode ? currentRows() : (mode === "onboarding" ? onboardingRows() : handoffRows()));
    const title = mode === state.mode ? currentTitle() : (mode === "onboarding" ? onboardingResult.title : (issue ? issue.result.title : fullScopeResult.title));
    const rowText = (label) => {
      const row = rows.find((item) => item[0] === label);
      if (!row) return "";
      return Array.isArray(row[1]) ? row[1].join("\n") : row[1];
    };
    const selectedLabel = mode === "onboarding"
      ? `${state.onboardingTarget} 신입 온보딩 대상 업무`
      : (issue ? `${issue.status} · ${issue.title}` : "이전 담당 업무 전체");
    const referenceText = rowText("참고 보고서 / 문서") || rowText("참고 자료");
    const managerCheckText = rowText("팀장 확인 항목") || rowText("사수/팀장 확인 항목");
    const selectedReports = mode === "onboarding" ? checkedOnboardingTitles("reports") : checkedTitles("reports");
    const selectedTodos = mode === "onboarding" ? checkedOnboardingTitles("todos") : checkedTitles("todos");
    return {
      title,
      target: mode === "onboarding" ? `${state.onboardingTarget} · ${state.onboardingTeam}` : (issue ? `${issue.status} · ${issue.title}` : `${state.owner} → ${state.nextOwner}`),
      sections: [
        ["현재 선택된 담당자", mode === "onboarding" ? state.onboardingTarget : state.owner],
        ["현재 선택된 신규 담당자", mode === "onboarding" ? `${state.onboardingTarget} · ${state.onboardingTeam}` : state.nextOwner],
        ["소속 팀", mode === "onboarding" ? state.onboardingTeam : state.handoffDepartment],
        ["인수인계 사유", mode === "onboarding" ? "신입 온보딩" : state.reason],
        ["업무 범위", mode === "onboarding" ? "온보딩 가이드" : state.scope],
        ["선택 이슈 또는 선택 자료", selectedLabel],
        ...rows.map((row) => [row[0], Array.isArray(row[1]) ? row[1].join("\n") : row[1]]),
        ["선택된 보고서", selectedReports.join("\n")],
        ["선택된 Todo", selectedTodos.join("\n")],
        ["참고 보고서 / 문서", referenceText],
        ["팀장 확인 항목", managerCheckText],
        ["생성 시각", new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })],
      ],
    };
  }

  window.setDetailStep = function(step, type) {
    state.activeDetailStep = step;
    const tabs = document.querySelectorAll(".hf-step-tab");
    const steps = ["conditions", "candidates", "preview"];
    tabs.forEach((tab, i) => tab.classList.toggle("active", steps[i] === step));
    const area = document.getElementById("handoffStepContent");
    if (area) area.innerHTML = renderCurrentStep(type || normalizeMode(state.mode));
  };

  window.toggleCandidate = function(type, id, checked) {
    const sections = { todo:"todos", issue:"issues", report:"reports", document:"documents", caution:"cautions" };
    const arr = candidateItems[sections[type]];
    if (!arr) return;
    const item = arr.find(i => i.id === id);
    if (item) item.checked = checked;
  };

  window.toggleOnboardingCandidate = function(type, id, checked) {
    const sections = { customer:"customers", supplier:"suppliers", issue:"issues", todo:"todos", report:"reports", question:"questions" };
    const arr = onboardingCandidates[sections[type]];
    if (!arr) return;
    const item = arr.find(i => i.id === id);
    if (item) item.checked = checked;
  };

  function patchKnowledgeNav() {
    const navItem = document.getElementById("nav-knowledge");
    if (navItem && navItem.dataset.handoffCenterWired !== "true") {
      navItem.dataset.handoffCenterWired = "true";
      navItem.onclick = function (event) {
        if (event) event.preventDefault();
        if (typeof window.nav === "function") window.nav("knowledge");
        setTimeout(renderHandoffHome, 0);
        setTimeout(renderHandoffHome, 30);
        requestAnimationFrame(renderHandoffHome);
        return false;
      };
    }

    if (!window.__handoffCenterNavPatched && typeof window.nav === "function") {
      const originalNav = window.nav;
      window.__handoffCenterNavPatched = true;
      window.nav = function patchedNav(destination) {
        originalNav(destination);
        if (destination === "knowledge") {
          setTimeout(renderHandoffHome, 0);
          setTimeout(renderHandoffHome, 30);
          requestAnimationFrame(renderHandoffHome);
        }
      };
    }
  }

  function selectKnowledgeType(type) {
    if (type === "home" || !type) {
      if (window.G) window.G.currentKnowledgeType = "home";
      renderHandoffHome();
      return;
    }
    const selected = type === "onboarding" ? "onboarding" : "handoff";
    if (selected === "handoff") {
      state.scope = scopeOptions[0];
      state.issueGroup = "active";
      state.issueSearch = "";
      state.selectedIssueId = handoffIssues.find((issue) => issue.group === "active")?.id || state.selectedIssueId;
    }
    renderHandoffDetail(selected);
  }

  const originalGeneratePreview = window.generateHandoffPreview;
  window.generateHandoffPreview = function (type) {
    if (["handoff", "onboarding", "absence", "offboard", undefined, null].includes(type)) {
      const data = window.getHandoffPreviewData(type || state.mode);
      if (typeof window.renderHandoffPreview === "function") window.renderHandoffPreview(data);
      if (typeof window.showToast === "function") window.showToast(`${data.title} 미리보기를 생성했습니다.`, "success");
      return data;
    }
    return typeof originalGeneratePreview === "function" ? originalGeneratePreview(type) : null;
  };

  window.openHandoffPreview = function (type) {
    return window.generateHandoffPreview(type || state.mode);
  };

  window.saveHandoffDraft = function () {
    window.G = window.G || {};
    G.currentHandoffDraft = window.getHandoffPreviewData(state.mode);
    G.savedHandoffDraft = { ...G.currentHandoffDraft, savedAt: new Date().toISOString() };
    if (typeof window.showToast === "function") window.showToast("초안을 임시 저장했습니다.", "success");
  };

  window.editHandoffDraft = function () {
    if (typeof window.showToast === "function") window.showToast("수정 모드는 실제 문서 편집 API 연결 후 제공됩니다.", "info");
  };

  window.shareHandoffDraft = function () {
    if (typeof window.showToast === "function") window.showToast("공유 기능은 실제 권한/API 연결 후 제공됩니다.", "info");
  };

  function initHandoffCenter() {
    ensureStyle();
    patchKnowledgeNav();
    window.selectKnowledgeType = selectKnowledgeType;
    window.selectHandoffType = selectKnowledgeType;
    window.renderKnowledgeFlow = selectKnowledgeType;
    window.renderHandoffHome = renderHandoffHome;
    window.renderHandoffDetail = renderHandoffDetail;
    window.getHandoffPreviewData = getHandoffPreviewData;

    const active = screen()?.classList.contains("active");
    if (active || window.G?.currentScreen === "knowledge") renderHandoffHome();
  }

  initHandoffCenter();
  setTimeout(initHandoffCenter, 0);
  setTimeout(initHandoffCenter, 250);
  setTimeout(initHandoffCenter, 750);
  setTimeout(initHandoffCenter, 1500);
  window.addEventListener("DOMContentLoaded", initHandoffCenter, { once: true });
  window.addEventListener("load", initHandoffCenter, { once: true });
  window.initHandoffCenter = initHandoffCenter;
})();
