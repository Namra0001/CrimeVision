from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import verify_password, create_access_token
from app.api.deps import get_db, get_current_user

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    station_id: Optional[int]
    district_id: Optional[int]
    
    class Config:
        from_attributes = True

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your email is not verified. Please complete OTP verification.",
        )
    if not user.is_verified_by_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin verification.",
        )
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserProfile)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Added Registration, OTP, Forgot Password
import random
from datetime import datetime, timedelta
from app.models.user import OTPVerification
from app.core.security import get_password_hash
from app.utils.email import send_otp_email

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    otp = str(random.randint(100000, 999999))
    otp_hash = get_password_hash(otp)
    expires = datetime.utcnow() + timedelta(minutes=10)
    
    otp_entry = OTPVerification(email=req.email, otp_hash=otp_hash, expires_at=expires, purpose="register")
    db.add(otp_entry)
    
    # Store user with inactive state, wait for OTP
    new_user = User(
        email=req.email,
        full_name=req.email.split('@')[0],
        hashed_password=get_password_hash(req.password),
        role=req.role,
        is_active=False
    )
    db.add(new_user)
    db.commit()
    
    send_otp_email(req.email, otp, purpose="register")
    return {"message": "OTP sent"}

@router.post("/verify-registration")
def verify_registration(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    otp_entry = db.query(OTPVerification).filter(OTPVerification.email == req.email, OTPVerification.purpose == "register").order_by(OTPVerification.id.desc()).first()
    if not otp_entry or otp_entry.expires_at < datetime.utcnow() or not verify_password(req.otp, otp_entry.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        user.is_active = True
        db.commit()
        return {"message": "User verified and activated"}
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    otp_hash = get_password_hash(otp)
    expires = datetime.utcnow() + timedelta(minutes=10)
    
    otp_entry = OTPVerification(email=req.email, otp_hash=otp_hash, expires_at=expires, purpose="reset")
    db.add(otp_entry)
    db.commit()
    
    send_otp_email(req.email, otp, purpose="reset")
    return {"message": "OTP sent"}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    otp_entry = db.query(OTPVerification).filter(OTPVerification.email == req.email, OTPVerification.purpose == "reset").order_by(OTPVerification.id.desc()).first()
    if not otp_entry or otp_entry.expires_at < datetime.utcnow() or not verify_password(req.otp, otp_entry.otp_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        user.hashed_password = get_password_hash(req.new_password)
        db.commit()
        return {"message": "Password reset successfully"}
    raise HTTPException(status_code=404, detail="User not found")
