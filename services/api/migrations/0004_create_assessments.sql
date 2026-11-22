CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    patient_record_id INTEGER NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    assessment_type VARCHAR(20) NOT NULL
        CHECK (assessment_type IN ('general', 'overweight')),
    general_health VARCHAR(10) NOT NULL
        CHECK (general_health IN ('Good', 'Poor')),
    on_diet VARCHAR(3),
    using_drugs VARCHAR(3),
    comments TEXT NOT NULL CHECK (length(trim(comments)) > 0),
    CONSTRAINT ck_assessment_form_fields CHECK (
        (assessment_type = 'overweight'
         AND on_diet IN ('Yes', 'No')
         AND using_drugs IS NULL)
        OR
        (assessment_type = 'general'
         AND using_drugs IN ('Yes', 'No')
         AND on_diet IS NULL)
    ),
    CONSTRAINT uq_assessment_patient_visit_date
        UNIQUE (patient_record_id, visit_date)
);