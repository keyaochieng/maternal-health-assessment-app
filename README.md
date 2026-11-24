# Superhealth

A web application for registering patients, recording visits, completing assessments, and classifying maternal health risk.

## Technology

- **Frontend:** React, TypeScript, and Vite
- **Backend:** Python and FastAPI
- **Database:** PostgreSQL
- **Machine learning:** scikit-learn K-nearest neighbors (KNN)

## API approach

I built a custom REST API with FastAPI and PostgreSQL instead of using the demo APIs in the Postman collection. The API manages patient registration, visit vitals, assessments, reports, and maternal health risk predictions.

## Patient workflow

1. Register each patient once.
2. Select a patient from the list to start a visit.
3. Record the visit date, height, and weight. The API calculates BMI.
4. BMI of 25 or less leads to the General Assessment; BMI above 25 leads to the Overweight Assessment.
5. After saving the assessment, return to the patient list.

Patients may have visits on different dates. The list displays each patient once with their latest visit’s BMI status. Use the visit-date filter to find patients with a visit on a particular date.

BMI status is:

- **Underweight:** BMI below 18.5
- **Normal:** BMI from 18.5 to less than 25
- **Overweight:** BMI of 25 or higher

## Maternal health risk classification

The model is trained using the UCI Maternal Health Risk dataset. Its scikit-learn pipeline scales the input features and classifies them using KNN.

The prediction endpoint is:

```http
POST /risk/predict
```

It accepts these features:

- `Age`
- `SystolicBP`
- `DiastolicBP`
- `BS` (blood sugar)
- `BodyTemp`
- `HeartRate`

Example request:

```json
{
  "Age": 25,
  "SystolicBP": 120,
  "DiastolicBP": 80,
  "BS": 8,
  "BodyTemp": 98.6,
  "HeartRate": 70
}
```

Example response:

```json
{
  "risk_level": "Low Risk"
}
```

The model returns `Low Risk`, `Mid Risk`, or `High Risk`. This classification is an assessment result, not a medical diagnosis.

Interactive API documentation is available at `/docs` while the backend is running.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/patients` | Register a patient |
| `GET` | `/patients` | List patients |
| `GET` | `/patients/{patient_id}` | Get a patient |
| `GET` | `/patients/report` | Get the latest visit report |
| `GET` | `/patients/report?visit_date=YYYY-MM-DD` | Filter the report by visit date |
| `POST` | `/patients/{patient_id}/vitals` | Save vitals for a visit |
| `GET` | `/patients/{patient_id}/vitals` | List a patient’s vitals history |
| `POST` | `/patients/{patient_id}/assessments/general` | Save a General Assessment |
| `POST` | `/patients/{patient_id}/assessments/overweight` | Save an Overweight Assessment |
| `GET` | `/patients/{patient_id}/assessments` | List a patient’s assessments |
| `POST` | `/risk/predict` | Predict maternal health risk |
| `GET` | `/health` | Check API and database health |

## Run locally

### Prerequisites

- Docker Desktop
- Python
- Node.js and npm

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d db
```

### 2. Configure and start the API

Set `DATABASE_URL` in `services/api/.env`. Keep `.env` local and do not commit it.

From `services/api`:

```bash
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Open `http://127.0.0.1:8000/docs` for interactive API documentation.

To retrain the model and recreate its dataset and model artifact, run this from `services/api`:

```bash
python -m app.ml.train_model
```

### 3. Start the web app

From `apps/web`:

```bash
npm install
npm run dev
```

Vite prints the local web address in the terminal.

## Project structure

```text
apps/web/       React and TypeScript web application
services/api/   FastAPI backend, database models, and ML training/inference code
data/           Training dataset and trained model artifact
```