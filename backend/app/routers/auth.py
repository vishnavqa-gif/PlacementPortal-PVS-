from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
import uuid, secrets
from pydantic import BaseModel, EmailStr
from app.database.session import get_db
from app.models.models import User, Student, AuditLog
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, get_current_user, decode_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/register", status_code=201)
async def register(data: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password_hash=get_password_hash(data.password),
                role="student", first_name=data.first_name, last_name=data.last_name, phone=data.phone)
    db.add(user)
    await db.flush()
    student_id = f"STU{datetime.utcnow().year}{str(user.id)[:6].upper()}"
    student = Student(user_id=user.id, student_id=student_id)
    db.add(student)
    db.add(AuditLog(user_id=user.id, action="USER_REGISTER", description=f"Student registered: {user.email}"))
    await db.commit()
    return {"message": "Registration successful", "user_id": str(user.id)}

@router.post("/login")
async def login(data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive")
    await db.execute(update(User).where(User.id == user.id).values(last_login=datetime.utcnow()))
    token_data = {"sub": str(user.id), "role": user.role, "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    db.add(AuditLog(user_id=user.id, action="USER_LOGIN", description=f"Login: {user.email}"))
    await db.commit()
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer",
            "user": {"id": str(user.id), "email": user.email, "role": user.role,
                     "first_name": user.first_name, "last_name": user.last_name, "phone": user.phone}}

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    result = await db.execute(select(User).where(User.id == uuid.UUID(payload.get("sub"))))
    user = result.scalar_one_or_none()
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="User not found")
    token_data = {"sub": str(user.id), "role": user.role, "email": user.email}
    return {"access_token": create_access_token(token_data), "token_type": "bearer"}

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        token = secrets.token_urlsafe(32)
        from datetime import timedelta
        expires = datetime.utcnow() + timedelta(hours=1)
        await db.execute(update(User).where(User.id == user.id).values(reset_token=token, reset_token_expires=expires))
        await db.commit()
    return {"message": "If an account exists with that email, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.reset_token == data.token, User.reset_token_expires > datetime.utcnow()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await db.execute(update(User).where(User.id == user.id).values(password_hash=get_password_hash(data.new_password), reset_token=None, reset_token_expires=None))
    await db.commit()
    return {"message": "Password reset successful"}

@router.post("/change-password")
async def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.execute(update(User).where(User.id == current_user.id).values(password_hash=get_password_hash(data.new_password)))
    await db.commit()
    return {"message": "Password changed successfully"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "role": current_user.role,
            "status": current_user.status, "first_name": current_user.first_name,
            "last_name": current_user.last_name, "phone": current_user.phone,
            "profile_picture": current_user.profile_picture, "last_login": current_user.last_login}
