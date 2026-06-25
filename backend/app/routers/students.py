from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update
from sqlalchemy.orm import selectinload
from datetime import date, datetime
import uuid, aiofiles, os

from app.database.session import get_db
from app.models.models import User, Student, Interview, AuditLog, Announcement
from app.schemas.schemas import StudentProfileUpdate, StudentDashboardStats
from app.core.security import get_current_user, require_student

router = APIRouter(prefix="/student", tags=["Student"])


@router.get("/dashboard", response_model=StudentDashboardStats)
async def student_dashboard(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    today = date.today()

    todays = await db.execute(
        select(func.count(Interview.id)).where(
            Interview.student_id == student.id,
            Interview.interview_date == today
        )
    )
    upcoming = await db.execute(
        select(func.count(Interview.id)).where(
            Interview.student_id == student.id,
            Interview.interview_date > today,
            Interview.status.in_(["pending", "scheduled"])
        )
    )
    completed = await db.execute(
        select(func.count(Interview.id)).where(
            Interview.student_id == student.id,
            Interview.status == "completed"
        )
    )
    pending = await db.execute(
        select(func.count(Interview.id)).where(
            Interview.student_id == student.id,
            Interview.status == "pending"
        )
    )

    return StudentDashboardStats(
        todays_interviews=todays.scalar(),
        upcoming_interviews=upcoming.scalar(),
        completed_interviews=completed.scalar(),
        pending_interviews=pending.scalar(),
    )


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Student).where(Student.user_id == current_user.id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone": current_user.phone,
            "profile_picture": current_user.profile_picture,
        },
        "student": {
            "id": str(student.id),
            "student_id": student.student_id,
            "college": student.college,
            "degree": student.degree,
            "branch": student.branch,
            "graduation_year": student.graduation_year,
            "cgpa": str(student.cgpa) if student.cgpa else None,
            "skills": student.skills or [],
            "resume_url": student.resume_url,
            "resume_filename": student.resume_filename,
            "linkedin_url": student.linkedin_url,
            "github_url": student.github_url,
            "portfolio_url": student.portfolio_url,
            "address": student.address,
            "city": student.city,
            "state": student.state,
            "pincode": student.pincode,
            "date_of_birth": str(student.date_of_birth) if student.date_of_birth else None,
            "gender": student.gender,
            "experience_months": student.experience_months,
            "current_company": student.current_company,
            "current_role": student.current_role,
            "expected_ctc": str(student.expected_ctc) if student.expected_ctc else None,
            "notice_period_days": student.notice_period_days,
            "is_fresher": student.is_fresher,
        }
    }


@router.put("/profile")
async def update_profile(
    data: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    for key, val in update_data.items():
        setattr(student, key, val)

    log = AuditLog(user_id=current_user.id, action="USER_UPDATE", description="Student profile updated")
    db.add(log)

    return {"message": "Profile updated successfully"}


@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith((".pdf", ".doc", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF, DOC, DOCX files are allowed")

    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    # In production, upload to Cloudinary/S3
    upload_dir = "/tmp/resumes"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{current_user.id}_{file.filename}"
    filepath = os.path.join(upload_dir, filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    # Update student record
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if student:
        student.resume_url = f"/uploads/resumes/{filename}"
        student.resume_filename = file.filename

    log = AuditLog(user_id=current_user.id, action="RESUME_UPLOAD", description=f"Resume uploaded: {file.filename}")
    db.add(log)

    return {"message": "Resume uploaded successfully", "filename": file.filename}


@router.get("/interviews")
async def get_my_interviews(
    status: str = None,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = select(Interview).options(
        selectinload(Interview.technology),
        selectinload(Interview.interviewer),
        selectinload(Interview.cabin),
        selectinload(Interview.time_slot),
        selectinload(Interview.feedbacks),
        selectinload(Interview.rounds),
    ).where(Interview.student_id == student.id)

    if status:
        query = query.where(Interview.status == status)

    query = query.order_by(Interview.interview_date.desc())
    result = await db.execute(query)
    interviews = result.scalars().all()

    def serialize(i):
        return {
            "id": str(i.id),
            "interview_date": str(i.interview_date),
            "status": i.status,
            "current_round": i.current_round,
            "notes": i.notes,
            "technology": {"id": str(i.technology.id), "name": i.technology.name} if i.technology else None,
            "interviewer": {"id": str(i.interviewer.id), "name": i.interviewer.name} if i.interviewer else None,
            "cabin": {"id": str(i.cabin.id), "name": i.cabin.name} if i.cabin else None,
            "time_slot": {"id": str(i.time_slot.id), "label": i.time_slot.label, "start_time": str(i.time_slot.start_time), "end_time": str(i.time_slot.end_time)} if i.time_slot else None,
            "rounds": [{"round_type": r.round_type, "round_number": r.round_number, "status": r.status} for r in i.rounds],
            "feedbacks": [{"communication_score": f.communication_score, "technical_score": f.technical_score, "confidence_score": f.confidence_score, "overall_score": str(f.overall_score) if f.overall_score else None, "remarks": f.remarks} for f in i.feedbacks],
            "created_at": str(i.created_at),
        }

    return [serialize(i) for i in interviews]


@router.get("/announcements")
async def get_announcements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    result = await db.execute(
        select(Announcement).where(
            Announcement.status == "active",
            (Announcement.expires_at == None) | (Announcement.expires_at > now)
        ).order_by(Announcement.created_at.desc())
    )
    announcements = result.scalars().all()

    return [
        {
            "id": str(a.id),
            "title": a.title,
            "content": a.content,
            "priority": a.priority,
            "created_at": str(a.created_at),
        }
        for a in announcements
    ]
