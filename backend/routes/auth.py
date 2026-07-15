import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db
from backend.config import settings
from backend.models import User, Streak
from backend.schemas import UserRegister, UserLogin, Token, UserResponse, GoogleLoginRequest
from backend.utils.auth_helper import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_google_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    password_hash = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=password_hash
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize learning streak
    new_streak = Streak(user_id=new_user.id, current_streak=0, longest_streak=0)
    db.add(new_streak)
    db.commit()
    
    # Create token
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if not db_user or not db_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    if not verify_password(user_data.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
        
    access_token = create_access_token(data={"sub": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/google", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    # Verify Google token
    try:
        google_user = verify_google_token(payload.token)
    except Exception as e:
        # Fallback Mock Sign-in for local environment testing if no internet or client id is invalid
        # To make it friendly, if token is "mock_user_token", we authorize a mock account.
        if payload.token.startswith("mock_"):
            mock_email = f"{payload.token}@example.com"
            mock_name = payload.token.replace("mock_", "").title()
            google_user = {
                "email": mock_email,
                "name": mock_name,
                "picture": None
            }
        else:
            raise e

    email = google_user.get("email")
    name = google_user.get("name")
    avatar_url = google_user.get("picture")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google OAuth"
        )
        
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create user without password
        user = User(
            email=email,
            name=name,
            avatar_url=avatar_url,
            password_hash=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Initialize streak
        new_streak = Streak(user_id=user.id, current_streak=0, longest_streak=0)
        db.add(new_streak)
        db.commit()
    else:
        # Update name or avatar if needed
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if name and not user.name:
            user.name = name
        db.commit()
        db.refresh(user)
        
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/google/client-id")
def get_google_client_id():
    return {"client_id": settings.google_client_id}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None

@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.name:
        current_user.name = payload.name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.password:
        current_user.password_hash = get_password_hash(payload.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user
