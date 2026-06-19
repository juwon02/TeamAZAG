import { useState } from "react";
import { DEPARTMENTS, PEOPLE, WORK_TYPES } from "./handoverData";

export default function HandoverCreatePanel({ kind, onClose, onCreate }) {
  const onboarding = kind === "onboarding";
  const [form, setForm] = useState({ title: onboarding ? "신규 입사자 30일 온보딩" : "담당 업무 인수인계", owner: onboarding ? "이민재" : "박서연", receiver: onboarding ? "정하늘" : "이민재", department: "영업관리팀", workType: "고객 운영" });
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => { event.preventDefault(); onCreate({ ...form, kind, summary: onboarding ? `${form.receiver}님이 첫날 핵심 고객과 시스템을 파악하고, 첫 주 동행 업무를 거쳐 첫 달부터 ${form.workType} 업무를 독립 수행하도록 AI가 학습 순서를 구성했습니다.` : `${form.owner}님의 ${form.workType} 운영 기록을 Todo, Issue, Report 기준으로 분석해 ${form.receiver}님이 먼저 확인할 업무와 리스크를 정리했습니다.` }); };
  return <div className="hc-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="hc-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={onboarding ? "온보딩 가이드 생성" : "인수인계 문서 생성"}>
      <header><div><span>{onboarding ? "NEW EMPLOYEE ONBOARDING" : "WORK TRANSFER"}</span><h2>{onboarding ? "온보딩 가이드 생성" : "인수인계 문서 생성"}</h2><p>조건을 선택하면 AI가 연결된 운영 기록을 바탕으로 초안을 구성합니다.</p></div><button type="button" onClick={onClose} aria-label="닫기"><i className="ti ti-x" /></button></header>
      <div className="hc-modal-grid">
        <label className="wide"><span>문서 제목</span><input value={form.title} onChange={(event) => change("title", event.target.value)} required /></label>
        <label><span>{onboarding ? "사수 / 작성자" : "기존 담당자"}</span><select value={form.owner} onChange={(event) => change("owner", event.target.value)}>{PEOPLE.map((person) => <option key={person}>{person}</option>)}</select></label>
        <label><span>{onboarding ? "온보딩 대상자" : "신규 담당자"}</span><select value={form.receiver} onChange={(event) => change("receiver", event.target.value)}>{PEOPLE.map((person) => <option key={person}>{person}</option>)}</select></label>
        <label><span>담당 부서</span><select value={form.department} onChange={(event) => change("department", event.target.value)}>{DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}</select></label>
        <label><span>업무 범위</span><select value={form.workType} onChange={(event) => change("workType", event.target.value)}>{WORK_TYPES.map((work) => <option key={work}>{work}</option>)}</select></label>
      </div>
      <div className="hc-modal-sources"><i className="ti ti-sparkles" /><div><strong>AI 연결 범위</strong><span>진행 중 Todo, 미해결 Issue, 최근 Report, 관련 문서와 출처를 함께 요약합니다.</span></div></div>
      <footer><button type="button" onClick={onClose}>취소</button><button type="submit" className="hc-primary"><i className="ti ti-wand" />AI 초안 생성</button></footer>
    </form>
  </div>;
}
