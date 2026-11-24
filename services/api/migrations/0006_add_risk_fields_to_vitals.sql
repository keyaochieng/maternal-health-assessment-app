ALTER TABLE vitals
    ADD COLUMN systolic_bp NUMERIC(6, 2),
    ADD COLUMN diastolic_bp NUMERIC(6, 2),
    ADD COLUMN blood_sugar NUMERIC(6, 2),
    ADD COLUMN body_temperature NUMERIC(6, 2),
    ADD COLUMN heart_rate NUMERIC(6, 2),
    ADD COLUMN risk_level VARCHAR(20);

ALTER TABLE vitals
    ADD CONSTRAINT ck_vitals_complete_risk_prediction
    CHECK (
        (
            systolic_bp IS NULL
            AND diastolic_bp IS NULL
            AND blood_sugar IS NULL
            AND body_temperature IS NULL
            AND heart_rate IS NULL
            AND risk_level IS NULL
        )
        OR
        (
            systolic_bp IS NOT NULL
            AND diastolic_bp IS NOT NULL
            AND blood_sugar IS NOT NULL
            AND body_temperature IS NOT NULL
            AND heart_rate IS NOT NULL
            AND risk_level IN ('Low Risk', 'Mid Risk', 'High Risk')
        )
    );