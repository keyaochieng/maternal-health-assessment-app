CREATE TABLE IF NOT EXISTS vitals (
    id SERIAL PRIMARY KEY,
    patient_record_id INTEGER NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    height_cm NUMERIC(6, 2) NOT NULL CHECK (height_cm > 0),
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg > 0),
    bmi NUMERIC(6, 2) NOT NULL,
    CONSTRAINT uq_vitals_patient_visit_date
        UNIQUE (patient_record_id, visit_date)
);