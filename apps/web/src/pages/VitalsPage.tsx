import { useState, type FormEvent } from "react";
import type { Patient } from "../types";
import "./VitalsPage.css";

type SavedVitals = {
  bmi: number;
  next_assessment: "general" | "overweight";
};

type ApiError = {
  detail?: string;
};

type Props = {
  patient: Patient;
};

function VitalsPage({ patient }: Props) {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedVitals, setSavedVitals] = useState<SavedVitals | null>(null);

  const heightMetres = Number(heightCm) / 100;
  const bmiPreview =
    Number(weightKg) > 0 && heightMetres > 0
      ? Number(weightKg) / (heightMetres * heightMetres)
      : null;

  const patientName = [
    patient.first_name,
    patient.middle_name,
    patient.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSavedVitals(null);

    const formData = new FormData(event.currentTarget);
    const visitDate = String(formData.get("visit_date") ?? "");

    try {
      const response = await fetch(
        `/api/patients/${encodeURIComponent(patient.patient_id)}/vitals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visit_date: visitDate,
            height_cm: Number(heightCm),
            weight_kg: Number(weightKg),
          }),
        },
      );

      const result = (await response.json()) as SavedVitals & ApiError;

      if (!response.ok) {
        setErrorMessage(
          result.detail ?? "I couldn't save these vitals. Please try again.",
        );
        return;
      }

      setSavedVitals(result);
    } catch {
      setErrorMessage(
        "I couldn't reach the API. Check that FastAPI and PostgreSQL are running.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="vitals-page">
      <div className="vitals-intro">
        <p className="eyebrow">VISIT RECORD / 02</p>
        <h1>Record vitals.</h1>
        <p>Enter the patient’s measurements for this visit.</p>
      </div>

      <section className="patient-context" aria-label="Current patient">
        <div>
          <span>Patient No.</span>
          <strong>{patient.patient_id}</strong>
        </div>
        <div>
          <span>Patient name</span>
          <strong>{patientName}</strong>
        </div>
      </section>

      {errorMessage && (
        <div className="message message-error" role="alert">
          <strong>Could not save</strong>
          <span>{errorMessage}</span>
        </div>
      )}

      {savedVitals && (
        <div className="vitals-result" role="status">
          <div>
            <span className="eyebrow">CALCULATED BMI</span>
            <strong>{Number(savedVitals.bmi).toFixed(2)}</strong>
          </div>
          <div>
            <span className="eyebrow">NEXT FORM</span>
            <strong>
              {savedVitals.next_assessment === "general"
                ? "General Assessment"
                : "Overweight Assessment"}
            </strong>
          </div>
        </div>
      )}

      <form className="vitals-form" onSubmit={handleSubmit}>
        <div className="vitals-form-heading">
          <span className="section-letter">A</span>
          <h2>Measurements</h2>
        </div>

        <div className="vitals-fields">
          <label className="field">
            <span>Visit date <b>*</b></span>
            <input name="visit_date" type="date" required />
          </label>

          <label className="field">
            <span>Height in cm <b>*</b></span>
            <input
              name="height_cm"
              type="number"
              min="1"
              step="0.1"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Weight in kg <b>*</b></span>
            <input
              name="weight_kg"
              type="number"
              min="1"
              step="0.1"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="bmi-preview" aria-live="polite">
          <span className="eyebrow">BMI PREVIEW</span>
          <strong>{bmiPreview ? bmiPreview.toFixed(2) : "—"}</strong>
          <span>
            {bmiPreview
              ? "The API recalculates BMI when you save."
              : "Enter height and weight to preview BMI."}
          </span>
        </div>

        <div className="form-footer">
          <p>All measurements are required.</p>
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save vitals"}
            {!isSaving && <span aria-hidden="true">↗</span>}
          </button>
        </div>
      </form>
    </main>
  );
}

export default VitalsPage;