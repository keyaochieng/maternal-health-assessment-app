from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

from decimal import Decimal
from typing import Literal

from typing import Literal
from pydantic import StringConstraints

PatientId = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=50),
]


class PatientCreate(BaseModel):
    patient_id: PatientId
    registration_date: date
    first_name: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
    ]
    middle_name: str | None = Field(default=None, max_length=100)

    @field_validator("middle_name", mode="before")
    @classmethod
    def normalize_middle_name(cls, value: object) -> object:
        # I treat an empty form field as an omitted optional name.
        if isinstance(value, str):
            return value.strip() or None
        return value

    last_name: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
    ]
    date_of_birth: date
    gender: Annotated[
        str,
        StringConstraints(strip_whitespace=True, min_length=1, max_length=30),
    ]

    @model_validator(mode="after")
    def check_birth_date(self) -> "PatientCreate":
        if self.date_of_birth > self.registration_date:
            raise ValueError("Date of birth cannot be after the registration date.")
        return self


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: str
    registration_date: date
    first_name: str
    middle_name: str | None
    last_name: str
    date_of_birth: date
    gender: str

class VitalsCreate(BaseModel):
    visit_date: date
    height_cm: Decimal = Field(gt=0, le=300, max_digits=6, decimal_places=2)
    weight_kg: Decimal = Field(gt=0, le=500, max_digits=6, decimal_places=2)


class VitalsResponse(BaseModel):
    id: int
    visit_date: date
    height_cm: Decimal
    weight_kg: Decimal
    bmi: Decimal
    next_assessment: Literal["general", "overweight"]


RequiredComment = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1),
]


class OverweightAssessmentCreate(BaseModel):
    visit_date: date
    general_health: Literal["Good", "Poor"]
    on_diet: Literal["Yes", "No"]
    comments: RequiredComment


class GeneralAssessmentCreate(BaseModel):
    visit_date: date
    general_health: Literal["Good", "Poor"]
    using_drugs: Literal["Yes", "No"]
    comments: RequiredComment


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_name: str
    visit_date: date
    assessment_type: Literal["general", "overweight"]
    general_health: Literal["Good", "Poor"]
    on_diet: Literal["Yes", "No"] | None
    using_drugs: Literal["Yes", "No"] | None
    comments: str