# AutoParts One Korea 더미 데이터

## 1. 목적
이 데이터셋은 자동차 부품 유통/공급 운영 시나리오에서 AI가 보고서와 인수인계서 초안을 생성하는 기능을 테스트하기 위한 1년치 더미 데이터입니다. 실제 서비스 입력 대상은 `02_raw_documents`와 `03_structured_csv`입니다.

## 2. 폴더 구조
- `01_master_data`: 직원, 고객사, 구매처, 품목 기준정보
- `02_raw_documents`: 메일, 클레임, 물류 로그, 회의록, 채팅 로그 원천 문서
- `03_structured_csv`: 주문, 구매, 출하, 클레임, 이슈 이벤트, 문서 인덱스 CSV
- `04_expected_outputs_for_test`: 개발 검증용 샘플 결과물 3개

## 3. 서비스 입력 데이터와 expected output의 차이
`02_raw_documents`와 `03_structured_csv`는 AI가 실제로 분석해야 하는 입력 데이터입니다. `04_expected_outputs_for_test`는 모델이 만들 수 있는 결과 형태를 확인하기 위한 정답 예시이며, 실제 업로드 또는 분석 대상에 포함하면 안 됩니다.

## 4. 특수 시나리오 8개
1. 2025년 6월 Daesung Automotive 긴급 발주 대응
2. 2025년 8월 KET Supplier 재고 부족과 납기 지연 가능성
3. 2025년 9월 Global Harness Vietnam 수출 서류 누락과 통관 지연
4. 2025년 11월 Mirae EV Systems 센서 케이블 반복 클레임
5. 2025년 12월 Yazaki Parts Asia 리드타임 8주에서 12주 증가
6. 2026년 2월 Hyundai Mobis Tier2 긴급 항공 이송
7. 2026년 4월 TE Connectivity Korea 단가 7% 인상 통보
8. 2026년 5~6월 박서연 담당 고객 업무 일부 인수인계

## 5. 인수인계 테스트 방법
1. `02_raw_documents`와 `03_structured_csv`만 업로드합니다.
2. 박서연 담당 고객인 Hyundai Mobis Tier2와 Daesung Automotive를 대상으로 인수인계서 생성을 요청합니다.
3. 결과에 고객별 미완료 Todo, 주요 이슈, 리스크, 담당자, 마감일, 다음 액션이 포함되는지 확인합니다.
4. `04_expected_outputs_for_test/expected_handover_sample.md`는 비교용으로만 사용합니다.

## 6. 주의사항
`04_expected_outputs_for_test`는 실제 업로드 대상이 아닙니다. 이 폴더를 AI 입력에 포함하면 평가가 오염될 수 있습니다.

## 재생성
```bash
python scripts/generate_dummy_data.py
```
