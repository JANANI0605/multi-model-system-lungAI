from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any

class UserRegisterRequest(BaseModel):
    name: str = Field(..., example="Janani S")
    email: EmailStr = Field(..., example="janani@example.com")
    password: str = Field(..., min_length=6)
    confirmPassword: str
    role: str = Field(..., example="patient")  # patient or doctor
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    
    # Doctor specific fields
    specialization: Optional[str] = None
    licenseNumber: Optional[str] = None
    
    # Patient specific fields
    emergencyContact: Optional[str] = None
    medicalHistory: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
