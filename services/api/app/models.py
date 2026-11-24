from datetime import date

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy import Text

class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    registration_date: Mapped[date] = mapped_column(Date, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(30), nullable=False)

class Vitals(Base):
    __tablename__ = "vitals"
    __table_args__ = (
        UniqueConstraint(
            "patient_record_id",
            "visit_date",
            name="uq_vitals_patient_visit_date",
        ),
        CheckConstraint("height_cm > 0", name="ck_vitals_height_positive"),
        CheckConstraint("weight_kg > 0", name="ck_vitals_weight_positive"),
        CheckConstraint(
            """
            (
                systolic_bp IS NULL
                AND diastolic_bp IS NULL
                AND blood_sugar IS NULL
                AND body_temperature IS NULL
                AND heart_rate IS NULL
                AND risk_level IS NULL
            )
            OR
            (
                systolic_bp IS NOT NULL
                AND diastolic_bp IS NOT NULL
                AND blood_sugar IS NOT NULL
                AND body_temperature IS NOT NULL
                AND heart_rate IS NOT NULL
                AND risk_level IN ('Low Risk', 'Mid Risk', 'High Risk')
            )
            """,
            name="ck_vitals_complete_risk_prediction",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_record_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    height_cm: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    bmi: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    systolic_bp: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    diastolic_bp: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    blood_sugar: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    body_temperature: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    heart_rate: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    risk_level: Mapped[str | None] = mapped_column(String(20))

class Assessment(Base):
    __tablename__ = "assessments"
    __table_args__ = (
        UniqueConstraint(
            "patient_record_id",
            "visit_date",
            name="uq_assessment_patient_visit_date",
        ),
        CheckConstraint(
            "assessment_type IN ('general', 'overweight')",
            name="ck_assessment_type",
        ),
        CheckConstraint(
            "general_health IN ('Good', 'Poor')",
            name="ck_assessment_general_health",
        ),
        CheckConstraint(
            """
            (assessment_type = 'overweight'
             AND on_diet IN ('Yes', 'No')
             AND using_drugs IS NULL)
            OR
            (assessment_type = 'general'
             AND using_drugs IN ('Yes', 'No')
             AND on_diet IS NULL)
            """,
            name="ck_assessment_form_fields",
        ),
        CheckConstraint(
            "length(trim(comments)) > 0",
            name="ck_assessment_comments_not_empty",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_record_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    assessment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    general_health: Mapped[str] = mapped_column(String(10), nullable=False)
    on_diet: Mapped[str | None] = mapped_column(String(3), nullable=True)
    using_drugs: Mapped[str | None] = mapped_column(String(3), nullable=True)
    comments: Mapped[str] = mapped_column(Text, nullable=False)