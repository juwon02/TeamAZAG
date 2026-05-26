"""
faiss_store.py — FAISS 벡터 검색 모듈
팀메모리 (OpsRadar) 프로젝트 / 담당: 이성우

역할: retriever.py에서 분리된 FAISS 전용 모듈.
      벡터 저장, 검색, 로드 기능을 담당.

팀 최종 구조 기준:
  vectorstores/faiss_store.py  ← 이 파일

사용 방법:
    from vectorstores.faiss_store import FAISSStore

    store = FAISSStore()

    # 저장
    store.add(texts, embeddings, metadatas)

    # 검색
    results = store.search(query_embedding, top_k=3)

    # 초기화
    store.reset()
"""

import os
import pickle
import logging
import numpy as np
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# 팀 최종 구조 기준 저장 경로
FAISS_DIR = os.getenv("FAISS_DIR", "./data/faiss")


class FAISSStore:
    """
    FAISS 벡터 DB 래퍼 클래스.
    embedder.py에서 저장, retriever.py에서 검색할 때 사용.
    """

    def __init__(self, faiss_dir: str = FAISS_DIR):
        self.faiss_dir = faiss_dir
        self.index_path = os.path.join(faiss_dir, "index.faiss")
        self.texts_path = os.path.join(faiss_dir, "texts.pkl")
        self.metadatas_path = os.path.join(faiss_dir, "metadatas.pkl")

    # ────────────────────────────────────────────
    # 저장 (embedder.py에서 호출)
    # ────────────────────────────────────────────

    def add(
        self,
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> int:
        """
        벡터 추가 저장.
        기존 DB가 있으면 추가, 없으면 새로 생성.

        Args:
            texts      : 원본 텍스트 리스트
            embeddings : 벡터 리스트 (각 벡터는 float 리스트)
            metadatas  : 메타데이터 리스트

        Returns:
            저장 후 총 벡터 수

        Raises:
            ValueError: 입력 리스트 길이 불일치
            RuntimeError: 저장 실패
        """
        import faiss

        if not (len(texts) == len(embeddings) == len(metadatas)):
            raise ValueError(
                f"[faiss_store] 리스트 길이 불일치: "
                f"texts={len(texts)}, embeddings={len(embeddings)}, metadatas={len(metadatas)}"
            )
        if not texts:
            raise ValueError("[faiss_store] 저장할 데이터가 없습니다.")

        vectors = np.array(embeddings, dtype=np.float32)
        dimension = vectors.shape[1]

        os.makedirs(self.faiss_dir, exist_ok=True)

        if os.path.exists(self.index_path):
            # 기존 DB에 추가
            index = faiss.read_index(self.index_path)
            existing_texts, existing_metadatas = self._load_pkl()
            index.add(vectors)
            existing_texts.extend(texts)
            existing_metadatas.extend(metadatas)
        else:
            # 새로 생성
            index = faiss.IndexFlatL2(dimension)
            index.add(vectors)
            existing_texts = texts
            existing_metadatas = metadatas

        faiss.write_index(index, self.index_path)
        self._save_pkl(existing_texts, existing_metadatas)

        total = index.ntotal
        logger.info(f"[faiss_store] {len(texts)}개 추가 완료. 총 벡터: {total}개")
        print(f"[faiss_store] {len(texts)}개 추가 완료. 총 벡터: {total}개")
        return total

    def overwrite(
        self,
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> int:
        """
        기존 DB를 지우고 새로 저장.
        embedder.py의 reset + add 조합 대신 사용.
        """
        self.reset()
        return self.add(texts, embeddings, metadatas)

    # ────────────────────────────────────────────
    # 검색 (retriever.py에서 호출)
    # ────────────────────────────────────────────

    def search(
        self,
        query_embedding: list[float],
        top_k: int = 3,
        doc_type: Optional[str] = None,
        document_id: Optional[int] = None,
    ) -> list[dict]:
        """
        쿼리 벡터와 가장 유사한 청크 검색.

        Args:
            query_embedding : 질문의 벡터 (float 리스트)
            top_k           : 반환할 최대 결과 수 (기본 3)
            doc_type        : 필터 (meeting/email/chat/csv/handover/report)
            document_id     : 특정 문서 ID 필터

        Returns:
            [
                {
                    "text": "청크 텍스트",
                    "score": 0.91,
                    "source": "meeting_2026_05_11_final.txt",
                    "file_name": "meeting_2026_05_11_final.txt",
                    "document_id": 4,
                    "doc_type": "meeting",
                    "date": "2026-05-11",
                    "metadata": { ... }
                },
                ...
            ]

        Raises:
            FileNotFoundError: FAISS DB 없음
            ValueError: 잘못된 top_k
        """
        import faiss

        if not 1 <= top_k <= 50:
            raise ValueError(f"[faiss_store] top_k는 1~50 사이여야 합니다: {top_k}")

        self._check_db_exists()

        texts, metadatas = self._load_pkl()
        index = faiss.read_index(self.index_path)

        query_vector = np.array([query_embedding], dtype=np.float32)

        # 필터가 있으면 더 많이 검색 후 필터링
        search_k = min(top_k * 10 if (doc_type or document_id) else top_k, index.ntotal)
        distances, indices = index.search(query_vector, search_k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue

            meta = metadatas[idx]

            # 필터 적용
            if doc_type and meta.get("doc_type") != doc_type:
                continue
            if document_id and meta.get("document_id") != document_id:
                continue

            score = round(float(1 / (1 + dist)), 4)
            results.append({
                "text": texts[idx],
                "score": score,
                "source": meta.get("source", ""),
                "file_name": meta.get("file_name", meta.get("source", "")),
                "document_id": meta.get("document_id"),
                "doc_type": meta.get("doc_type", ""),
                "date": meta.get("date", ""),
                "metadata": meta,
            })

            if len(results) >= top_k:
                break

        logger.info(f"[faiss_store] 검색 완료: {len(results)}개 결과")
        return results

    # ────────────────────────────────────────────
    # 유틸리티
    # ────────────────────────────────────────────

    def count(self) -> int:
        """저장된 벡터 수 반환."""
        import faiss
        if not os.path.exists(self.index_path):
            return 0
        index = faiss.read_index(self.index_path)
        return index.ntotal

    def reset(self):
        """FAISS DB 초기화. 주의: 모든 벡터 삭제됨."""
        import shutil
        if os.path.exists(self.faiss_dir):
            shutil.rmtree(self.faiss_dir)
            print(f"[faiss_store] DB 초기화 완료: {self.faiss_dir}")
        else:
            print(f"[faiss_store] 초기화할 DB가 없습니다.")

    def exists(self) -> bool:
        """FAISS DB가 존재하는지 확인."""
        return os.path.exists(self.index_path)

    # ────────────────────────────────────────────
    # 내부 헬퍼
    # ────────────────────────────────────────────

    def _check_db_exists(self):
        """DB 파일 존재 확인."""
        missing = [
            f for f in [self.index_path, self.texts_path, self.metadatas_path]
            if not os.path.exists(f)
        ]
        if missing:
            raise FileNotFoundError(
                f"[faiss_store] FAISS DB 파일 누락: {missing}\n"
                f"  → python -m app.ai.embedder 를 먼저 실행하세요."
            )

    def _load_pkl(self) -> tuple[list, list]:
        """텍스트와 메타데이터 pkl 파일 로드."""
        with open(self.texts_path, "rb") as f:
            texts = pickle.load(f)
        with open(self.metadatas_path, "rb") as f:
            metadatas = pickle.load(f)
        return texts, metadatas

    def _save_pkl(self, texts: list, metadatas: list):
        """텍스트와 메타데이터 pkl 파일 저장."""
        with open(self.texts_path, "wb") as f:
            pickle.dump(texts, f)
        with open(self.metadatas_path, "wb") as f:
            pickle.dump(metadatas, f)


# ────────────────────────────────────────────
# 테스트 (python -m vectorstores.faiss_store)
# ────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)

    print("=" * 50)
    print("faiss_store.py 테스트")
    print("=" * 50)

    store = FAISSStore()

    # DB 상태 확인
    print(f"\n현재 DB 존재 여부: {store.exists()}")
    print(f"현재 벡터 수: {store.count()}")

    # DB 없을 때 검색 오류 테스트
    print("\n[테스트 1] DB 없을 때 search()")
    try:
        store.search([0.1] * 3072)
    except FileNotFoundError as e:
        print(f"✅ FileNotFoundError 정상 처리")

    # 실제 검색 테스트 (기존 faiss_db가 있으면)
    old_db = "./faiss_db"
    if os.path.exists(old_db):
        print(f"\n[테스트 2] 기존 faiss_db에서 검색 테스트")
        old_store = FAISSStore(faiss_dir=old_db)
        print(f"기존 DB 벡터 수: {old_store.count()}")

        from dotenv import load_dotenv
        from openai import AzureOpenAI
        load_dotenv()

        client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        )
        query = "이성우가 해야 할 일이 뭐야?"
        response = client.embeddings.create(
            input=query,
            model=os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
        )
        query_embedding = response.data[0].embedding

        results = old_store.search(query_embedding, top_k=3)
        print(f"\n질문: {query}")
        for i, r in enumerate(results):
            print(f"  #{i+1} 유사도: {r['score']} | 출처: {r['source']}")

    print("\n✅ faiss_store.py 테스트 완료!")
