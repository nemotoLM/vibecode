from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from datetime import datetime
import os
from typing import Optional
from dotenv import load_dotenv
import jwt
from jwt import PyJWKClient

app = FastAPI(title="VibeCode API")

# backend/.env を自動ロード（ローカル開発用）
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース設定
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    # パスワード無しで使う想定: Unixソケット + peer認証
    # 例: postgresql://snem11@/vibecode?host=/var/run/postgresql
    "postgresql://snem11@/vibecode?host=/var/run/postgresql"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# モデル定義
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    auth0_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    picture = Column(String, nullable=True)
    last_token = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# テーブル作成
Base.metadata.create_all(bind=engine)

# 既存DBに後から列を追加した場合の簡易マイグレーション（Vibe用）
try:
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("users")}
    if "last_token" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_token TEXT"))
except Exception as e:
    # DB未作成/権限不足など。起動自体を止めない
    print("DBマイグレーション警告（無視可能）:", e)

# Auth0設定
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "your-domain.auth0.com")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", f"https://{AUTH0_DOMAIN}/api/v2/")

# JWT検証用のクライアント
jwks_client = PyJWKClient(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_token(authorization: Optional[str] = Header(None)) -> dict:
    """Auth0のトークンを検証"""
    if not authorization:
        raise HTTPException(status_code=401, detail="認証トークンが必要です")
    
    try:
        token = authorization.replace("Bearer ", "")
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        # B案（簡易モード）: audience 検証を無効化してまず動かす
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=f"https://{AUTH0_DOMAIN}/",
            options={"verify_exp": True, "verify_aud": False}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="トークンの有効期限が切れています")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"無効なトークン: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "VibeCode API", "status": "running"}

@app.get("/api/protected")
def protected_route(
    token: dict = Depends(verify_token),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """保護されたエンドポイント"""
    auth0_id = token.get("sub")
    raw_token = authorization.replace("Bearer ", "") if authorization else None
    
    # ユーザー情報をDBから取得または作成
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user:
        # 新規ユーザーを作成
        user = User(
            auth0_id=auth0_id,
            email=token.get("email"),
            name=token.get("name"),
            picture=token.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    # トークンを保存（テスト用途）
    if raw_token:
        user.last_token = raw_token
        db.add(user)
        db.commit()
    
    return {
        "message": "保護されたコンテンツにアクセスしました",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        },
        "saved_token_preview": (raw_token[:24] + "…") if raw_token else None,
        "token_info": {
            "sub": token.get("sub"),
            "exp": token.get("exp")
        }
    }

@app.get("/api/token/latest")
def latest_token(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """DBに保存した最新トークン（テスト用途）"""
    auth0_id = token.get("sub")
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    if not user or not user.last_token:
        return {"token": None}
    return {"token": user.last_token}

@app.get("/api/users/me")
def get_current_user(token: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """現在のユーザー情報を取得"""
    auth0_id = token.get("sub")
    user = db.query(User).filter(User.auth0_id == auth0_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    
    return {
        "id": user.id,
        "auth0_id": user.auth0_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
