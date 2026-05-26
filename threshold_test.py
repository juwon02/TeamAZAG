"""
threshold_test.py — 임계값 찾기 도구
사용법: python threshold_test.py

직접 질문을 입력하고 유사도 결과를 보면서
적절한 임계값을 찾아보세요.
"""

import os
import sys
import pickle
import numpy as np
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

FAISS_DIR = os.getenv("FAISS_DIR", "./data/faiss")

def search(query: str, top_k: int = 10) -> list[dict]:
    """임계값 없이 top_k개 전부 반환."""
    import faiss

    client = AzureOpenAI(
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    )
    deployment = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")

    # 질문 임베딩
    response = client.embeddings.create(input=query, model=deployment)
    query_vector = np.array([response.data[0].embedding], dtype=np.float32)

    # FAISS 검색
    index = faiss.read_index(os.path.join(FAISS_DIR, "index.faiss"))
    with open(os.path.join(FAISS_DIR, "texts.pkl"), "rb") as f:
        texts = pickle.load(f)
    with open(os.path.join(FAISS_DIR, "metadatas.pkl"), "rb") as f:
        metadatas = pickle.load(f)

    distances, indices = index.search(query_vector, min(top_k, index.ntotal))

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx == -1:
            continue
        score = round(float(1 / (1 + dist)), 4)
        results.append({
            "score": score,
            "source": metadatas[idx].get("source", ""),
            "doc_type": metadatas[idx].get("doc_type", ""),
            "text": texts[idx][:120] + "..." if len(texts[idx]) > 120 else texts[idx],
        })

    return results


def print_results(query: str, results: list[dict], threshold: float = None):
    print(f"\n{'='*60}")
    print(f"질문: {query}")
    print(f"{'='*60}")

    for i, r in enumerate(results):
        # 임계값 기준으로 색 구분
        if threshold:
            status = "✅ 통과" if r["score"] >= threshold else "❌ 차단"
        else:
            status = ""

        print(f"\n#{i+1} 유사도: {r['score']}  {status}")
        print(f"  출처: {r['source']} ({r['doc_type']})")
        print(f"  내용: {r['text']}")

    if threshold:
        passed = [r for r in results if r["score"] >= threshold]
        blocked = [r for r in results if r["score"] < threshold]
        print(f"\n  임계값 {threshold} 기준: {len(passed)}개 통과, {len(blocked)}개 차단")


# ── 테스트 질문 목록 ──────────────────────────────────
TEST_QUERIES = [
    "이번 프로젝트에서 결정된 기술 스택이 뭐야?",
    "이성우가 해야 할 일이 뭐야?",
    "이슈가 뭐가 있어?",
    "서비스 이름이 뭐야?",
    "오늘 날씨가 어때?",           # 완전 무관한 질문 (차단되어야 함)
    "피자 맛있는 집 알려줘",        # 완전 무관한 질문 (차단되어야 함)
    "3주차 계획이 뭐야?",
    "백엔드 API 현황이 어때?",
]

if __name__ == "__main__":
    print("\n" + "="*60)
    print("임계값 탐색 도구")
    print("="*60)
    print("top_k=10으로 검색해서 유사도 분포를 확인해보세요.")
    print("관련 있는 결과와 없는 결과의 유사도 경계를 찾으면 됩니다.")

    # 테스트할 임계값 후보
    THRESHOLD_CANDIDATES = [0.35, 0.40, 0.42, 0.45, 0.50]

    print("\n어떻게 테스트할까요?")
    print("1. 전체 질문 자동 테스트")
    print("2. 직접 질문 입력")
    print("3. 임계값 비교 테스트")

    choice = input("\n선택 (1/2/3): ").strip()

    if choice == "1":
        # 전체 질문 자동 테스트
        for query in TEST_QUERIES:
            results = search(query, top_k=5)
            print_results(query, results)
            input("\n[Enter]를 누르면 다음 질문...")

    elif choice == "2":
        # 직접 질문 입력
        while True:
            query = input("\n질문 입력 (종료: q): ").strip()
            if query.lower() == "q":
                break
            results = search(query, top_k=10)
            print_results(query, results)

    elif choice == "3":
        # 임계값 비교
        print("\n테스트할 질문 선택:")
        for i, q in enumerate(TEST_QUERIES):
            print(f"  {i+1}. {q}")
        idx = int(input("번호: ")) - 1
        query = TEST_QUERIES[idx]

        results = search(query, top_k=10)

        print(f"\n임계값별 비교:")
        for threshold in THRESHOLD_CANDIDATES:
            passed = [r for r in results if r["score"] >= threshold]
            blocked = [r for r in results if r["score"] < threshold]
            print(f"  임계값 {threshold}: {len(passed)}개 통과 / {len(blocked)}개 차단")

        print_results(query, results)
        threshold = float(input("\n적용할 임계값 입력 (예: 0.42): "))
        print_results(query, results, threshold=threshold)

    print("\n\n적절한 임계값을 찾으면 retriever.py의")
    print("SCORE_THRESHOLD = 0.4 를 원하는 값으로 바꾸면 됩니다!")
