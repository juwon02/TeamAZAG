"""
비동기 DB 마이그레이션 스크립트
"""
import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

# DATABASE_URL 가져오기
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL이 .env에 없습니다")

# asyncpg를 사용하는 경우, postgresql+asyncpg:// 형태일 것
# 이미 그 형태라면 그대로 사용

async def migrate():
    # 비동기 엔진 생성
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    queries = [
        # todos 테이블에 컬럼 추가
        """
        ALTER TABLE todos 
        ADD COLUMN IF NOT EXISTS assignee_member_id UUID DEFAULT NULL;
        """,
        
        # issues 테이블에 컬럼 추가
        """
        ALTER TABLE issues 
        ADD COLUMN IF NOT EXISTS assignee_member_id UUID DEFAULT NULL;
        """,
    ]
    
    try:
        async with engine.begin() as connection:
            for query in queries:
                print(f"[실행] {query.strip()[:50]}...")
                await connection.execute(text(query))
                print("✅ 성공\n")
        
        print("🎉 마이그레이션 완료!")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        raise
    
    finally:
        await engine.dispose()

# 실행
if __name__ == "__main__":
    asyncio.run(migrate())