from openai import AzureOpenAI
from dotenv import load_dotenv
import os, uuid
import chromadb

load_dotenv()

client = AzureOpenAI(
    api_key=os.getenv('AZURE_OPENAI_API_KEY'),
    azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT'),
    api_version=os.getenv('AZURE_OPENAI_API_VERSION')
)

print('1. 임베딩 생성 중...')
r = client.embeddings.create(
    input='테스트 문장입니다',
    model=os.getenv('AZURE_OPENAI_EMBEDDING_DEPLOYMENT')
)
embedding = r.data[0].embedding
print(f'2. 임베딩 완료: {len(embedding)}차원')

print('3. Chroma 저장 중...')
db = chromadb.EphemeralClient()
col = db.get_or_create_collection('test')

# 메타데이터 값을 전부 문자열로 변환
col.add(
    ids=[str(uuid.uuid4())],
    embeddings=[embedding],
    documents=['테스트 문장입니다'],
    metadatas=[{'type': 'test', 'document_id': '1', 'chunk_index': '0'}]  # 정수 → 문자열
)
print(f'4. 저장 완료! 벡터 수: {col.count()}')
