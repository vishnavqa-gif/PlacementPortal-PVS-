import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, Date, Time, ForeignKey, DECIMAL, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False, default="student")
    status = Column(String(20), nullable=False, default="active")
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    profile_picture = Column(Text)
    reset_token = Column(Text)
    reset_token_expires = Column(DateTime)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    student = relationship("Student", back_populates="user", uselist=False)
    admin = relationship("Admin", back_populates="user", uselist=False)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String(50), unique=True)
    college = Column(String(255))
    degree = Column(String(100))
    branch = Column(String(100))
    graduation_year = Column(Integer)
    cgpa = Column(DECIMAL(4, 2))
    skills = Column(ARRAY(Text))
    resume_url = Column(Text)
    resume_filename = Column(String(255))
    linkedin_url = Column(Text)
    github_url = Column(Text)
    portfolio_url = Column(Text)
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    date_of_birth = Column(Date)
    gender = Column(String(20))
    experience_months = Column(Integer, default=0)
    current_company = Column(String(255))
    job_role = Column(String(255))
    expected_ctc = Column(DECIMAL(12, 2))
    notice_period_days = Column(Integer, default=0)
    is_fresher = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="student")
    interviews = relationship("Interview", back_populates="student")

class Admin(Base):
    __tablename__ = "admins"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department = Column(String(100))
    designation = Column(String(100))
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="admin", foreign_keys=[user_id])

class Technology(Base):
    __tablename__ = "technologies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon_url = Column(Text)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    interviewers = relationship("Interviewer", back_populates="technology")
    interviews = relationship("Interview", back_populates="technology")

class Interviewer(Base):
    __tablename__ = "interviewers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20))
    technology_id = Column(UUID(as_uuid=True), ForeignKey("technologies.id"))
    experience_years = Column(Integer)
    designation = Column(String(100))
    company = Column(String(200))
    linkedin_url = Column(Text)
    profile_picture = Column(Text)
    bio = Column(Text)
    status = Column(String(20), default="active")
    max_interviews_per_day = Column(Integer, default=5)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    technology = relationship("Technology", back_populates="interviewers")
    interviews = relationship("Interview", back_populates="interviewer")

class Cabin(Base):
    __tablename__ = "cabins"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    capacity = Column(Integer, default=2)
    amenities = Column(ARRAY(Text))
    status = Column(String(20), default="active")
    description = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    interviews = relationship("Interview", back_populates="cabin")

class TimeSlot(Base):
    __tablename__ = "time_slots"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    label = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    interviews = relationship("Interview", back_populates="time_slot")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    technology_id = Column(UUID(as_uuid=True), ForeignKey("technologies.id"), nullable=False)
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey("interviewers.id"), nullable=False)
    cabin_id = Column(UUID(as_uuid=True), ForeignKey("cabins.id"), nullable=False)
    time_slot_id = Column(UUID(as_uuid=True), ForeignKey("time_slots.id"), nullable=False)
    interview_date = Column(Date, nullable=False)
    status = Column(String(20), default="pending")
    current_round = Column(String(20), default="L1_Technical")
    notes = Column(Text)
    cancellation_reason = Column(Text)
    booked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    scheduled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    student = relationship("Student", back_populates="interviews")
    technology = relationship("Technology", back_populates="interviews")
    interviewer = relationship("Interviewer", back_populates="interviews")
    cabin = relationship("Cabin", back_populates="interviews")
    time_slot = relationship("TimeSlot", back_populates="interviews")
    rounds = relationship("InterviewRound", back_populates="interview")
    feedbacks = relationship("Feedback", back_populates="interview")

class InterviewRound(Base):
    __tablename__ = "interview_rounds"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    round_type = Column(String(20), nullable=False)
    round_number = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey("interviewers.id"))
    scheduled_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration_minutes = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    interview = relationship("Interview", back_populates="rounds")

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    round_id = Column(UUID(as_uuid=True), ForeignKey("interview_rounds.id"))
    given_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    communication_score = Column(Integer)
    technical_score = Column(Integer)
    confidence_score = Column(Integer)
    overall_score = Column(DECIMAL(4, 2))
    remarks = Column(Text)
    strengths = Column(Text)
    improvements = Column(Text)
    recommendation = Column(String(50))
    is_selected = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    interview = relationship("Interview", back_populates="feedbacks")

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), default="normal")
    target_role = Column(String(20))
    status = Column(String(20), default="active")
    expires_at = Column(DateTime)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(UUID(as_uuid=True))
    description = Column(Text, nullable=False)
    metadata = Column(JSONB)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text)
    description = Column(Text)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
