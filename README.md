# Maternal Care Patient Assessment

A full-stack patient registration and assessment app with a maternal health risk classification API.

## Architecture

This repository uses a TypeScript/React web client, a Python/FastAPI service, PostgreSQL for durable patient and visit data, and a scikit-learn model for maternal risk classification.

```text
apps/web/       React + TypeScript user interface
services/api/   FastAPI REST service and model inference
data/           Training dataset notes and trained model artifacts
docs/           Architecture and API documentation
```

## Planned workflow

1. Register each patient once.
2. Record dated height and weight measurements and calculate BMI.
3. Route the patient to the BMI-appropriate assessment form.
4. List patients and filter their visits by date.
5. Submit maternal vital signs to the API and return Low, Mid, or High Risk using a trained model.

## Implementation approach

The web application will call the REST API built in this repository. The API will own validation, persistence, BMI status rules, and model inference. The classifier will be trained from a documented maternal health dataset; its preprocessing and model artifact will be versioned with the project, while patient data will live in PostgreSQL.

## Development status

Initial repository outline. Application code, database schema, API contracts, and model are to be added in the following steps.
