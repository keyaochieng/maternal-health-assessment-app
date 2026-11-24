from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.ml.predictor import predict_risk


router = APIRouter(prefix="/risk", tags=["AI Classification"])


class RiskPredictionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    age: float = Field(alias="Age", gt=0, le=120)
    systolic_bp: float = Field(alias="SystolicBP", gt=0, le=300)
    diastolic_bp: float = Field(alias="DiastolicBP", gt=0, le=200)
    blood_sugar: float = Field(alias="BS", gt=0, le=100)
    body_temperature: float = Field(alias="BodyTemp", gt=0, le=50)
    heart_rate: float = Field(alias="HeartRate", gt=0, le=300)


class RiskPredictionResponse(BaseModel):
    risk_level: Literal["Low Risk", "Mid Risk", "High Risk"]


@router.post("/predict", response_model=RiskPredictionResponse)
def classify_maternal_risk(
    data: RiskPredictionRequest,
) -> RiskPredictionResponse:
    features = {
        "Age": data.age,
        "SystolicBP": data.systolic_bp,
        "DiastolicBP": data.diastolic_bp,
        "BS": data.blood_sugar,
        "BodyTemp": data.body_temperature,
        "HeartRate": data.heart_rate,
    }

    try:
        risk_level = predict_risk(features)
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail="The trained maternal health model file was not found.",
        ) from error

    if risk_level not in {"Low Risk", "Mid Risk", "High Risk"}:
        raise HTTPException(
            status_code=500,
            detail="The model returned an unrecognized risk classification.",
        )

    return RiskPredictionResponse(risk_level=risk_level)