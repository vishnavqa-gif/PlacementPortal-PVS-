from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete, and_
from sqlalchemy.orm import selectinload
from datetime import date, datetime
from typing import Optional
import uuid

from app.database.session import get_db
from app.models.models import (
    User, Student, Admin, Technology, Interviewer,
    Cabin, TimeSlot, Interview, Feedback, Announcement, AuditLog
)
from app.schemas.schemas import (
    StudentCreate, TechnologyCreate, TechnologyUpdate,
    InterviewerCreate, InterviewerUpdate, CabinCreate, CabinUpdate,
    TimeSlotCreate, TimeSlotUpdate, InterviewScheduleRequest,
    InterviewUpdateStatus, FeedbackCreate, AnnouncementCreate,
    AdminDashboardStats
)
from app.core.security import get_current_user, require_admin, get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================
# DASHBOARD
# ============================================================
@router.get("/dashboard", response_model=AdminDashboardStats)
async def admin_dashboard(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()

    total_students = await db.execute(select(func.count(Student.id)))
    active_students = await db.execute(
        select(func.count(Student.id)).join(User, Student.user_id == User.id).where(User.status == "active")
    )
    todays_interviews = await db.execute(
        select(func.count(Interview.id)).where(Interview.interview_date == today)
    )
    completed = await db.execute(
        select(func.count(Interview.id)).where(Interview.status == "completed")
    )
    technologies_count = await db.execute(
        select(func.count(Technology.id)).where(Technology.is_active == True)
    )
    interviewers_count = await db.execute(
        select(func.count(Interviewer.id)).where(Interviewer.status == "active")
    )

    return AdminDashboardStats(
        total_students=total_students.scalar(),
        active_students=active_students.scalar(),
        todays_interviews=todays_interviews.scalar(),
        completed_interviews=completed.scalar(),
        available_slots=12,  # Computed from cabin*slots
        technologies_count=technologies_count.scalar(),
        interviewers_count=interviewers_count.scalar(),
    )


# ============================================================
# STUDENT MANAGEMENT
# ============================================================
@router.get("/students")
async def list_students(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(Student).options(selectinload(Student.user)).join(User, Student.user_id == User.id)

    if search:
        query = query.where(
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (Student.student_id.ilike(f"%{search}%"))
        )
    if status:
        query = query.where(User.status == status)

    total = await db.execute(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.offset((page - 1) * size).limit(size))
    students = result.scalars().all()

    def serialize(s):
        return {
            "id": str(s.id),
            "student_id": s.student_id,
            "college": s.college,
            "branch": s.branch,
            "graduation_year": s.graduation_year,
            "skills": s.skills,
            "resume_url": s.resume_url,
            "user": {
                "id": str(s.user.id),
                "email": s.user.email,
                "first_name": s.user.first_name,
                "last_name": s.user.last_name,
                "phone": s.user.phone,
                "status": s.user.status,
                "created_at": str(s.user.created_at),
            }
        }

    return {
        "items": [serialize(s) for s in students],
        "total": total.scalar(),
        "page": page,
        "size": size,
        "pages": (total.scalar() + size - 1) // size
    }


@router.post("/students", status_code=201)
async def create_student(
    data: StudentCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        role="student",
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
    )
    db.add(user)
    await db.flush()

    student_id = f"STU{datetime.utcnow().year}{str(user.id)[:6].upper()}"
    student = Student(
        user_id=user.id,
        student_id=student_id,
        college=data.college,
        degree=data.degree,
        branch=data.branch,
        graduation_year=data.graduation_year,
        skills=data.skills,
    )
    db.add(student)

    log = AuditLog(user_id=current_user.id, action="STUDENT_ADD", description=f"Student added: {data.email}")
    db.add(log)

    return {"message": "Student created", "student_id": student_id}


@router.put("/students/{student_id}/status")
async def update_student_status(
    student_id: uuid.UUID,
    new_status: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    await db.execute(update(User).where(User.id == student.user_id).values(status=new_status))

    action = "STUDENT_ACTIVATE" if new_status == "active" else "STUDENT_DEACTIVATE"
    log = AuditLog(user_id=current_user.id, action=action, description=f"Student {new_status}: {student_id}")
    db.add(log)

    return {"message": f"Student {new_status} successfully"}


@router.delete("/students/{student_id}")
async def delete_student(
    student_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    await db.execute(delete(User).where(User.id == student.user_id))
    log = AuditLog(user_id=current_user.id, action="STUDENT_DELETE", description=f"Student deleted: {student_id}")
    db.add(log)

    return {"message": "Student deleted"}


# ============================================================
# TECHNOLOGY MANAGEMENT
# ============================================================
@router.get("/technologies")
async def list_technologies(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Technology).order_by(Technology.name))
    techs = result.scalars().all()
    return [{"id": str(t.id), "name": t.name, "description": t.description, "is_active": t.is_active, "created_at": str(t.created_at)} for t in techs]


@router.post("/technologies", status_code=201)
async def create_technology(
    data: TechnologyCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(Technology).where(Technology.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Technology already exists")

    tech = Technology(**data.model_dump(), created_by=current_user.id)
    db.add(tech)

    log = AuditLog(user_id=current_user.id, action="TECHNOLOGY_ADD", description=f"Technology added: {data.name}")
    db.add(log)

    return {"message": "Technology created"}


@router.put("/technologies/{tech_id}")
async def update_technology(
    tech_id: uuid.UUID,
    data: TechnologyUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Technology).where(Technology.id == tech_id))
    tech = result.scalar_one_or_none()
    if not tech:
        raise HTTPException(status_code=404, detail="Technology not found")

    for k, v in data.model_dump(exclude_none=True).items():
        setattr(tech, k, v)

    log = AuditLog(user_id=current_user.id, action="TECHNOLOGY_EDIT", description=f"Technology updated: {tech_id}")
    db.add(log)
    return {"message": "Technology updated"}


@router.delete("/technologies/{tech_id}")
async def delete_technology(
    tech_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(Technology).where(Technology.id == tech_id))
    log = AuditLog(user_id=current_user.id, action="TECHNOLOGY_DELETE", description=f"Technology deleted: {tech_id}")
    db.add(log)
    return {"message": "Technology deleted"}


# ============================================================
# INTERVIEWER MANAGEMENT
# ============================================================
@router.get("/interviewers")
async def list_interviewers(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Interviewer).options(selectinload(Interviewer.technology)).order_by(Interviewer.name)
    )
    interviewers = result.scalars().all()
    return [
        {
            "id": str(i.id), "name": i.name, "email": i.email, "phone": i.phone,
            "experience_years": i.experience_years, "designation": i.designation,
            "company": i.company, "status": i.status,
            "technology": {"id": str(i.technology.id), "name": i.technology.name} if i.technology else None,
            "created_at": str(i.created_at),
        }
        for i in interviewers
    ]


@router.post("/interviewers", status_code=201)
async def create_interviewer(
    data: InterviewerCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    interviewer = Interviewer(**data.model_dump(), created_by=current_user.id)
    db.add(interviewer)
    log = AuditLog(user_id=current_user.id, action="INTERVIEWER_ADD", description=f"Interviewer added: {data.name}")
    db.add(log)
    return {"message": "Interviewer created"}


@router.put("/interviewers/{interviewer_id}")
async def update_interviewer(
    interviewer_id: uuid.UUID,
    data: InterviewerUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Interviewer).where(Interviewer.id == interviewer_id))
    interviewer = result.scalar_one_or_none()
    if not interviewer:
        raise HTTPException(status_code=404, detail="Interviewer not found")

    for k, v in data.model_dump(exclude_none=True).items():
        setattr(interviewer, k, v)

    log = AuditLog(user_id=current_user.id, action="INTERVIEWER_EDIT", description=f"Interviewer updated: {interviewer_id}")
    db.add(log)
    return {"message": "Interviewer updated"}


@router.delete("/interviewers/{interviewer_id}")
async def delete_interviewer(
    interviewer_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(delete(Interviewer).where(Interviewer.id == interviewer_id))
    log = AuditLog(user_id=current_user.id, action="INTERVIEWER_DELETE", description=f"Interviewer deleted: {interviewer_id}")
    db.add(log)
    return {"message": "Interviewer deleted"}


# ============================================================
# CABIN MANAGEMENT
# ============================================================
@router.get("/cabins")
async def list_cabins(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cabin).order_by(Cabin.name))
    cabins = result.scalars().all()
    return [{"id": str(c.id), "name": c.name, "location": c.location, "capacity": c.capacity, "status": c.status, "amenities": c.amenities} for c in cabins]


@router.post("/cabins", status_code=201)
async def create_cabin(data: CabinCreate, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    cabin = Cabin(**data.model_dump(), created_by=current_user.id)
    db.add(cabin)
    log = AuditLog(user_id=current_user.id, action="CABIN_ADD", description=f"Cabin added: {data.name}")
    db.add(log)
    return {"message": "Cabin created"}


@router.put("/cabins/{cabin_id}")
async def update_cabin(cabin_id: uuid.UUID, data: CabinUpdate, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Cabin).where(Cabin.id == cabin_id))
    cabin = result.scalar_one_or_none()
    if not cabin:
        raise HTTPException(status_code=404, detail="Cabin not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(cabin, k, v)
    log = AuditLog(user_id=current_user.id, action="CABIN_EDIT", description=f"Cabin updated: {cabin_id}")
    db.add(log)
    return {"message": "Cabin updated"}


# ============================================================
# TIME SLOT MANAGEMENT
# ============================================================
@router.get("/slots")
async def list_slots(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TimeSlot).order_by(TimeSlot.start_time))
    slots = result.scalars().all()
    return [{"id": str(s.id), "start_time": str(s.start_time), "end_time": str(s.end_time), "label": s.label, "is_active": s.is_active} for s in slots]


@router.post("/slots", status_code=201)
async def create_slot(data: TimeSlotCreate, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    slot = TimeSlot(**data.model_dump(), created_by=current_user.id)
    db.add(slot)
    log = AuditLog(user_id=current_user.id, action="SLOT_CREATE", description=f"Slot created: {data.label}")
    db.add(log)
    return {"message": "Slot created"}


@router.delete("/slots/{slot_id}")
async def delete_slot(slot_id: uuid.UUID, current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(TimeSlot).where(TimeSlot.id == slot_id))
    log = AuditLog(user_id=current_user.id, action="SLOT_DELETE", description=f"Slot deleted: {slot_id}")
    db.add(log)
    return {"message": "Slot deleted"}


# ============================================================
# INTERVIEW MANAGEMENT
# ============================================================
@router.get("/interviews")
async def list_interviews(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    interview_date: Optional[date] = None,
    interview_status: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(Interview).options(
        selectinload(Interview.student).selectinload(Student.user),
        selectinload(Interview.technology),
        selectinload(Interview.interviewer),
        selectinload(Interview.cabin),
        selectinload(Interview.time_slot),
    )
    if interview_date:
        query = query.where(Interview.interview_date == interview_date)
    if interview_status:
        query = query.where(Interview.status == interview_status)

    total_q = await db.execute(select(func.count()).select_from(query.subquery()))
    result = await db.execute(query.order_by(Interview.interview_date.desc()).offset((page - 1) * size).limit(size))
    interviews = result.scalars().all()

    def serialize(i):
        return {
            "id": str(i.id),
            "interview_date": str(i.interview_date),
            "status": i.status,
            "current_round": i.current_round,
            "notes": i.notes,
            "student": {
                "id": str(i.student.id),
                "student_id": i.student.student_id,
                "name": f"{i.student.user.first_name} {i.student.user.last_name}",
                "email": i.student.user.email,
            } if i.student else None,
            "technology": {"id": str(i.technology.id), "name": i.technology.name} if i.technology else None,
            "interviewer": {"id": str(i.interviewer.id), "name": i.interviewer.name} if i.interviewer else None,
            "cabin": {"id": str(i.cabin.id), "name": i.cabin.name} if i.cabin else None,
            "time_slot": {"label": i.time_slot.label} if i.time_slot else None,
        }

    return {
        "items": [serialize(i) for i in interviews],
        "total": total_q.scalar(),
        "page": page,
        "size": size,
    }


@router.post("/interviews", status_code=201)
async def schedule_interview(
    data: InterviewScheduleRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Check slot availability
    existing = await db.execute(
        select(Interview).where(
            Interview.cabin_id == data.cabin_id,
            Interview.time_slot_id == data.time_slot_id,
            Interview.interview_date == data.interview_date,
            Interview.status.not_in(["cancelled", "rejected"])
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This slot is already booked")

    interview = Interview(
        **data.model_dump(),
        status="scheduled",
        scheduled_by=current_user.id,
        booked_by=current_user.id
    )
    db.add(interview)

    log = AuditLog(user_id=current_user.id, action="INTERVIEW_BOOK", description=f"Interview scheduled for student: {data.student_id}")
    db.add(log)

    return {"message": "Interview scheduled successfully"}


@router.put("/interviews/{interview_id}/status")
async def update_interview_status(
    interview_id: uuid.UUID,
    data: InterviewUpdateStatus,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = data.status
    if data.notes:
        interview.notes = data.notes
    if data.cancellation_reason:
        interview.cancellation_reason = data.cancellation_reason
    if data.current_round:
        interview.current_round = data.current_round

    log = AuditLog(user_id=current_user.id, action="INTERVIEW_STATUS_UPDATE", description=f"Interview {interview_id} status → {data.status}")
    db.add(log)

    return {"message": "Interview status updated"}


@router.post("/interviews/{interview_id}/feedback", status_code=201)
async def add_feedback(
    interview_id: uuid.UUID,
    data: FeedbackCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    overall = (data.communication_score + data.technical_score + data.confidence_score) / 3
    feedback = Feedback(
        interview_id=interview_id,
        round_id=data.round_id,
        given_by=current_user.id,
        communication_score=data.communication_score,
        technical_score=data.technical_score,
        confidence_score=data.confidence_score,
        overall_score=round(overall, 2),
        remarks=data.remarks,
        strengths=data.strengths,
        improvements=data.improvements,
        recommendation=data.recommendation,
        is_selected=data.is_selected,
    )
    db.add(feedback)

    log = AuditLog(user_id=current_user.id, action="FEEDBACK_ADD", description=f"Feedback added for interview: {interview_id}")
    db.add(log)

    return {"message": "Feedback added"}


# ============================================================
# ANNOUNCEMENTS
# ============================================================
@router.post("/announcements", status_code=201)
async def create_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    announcement = Announcement(**data.model_dump(), created_by=current_user.id)
    db.add(announcement)
    log = AuditLog(user_id=current_user.id, action="ANNOUNCEMENT_POST", description=f"Announcement posted: {data.title}")
    db.add(log)
    return {"message": "Announcement posted"}


@router.get("/announcements")
async def list_announcements(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Announcement).order_by(Announcement.created_at.desc()))
    announcements = result.scalars().all()
    return [{"id": str(a.id), "title": a.title, "content": a.content, "priority": a.priority, "status": a.status, "created_at": str(a.created_at)} for a in announcements]


# ============================================================
# AUDIT LOGS
# ============================================================
@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    total_q = await db.execute(select(func.count(AuditLog.id)))
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    logs = result.scalars().all()

    return {
        "items": [{"id": str(l.id), "action": l.action, "description": l.description, "user_id": str(l.user_id) if l.user_id else None, "ip_address": str(l.ip_address) if l.ip_address else None, "created_at": str(l.created_at)} for l in logs],
        "total": total_q.scalar(),
        "page": page,
        "size": size
    }


# ============================================================
# AVAILABLE SLOTS (for booking)
# ============================================================
@router.get("/available-slots")
async def get_available_slots(
    interview_date: date,
    cabin_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get all active slots and cabins
    all_slots = await db.execute(select(TimeSlot).where(TimeSlot.is_active == True))
    all_cabins = await db.execute(select(Cabin).where(Cabin.status == "active"))
    slots = all_slots.scalars().all()
    cabins = all_cabins.scalars().all()

    # Get booked combinations
    booked_q = select(Interview.cabin_id, Interview.time_slot_id).where(
        Interview.interview_date == interview_date,
        Interview.status.not_in(["cancelled", "rejected"])
    )
    if cabin_id:
        booked_q = booked_q.where(Interview.cabin_id == cabin_id)
    booked = await db.execute(booked_q)
    booked_pairs = {(str(row.cabin_id), str(row.time_slot_id)) for row in booked}

    result = []
    for cabin in cabins:
        if cabin_id and cabin.id != cabin_id:
            continue
        cabin_slots = []
        for slot in slots:
            is_booked = (str(cabin.id), str(slot.id)) in booked_pairs
            cabin_slots.append({
                "slot_id": str(slot.id),
                "label": slot.label,
                "start_time": str(slot.start_time),
                "end_time": str(slot.end_time),
                "is_available": not is_booked
            })
        result.append({
            "cabin_id": str(cabin.id),
            "cabin_name": cabin.name,
            "slots": cabin_slots
        })

    return result
