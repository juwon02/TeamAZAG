# 더미데이터 / DB Seed / RAG 적용 기준 정리

## 1. 결론

- 현재 `dummy` 브랜치의 데이터는 하나의 용도로 통일된 seed가 아니다. 업무 원천자료, 정형 CSV, 검증 정답, 확장 스키마 후보 seed, 현재 DB 호환 최소 seed가 함께 있다.
- 특히 `dummy_data/05_db_seed_v2`는 현재 공유 PostgreSQL DB에 바로 넣는 DB-ready seed가 아니다. 업무 도메인 매핑을 표현한 확장 v2 후보 seed에 가깝다.
- `dummy_data/06_current_db_seed`는 현재 코드의 주요 13개 테이블 컬럼과 UUID PK/FK에 맞춘 최소 seed 후보지만, 공유 DB에 무검증으로 실행할 대상은 아니다. 기존 데이터와의 unique 충돌, 적용된 migration, schema 위치를 먼저 확인해야 한다.
- 현재 공유 PostgreSQL DB는 UUID 기반 스키마이므로 문자열 ID seed를 그대로 넣으면 안 된다.
- documents row만 insert해도 RAG는 동작하지 않는다. RAG에는 `document_chunks`와 `chunk_embeddings`가 필요하다.
- 발표용으로는 raw document를 업로드 API 또는 `run_document_pipeline`에 태워 청킹과 임베딩을 생성하는 방식이 가장 안전하다.
- DB 구조는 더미데이터에 맞춰 바꾸지 않고, 더미데이터를 DB에 맞게 변환해야 한다.
- 이 문서는 저장소 파일과 `origin/SeongWoo-new2`의 코드·스키마를 기준으로 작성했다. 공유 DB에는 접속하지 않았으며 insert, update, delete를 실행하지 않았다.
- 점검 요청 경로 중 `docs/dummy-seed-compatibility.md`는 현재 저장소에 없다. 이 문서가 해당 호환성 판단을 대신한다.

## 2. 현재 데이터 폴더별 역할

| 경로 | 분류 및 역할 | DB 직접 적재 가능 여부 | RAG 직접 사용 가능 여부 | 필요한 추가 처리 / 주의사항 |
|---|---|---|---|---|
| `dummy_data/02_raw_documents` | **RAG 업로드용 raw document** 및 업무 원천 seed. 실무형 메일·채팅·물류·품질 기록 235개 | 아니오 | 업로드 파이프라인 경유 시 가능 | 파일 업로드 후 documents 생성, 파싱, 청킹, 임베딩 필요 |
| `dummy_data/03_structured_csv` | **업무 원천 seed**. 주문·구매·출하·클레임·이슈·문서 인덱스 6종 | 아니오 | 아니오 | 문자열 외부 ID를 UUID로 변환하고 실제 테이블 컬럼·status·FK로 매핑하는 loader 필요 |
| `dummy_data/04_expected_outputs_for_test` | **검증용 expected output** 6개 | 아니오 | 아니오 | 정답 예시다. 서비스 업로드와 DB 적재에서 반드시 제외 |
| `dummy_data/05_db_seed_v2` | **업무 원천 seed / 확장 v2 후보 seed**. 27개 CSV로 도메인 관계를 미리 표현 | 아니오 | 아니오 | 현재 DB에 없는 확장 테이블, 문자열 ID, 컬럼 차이가 있다. 현재 공유 DB에 직접 실행 금지 |
| `dummy_data/06_current_db_seed` | **현재 DB 호환 최소 seed 후보**. UUID 기반 13개 CSV, 242행 및 삽입 순서 SQL 제공 | 조건부 가능 | 아니오 | clean 테스트 DB에서 schema·migration·unique 충돌 사전 검증 후 사용. chunk/embedding은 생성하지 않음 |
| `dummy_data/2022` | **업무 원천 seed + loader/mapping preview**. raw 128개, mapping 5개, loader preview 6개 | 아니오 | raw 업로드 파이프라인 경유 시 가능 | preview는 실제 loader가 아니며 `out_preview`도 DB 직접 적재용이 아님. expected output 3개 제외 |

`dummy_data/2022/02_raw_documents`는 위 분류 안에서도 RAG 업로드용 raw document에 해당한다. `dummy_data/2022/06_loader_preview`는 deterministic UUID 매핑을 보여주는 loader/mapping preview일 뿐 실제 DB write를 수행하지 않는다.

### Expected output 혼입 점검

- 기본 `source_document_index.csv` 235행 중 expected output 경로 참조: 0건
- `05_db_seed_v2/documents.csv` 151행 중 expected output 경로 참조: 0건
- `06_current_db_seed/csv/documents.csv` 88행 중 expected output 경로 참조: 0건
- 2022 `source_document_index.csv` 128행 중 expected output 경로 참조: 0건

**expected_outputs_for_test는 검증용 정답 예시이며 실제 서비스 업로드 대상이나 DB 적재 대상이 아니다.**

## 3. 왜 그대로 DB에 넣으면 안 되는가

### UUID와 문자열 ID 불일치

- 업무 원천 CSV는 `DOC-0001`, `ISS-2025-006`, `USER-001`, `TEAM-001`, `ISSUE-2022-001` 같은 사람이 읽기 쉬운 외부 ID를 사용한다.
- `dummy_data/05_db_seed_v2`도 `PROJ-001`, `PM-001`, `TODO-0001`, `BE-ORDER-0001` 같은 문자열 ID를 사용한다.
- 현재 DB의 주요 PK/FK는 UUID다. 문자열 값을 UUID 컬럼에 직접 넣으면 타입 오류가 발생한다.
- `dummy_data/06_current_db_seed`와 2022 loader preview의 DB ID는 UUID v5로 변환되어 있다.

**문자열 외부 ID는 업무 원천 seed 식별자로는 사용할 수 있지만, UUID 기반 공유 DB에 그대로 INSERT하면 안 된다. DB 적재 전 deterministic UUID 변환이 필요하다.**

### 컬럼 매핑 차이

아래 표는 실제 `05_db_seed_v2` 헤더와 현재 코드의 DB 스키마를 비교한 결과다.

| 원천/후보 컬럼 | 현재 DB 대상 | 처리 규칙 |
|---|---|---|
| `documents.title` | `documents.file_name` | 파일명 또는 표시 제목으로 변환 |
| `documents.file_path` | `documents.storage_uri` | 저장소 기준 경로로 정규화 |
| `documents.doc_type` | `documents.file_type` | 허용 enum으로 정규화 |
| `documents.content_preview` | `document_chunks.content` | 원문 전체를 파싱·청킹해야 하며 preview만 적재하면 안 됨 |
| `todos.owner_member_id` | `todos.assignee_member_id` | member UUID로 변환 |
| `todos.related_issue_id` | `todos.linked_issue_id` | issue UUID로 변환 |
| `calendar_events.start_at` | `calendar_events.starts_at` | timestamp 변환 |
| `calendar_events.end_at` | `calendar_events.ends_at` | timestamp 변환 |
| `calendar_events.related_todo_id` | 직접 대응 컬럼 없음 | 필요한 경우 별도 연계 정책 수립 |
| `calendar_events.related_issue_id` | 직접 대응 컬럼 없음 | 필요한 경우 별도 연계 정책 수립 |
| `weekly_reports.period_start` | `weekly_reports.week_start` | date 변환 |
| `weekly_reports.period_end` | `weekly_reports.week_end` | date 변환 |
| `weekly_reports.summary` | `weekly_reports.content` | 본문으로 변환 |
| `monthly_reports.period_start` | `monthly_reports.month_start` | date 변환 |
| `monthly_reports.period_end` | `monthly_reports.month_end` | date 변환 |
| `monthly_reports.summary` | `monthly_reports.content` | 본문으로 변환 |

### 제약조건과 상태값

- 현재 스키마는 project, member, document, issue 간 FK를 검사한다. 부모 row보다 자식 row를 먼저 넣으면 실패한다.
- 현재 스키마는 issue status, todo status, severity, approval status 등에 CHECK 제약을 둔다.
- 원천 데이터의 `done`, `completed`, `open` 같은 표현은 대상 테이블별 허용값으로 정규화해야 한다.
- NOT NULL 컬럼과 unique 제약도 확인해야 한다. 기존 공유 DB에 같은 이메일, project/week, project/month 조합이 있으면 충돌할 수 있다.
- 공유 DB에 실제 적용된 migration이 저장소의 기준 스키마와 같은지는 DB 담당자가 read-only 조회로 확인해야 한다.

## 4. DB-ready seed와 업무 원천 seed의 차이

| 구분 | DB-ready seed | 업무 원천 seed |
|---|---|---|
| 테이블/파일명 | 실제 DB 테이블명과 일치 | 업무 관점 파일명 사용 가능 |
| 컬럼 | 실제 DB 컬럼명·타입과 일치 | 사람이 읽기 쉬운 업무 컬럼 사용 |
| ID | UUID 등 실제 DB 타입 사용 | 문자열 외부 ID 사용 가능 |
| FK | 실제 부모 UUID 참조 | 외부 ID 간 논리 연결 |
| 상태값 | CHECK 제약 허용값 사용 | 업무 표현 사용 가능 |
| 삽입 순서 | 부모→자식 순서 제공 | 별도 loader에서 결정 |
| 추가 작업 | 충돌·환경 사전 검증 | mapping, UUID 변환, status 정규화, FK 연결 필요 |

`05_db_seed_v2`는 파일명이 DB seed처럼 보이지만 현재 공유 DB 관점에서는 업무 원천 seed 또는 확장 스키마 후보로 취급해야 한다. `06_current_db_seed`는 DB-ready에 가까운 최소 후보지만 RAG-ready는 아니다.

## 5. RAG에 필요한 데이터 흐름

```text
raw document
→ documents
→ document_chunks
→ chunk_embeddings
→ RAG 검색
```

- SQL로 documents만 넣으면 문서 목록은 보일 수 있지만 RAG 검색은 안 된다.
- **documents row만 insert된 상태는 RAG 검색 가능 상태가 아니다. RAG 검색에는 document_chunks와 chunk_embeddings가 필요하다.**
- 현재 `05_db_seed_v2`에는 documents CSV는 있지만 `document_chunks`와 `chunk_embeddings` 파일 및 실제 embedding vector가 없다.
- 현재 `06_current_db_seed`에도 documents 88행은 있지만 chunk/embedding seed는 없다.
- 2022 loader preview는 documents/issues/todos preview만 만들며 chunk/embedding을 생성하지 않는다.
- `origin/SeongWoo-new2`에는 문서 업로드 API, `run_document_pipeline`, chunk 모델, embedding 저장소와 backfill 스크립트가 있다.
- 업로드 API 또는 `run_document_pipeline`을 사용하면 documents 생성 후 파싱·청킹·임베딩 단계가 이어질 수 있다. 실제 임베딩 성공 여부는 실행 환경의 AI 설정과 적용된 DB migration에 달려 있다.
- 이미 documents만 들어간 경우에는 raw 원문을 읽어 chunk를 생성한 뒤 embedding backfill을 실행해야 한다. embedding backfill만으로는 누락된 chunk 본문을 만들 수 없다.

## 6. 권장 적용 방식

### 권장 방식 A: raw_documents를 업로드 API 또는 문서 처리 파이프라인으로 넣기

장점:

- documents, chunks, embeddings가 같은 처리 흐름에서 생성된다.
- 파싱·청킹 규칙이 실제 서비스와 같아 RAG 준비 상태를 확인하기 쉽다.
- SQL seed보다 발표용 시연에 적합하다.

사전 확인:

- 업로드 대상은 `02_raw_documents`와 필요 시 `2022/02_raw_documents`로 한정한다.
- `04_expected_outputs_for_test`는 제외한다.
- 업로드 후 문서별 status, chunk 수, embedding 수를 확인한다.

### 권장 방식 B: 변환 loader로 documents/chunks 생성 후 embedding backfill

장점:

- 대량 데이터를 일괄 처리할 수 있다.

단점:

- loader 구현과 chunk 생성 로직이 필요하다.
- FK, UUID, status, 중복 및 재실행 안전성을 검증해야 한다.
- 현재 `05_db_seed_v2`와 2022 preview는 이 작업을 대신하는 완성 loader가 아니다.

### 비추천

- 현재 seed SQL을 공유 DB에 그대로 실행
- documents만 insert하고 RAG가 될 것이라고 가정
- 더미데이터에 맞춰 DB schema를 변경

## 7. 발표용 최종 데이터 고정 절차

1. 팀에서 최종 더미데이터 범위를 확정한다.
2. `dummy` 브랜치의 최종 commit을 고정한다.
3. 적용 방식을 업로드 파이프라인 또는 변환 loader + backfill 중 하나로 결정한다.
4. 공유 DB 초기 상태를 read-only SQL로 확인한다.
5. 더미 문서를 업로드하거나 검증된 loader로 적재한다.
6. `document_chunks` 생성 여부와 문서별 chunk 수를 확인한다.
7. `chunk_embeddings` 생성 여부와 실패 건수를 확인한다.
8. 대표 질문으로 RAG 검색 결과와 출처 문서를 테스트한다.
9. 발표용 DB 상태와 적용 commit을 기록하고 freeze한다.
10. 발표 전에는 더미데이터 추가·삭제와 재적재를 중단한다.

## 8. 팀에서 확인해야 할 질문

- 발표용 더미데이터 범위는 어느 폴더 기준인가?
- 2022 데이터도 발표에 포함할 것인가?
- 2026 H2 messy 데이터도 포함할 것인가?
- DB 반영 방식은 업로드 API인가, SQL seed인가, 변환 loader인가?
- 공유 DB를 누가 최종 반영할 것인가?
- RAG embedding backfill은 누가 언제 실행할 것인가?
- 발표용 DB 상태는 언제 freeze할 것인가?
- 기존 공유 DB 데이터는 삭제하고 다시 넣을 것인가, 추가만 할 것인가?

## 9. 담당 역할 제안

### 더미데이터 담당

- raw document, structured CSV, expected output 관리
- 각 데이터의 DB-ready 여부 명시
- 외부 ID와 DB 컬럼 mapping 문서 제공

### DB/백엔드 담당

- 실제 공유 DB schema와 적용 migration 확인
- 변환 loader 또는 업로드 API 경로 확정
- FK, UUID, status, unique 충돌 검증

### RAG 담당

- 문서 업로드 또는 pipeline 실행
- chunks 생성 확인
- embeddings 생성 확인
- RAG 검색과 출처 연결 테스트

### 프론트 담당

- 최종 데이터 기준으로 화면 표시 확인
- 보고서와 인수인계 결과 표시 확인

## 10. 실행하면 안 되는 것

- 검증 없이 공유 DB에 seed SQL 실행 금지
- DUMMY 형태의 문자열 ID를 UUID 컬럼에 직접 insert 금지
- expected output을 업로드 대상에 포함 금지
- documents만 insert하고 RAG 가능하다고 판단 금지
- 발표 직전 더미데이터 임의 추가 금지
- 더미데이터 때문에 DB schema 변경 금지

## 11. 공유 DB 상태 확인 SQL

아래 SQL은 팀원이 read-only 확인용으로 실행할 예시다. 이 문서 작업에서는 실행하지 않았다. DB schema가 별도 namespace에 있다면 연결 환경에 맞는 schema를 명시해야 한다.

### 주요 row 수

```sql
select count(*) as documents_count from documents;
select count(*) as chunks_count from document_chunks;
select count(*) as embeddings_count from chunk_embeddings;
select count(*) as issues_count from issues;
select count(*) as todos_count from todos;
```

### 최근 문서

```sql
select id, file_name, file_type, storage_uri, analysis_status, created_at
from documents
order by created_at desc
limit 20;
```

### 문서별 RAG 준비 상태

```sql
select d.id, d.file_name, count(dc.id) as chunk_count
from documents d
left join document_chunks dc on dc.document_id = d.id
group by d.id, d.file_name, d.created_at
order by d.created_at desc
limit 20;
```

### embedding 수

```sql
select count(*) as embedding_count
from chunk_embeddings;
```

### orphan chunk

```sql
select dc.id
from document_chunks dc
left join documents d on d.id = dc.document_id
where d.id is null;
```

### chunk가 없는 document

```sql
select d.id, d.file_name
from documents d
left join document_chunks dc on dc.document_id = d.id
where dc.id is null
order by d.created_at desc;
```

## 12. 최종 요약

현재 dummy seed는 일부 DB-ready가 아니라 업무 원천 seed입니다. 공유 DB에 그대로 넣으면 UUID, 컬럼명, 상태값, FK 문제로 실패할 수 있습니다. 또한 documents만 insert하면 RAG 검색이 되지 않으므로 `document_chunks`와 `chunk_embeddings` 생성이 필요합니다. 발표용으로는 더미 raw document를 업로드 파이프라인에 태워 청킹과 임베딩까지 생성하는 방식이 가장 안전합니다. 먼저 최종 더미 범위와 DB 반영 방식을 팀에서 확정한 뒤, 한 번에 적용하고 RAG를 검증해야 합니다.
