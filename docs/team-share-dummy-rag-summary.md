# 팀 공유용 요약

## 결론

- 현재 dummy seed는 그대로 공유 DB에 넣으면 안 됩니다.
- 이유는 UUID, 컬럼명, status, FK가 현재 DB와 다를 수 있기 때문입니다.
- 특히 `dummy_data/05_db_seed_v2`는 현재 공유 DB용 DB-ready seed가 아니라 확장 v2 후보 또는 업무 원천 seed입니다.
- `dummy_data/06_current_db_seed`는 UUID와 주요 DB 컬럼에 맞춘 최소 seed 후보지만 chunk와 embedding은 만들지 않습니다.
- documents만 넣어도 RAG는 동작하지 않습니다.
- RAG에는 `document_chunks`와 `chunk_embeddings`가 필요합니다.
- 발표용으로는 `raw_documents`를 업로드 파이프라인에 태우는 방식이 가장 안전합니다.

## 지금 정해야 할 것

1. 발표용 더미데이터 범위
2. DB 반영 방식
3. 최종 적용 담당자
4. RAG backfill 담당자
5. 발표용 DB freeze 시점

## 제안

- `dummy` 브랜치 최종 데이터와 commit 확정
- `02_raw_documents`와 필요 시 `2022/02_raw_documents`만 업로드 파이프라인으로 처리
- chunks와 embeddings 생성 확인
- 대표 질문으로 RAG 검색과 출처 연결 테스트
- 이후 발표 전까지 DB 상태 고정

## 주의

- seed SQL을 검증 없이 공유 DB에 실행하지 말 것
- `04_expected_outputs_for_test`는 업로드하지 말 것
- 문자열 외부 ID를 UUID 컬럼에 직접 넣지 말 것
- 더미데이터에 맞춰 DB schema를 바꾸지 말 것

상세 기준: `docs/dummy-data-db-rag-handoff.md`
