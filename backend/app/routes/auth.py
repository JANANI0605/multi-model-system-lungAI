from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
from bson import ObjectId
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, AuthResponse
from app.auth.security import hash_password, verify_password
from app.auth.jwt_handler import create_access_token, get_current_user
from app.database import get_database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse)
async def register_user(req: UserRegisterRequest):
    if req.password != req.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
        
    db = get_database()
    
    # Check if user already exists
    if db is not None:
        try:
            existing = await db.users.find_one({"email": req.email.lower()})
            if existing:
                raise HTTPException(status_code=400, detail="Email is already registered.")
        except HTTPException:
            raise
        except Exception:
            pass

    hashed_pwd = hash_password(req.password)
    
    user_doc = {
        "name": req.name,
        "email": req.email.lower(),
        "passwordHash": hashed_pwd,
        "role": req.role.lower(), # patient or doctor
        "phone": req.phone,
        "dob": req.dob,
        "gender": req.gender,
        "profile": {
            "specialization": req.specialization,
            "licenseNumber": req.licenseNumber,
            "emergencyContact": req.emergencyContact,
            "medicalHistory": req.medicalHistory
        },
        "createdAt": datetime.utcnow().isoformat()
    }
    
    user_id = str(ObjectId())
    if db is not None:
        try:
            res = await db.users.insert_one(user_doc)
            user_id = str(res.inserted_id)
        except Exception as e:
            pass
            
    token = create_access_token({
        "sub": user_id,
        "email": req.email.lower(),
        "role": req.role.lower(),
        "name": req.name
    })
    
    user_response = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "role": req.role.lower(),
        "phone": req.phone,
        "dob": req.dob,
        "gender": req.gender,
        "profile": user_doc["profile"]
    }
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/login", response_model=AuthResponse)
async def login_user(req: UserLoginRequest):
    db = get_database()
    user = None
    
    if db is not None:
        try:
            user = await db.users.find_one({"email": req.email.lower()})
        except Exception:
            user = None
            
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    if not verify_password(req.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    # Auto-detect user's registered role
    user_role = user.get("role", req.role).lower()

    user_id = str(user["_id"])
    token = create_access_token({
        "sub": user_id,
        "email": user["email"],
        "role": user["role"],
        "name": user["name"]
    })

    user_response = {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "phone": user.get("phone"),
        "dob": user.get("dob"),
        "gender": user.get("gender"),
        "profile": user.get("profile", {})
    }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
