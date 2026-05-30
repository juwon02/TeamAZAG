-- TeamAZAG v3 dashboard and screen queries.
-- Bind parameters from the backend:
--   :project_id, :week_start, :week_end, :user_id, :limit

-- 1. Dashboard summary cards.
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.status AS project_status,
  COALESCE(latest_report.progress_rate, 0) AS progress_rate,
  COUNT(t.id) FILTER (WHERE t.approval_status = 'approved') AS total_todos,
  COUNT(t.id) FILTER (WHERE t.approval_status = 'approved' AND t.status = 'completed') AS completed_todos,
  COUNT(t.id) FILTER (
    WHERE t.approval_status = 'approved'
      AND t.status <> 'completed'
      AND t.due_date IS NOT NULL
      AND t.due_date < now()
  ) AS delayed_todos,
  COUNT(t.id) FILTER (
    WHERE t.approval_status = 'approved'
      AND t.due_date BETWEEN :week_start AND :week_end
  ) AS current_week_todos,
  COUNT(t.id) FILTER (
    WHERE t.source_type = 'ai'
      AND t.approval_status = 'pending'
  ) AS pending_ai_todos,
  (
    SELECT COUNT(*)
    FROM issues i
    WHERE i.project_id = p.id
      AND i.is_candidate = false
      AND i.status IN ('open', 'in_progress', 'blocked')
  ) AS unresolved_issues,
  (
    SELECT COUNT(*)
    FROM issues i
    WHERE i.project_id = p.id
      AND i.is_candidate = true
  ) AS candidate_issues,
  (
    SELECT COUNT(*)
    FROM documents d
    WHERE d.project_id = p.id
  ) AS document_count,
  latest_handoff.handoff_score AS latest_handoff_score
FROM projects p
LEFT JOIN todos t ON t.project_id = p.id
LEFT JOIN LATERAL (
  SELECT pr.progress_rate
  FROM project_reports pr
  WHERE pr.project_id = p.id
    AND pr.report_type = 'weekly'
  ORDER BY pr.period_start DESC, pr.created_at DESC
  LIMIT 1
) latest_report ON true
LEFT JOIN LATERAL (
  SELECT hr.handoff_score
  FROM handoff_reports hr
  WHERE hr.project_id = p.id
  ORDER BY hr.created_at DESC
  LIMIT 1
) latest_handoff ON true
WHERE p.id = :project_id
GROUP BY p.id, latest_report.progress_rate, latest_handoff.handoff_score;

-- 2. Current week Todo list.
SELECT
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.source_type,
  t.approval_status,
  t.confidence_score,
  assignee.name AS assignee_name,
  creator.name AS created_by_name,
  d.file_name AS source_file_name
FROM todos t
LEFT JOIN users assignee ON assignee.id = t.assignee_id
JOIN users creator ON creator.id = t.created_by
LEFT JOIN documents d ON d.id = t.source_document_id
WHERE t.project_id = :project_id
  AND t.approval_status = 'approved'
  AND t.due_date BETWEEN :week_start AND :week_end
ORDER BY
  CASE t.status
    WHEN 'blocked' THEN 1
    WHEN 'in_progress' THEN 2
    WHEN 'pending' THEN 3
    WHEN 'completed' THEN 4
    ELSE 5
  END,
  CASE t.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  t.due_date ASC NULLS LAST
LIMIT :limit;

-- 3. AI Todo approval queue.
SELECT
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.due_date,
  t.confidence_score,
  assignee.name AS assignee_name,
  d.file_name AS source_file_name,
  dc.page_number AS source_page_number
FROM todos t
LEFT JOIN users assignee ON assignee.id = t.assignee_id
LEFT JOIN documents d ON d.id = t.source_document_id
LEFT JOIN document_chunks dc ON dc.id = t.source_chunk_id
WHERE t.project_id = :project_id
  AND t.source_type = 'ai'
  AND t.approval_status = 'pending'
ORDER BY t.confidence_score DESC NULLS LAST, t.created_at DESC
LIMIT :limit;

-- 4. Open issue list.
SELECT
  i.id,
  i.title,
  i.description,
  i.severity,
  i.status,
  i.source_type,
  i.confidence_score,
  i.is_candidate,
  reporter.name AS reporter_name,
  assignee.name AS assignee_name,
  d.file_name AS source_file_name,
  i.created_at
FROM issues i
LEFT JOIN users reporter ON reporter.id = i.reporter_id
LEFT JOIN users assignee ON assignee.id = i.assignee_id
LEFT JOIN documents d ON d.id = i.source_document_id
WHERE i.project_id = :project_id
  AND i.status IN ('open', 'in_progress', 'blocked')
ORDER BY
  CASE i.severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  i.created_at DESC
LIMIT :limit;

-- 5. Project document list.
SELECT
  d.id,
  d.file_name,
  d.file_type,
  d.source_type,
  d.status,
  d.uploaded_at,
  uploader.name AS uploaded_by_name,
  COUNT(dc.id) AS chunk_count,
  latest_job.status AS latest_analysis_status,
  latest_job.progress_percent AS latest_analysis_progress
FROM documents d
JOIN users uploader ON uploader.id = d.uploaded_by
LEFT JOIN document_chunks dc ON dc.document_id = d.id
LEFT JOIN LATERAL (
  SELECT aj.status, aj.progress_percent
  FROM analysis_jobs aj
  WHERE aj.document_id = d.id
  ORDER BY aj.created_at DESC
  LIMIT 1
) latest_job ON true
WHERE d.project_id = :project_id
GROUP BY d.id, uploader.name, latest_job.status, latest_job.progress_percent
ORDER BY d.uploaded_at DESC, d.created_at DESC
LIMIT :limit;

-- 6. Project members.
SELECT
  pm.id,
  pm.role AS project_role,
  pm.joined_at,
  u.id AS user_id,
  u.name,
  u.email,
  u.role AS global_role
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = :project_id
ORDER BY
  CASE pm.role
    WHEN 'owner' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'member' THEN 3
    ELSE 4
  END,
  u.name ASC;

-- 7. Chat history with source metadata.
SELECT
  cm.id,
  cm.chat_session_id,
  cm.role,
  cm.content,
  cm.created_at,
  u.name AS user_name,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'document_id', cms.document_id,
        'chunk_id', cms.chunk_id,
        'source_label', cms.source_label,
        'page_number', cms.page_number
      )
    ) FILTER (WHERE cms.id IS NOT NULL),
    '[]'::jsonb
  ) AS sources_json
FROM chat_messages cm
JOIN chat_sessions cs ON cs.id = cm.chat_session_id
LEFT JOIN users u ON u.id = cm.user_id
LEFT JOIN chat_message_sources cms ON cms.chat_message_id = cm.id
WHERE cs.project_id = :project_id
GROUP BY cm.id, u.name
ORDER BY cm.created_at ASC
LIMIT :limit;

-- 8. Latest handoff report with items.
SELECT
  hr.id,
  hr.title,
  hr.summary,
  hr.handoff_score,
  hr.created_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', hi.id,
        'item_type', hi.item_type,
        'title', hi.title,
        'body', hi.body,
        'priority', hi.priority,
        'status', hi.status
      )
    ) FILTER (WHERE hi.id IS NOT NULL),
    '[]'::jsonb
  ) AS items_json
FROM handoff_reports hr
LEFT JOIN handoff_items hi ON hi.handoff_report_id = hr.id
WHERE hr.project_id = :project_id
GROUP BY hr.id
ORDER BY hr.created_at DESC
LIMIT 1;

-- 9. Projects visible to a user.
SELECT
  p.id,
  p.name,
  p.description,
  p.status,
  p.start_date,
  p.end_date,
  t.name AS team_name,
  pm.role AS project_role
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
JOIN teams t ON t.id = p.team_id
WHERE pm.user_id = :user_id
ORDER BY p.updated_at DESC;
