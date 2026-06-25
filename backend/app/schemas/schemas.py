from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any
from datetime import datetime, date, time
from uuid import UUID
from decimal import Decimal


# ---- Base ----
class BaseResponse(BaseModel):
    class Config:
        from_attributes = True


# ---- Auth ----
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    phone: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


# ---- User ----
class UserBase(BaseResponse):
    id: UUID
    email: str
    role: str
    status: str
    first_name: str
    last_name: str
    phone: Optional[str]
    profile_picture: Optional[str]
    created_at: datetime

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


# ---- Student ----
class StudentProfileUpdate(BaseModel):
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[Decimal] = None
    skills: Optional[List[str]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    experience_months: Optional[int] = None
    current_company: Optional[str] = None
    job_role: Optional[str] = None
    expected_ctc: Optional[Decimal] = None
    notice_period_days: Optional[int] = None
    is_fresher: Optional[bool] = None

class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[List[str]] = None

class StudentResponse(BaseResponse):
    id: UUID
    user_id: UUID
    student_id: Optional[str]
    college: Optional[str]
    degree: Optional[str]
    branch: Optional[str]
    graduation_year: Optional[int]
    cgpa: Optional[Decimal]
    skills: Optional[List[str]]
    resume_url: Optional[str]
    resume_filename: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    city: Optional[str]
    state: Optional[str]
    is_fresher: Optional[bool]
    created_at: datetime
    user: UserBase


# ---- Technology ----
class TechnologyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None

class TechnologyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon_url: Optional[str] = None
    is_active: Optional[bool] = None

class TechnologyResponse(BaseResponse):
    id: UUID
    name: str
    description: Optional[str]
    icon_url: Optional[str]
    is_active: bool
    created_at: datetime


# ---- Interviewer ----
class InterviewerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    technology_id: UUID
    experience_years: Optional[int] = None
    designation: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    max_interviews_per_day: Optional[int] = 5

class InterviewerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    technology_id: Optional[UUID] = None
    experience_years: Optional[int] = None
    designation: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    max_interviews_per_day: Optional[int] = None

class InterviewerResponse(BaseResponse):
    id: UUID
    name: str
    email: str
    phone: Optional[str]
    experience_years: Optional[int]
    designation: Optional[str]
    company: Optional[str]
    status: str
    technology: Optional[TechnologyResponse]
    created_at: datetime


# ---- Cabin ----
class CabinCreate(BaseModel):
    name: str
    location: Optional[str] = None
    capacity: Optional[int] = 2
    amenities: Optional[List[str]] = None
    description: Optional[str] = None

class CabinUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    amenities: Optional[List[str]] = None
    status: Optional[str] = None
    description: Optional[str] = None

class CabinResponse(BaseResponse):
    id: UUID
    name: str
    location: Optional[str]
    capacity: int
    status: str
    amenities: Optional[List[str]]
    created_at: datetime


# ---- Time Slot ----
class TimeSlotCreate(BaseModel):
    start_time: time
    end_time: time
    label: Optional[str] = None

class TimeSlotUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    label: Optional[str] = None
    is_active: Optional[bool] = None

class TimeSlotResponse(BaseResponse):
    id: UUID
    start_time: time
    end_time: time
    label: Optional[str]
    is_active: bool


# ---- Interview ----
class InterviewBookRequest(BaseModel):
    technology_id: UUID
    interviewer_id: UUID
    cabin_id: UUID
    time_slot_id: UUID
    interview_date: date

class InterviewScheduleRequest(BaseModel):
    student_id: UUID
    technology_id: UUID
    interviewer_id: UUID
    cabin_id: UUID
    time_slot_id: UUID
    interview_date: date
    notes: Optional[str] = None

class InterviewUpdateStatus(BaseModel):
    status: str
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    current_round: Optional[str] = None

class InterviewResponse(BaseResponse):
    id: UUID
    interview_date: date
    status: str
    current_round: str
    notes: Optional[str]
    created_at: datetime
    student: Optional[StudentResponse]
    technology: Optional[TechnologyResponse]
    interviewer: Optional[InterviewerResponse]
    cabin: Optional[CabinResponse]
    time_slot: Optional[TimeSlotResponse]


# ---- Feedback ----
class FeedbackCreate(BaseModel):
    interview_id: UUID
    round_id: Optional[UUID] = None
    communication_score: int = Field(ge=1, le=10)
    technical_score: int = Field(ge=1, le=10)
    confidence_score: int = Field(ge=1, le=10)
    remarks: Optional[str] = None
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    recommendation: Optional[str] = None
    is_selected: Optional[bool] = None

class FeedbackResponse(BaseResponse):
    id: UUID
    communication_score: int
    technical_score: int
    confidence_score: int
    overall_score: Optional[Decimal]
    remarks: Optional[str]
    strengths: Optional[str]
    improvements: Optional[str]
    recommendation: Optional[str]
    is_selected: Optional[bool]
    created_at: datetime


# ---- Announcement ----
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: Optional[str] = "normal"
    target_role: Optional[str] = None
    expires_at: Optional[datetime] = None

class AnnouncementResponse(BaseResponse):
    id: UUID
    title: str
    content: str
    priority: str
    target_role: Optional[str]
    status: str
    expires_at: Optional[datetime]
    created_at: datetime


# ---- Pagination ----
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


# ---- Dashboard ----
class AdminDashboardStats(BaseModel):
    total_students: int
    active_students: int
    todays_interviews: int
    completed_interviews: int
    available_slots: int
    technologies_count: int
    interviewers_count: int

class StudentDashboardStats(BaseModel):
    todays_interviews: int
    upcoming_interviews: int
    completed_interviews: int
    pending_interviews: int
