from datetime import datetime, timedelta
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings
from app.database import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

from bson import ObjectId

def safe_user_query(user_id: str):
    try:
        return {"$or": [{"_id": ObjectId(user_id)}, {"id": user_id}]}
    except Exception:
        return {"id": user_id}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    db = get_database()
    if db is not None:
        try:
            query = safe_user_query(user_id)
            raw_user = await db.users.find_one(query)
            if raw_user:
                user = dict(raw_user)
                user["id"] = str(user.get("_id", user.get("id")))
                user.pop("_id", None)  # Remove raw ObjectId to ensure clean JSON serialization
                user.pop("passwordHash", None)
                return user
        except Exception as e:
            print(f"Error retrieving current user: {e}")
            
    return {
        "id": user_id,
        "email": payload.get("email", ""),
        "role": payload.get("role", "patient"),
        "name": payload.get("name", "User")
    }

def require_role(allowed_roles: list):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Requires one of roles: {allowed_roles}"
            )
        return current_user
    return role_checker
