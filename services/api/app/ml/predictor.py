from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


MODEL_PATH = (
    Path(__file__).resolve().parents[4]
    / "data"
    / "models"
    / "maternal_risk_pipeline.joblib"
)


@lru_cache(maxsize=1)
def load_model() -> dict[str, Any]:
    return joblib.load(MODEL_PATH)


def predict_risk(features: dict[str, float]) -> str:
    model_bundle = load_model()
    feature_columns = model_bundle["feature_columns"]

    # I keep the training feature names and order so prediction matches training.
    feature_values = [[features[column] for column in feature_columns]]
    input_data = pd.DataFrame(feature_values, columns=feature_columns)

    prediction = model_bundle["pipeline"].predict(input_data)[0]
    return str(prediction)