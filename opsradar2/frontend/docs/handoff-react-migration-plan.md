# Handoff Center React Migration Plan

## Current Frontend Structure

The current frontend is not a React + Vite application yet.

- Runtime package scripts use `react-scripts`, not Vite.
- React entrypoint is `src/index.js`.
- `src/App.js` currently acts as a login/session shell.
- The operational UI is still rendered by static HTML from `public/index.html`.
- Feature behavior is loaded by static scripts under `public/static/js/`.
- The handoff center currently lives in:
  - `public/static/js/handoff.js`
  - `js/handoff.js`

There is no confirmed `src/pages/`, `src/components/`, `src/routes/`, `main.jsx`,
`main.tsx`, `App.jsx`, `App.tsx`, `BrowserRouter`, `Routes`, or `Route` structure
for the handoff screen yet.

## Existing Static Handoff Summary

The current `handoff.js` implementation is a static JavaScript overlay for the
Knowledge screen.

It keeps these UX concepts:

- Handoff center Home
- Home to Detail flow
- 업무 인수인계 Detail
- 신입 온보딩 Detail
- Three Detail steps:
  - 조건 선택
  - AI 추출 후보
  - 문서 미리보기 / 온보딩 가이드 미리보기
- Candidate checklists for Todo, issues, reports, documents, and cautions
- Preview document sections
- Slide-preview data generation through `getHandoffPreviewData()`
- Dummy seed aligned copy and mock data

React migration should preserve these concepts, but not the DOM implementation
style.

## Dummy Data Baseline

Use the `dummy` branch seed scenario as the source of truth.

Confirmed files:

- `dummy_data/05_db_seed_v2/handoff_reports.csv`
- `dummy_data/05_db_seed_v2/issues.csv`
- `dummy_data/05_db_seed_v2/weekly_reports.csv`
- `dummy_data/05_db_seed_v2/monthly_reports.csv`
- `dummy_data/05_db_seed_v2/customers.csv`
- `dummy_data/05_db_seed_v2/suppliers.csv`
- `dummy_data/05_db_seed_v2/products.csv`
- `dummy_data/05_db_seed_v2/project_members.csv`

Baseline scenario:

- Company/team: AutoParts One Korea
- Handoff: 박서연 to 이민재
- Main customers:
  - Hyundai Mobis Tier2
  - Daesung Automotive
  - Mirae EV Systems
  - Hanil Motors
  - Global Harness Vietnam
- Main suppliers:
  - TE Connectivity Korea
  - KET Supplier
  - Yazaki Parts Asia
  - JST Components
  - Local Cable Works
- Main issues:
  - Daesung Automotive 긴급 발주 대응
  - KET Supplier 재고 부족으로 납기 지연 가능
  - Global Harness Vietnam 수출 서류 누락 통관 지연
  - Mirae EV Systems 센서 케이블 반복 클레임
  - Yazaki Parts Asia 리드타임 8주에서 12주 증가
  - TE Connectivity Korea 단가 7% 인상 통보
  - 박서연 담당 고객 인수인계 준비
- Report references:
  - WR-0001 Daesung Automotive 긴급 발주 대응
  - WR-0002 Mirae EV Systems 센서 케이블 반복 클레임
  - WR-0003 Hyundai Mobis Tier2 긴급 항공 이송
  - MR-0003 박서연 담당 고객 인수인계 준비

Do not introduce new company names, customer names, suppliers, or unrelated
business scenarios during migration.

## Recommended React File Layout

When the React routing structure is confirmed, migrate toward this shape:

```text
src/pages/HandoffCenter.jsx
src/components/handoff/HandoffHome.jsx
src/components/handoff/HandoffDetail.jsx
src/components/handoff/StepTabs.jsx
src/components/handoff/HandoffConditionStep.jsx
src/components/handoff/HandoffCandidateStep.jsx
src/components/handoff/HandoffPreviewStep.jsx
src/components/handoff/OnboardingConditionStep.jsx
src/components/handoff/OnboardingCandidateStep.jsx
src/components/handoff/OnboardingPreviewStep.jsx
src/components/handoff/CandidateChecklist.jsx
src/components/handoff/PreviewDocument.jsx
src/components/handoff/HandoffSummaryCard.jsx
src/data/handoffMockData.js
```

If the team wants fewer files for the first migration, keep at least these
boundaries:

- Home
- Detail
- StepTabs
- Conditions step
- Candidates step
- Preview step
- Mock data / preview-data builder

Avoid placing the full old `handoff.js` equivalent into one JSX file.

## State Design

Replace global mutable state and `window.*` control with React state.

Suggested page state:

```js
const [mode, setMode] = useState("home");
// home | handoff | onboarding

const [activeStep, setActiveStep] = useState("conditions");
// conditions | candidates | preview

const [handoffForm, setHandoffForm] = useState({
  owner: "박서연 | 영업관리팀",
  nextOwner: "이민재 | 영업관리팀",
  handoffDepartment: "영업관리팀",
  reason: "담당자 변경",
  scope: "이전 담당 업무 전체",
  customer: "전체",
  supplier: "전체",
  filterDepartment: "전체",
  period: "최근 6개월",
  selectedIssueId: "mirae-quality-claim",
});

const [onboardingForm, setOnboardingForm] = useState({
  target: "정하늘",
  team: "영업관리팀",
  period: "최근 6개월",
});

const [selectedCandidates, setSelectedCandidates] = useState({
  todos: {},
  issues: {},
  reports: {},
  documents: {},
  cautions: {},
  onboardingCustomers: {},
  onboardingSuppliers: {},
});
```

Use controlled inputs and event handlers instead of inline `onclick` strings.

## Data Design

Move static mock content from `handoff.js` into `src/data/handoffMockData.js`
or the equivalent data module chosen by the React structure.

Recommended exports:

```js
export const handoffOptions = {
  people,
  scopeOptions,
  reasonOptions,
  customerFilterOptions,
  supplierFilterOptions,
  departmentFilterOptions,
  periodOptions,
};

export const handoffIssues = [];
export const fullScopeResult = {};
export const onboardingResult = {};
export const candidateItems = {};
export const onboardingCandidates = {};
```

Keep labels aligned with the current UX:

- 인수인계 개요
- 담당 고객사 / 구매처 / 품목
- 현재 진행 중 Todo
- 미해결 이슈
- 주요 리스크
- 고객별 주의사항
- 관련 부서별 확인사항
- 참고 보고서 / 문서
- 다음 액션
- 팀장 확인 항목
- 팀/업무 요약
- 먼저 파악해야 할 고객사
- 먼저 파악해야 할 구매처
- 첫날 / 첫주 / 첫달 가이드
- 사수/팀장 확인 항목

## Preview Data Builder

Move `getHandoffPreviewData()` into a pure helper, for example:

```text
src/components/handoff/buildHandoffPreviewData.js
```

or:

```text
src/data/handoffPreviewData.js
```

The helper should accept explicit state instead of reading globals:

```js
buildHandoffPreviewData({
  mode,
  handoffForm,
  onboardingForm,
  selectedIssue,
  resultRows,
  selectedCandidates,
});
```

It should return the same slide-preview shape currently expected by the preview
panel:

```js
{
  title,
  target,
  sections: [["label", "value"]],
}
```

## Existing Static JS To Avoid Recreating

Do not recreate these patterns in React:

- `document.getElementById(...)`
- `innerHTML` string rendering
- inline `onclick` strings
- `window.selectKnowledgeType` as the main state transition
- `window.initHandoffCenter` as the main mount point
- script query-string cache management as an application mechanism
- script loading order as a feature dependency

These globals can remain only while the static screen is still in service.

## Retirable Legacy Globals After React Parity

After the React handoff route reaches parity and the static Knowledge screen is retired, these globals can be removed or reduced to compatibility adapters:

- `window.initHandoffCenter`
- `window.selectKnowledgeType`
- `window.selectHandoffType`
- `window.renderKnowledgeFlow`
- `window.generateHandoffPreview`
- `window.openHandoffPreview`
- `window.closeHandoffPreview`
- `window.saveHandoffDraft`
- `window.editHandoffDraft`
- `window.shareHandoffDraft`
- Inline `onclick` handlers that call handoff-specific functions

## Parallel Operation Notes

Until React routing is confirmed, do not delete or disable the static
`handoff.js` screen.

If both static and React versions exist temporarily:

- Keep the static Knowledge screen script untouched for current demos.
- Mount the React Handoff Center behind a separate route or feature flag.
- Do not share mutable global state between the static and React versions.
- Reuse dummy seed-aligned mock data by extracting it into a data module only
  after the bundler/import path is agreed.
- Keep the slide preview contract stable so existing preview tooling can be
  reused.

## Migration Order

1. Confirm whether the team is moving to Vite or staying on CRA temporarily.
2. Confirm router choice and route path for the handoff center.
3. Create `src/pages/HandoffCenter.jsx`.
4. Extract dummy seed-aligned mock data into a data module.
5. Build `HandoffHome` with mode selection.
6. Build `HandoffDetail` with `StepTabs`.
7. Add condition-step controlled inputs.
8. Add candidate checklists with `selectedCandidates` state.
9. Add preview document rendering.
10. Add pure `buildHandoffPreviewData()` helper.
11. Wire the route/menu entry.
12. Run build and browser QA.
13. Only after React parity is confirmed, retire static global handlers.

## Implementation Decision For Now

React + Vite structure is not confirmed in this branch. The current codebase is
still a CRA login shell plus a static HTML application. Therefore this pass does
not implement React components. It records the migration plan and leaves the
existing static Handoff Center untouched.
