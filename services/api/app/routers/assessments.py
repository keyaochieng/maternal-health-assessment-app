from datetime import date
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Assessment, Patient, Vitals
from app.schemas import (
    AssessmentResponse,
    GeneralAssessmentCreate,
    OverweightAssessmentCreate,
)


router = APIRouter(
    prefix="/patients/{patient_id}/assessments",
    tags=["Assessments"],
)


def get_patient_and_visit(
    db: Session,
    patient_id: str,
    visit_date: date,
    expected_type: Literal["general", "overweight"],
) -> tuple[Patient, Vitals]:
    patient = db.scalar(
        select(Patient).where(Patient.patient_id == patient_id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' was not found.",
        )

    vitals = db.scalar(
        select(Vitals).where(
            Vitals.patient_record_id == patient.id,
            Vitals.visit_date == visit_date,
        )
    )

    if vitals is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Record vitals for this patient and visit date first.",
        )

    # I enforce the BMI rule on the server, even if someone bypasses the form UI.
    if expected_type == "overweight" and vitals.bmi <= Decimal("25"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The Overweight Assessment is only for BMI greater than 25.",
        )

    if expected_type == "general" and vitals.bmi > Decimal("25"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The General Assessment is only for BMI equal to or less than 25.",
        )

    return patient, vitals


def patient_display_name(patient: Patient) -> str:
    name_parts = [patient.first_name]

    if patient.middle_name:
        name_parts.append(patient.middle_name)

    name_parts.append(patient.last_name)
    return " ".join(name_parts)


def to_response(
    assessment: Assessment,
    patient: Patient,
) -> AssessmentResponse:
    return AssessmentResponse(
        id=assessment.id,
        patient_name=patient_display_name(patient),
        visit_date=assessment.visit_date,
        assessment_type=assessment.assessment_type,
        general_health=assessment.general_health,
        on_diet=assessment.on_diet,
        using_drugs=assessment.using_drugs,
        comments=assessment.comments,
    )


def save_assessment(
    db: Session,
    assessment: Assessment,
    patient: Patient,
) -> AssessmentResponse:
    db.add(assessment)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An assessment has already been submitted for this patient on that date.",
        ) from error

    db.refresh(assessment)
    return to_response(assessment, patient)


@router.post(
    "/overweight",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_overweight_assessment(
    patient_id: str,
    form_data: OverweightAssessmentCreate,
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    patient, _ = get_patient_and_visit(
        db,
        patient_id,
        form_data.visit_date,
        "overweight",
    )

    assessment = Assessment(
        patient_record_id=patient.id,
        visit_date=form_data.visit_date,
        assessment_type="overweight",
        general_health=form_data.general_health,
        on_diet=form_data.on_diet,
        using_drugs=None,
        comments=form_data.comments,
    )
    return save_assessment(db, assessment, patient)


@router.post(
    "/general",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_general_assessment(
    patient_id: str,
    form_data: GeneralAssessmentCreate,
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    patient, _ = get_patient_and_visit(
        db,
        patient_id,
        form_data.visit_date,
        "general",
    )

    assessment = Assessment(
        patient_record_id=patient.id,
        visit_date=form_data.visit_date,
        assessment_type="general",
        general_health=form_data.general_health,
        on_diet=None,
        using_drugs=form_data.using_drugs,
        comments=form_data.comments,
    )
    return save_assessment(db, assessment, patient)


@router.get("", response_model=list[AssessmentResponse])
def list_patient_assessments(
    patient_id: str,
    db: Session = Depends(get_db),
) -> list[AssessmentResponse]:
    patient = db.scalar(
        select(Patient).where(Patient.patient_id == patient_id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' was not found.",
        )

    statement = (
        select(Assessment)
        .where(Assessment.patient_record_id == patient.id)
        .order_by(Assessment.visit_date.desc())
    )
    assessments = db.scalars(statement).all()
    return [to_response(item, patient) for item in assessments]