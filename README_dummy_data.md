# AutoParts One Korea 더미 데이터

## 목적
이 데이터셋은 자동차 부품 B2B 운영관리 시나리오에서 AI가 보고서, Todo, 리스크, 인수인계서 초안을 생성하는 기능을 검증하기 위한 더미 데이터입니다.

## 폴더 구조
- `01_master_data`: 직원, 고객사, 구매처, 품목 기준정보
- `02_raw_documents`: 메일, 품질 클레임, 물류 로그, 회의록, 채팅 로그 원천 문서
- `03_structured_csv`: 주문, 구매, 출하, 클레임, 이슈 이벤트, 문서 인덱스 CSV
- `04_expected_outputs_for_test`: 개발 검증용 결과 샘플이며 실제 서비스 업로드 대상이 아닙니다.
- `05_db_seed_v2`: OpsRadar2 v2 MVP DB seed CSV

## 특수 시나리오 9개
1. 2025년 6월 Daesung Automotive 긴급 발주 대응
2. 2025년 8월 KET Supplier 재고 부족과 납기 지연 가능성
3. 2025년 9월 Global Harness Vietnam 수출 서류 누락과 통관 지연
4. 2025년 11월 Mirae EV Systems 센서 케이블 반복 클레임
5. 2025년 12월 Yazaki Parts Asia 리드타임 8주에서 12주 증가
6. 2026년 2월 Hyundai Mobis Tier2 긴급 항공 이송
7. 2026년 4월 TE Connectivity Korea 단가 7% 인상 통보
8. 2026년 5~6월 박서연 담당 고객 업무 일부 인수인계
9. 2026년 5월 Hanil Motors 수량 불일치 클레임

## 신규 시나리오 9 설명
Hanil Motors 입고 검사에서 AP-CB-510 케이블 어셈블리 2,000개 중 1,850개만 확인되어 내부 출고 수량과 고객 입고 수량이 불일치한 상황입니다. 영업관리팀, 물류팀, 품질 클레임팀이 공동으로 출고 검수표, 패킹 리스트, 운송장 인수증, 고객 입고 검수 결과를 대조해야 합니다. 인수인계서에는 출고 검증, 재출고 가능성, 고객 회신 일정, 차액 조정 검토가 추출되어야 합니다.

## 서비스 입력 데이터와 expected output의 차이
`02_raw_documents`와 `03_structured_csv`는 실제 서비스 업로드 및 분석 대상입니다. `04_expected_outputs_for_test`는 검증용 샘플 결과물이므로 실제 서비스 입력에 포함하면 안 됩니다.

## 재생성 명령어
```bash
python scripts/generate_dummy_data.py
python scripts/convert_dummy_to_seed_v2.py
```
