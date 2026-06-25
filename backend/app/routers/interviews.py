from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from datetime import date
import uuid

from app.database.session import get_db
from app.models.models import User, Student, Interview, AuditLog
from app.schemas.schemas import InterviewBookRequest
from app.core.security import get_current_user, require_student

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("/book", status_code=201)
async def book_interview(
    data: InterviewBookRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    # Get student profile
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    if data.interview_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot book interviews in the past")

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
        raise HTTPException(status_code=400, detail="This slot is already taken. Please choose another.")

    # Check student doesn't have existing booking on same date
    student_existing = await db.execute(
        select(Interview).where(
            Interview.student_id == student.id,
            Interview.interview_date == data.interview_date,
            Interview.status.not_in(["cancelled", "rejected"])
        )
    )
    if student_existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have an interview booked on this date")

    interview = Interview(
        student_id=student.id,
        technology_id=data.technology_id,
        interviewer_id=data.interviewer_id,
        cabin_id=data.cabin_id,
        time_slot_id=data.time_slot_id,
        interview_date=data.interview_date,
        status="scheduled",
        booked_by=current_user.id,
    )
    db.add(interview)

    log = AuditLog(
        user_id=current_user.id,
        action="INTERVIEW_BOOK",
        description=f"Interview booked for {data.interview_date}"
    )
    db.add(log)

    return {"message": "Interview booked successfully"}


@router.delete("/{interview_id}/cancel")
async def cancel_interview(
    interview_id: uuid.UUID,
    reason: str = None,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()

    interview_q = await db.execute(
        select(Interview).where(
            Interview.id == interview_id,
            Interview.student_id == student.id
        )
    )
    interview = interview_q.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if interview.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel this interview")

    interview.status = "cancelled"
    interview.cancellation_reason = reason

    log = AuditLog(
        user_id=current_user.id,
        action="INTERVIEW_CANCEL",
        description=f"Interview cancelled: {interview_id}"
    )
    db.add(log)

    return {"message": "Interview cancelled"}
