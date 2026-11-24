from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.ml.predictor import predict_risk
from app.models import Patient, Vitals
from app.schemas import VitalsCreate, VitalsResponse


router = APIRouter(prefix="/patients/{patient_id}/vitals", tags=["Vitals"])


def age_on(birth_date: date, reference_date: date) -> int:
    age = reference_date.year - birth_date.year

    if (reference_date.month, reference_date.day) < (
        birth_date.month,
        birth_date.day,
    ):
        age -= 1

    return age


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
        systolic_bp=vitals.systolic_bp,
        diastolic_bp=vitals.diastolic_bp,
        blood_sugar=vitals.blood_sugar,
        body_temperature=vitals.body_temperature,
        heart_rate=vitals.heart_rate,
        risk_level=vitals.risk_level,
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

    risk_level = None

    if vitals_data.systolic_bp is not None:
        # I use the visit date so the model receives the patient's age at this visit.
        patient_age = age_on(patient.date_of_birth, vitals_data.visit_date)

        features = {
            "Age": float(patient_age),
            "SystolicBP": float(vitals_data.systolic_bp),
            "DiastolicBP": float(vitals_data.diastolic_bp),
            "BS": float(vitals_data.blood_sugar),
            "BodyTemp": float(vitals_data.body_temperature),
            "HeartRate": float(vitals_data.heart_rate),
        }

        try:
            risk_level = predict_risk(features)
        except FileNotFoundError as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The trained maternal health model file was not found.",
            ) from error

        if risk_level not in {"Low Risk", "Mid Risk", "High Risk"}:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The model returned an unrecognized risk classification.",
            )

    vitals = Vitals(
        patient_record_id=patient.id,
        visit_date=vitals_data.visit_date,
        height_cm=vitals_data.height_cm,
        weight_kg=vitals_data.weight_kg,
        bmi=bmi,
        systolic_bp=vitals_data.systolic_bp,
        diastolic_bp=vitals_data.diastolic_bp,
        blood_sugar=vitals_data.blood_sugar,
        body_temperature=vitals_data.body_temperature,
        heart_rate=vitals_data.heart_rate,
        risk_level=risk_level,
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