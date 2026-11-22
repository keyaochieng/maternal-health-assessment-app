from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientResponse


router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
) -> Patient:
    patient = Patient(**patient_data.model_dump())
    db.add(patient)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        # I rely on the database constraint too, to catch duplicate IDs even during simultaneous requests.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient ID '{patient_data.patient_id}' is already registered.",
        ) from error

    db.refresh(patient)
    return patient


@router.get("", response_model=list[PatientResponse])
def list_patients(db: Session = Depends(get_db)) -> list[Patient]:
    statement = select(Patient).order_by(Patient.last_name, Patient.first_name)
    return list(db.scalars(statement).all())