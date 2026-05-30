-- TeamAZAG v3 seed data.
-- Run after db/schema.postgresql.sql.

INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Kim Sung Ho', 'sungho@teamazag.test', '$2b$12$sample.admin.hash', 'admin'),
  ('00000000-0000-0000-0000-000000000102', 'Lee Project', 'pm@teamazag.test', '$2b$12$sample.manager.hash', 'manager'),
  ('00000000-0000-0000-0000-000000000103', 'Park Backend', 'backend@teamazag.test', '$2b$12$sample.member.hash', 'member'),
  ('00000000-0000-0000-0000-000000000104', 'Choi Frontend', 'frontend@teamazag.test', '$2b$12$sample.member.hash', 'member'),
  ('00000000-0000-0000-0000-000000000105', 'Jung AI', 'ai@teamazag.test', '$2b$12$sample.viewer.hash', 'viewer');

INSERT INTO teams (id, name) VALUES
  ('00000000-0000-0000-0000-000000000201', 'Team AZAG');

INSERT INTO projects (
  id, team_id, created_by, name, description, status, start_date, end_date
) VALUES (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000101',
  'Project AZAG OpsRadar',
  'Project-centered operational radar for documents, AI analysis, Todos, issues, reports, handoff, and assistant workflows.',
  'active',
  '2026-05-01',
  '2026-06-30'
);

INSERT INTO project_members (id, project_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'owner'),
  ('00000000-0000-0000-0000-000000000312', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', 'manager'),
  ('00000000-0000-0000-0000-000000000313', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103', 'member'),
  ('00000000-0000-0000-0000-000000000314', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000104', 'member'),
  ('00000000-0000-0000-0000-000000000315', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000105', 'viewer');

INSERT INTO documents (
  id, project_id, uploaded_by, file_name, file_type, source_type, storage_path, status, uploaded_at
) VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', 'weekly_meeting_2026_05_18.docx', 'docx', 'meeting', 'local://project-azag/weekly_meeting_2026_05_18.docx', 'completed', '2026-05-18 10:00:00+09'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000104', 'opsradar_frontend_final_v3.html', 'html', 'upload', 'local://project-azag/opsradar_frontend_final_v3.html', 'completed', '2026-05-22 11:28:00+09'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103', 'dashboard_api_contract.md', 'md', 'report', 'local://project-azag/dashboard_api_contract.md', 'analyzing', '2026-05-22 12:00:00+09');

INSERT INTO document_chunks (
  id, document_id, project_id, content, chunk_index, page_number, token_count
) VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 'Dashboard aggregation API must support project progress, current week todos, delayed work, open issues, and latest handoff score.', 0, 1, 28),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', 'The final frontend contains Dashboard, AI Analysis, Todo, Issue Log, Reports, Handoff, Knowledge, and Assistant screens.', 0, 1, 25),
  ('00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000301', 'All backend queries must be scoped by project_id and return stable UUID records for frontend inspection.', 0, 1, 22);

INSERT INTO chunk_embeddings (id, chunk_id, faiss_index_path, faiss_index_id, embedding_model) VALUES
  ('00000000-0000-0000-0000-000000000511', '00000000-0000-0000-0000-000000000501', 'data/faiss/project-azag/index.faiss', 501, 'text-embedding-3-small'),
  ('00000000-0000-0000-0000-000000000512', '00000000-0000-0000-0000-000000000502', 'data/faiss/project-azag/index.faiss', 502, 'text-embedding-3-small'),
  ('00000000-0000-0000-0000-000000000513', '00000000-0000-0000-0000-000000000503', 'data/faiss/project-azag/index.faiss', 503, 'text-embedding-3-small');

INSERT INTO analysis_jobs (
  id, project_id, document_id, requested_by, status, progress_percent, started_at, completed_at
) VALUES
  ('00000000-0000-0000-0000-000000000521', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000102', 'completed', 100, '2026-05-18 10:05:00+09', '2026-05-18 10:06:00+09'),
  ('00000000-0000-0000-0000-000000000522', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000103', 'running', 65, '2026-05-22 12:05:00+09', NULL);

INSERT INTO analysis_steps (id, analysis_job_id, step_name, status, step_order, message, started_at, completed_at) VALUES
  ('00000000-0000-0000-0000-000000000531', '00000000-0000-0000-0000-000000000521', 'parsing', 'completed', 0, 'Parsed meeting notes.', '2026-05-18 10:05:00+09', '2026-05-18 10:05:10+09'),
  ('00000000-0000-0000-0000-000000000532', '00000000-0000-0000-0000-000000000521', 'chunking', 'completed', 1, 'Created chunks.', '2026-05-18 10:05:10+09', '2026-05-18 10:05:20+09'),
  ('00000000-0000-0000-0000-000000000533', '00000000-0000-0000-0000-000000000521', 'embedding', 'completed', 2, 'Stored FAISS references.', '2026-05-18 10:05:20+09', '2026-05-18 10:05:40+09'),
  ('00000000-0000-0000-0000-000000000534', '00000000-0000-0000-0000-000000000521', 'ai_analysis', 'completed', 3, 'Extracted Todo and issue candidates.', '2026-05-18 10:05:40+09', '2026-05-18 10:06:00+09'),
  ('00000000-0000-0000-0000-000000000535', '00000000-0000-0000-0000-000000000522', 'parsing', 'completed', 0, 'Parsed API contract.', '2026-05-22 12:05:00+09', '2026-05-22 12:05:20+09'),
  ('00000000-0000-0000-0000-000000000536', '00000000-0000-0000-0000-000000000522', 'ai_analysis', 'running', 3, 'Checking frontend/backend field alignment.', '2026-05-22 12:06:00+09', NULL);

INSERT INTO ai_extractions (
  id, analysis_job_id, project_id, document_id, source_chunk_id, extraction_type, title, body, confidence_score, status, extracted_json
) VALUES
  ('00000000-0000-0000-0000-000000000541', '00000000-0000-0000-0000-000000000521', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000501', 'todo', 'Implement dashboard summary API', 'The dashboard requires aggregate cards before frontend integration.', 91, 'promoted', '{"priority":"high","due_date":"2026-05-23"}'::jsonb),
  ('00000000-0000-0000-0000-000000000542', '00000000-0000-0000-0000-000000000522', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000503', 'issue', 'Frontend and backend field names may drift', 'The API contract needs stable field names for the final frontend.', 84, 'candidate', '{"screen":"dashboard"}'::jsonb);

INSERT INTO issues (
  id, project_id, reporter_id, assignee_id, source_document_id, source_chunk_id, source_extraction_id,
  title, description, severity, status, source_type, confidence_score, is_candidate, detected_at
) VALUES
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000542', 'Dashboard API contract needs sign-off', 'Frontend field names and backend response keys must be frozen.', 'high', 'open', 'ai', 84, true, '2026-05-22 12:06:00+09'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000501', NULL, 'Handoff checklist missing deployment notes', 'The handoff report still lacks deployment and test coverage notes.', 'critical', 'blocked', 'manual', NULL, false, '2026-05-20 09:00:00+09'),
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000502', NULL, 'Static frontend is not yet wired to API calls', 'The final HTML is currently a local interactive prototype.', 'medium', 'in_progress', 'manual', NULL, false, '2026-05-22 11:30:00+09');

INSERT INTO todos (
  id, project_id, assignee_id, created_by, source_document_id, source_chunk_id, source_extraction_id,
  linked_issue_id, title, description, status, priority, source_type, approval_status, confidence_score,
  reviewed_by, reviewed_at, due_date
) VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000541', NULL, 'Implement dashboard summary API', 'Return project progress, todos, issues, documents, and handoff score.', 'completed', 'high', 'ai', 'approved', 91, '00000000-0000-0000-0000-000000000102', '2026-05-18 11:00:00+09', '2026-05-20 18:00:00+09'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000502', NULL, '00000000-0000-0000-0000-000000000703', 'Place frontend final HTML in project folder', 'Keep the frontend owner design untouched and make it available locally.', 'completed', 'medium', 'manual', 'approved', NULL, NULL, NULL, '2026-05-22 12:00:00+09'),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000503', NULL, '00000000-0000-0000-0000-000000000701', 'Freeze dashboard response field names', 'Agree on the exact response contract for dashboard cards and lists.', 'in_progress', 'high', 'manual', 'approved', NULL, NULL, NULL, '2026-05-24 18:00:00+09'),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000101', NULL, NULL, NULL, '00000000-0000-0000-0000-000000000702', 'Add deployment notes to handoff', 'Document DATABASE_URL, migration order, and local run commands.', 'blocked', 'critical', 'manual', 'approved', NULL, NULL, NULL, '2026-05-21 18:00:00+09'),
  ('00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000501', NULL, NULL, 'Run AI extraction smoke test', 'Check Todo and issue extraction candidate output.', 'pending', 'medium', 'manual', 'approved', NULL, NULL, NULL, '2026-05-27 18:00:00+09'),
  ('00000000-0000-0000-0000-000000000606', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000502', NULL, NULL, 'Review frontend console warnings', 'Check the final HTML for obvious broken assets or script errors.', 'pending', 'medium', 'manual', 'approved', NULL, NULL, NULL, '2026-05-25 18:00:00+09'),
  ('00000000-0000-0000-0000-000000000607', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000101', NULL, NULL, NULL, NULL, 'Prepare weekly report draft', 'Summarize completed backend and frontend integration work.', 'pending', 'high', 'manual', 'approved', NULL, NULL, NULL, '2026-05-29 18:00:00+09'),
  ('00000000-0000-0000-0000-000000000608', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000503', '00000000-0000-0000-0000-000000000542', '00000000-0000-0000-0000-000000000701', 'Confirm API contract drift candidate', 'AI found a possible frontend/backend mismatch; PM should approve or reject it.', 'pending', 'high', 'ai', 'pending', 84, NULL, NULL, '2026-05-24 18:00:00+09');

INSERT INTO issue_status_history (id, issue_id, changed_by, from_status, to_status, note, changed_at) VALUES
  ('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000101', 'open', 'blocked', 'Deployment notes are required before handoff can close.', '2026-05-21 10:00:00+09'),
  ('00000000-0000-0000-0000-000000000722', '00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000104', 'open', 'in_progress', 'Frontend file was placed locally for inspection.', '2026-05-22 12:00:00+09');

INSERT INTO project_events (
  id, project_id, created_by, title, event_type, risk_level, start_at, end_at, location, description
) VALUES
  ('00000000-0000-0000-0000-000000000731', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', 'Frontend final review', 'meeting', 'medium', '2026-05-22 14:00:00+09', '2026-05-22 15:00:00+09', 'Local', 'Review final HTML and backend contract.'),
  ('00000000-0000-0000-0000-000000000732', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'API contract freeze', 'milestone', 'high', '2026-05-24 18:00:00+09', NULL, 'GitHub', 'Freeze field names for frontend integration.');

INSERT INTO risk_windows (
  id, project_id, related_todo_id, related_issue_id, title, risk_level, start_date, end_date, reason, confidence_score
) VALUES
  ('00000000-0000-0000-0000-000000000741', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000702', 'Handoff blocked by missing deployment notes', 'critical', '2026-05-21', '2026-05-24', 'Blocked Todo is past due and linked to a critical issue.', 89),
  ('00000000-0000-0000-0000-000000000742', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000701', 'API contract drift risk', 'high', '2026-05-22', '2026-05-24', 'Dashboard field names are not frozen yet.', 84);

INSERT INTO project_reports (
  id, project_id, created_by, report_type, title, content, status, version, progress_rate, period_start, period_end
) VALUES
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', 'weekly', 'Project AZAG Weekly Report', 'Dashboard backend and local frontend placement are complete. Remaining work is API contract sign-off and deployment handoff notes.', 'draft', 1, 72, '2026-05-18 00:00:00+09', '2026-05-24 23:59:59+09'),
  ('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', 'monthly', 'Project AZAG May Report', 'May progress focused on frontend finalization, project-centered DB design, and backend API contract stabilization.', 'draft', 1, 48, '2026-05-01 00:00:00+09', '2026-05-31 23:59:59+09');

INSERT INTO handoff_reports (
  id, project_id, created_by, title, summary, handoff_score
) VALUES (
  '00000000-0000-0000-0000-000000000901',
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000102',
  'Project AZAG Handoff Readiness',
  'Core frontend and backend artifacts are aligned enough for local inspection. API contract and deployment notes remain open.',
  82
);

INSERT INTO handoff_items (
  id, handoff_report_id, related_todo_id, related_issue_id, related_document_id, item_type, title, body, priority, status
) VALUES
  ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000403', 'open_issue', 'Freeze dashboard API contract', 'Frontend and backend field names need final confirmation.', 'high', 'open'),
  ('00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000702', NULL, 'risk', 'Add deployment notes', 'Document migration order, env vars, and local run commands.', 'critical', 'open'),
  ('00000000-0000-0000-0000-000000000913', '00000000-0000-0000-0000-000000000901', NULL, NULL, '00000000-0000-0000-0000-000000000402', 'onboarding', 'Frontend final HTML location', 'Use frontend/index.html or _Project_AZAG_rebuild/frontend/index.html for local review.', 'medium', 'open');

INSERT INTO chat_sessions (id, project_id, user_id, title) VALUES
  ('00000000-0000-0000-0000-000000000A11', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', 'Handoff check');

INSERT INTO chat_messages (id, chat_session_id, user_id, role, content, created_at) VALUES
  ('00000000-0000-0000-0000-000000000A21', '00000000-0000-0000-0000-000000000A11', '00000000-0000-0000-0000-000000000102', 'user', 'What is still blocking handoff?', '2026-05-22 13:00:00+09'),
  ('00000000-0000-0000-0000-000000000A22', '00000000-0000-0000-0000-000000000A11', NULL, 'assistant', 'The main blockers are API contract sign-off and deployment handoff notes.', '2026-05-22 13:00:04+09'),
  ('00000000-0000-0000-0000-000000000A23', '00000000-0000-0000-0000-000000000A11', '00000000-0000-0000-0000-000000000101', 'user', 'Where is the final frontend file?', '2026-05-22 13:05:00+09'),
  ('00000000-0000-0000-0000-000000000A24', '00000000-0000-0000-0000-000000000A11', NULL, 'assistant', 'It is available at frontend/index.html and _Project_AZAG_rebuild/frontend/index.html.', '2026-05-22 13:05:04+09'),
  ('00000000-0000-0000-0000-000000000A25', '00000000-0000-0000-0000-000000000A11', NULL, 'system', 'Document analysis job 00000000-0000-0000-0000-000000000522 is still running.', '2026-05-22 13:10:00+09');

INSERT INTO chat_message_sources (
  id, chat_message_id, document_id, chunk_id, source_label, page_number
) VALUES
  ('00000000-0000-0000-0000-000000000A31', '00000000-0000-0000-0000-000000000A22', '00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000503', 'dashboard_api_contract.md', 1),
  ('00000000-0000-0000-0000-000000000A32', '00000000-0000-0000-0000-000000000A24', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000502', 'opsradar_frontend_final_v3.html', 1);

INSERT INTO project_activity_logs (
  id, project_id, actor_id, activity_type, title, body, metadata, created_at
) VALUES
  ('00000000-0000-0000-0000-000000000B01', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000104', 'document_uploaded', 'Frontend final HTML placed locally', 'The final interactive HTML was copied into the project frontend folder.', '{"path":"frontend/index.html"}'::jsonb, '2026-05-22 12:00:00+09'),
  ('00000000-0000-0000-0000-000000000B02', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000103', 'report_saved', 'Backend API contract updated', 'Project-scoped FastAPI endpoints were aligned with the v3 schema.', '{"version":"0.2.0"}'::jsonb, '2026-05-22 12:30:00+09'),
  ('00000000-0000-0000-0000-000000000B03', '00000000-0000-0000-0000-000000000301', NULL, 'chat_answered', 'Assistant answered handoff question', 'Assistant cited API contract and frontend file location.', '{"session_id":"00000000-0000-0000-0000-000000000A11"}'::jsonb, '2026-05-22 13:05:04+09');
