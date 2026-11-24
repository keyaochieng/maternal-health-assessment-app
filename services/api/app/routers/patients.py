from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Patient, Vitals
from app.schemas import PatientCreate, PatientReportItem, PatientResponse


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
    # I let PostgreSQL allocate the number so concurrent registrations stay unique.
    next_number = db.execute(
        text("SELECT nextval('patient_number_seq')")
    ).scalar_one()

    patient = Patient(
        patient_id=f"PAT-{next_number:03d}",
        **patient_data.model_dump(),
    )
    db.add(patient)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not register the patient. Please check the submitted details.",
        ) from error

    db.refresh(patient)
    return patient


@router.get("", response_model=list[PatientResponse])
def list_patients(db: Session = Depends(get_db)) -> list[Patient]:
    statement = select(Patient).order_by(Patient.last_name, Patient.first_name)
    return list(db.scalars(statement).all())


@router.get("/report", response_model=list[PatientReportItem])
def get_patient_report(
    visit_date: date | None = None,
    db: Session = Depends(get_db),
) -> list[PatientReportItem]:
    if visit_date is not None:
        statement = (
            select(Patient, Vitals)
            .join(Vitals, Vitals.patient_record_id == Patient.id)
            .where(Vitals.visit_date == visit_date)
        )
    else:
        latest_visits = (
            select(
                Vitals.patient_record_id.label("patient_record_id"),
                func.max(Vitals.visit_date).label("latest_visit_date"),
            )
            .group_by(Vitals.patient_record_id)
            .subquery()
        )

        statement = (
            select(Patient, Vitals)
            .join(
                latest_visits,
                latest_visits.c.patient_record_id == Patient.id,
            )
            .join(
                Vitals,
                and_(
                    Vitals.patient_record_id == Patient.id,
                    Vitals.visit_date == latest_visits.c.latest_visit_date,
                ),
            )
        )

    statement = statement.order_by(Patient.last_name, Patient.first_name)
    patient_visits = db.execute(statement).all()

    report = []

    for patient, vitals in patient_visits:
        reference_date = visit_date or vitals.visit_date
        age = reference_date.year - patient.date_of_birth.year

        if (reference_date.month, reference_date.day) < (
            patient.date_of_birth.month,
            patient.date_of_birth.day,
        ):
            age -= 1

        if vitals.bmi < Decimal("18.5"):
            bmi_status = "Underweight"
        elif vitals.bmi < Decimal("25"):
            bmi_status = "Normal"
        else:
            bmi_status = "Overweight"

        name_parts = [patient.first_name]

        if patient.middle_name:
            name_parts.append(patient.middle_name)

        name_parts.append(patient.last_name)

        report.append(
            PatientReportItem(
                patient_id=patient.patient_id,
                patient_name=" ".join(name_parts),
                age=age,
                visit_date=vitals.visit_date,
                last_bmi_status=bmi_status,
            )
        )

    return report


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
) -> Patient:
    patient = db.scalar(
        select(Patient).where(Patient.patient_id == patient_id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' was not found.",
        )

    return patient