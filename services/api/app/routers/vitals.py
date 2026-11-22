from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Patient, Vitals
from app.schemas import VitalsCreate, VitalsResponse


router = APIRouter(prefix="/patients/{patient_id}/vitals", tags=["Vitals"])


def to_response(vitals: Vitals) -> VitalsResponse:
    next_assessment: Literal["general", "overweight"] = (
        "general" if vitals.bmi <= Decimal("25") else "overweight"
    )

    return VitalsResponse(
        id=vitals.id,
        visit_date=vitals.visit_date,
        height_cm=vitals.height_cm,
        weight_kg=vitals.weight_kg,
        bmi=vitals.bmi,
        next_assessment=next_assessment,
    )


@router.post("", response_model=VitalsResponse, status_code=status.HTTP_201_CREATED)
def create_vitals(
    patient_id: str,
    vitals_data: VitalsCreate,
    db: Session = Depends(get_db),
) -> VitalsResponse:
    patient = db.scalar(
        select(Patient).where(Patient.patient_id == patient_id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' was not found.",
        )

    height_m = vitals_data.height_cm / Decimal("100")
    bmi = (vitals_data.weight_kg / (height_m * height_m)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    vitals = Vitals(
        patient_record_id=patient.id,
        visit_date=vitals_data.visit_date,
        height_cm=vitals_data.height_cm,
        weight_kg=vitals_data.weight_kg,
        bmi=bmi,
    )
    db.add(vitals)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vitals have already been recorded for this patient on that date.",
        ) from error

    db.refresh(vitals)
    return to_response(vitals)


@router.get("", response_model=list[VitalsResponse])
def list_patient_vitals(
    patient_id: str,
    db: Session = Depends(get_db),
) -> list[VitalsResponse]:
    patient = db.scalar(
        select(Patient).where(Patient.patient_id == patient_id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' was not found.",
        )

    statement = (
        select(Vitals)
        .where(Vitals.patient_record_id == patient.id)
        .order_by(Vitals.visit_date.desc())
    )
    return [to_response(vitals) for vitals in db.scalars(statement).all()]