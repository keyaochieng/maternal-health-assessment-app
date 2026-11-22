# Architecture decisions

## Repository shape

Use a small monorepo so the frontend, backend, and model lifecycle can be reviewed together while remaining separated by responsibility.

## Backend ownership

The API is the source of truth for patient uniqueness, dates, vitals, assessments, BMI status, and risk predictions. The browser may calculate BMI for immediate feedback, but the API must validate and calculate it again before saving.

## Data model (planned)

- `patients`: unique patient identifier, registration date, name, date of birth, gender.
- `vitals`: patient reference, visit date, height, weight, calculated BMI, maternal health measurements.
- `assessments`: patient reference, visit date, assessment type, health status, relevant yes/no response, comments.

Multiple vitals and assessments per patient are allowed on different dates. The API will enforce the date/type rules to avoid accidental duplicate submissions.

## Classification (planned)

A reproducible training step will fit a model from the six requested features: age, systolic blood pressure, diastolic blood pressure, blood sugar, body temperature, and heart rate. The API will load the fitted preprocessing/model pipeline at startup and return one of `Low Risk`, `Mid Risk`, or `High Risk`. Model metadata and evaluation results will be documented; a prediction is decision support, not a diagnosis.
