export const ARCHIVE_KEY = "opsradar_handoff_archives";

export const PEOPLE = ["박서준", "김희진", "정하늘", "최유진", "한지우"];
export const DEPARTMENTS = ["영업관리팀", "구매팀", "품질클레임팀", "물류팀", "운영총괄"];
export const CUSTOMERS = ["전체", "Hyundai Mobis Tier2", "Daesung Automotive", "Mirae EV Systems", "Global Harness Vietnam"];
export const SUPPLIERS = ["전체", "KET Supplier", "TE Connectivity Korea", "Yazaki Parts Asia", "Local Cable Works"];
export const PERIODS = ["최근 1개월", "최근 3개월", "최근 6개월", "최근 1년"];
export const HANDOFF_REASONS = ["담당자 변경", "휴가/부재", "부서 이동", "퇴사"];
export const HANDOFF_SCOPES = ["이전 담당 업무 전체", "특정 고객사", "특정 이슈"];
export const HANDOFF_INCLUDES = ["진행 중 Todo", "미해결 이슈", "최근 보고서", "관련 문서", "일정/마감", "고객별 주의사항"];
export const ONBOARDING_INCLUDES = ["주요 고객사", "주요 품목", "반복 이슈", "미해결 Todo", "최근 보고서", "추천 질문"];

export const DEFAULT_HANDOFF_CONDITIONS = { owner: "박서준", receiver: "김희진", department: "영업관리팀", reason: "담당자 변경", scope: "이전 담당 업무 전체", customer: "전체", supplier: "전체", filterDepartment: "전체", period: "최근 6개월", includes: [...HANDOFF_INCLUDES] };
export const DEFAULT_ONBOARDING_CONDITIONS = { target: "정하늘", department: "영업관리팀", period: "최근 6개월", includes: [...ONBOARDING_INCLUDES] };

const item = (id, group, title, meta, priority = "Medium") => ({ id, group, title, meta, priority });
export const HANDOFF_CANDIDATES = [
  item("h1", "진행 중 Todo", "Daesung Automotive 긴급 발주 가능 수량 확인", "Daesung Automotive · 박서준", "High"),
  item("h2", "진행 중 Todo", "Hyundai Mobis Tier2 6월 출고 일정 재확인", "Hyundai Mobis Tier2 · 박서준"),
  item("h3", "진행 중 Todo", "TE Connectivity Korea 단가 인상 안내 초안 작성", "Hyundai Mobis Tier2 · 최유진", "High"),
  item("h4", "미해결 이슈", "KET Supplier AP-TM-118 재고 부족 가능성", "Daesung Automotive · 최유진", "High"),
  item("h5", "미해결 이슈", "Mirae EV Systems 반복 품질 클레임", "Mirae EV Systems · 한지우", "High"),
  item("h6", "참고 보고서", "Daesung Automotive 긴급 발주 주간 보고", "주간 보고서"),
  item("h7", "참고 보고서", "KET Supplier 재고 부족 리스크 보고", "월간 보고서", "High"),
  item("h8", "관련 문서", "Hyundai Mobis Tier2 고객별 주문 패턴", "고객 운영 문서"),
  item("h9", "고객별 주의사항", "납기 변경은 최소 5영업일 전 공유 필요", "Hyundai Mobis Tier2", "High")
];
export const ONBOARDING_CANDIDATES = [
  item("o1", "먼저 파악할 고객사", "Hyundai Mobis Tier2", "납기 민감도 높음 · 월별 대량 주문", "High"),
  item("o2", "먼저 파악할 고객사", "Daesung Automotive", "긴급 발주 빈번 · 월말 집중"),
  item("o3", "먼저 파악할 구매처", "KET Supplier", "AP-TM-118 재고 부족 반복", "High"),
  item("o4", "먼저 파악할 구매처", "TE Connectivity Korea", "고단가 품목과 단가 인상 이슈"),
  item("o5", "최근 반복 이슈", "Mirae EV Systems 반복 품질 클레임", "8D 리포트 진행 상태 확인", "High"),
  item("o6", "우선 확인할 Todo", "고객별 납기 리스트 브리핑", "첫날 · 사수 동행", "High"),
  item("o7", "추천 질문", "긴급 발주 요청이 들어오면 누구에게 먼저 확인해야 하나요?", "업무 흐름"),
  item("o8", "추천 질문", "High Risk 업무를 혼자 처리하지 말아야 하는 기준은 무엇인가요?", "리스크 기준", "High")
];

const titles = (candidates, ids, group) => candidates.filter((v) => ids.includes(v.id) && (!group || v.group === group)).map((v) => v.title);
const lines = (values) => values.length ? values : ["선택된 항목이 없습니다."];

// ── 온보딩 가이드 전용 보강 데이터 ──────────────────────────────

const CUSTOMER_NOTES = {
  "Hyundai Mobis Tier2": ["∙ 납기 확정 회신 속도가 중요함", "∙ 긴급 발주 비중이 높음", "∙ 회신 지연 시 고객 생산 일정에 영향 가능"],
  "Daesung Automotive": ["∙ 견적 요청 빈도가 높음", "∙ 대체품 제안이 필요한 경우가 많음", "∙ 견적 회신 예정일을 명확히 안내해야 함"],
  "Mirae EV Systems": ["∙ 반복 품질 클레임 발생 이력 있음", "∙ 8D 리포트 이력 확인 필요", "∙ 품질팀과 협력하여 대응"],
  "Global Harness Vietnam": ["∙ 해외 거래처 특성상 시차 고려", "∙ 수입 리드타임 사전 확인 필요"],
};

const SUPPLIER_NOTES = {
  "KET Supplier": ["∙ 재고 부족 가능성이 반복됨", "∙ 긴급 건은 회신 예정 시간을 함께 확인", "∙ 회신 지연 시 구매 담당자와 팀장에게 공유"],
  "TE Connectivity Korea": ["∙ 공식 리드타임과 실제 공급 가능일을 함께 확인", "∙ 대체품 검토 시 품질팀 확인 필요"],
  "Yazaki Parts Asia": ["∙ 납기가 긴 편으로 사전 주문 중요", "∙ 대체품 검토 여부 사전 확인"],
  "Local Cable Works": ["∙ 소량 긴급 공급 가능", "∙ 단가 협의 후 발주"],
};

const TODO_NEXT_ACTIONS = {
  "고객별 납기 리스트 브리핑": [
    "∙ 미확정 납기 항목 확인",
    "∙ 구매처 회신 여부 확인",
    "∙ 미회신 건은 오후 3시까지 팀장에게 공유",
  ],
};

const ROLE_SECTION = {
  "영업관리팀": (target) => [
    `${target} 담당자는 영업관리팀에서 고객 발주, 견적 요청, 납기 확인 업무를 담당합니다.`,
    "∙ 고객 요청 접수 및 요청사항 확인",
    "∙ 구매팀에 공급 가능 여부와 납기 확인",
    "∙ 회신 예정일 및 고객 약속 일정 관리",
    "∙ 출고 일정 변경 시 물류팀과 일정 조율",
    "∙ 품질 이슈 발생 시 품질팀에 내용 전달",
    "∙ High Risk 업무 발생 시 팀장에게 보고",
  ],
  "구매팀": (target) => [
    `${target} 담당자는 구매팀에서 구매처 발주, 재고 확인, 납기 조율 업무를 담당합니다.`,
    "∙ 구매처별 재고 현황 확인",
    "∙ 긴급 발주 요청 시 우선 처리",
    "∙ 납기 지연 가능성 사전 파악 및 영업팀 공유",
    "∙ 단가 인상·변경 사항 정리 및 공유",
    "∙ 재고 부족 시 대체품 검토 및 품질팀 확인",
    "∙ High Risk 재고 이슈 팀장 보고",
  ],
  "품질클레임팀": (target) => [
    `${target} 담당자는 품질클레임팀에서 고객 클레임 접수, 8D 리포트, 품질 대응 업무를 담당합니다.`,
    "∙ 클레임 접수 및 내용 정리",
    "∙ 8D 리포트 작성 및 기한 관리",
    "∙ 영업팀과 클레임 현황 공유",
    "∙ 반복 클레임 발생 시 근본 원인 분석",
    "∙ High Risk 클레임 팀장 즉시 보고",
  ],
  "물류팀": (target) => [
    `${target} 담당자는 물류팀에서 출고 일정, 운송 상태, 납기 조율 업무를 담당합니다.`,
    "∙ 출고 일정 확인 및 운송 상태 추적",
    "∙ 지연 발생 시 영업팀에 즉시 공유",
    "∙ 긴급 배송 요청 처리 및 비용 확인",
    "∙ 일정 변경 시 관련 부서 협의",
    "∙ 출고 차질 예상 시 팀장 보고",
  ],
  "운영총괄": (target) => [
    `${target} 담당자는 운영총괄 소속으로 전사 운영 현황 모니터링 및 우선순위 조율을 담당합니다.`,
    "∙ High Risk 업무 현황 파악 및 조율",
    "∙ 부서 간 업무 병목 해소",
    "∙ 주간 운영 보고서 검토",
    "∙ 이슈 발생 시 관련 부서 조율",
    "∙ 경영진 보고 자료 준비",
  ],
};

const WORKFLOW_SECTION = {
  "영업관리팀": [
    "고객사 발주 또는 견적 요청",
    "→ 영업관리 담당자가 요청 내용과 납기 확인",
    "→ 구매팀이 구매처 재고와 공급 가능일 확인",
    "→ 물류팀이 출고 일정과 운송 상태 확인",
    "→ 고객사에 견적 또는 납기 회신",
    "→ 지연·재고 부족·클레임 발생 시 이슈 등록",
    "→ High Risk 업무는 팀장에게 보고",
  ],
  "구매팀": [
    "영업팀 발주 요청 접수",
    "→ 구매처별 재고 및 공급 가능일 확인",
    "→ 납기 확정 후 영업팀 회신",
    "→ 재고 부족 시 대체품 검토 또는 긴급 발주",
    "→ 납기 지연 예상 시 영업팀에 즉시 공유",
    "→ High Risk 재고 이슈 팀장 보고",
  ],
  "품질클레임팀": [
    "고객사 또는 영업팀으로부터 클레임 접수",
    "→ 클레임 내용 확인 및 분류",
    "→ 8D 리포트 작성 및 초안 공유",
    "→ 구매팀·물류팀과 원인 분석 협력",
    "→ 고객사에 처리 결과 회신",
    "→ 반복 클레임 시 근본 원인 조치",
    "→ High Risk 클레임은 팀장 즉시 보고",
  ],
  "물류팀": [
    "영업팀으로부터 출고 요청 접수",
    "→ 출고 일정 확인 및 운송 수단 선택",
    "→ 긴급 배송 요청 시 비용 확인 후 처리",
    "→ 지연 발생 시 영업팀·고객팀에 즉시 공유",
    "→ 출고 완료 후 배송 상태 추적",
    "→ 출고 차질 예상 시 팀장 보고",
  ],
  "운영총괄": [
    "부서별 운영 현황 수집",
    "→ High Risk·Blocked 업무 파악",
    "→ 부서 간 병목 조율",
    "→ 주간 운영 보고서 작성",
    "→ 이슈 발생 시 관련 부서와 긴급 협의",
    "→ 경영진 보고",
  ],
};

const COMMON_TASKS = {
  "영업관리팀": ["견적 요청 확인", "추가 발주 수량 확인", "구매처 재고 확인", "납기 재확인", "출고 일정 변경", "대체품 검토", "품질 클레임 전달", "고객 회신 지연 추적"],
  "구매팀": ["구매처 재고 확인", "긴급 발주 처리", "납기 조율", "단가 확인 및 비교", "대체품 검토", "입고 일정 추적"],
  "품질클레임팀": ["클레임 접수 및 분류", "8D 리포트 작성", "고객 회신 관리", "반복 이슈 분석", "품질 검토 요청"],
  "물류팀": ["출고 일정 확인", "운송 상태 추적", "긴급 배송 처리", "일정 변경 조율", "입출고 기록 관리"],
  "운영총괄": ["High Risk 현황 파악", "부서 간 조율", "주간 보고서 검토", "이슈 우선순위 조율", "경영진 보고 준비"],
};

const RISK_GUIDE = [
  "즉시 팀장 보고",
  "∙ 고객 생산 일정에 영향 가능성이 있음",
  "∙ 납기 확정이 불가능한 상태가 지속됨",
  "∙ 공급사 재고 부족으로 출고 차질이 예상됨",
  "∙ 품질 클레임 회신이 기준 시간 이상 지연됨",
  "∙ 담당자 부재로 업무가 Blocked 상태임",
  "담당자 간 확인 후 처리",
  "∙ 견적 회신 일정 조정",
  "∙ 대체품 검토",
  "∙ 일반 출고 일정 재조율",
];

const DAILY_CHECKS = [
  "매일 업무 시작 시 확인 순서",
  "1. Dashboard — High Risk와 Blocked 업무 확인",
  "2. Todo — 본인 진행 업무와 오늘 마감 확인",
  "3. Issue Log — 미해결 이슈 확인",
  "4. Calendar — 일정과 마감 확인",
  "5. Report — 최근 주간 운영 보고서 확인",
];

const EXECUTION_PLAN = [
  "첫날",
  "∙ Dashboard, Todo, Issue Log 메뉴 확인",
  "∙ 담당 고객사와 구매처 목록 확인",
  "∙ 미완료 Todo 3건 읽기",
  "∙ 최근 주간 보고서 1건 확인",
  "∙ 사수와 전체 업무 흐름 브리핑",
  "첫주",
  "∙ 고객사별 주요 요청 유형 정리",
  "∙ 구매처별 납기 확인 방식 파악",
  "∙ 실제 Todo 1건 처리",
  "∙ High Risk 판단 기준 확인",
  "∙ 처리 결과를 사수 또는 팀장에게 리뷰 요청",
  "첫달",
  "∙ 담당 고객사 업무 독립 수행",
  "∙ 주간 리스크 요약 작성",
  "∙ 반복 이슈 대응 방식 정리",
  "∙ 업무 누락과 지연 여부를 팀장과 점검",
];

const CONTACT_GUIDE = [
  "∙ 운영 우선순위 및 High Risk → 운영팀장",
  "∙ 고객 발주·견적 요청 → 영업관리 담당자",
  "∙ 구매처 재고·납기 → 구매 담당자",
  "∙ 출고 일정·운송 상태 → 물류 담당자",
  "∙ 품질 클레임 → 품질 담당자",
];

const SUPERVISOR_CHECKLIST = [
  "∙ 고객별 업무 차이를 이해했는지 확인",
  "∙ High Risk 업무의 단독 처리 금지 기준 확인",
  "∙ 첫달 독립 처리 범위를 합의",
  "∙ 반복 이슈에 대한 대응 방식 검토",
  "∙ 주간 점검 일정 합의",
];

export function buildPreviewData(type, conditions, candidates, selectedIds) {
  if (type === "onboarding") {
    const { target, department: dept, period } = conditions;

    const cxList = candidates.filter((v) => selectedIds.includes(v.id) && v.group === "먼저 파악할 고객사");
    const spList = candidates.filter((v) => selectedIds.includes(v.id) && v.group === "먼저 파악할 구매처");
    const todoList = candidates.filter((v) => selectedIds.includes(v.id) && v.group === "우선 확인할 Todo");
    const questionList = candidates.filter((v) => selectedIds.includes(v.id) && v.group === "추천 질문");
    const issueList = candidates.filter((v) => selectedIds.includes(v.id) && v.group === "최근 반복 이슈");

    const cxSection = cxList.length
      ? cxList.flatMap((c) => [`${c.title} — ${c.meta}`, ...(CUSTOMER_NOTES[c.title] || [])])
      : ["선택된 고객사가 없습니다."];

    const spSection = spList.length
      ? spList.flatMap((c) => [`${c.title} — ${c.meta}`, ...(SUPPLIER_NOTES[c.title] || [])])
      : ["선택된 구매처가 없습니다."];

    const todoSection = todoList.length
      ? todoList.flatMap((c) => [
          c.title,
          `∙ 담당자: ${target}  ∙ 상태: 진행 중  ∙ 마감: ${period} 기준`,
          ...(TODO_NEXT_ACTIONS[c.title] || ["∙ 다음 행동: 사수와 함께 확인"]),
        ])
      : ["우선 확인할 Todo가 없습니다."];

    const commonTasks = COMMON_TASKS[dept] || COMMON_TASKS["운영총괄"];

    const issueSection = issueList.length
      ? issueList.map((c) => `${c.title} — ${c.meta}`)
      : ["선택된 반복 이슈가 없습니다."];

    const questionsSection = questionList.length
      ? questionList.map((c) => c.title)
      : ["궁금한 업무 내용을 AI에게 질문해보세요."];

    const roleLines = ROLE_SECTION[dept] ? ROLE_SECTION[dept](target) : [`${target} 담당자는 ${dept} 소속으로 업무를 담당합니다.`, "∙ 팀장과 담당 업무 범위를 직접 확인하세요."];
    const workflowLines = WORKFLOW_SECTION[dept] || WORKFLOW_SECTION["운영총괄"];

    return {
      type,
      title: `신입 온보딩 가이드 — ${target}`,
      sections: [
        ["내 역할과 담당 범위", roleLines],
        ["전체 업무 흐름", workflowLines],
        ["먼저 파악해야 할 고객사", cxSection],
        ["먼저 파악해야 할 구매처", spSection],
        ["자주 발생하는 업무 유형", commonTasks],
        ["현재 진행 중 업무", todoSection],
        ["최근 반복 이슈", issueSection],
        ["리스크 판단 및 보고 기준", RISK_GUIDE],
        ["매일 확인할 시스템과 문서", DAILY_CHECKS],
        ["첫날 · 첫주 · 첫달 실행 계획", EXECUTION_PLAN],
        ["도움을 요청할 담당자", CONTACT_GUIDE],
        ["AI Assistant에 물어볼 질문", questionsSection],
        ["사수/팀장 확인 항목", SUPERVISOR_CHECKLIST],
      ],
    };
  }

  if (conditions.scope === "특정 이슈") return {
    type, title: `이슈 인수인계서 - ${conditions.owner} → ${conditions.receiver}`,
    sections: [
      ["이슈 개요", [`${conditions.customer} 관련 선택 이슈의 현재 맥락과 담당 부서를 정리합니다.`]],
      ["현재 진행 중 업무", lines(titles(candidates, selectedIds, "진행 중 Todo"))],
      ["미해결 리스크", lines(titles(candidates, selectedIds, "미해결 이슈"))],
      ["관련 부서별 확인사항", [`${conditions.filterDepartment}: 담당 업무와 최신 마감일 확인`, "영업관리팀: 고객 안내 일정과 표현 확인"]],
      ["참고 자료", lines([...titles(candidates, selectedIds, "참고 보고서"), ...titles(candidates, selectedIds, "관련 문서")])],
      ["다음 액션", [`${conditions.receiver}: 미해결 리스크 우선순위 확인`, "관련 부서와 마감 일정 재확인"]]
    ]
  };

  return {
    type, title: `업무 인수인계서 - ${conditions.owner} → ${conditions.receiver}`,
    sections: [
      ["인수인계 개요", [`${conditions.owner} 담당자의 ${conditions.scope}를 ${conditions.receiver} 담당자에게 인계합니다.`, `${conditions.period} 업무 기록을 기준으로 정리했습니다.`]],
      ["담당 고객사 / 협력사", [`고객사: ${conditions.customer}`, `협력사: ${conditions.supplier}`, `소속 팀: ${conditions.department}`]],
      ["현재 진행 중 Todo", lines(titles(candidates, selectedIds, "진행 중 Todo"))],
      ["미해결 이슈", lines(titles(candidates, selectedIds, "미해결 이슈"))],
      ["주요 리스크", lines(titles(candidates, selectedIds, "미해결 이슈"))],
      ["고객별 주의사항", lines(titles(candidates, selectedIds, "고객별 주의사항"))],
      ["관련 부서별 확인사항", ["구매팀: 재고와 단가 적용일 확인", "물류팀: 출고 일정과 긴급 배송 비용 확인", "품질클레임팀: 8D 리포트 일정 확인"]],
      ["참고 보고서 / 문서", lines([...titles(candidates, selectedIds, "참고 보고서"), ...titles(candidates, selectedIds, "관련 문서")])],
      ["다음 액션", [`${conditions.receiver}: 고객별 미완료 Todo 확인`, "관련 부서와 High Risk 항목 마감 일정 재확인"]],
      ["팀장 확인 항목", ["인수인계 범위에 빠진 고객사가 없는지 확인", "미완료 Todo 담당자와 마감일 확인", "신규 담당자의 우선 처리 업무 확인"]]
    ]
  };
}

export function readArchives() { try { const data = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]"); return Array.isArray(data) ? data : []; } catch { return []; } }
export function writeArchives(value) { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(value)); }
