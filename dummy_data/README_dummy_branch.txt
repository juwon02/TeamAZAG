===SECTION: 더미 데이터 브랜치 안내===
문서 유형: 개발 가이드
작성일: 2026년 6월 5일
작성자: 이성우

이 문서는 OpsRadar 시스템 테스트용 더미 데이터의
구성과 활용 방법을 설명합니다.
===SECTION_END===

===SECTION: 브랜치 구조===
GitHub 브랜치: dummy
경로: https://github.com/juwon02/TeamAZAG/tree/dummy

포함 파일:
[기존 더미 데이터] — OpsRadar 개발 초기 (1~2주차 기반)
  - meeting_2026_05_07_kickoff.txt
  - meeting_2026_05_08_topic2.txt
  - meeting_2026_05_11_topic3.txt
  - meeting_2026_05_11_final.txt
  - meeting_2026_05_13_week2_check.txt
  - meeting_2026_05_19_week3_start.txt
  - chat_2026_05_11_13.txt
  - chat_2026_05_17_dashboard.txt
  - email_2026_05_08_12.txt
  - handover_2026_05_13.txt
  - handover_onboarding_2026_05_17.txt
  - project_status_2026_05_14.txt
  - report_2026_05_13_sungwoo_week2.txt
  - report_monthly_2026_05.txt
  - report_weekly_2026_05_17.txt
  - calendar_2026_05.txt
  - tasks_2026_05_week2.csv
  - tasks_2026_05_week3.csv
  - issue_log_20260514_azure_timeout.txt
  - meeting_notes_20260505_kickoff.txt
  - meeting_notes_20260512_week2.txt
  - chat_logs_20260512_backend.txt
  - chat_logs_20260514_ai_pipeline.txt
  - dummy_data.json
  - dummy_data.sql

[신규 더미 데이터] — 실제 구현 내용 반영 (3~7주차)
  - meeting_2026_05_28_week4_mid.txt
  - meeting_2026_05_30_week4_review.txt
  - meeting_2026_06_02_week5_start.txt
  - meeting_2026_06_04_week5_mid.txt
  - meeting_2026_06_07_demo.txt
  - meeting_2026_06_09_week6_start.txt
  - meeting_2026_06_14_week7_start.txt
  - chat_2026_05_27_ai_assistant.txt
  - chat_2026_05_28_dashboard_dev.txt
  - chat_2026_05_29_upload_integration.txt
  - chat_2026_06_04_report_feature.txt
  - chat_2026_06_11_qa_testing.txt
  - chat_2026_06_14_final_prep.txt
  - chat_2026_06_21_final_review.txt
  - email_2026_05_26_schema_confirm.txt
  - email_2026_05_30_server_config.txt
  - email_2026_06_03_code_review.txt
  - email_2026_06_14_final_prep.txt
  - handover_2026_05_30_week4.txt
  - handover_2026_06_14_final.txt
  - handover_onboarding_2026_06_07.txt
  - issue_log_20260526_faiss_and_chat.txt
  - issue_log_20260529_upload_validation.txt
  - issue_log_20260603_ux_feedback.txt
  - issue_log_20260605_performance.txt
  - project_status_2026_05_28.txt
  - project_status_2026_06_07.txt
  - project_status_2026_06_14.txt
  - report_weekly_2026_05_30.txt
  - report_weekly_2026_06_07.txt
  - report_monthly_2026_06.txt
  - report_2026_05_30_sungho_week4.txt
  - report_2026_06_07_sungwoo_week5.txt
  - report_2026_06_07_juwon_week5.txt
  - report_2026_06_07_yeeun_week5.txt
  - tasks_2026_06_week5.csv
  - tasks_2026_06_week6.csv
  - tasks_2026_06_week7.csv
  - calendar_2026_06.txt
===SECTION_END===

===SECTION: 핵심 시나리오 정보===
테스트 환경:
- DB: postgresql+asyncpg://azag_user:1111@74.249.82.58:5432/azag_db
- project_id: 30000000-0000-0000-0000-000000000001
- 포트 8000: RAG 메인 (업로드, 챗봇)
- 포트 8001: OpsRadar2 (대시보드, CRUD)

시연 권장 파일:
1. meeting_2026_05_07_kickoff.txt (킥오프 회의록)
2. report_weekly_2026_05_17.txt (2주차 보고서)
3. issue_log_20260514_azure_timeout.txt (이슈 로그)
===SECTION_END===
