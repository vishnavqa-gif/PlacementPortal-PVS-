from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
import uuid

from app.database.session import get_db
from app.models.models import User, Admin, AuditLog, SystemSetting
from app.schemas.schemas import RegisterRequest
from app.core.security import get_password_hash, require_super_admin

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])


@router.get("/admins")
async def list_admins(
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.role == "admin")
    )
    admins = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "phone": u.phone,
            "status": u.status,
            "created_at": str(u.created_at),
        }
        for u in admins
    ]


@router.post("/admins", status_code=201)
async def add_admin(
    data: RegisterRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        role="admin",
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
    )
    db.add(user)
    await db.flush()

    admin = Admin(user_id=user.id, added_by=current_user.id)
    db.add(admin)

    log = AuditLog(
        user_id=current_user.id,
        action="ADMIN_ADD",
        description=f"Admin added: {data.email}"
    )
    db.add(log)

    return {"message": "Admin created successfully"}


@router.delete("/admins/{admin_user_id}")
async def remove_admin(
    admin_user_id: uuid.UUID,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.id == admin_user_id, User.role == "admin")
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    await db.execute(delete(User).where(User.id == admin_user_id))

    log = AuditLog(
        user_id=current_user.id,
        action="ADMIN_REMOVE",
        description=f"Admin removed: {admin_user_id}"
    )
    db.add(log)

    return {"message": "Admin removed"}


@router.get("/settings")
async def get_settings(
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    return [{"id": str(s.id), "key": s.key, "value": s.value, "description": s.description} for s in settings]


@router.put("/settings/{key}")
async def update_setting(
    key: str,
    value: str,
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()

    if setting:
        setting.value = value
        setting.updated_by = current_user.id
    else:
        db.add(SystemSetting(key=key, value=value, updated_by=current_user.id))

    return {"message": "Setting updated"}


@router.get("/audit-logs")
async def get_all_audit_logs(
    current_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(500)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(l.id),
            "action": l.action,
            "description": l.description,
            "user_id": str(l.user_id) if l.user_id else None,
            "ip_address": str(l.ip_address) if l.ip_address else None,
            "created_at": str(l.created_at),
        }
        for l in logs
    ]
