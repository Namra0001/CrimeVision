from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.db.session import SessionLocal
from app.models.user import User
from app.api.deps import get_db, get_current_user

router = APIRouter()

class UnverifiedUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.email != "admin@ksp.gov.in":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

@router.get("/unverified-users", response_model=List[UnverifiedUserResponse])
def get_unverified_users(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    users = db.query(User).filter(User.is_verified_by_admin == False, User.email != "admin@ksp.gov.in", User.status != "rejected").all()
    return users

@router.get("/verified-users", response_model=List[UnverifiedUserResponse])
def get_verified_users(db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    users = db.query(User).filter(User.is_verified_by_admin == True, User.email != "admin@ksp.gov.in", User.status != "removed").all()
    return users

@router.post("/verify-user/{user_id}")
def verify_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified_by_admin = True
    db.commit()
    
    return {"message": "User verified successfully"}

@router.post("/reject-user/{user_id}")
def reject_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = "rejected"
    db.commit()
    
    return {"message": "User rejected successfully"}

@router.post("/remove-user/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User removed successfully"}
