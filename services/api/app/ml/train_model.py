from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from ucimlrepo import fetch_ucirepo


FEATURE_COLUMNS = [
    "Age",
    "SystolicBP",
    "DiastolicBP",
    "BS",
    "BodyTemp",
    "HeartRate",
]

RISK_LABELS = ["Low Risk", "Mid Risk", "High Risk"]


def main() -> None:
    api_directory = Path(__file__).resolve().parents[2]
    project_root = api_directory.parent.parent
    data_directory = project_root / "data"
    model_directory = data_directory / "models"

    data_directory.mkdir(parents=True, exist_ok=True)
    model_directory.mkdir(parents=True, exist_ok=True)

    dataset = fetch_ucirepo(id=863)
    features = dataset.data.features
    targets = dataset.data.targets

    frame = pd.concat([features, targets], axis=1)
    frame.to_csv(data_directory / "maternal_health_risk.csv", index=False)

    if frame[FEATURE_COLUMNS].isnull().any().any() or frame["RiskLevel"].isnull().any():
        raise ValueError("The training data contains missing feature or label values.")

    x = frame[FEATURE_COLUMNS].astype(float)
    y = frame["RiskLevel"].astype(str).str.strip().str.title()

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = Pipeline(
        steps=[
            # I scale the features so large-valued measurements don't dominate KNN distances.
            ("scaler", StandardScaler()),
            ("classifier", KNeighborsClassifier(n_neighbors=5)),
        ]
    )

    model.fit(x_train, y_train)
    predictions = model.predict(x_test)

    print(classification_report(
        y_test,
        predictions,
        labels=RISK_LABELS,
        zero_division=0,
    ))

    model_bundle = {
        "pipeline": model,
        "feature_columns": FEATURE_COLUMNS,
        "risk_labels": RISK_LABELS,
    }

    joblib.dump(
        model_bundle,
        model_directory / "maternal_risk_pipeline.joblib",
    )


if __name__ == "__main__":
    main()