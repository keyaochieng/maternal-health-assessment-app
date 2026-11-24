CREATE SEQUENCE IF NOT EXISTS patient_number_seq;

SELECT setval(
    'patient_number_seq',
    COALESCE(
        (
            SELECT MAX(CAST(SUBSTRING(patient_id FROM 5) AS INTEGER))
            FROM patients
            WHERE patient_id ~ '^PAT-[0-9]+$'
        ),
        0
    ) + 1,
    false
);