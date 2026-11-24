import { useState, type FormEvent } from "react";
import { apiRequest, todayInNairobi } from "../api";
import type { Patient, SavedVitals } from "../types";
import "./VitalsPage.css";

type Props = {
  patient: Patient;
  onSaved: (vitals: SavedVitals) => void;
};

type VitalsResponse = {
  bmi: number;
};

function VitalsPage({ patient, onSaved }: Props) {
  const [visitDate, setVisitDate] = useState(todayInNairobi());
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const height = Number(heightCm);
  const weight = Number(weightKg);
  const bmi =
    height > 0 && weight > 0 ? weight / (height / 100) ** 2 : null;

  const patientName = [
    patient.first_name,
    patient.middle_name,
    patient.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!bmi || !visitDate) {
      setError("Enter a visit date, height, and weight.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiRequest<VitalsResponse>(
        `/patients/${encodeURIComponent(patient.patient_id)}/vitals`,
        {
          method: "POST",
          body: JSON.stringify({
            visit_date: visitDate,
            height_cm: height,
            weight_kg: weight,
          }),
        },
      );

      onSaved({
        visit_date: visitDate,
        bmi: response.bmi,
        next_assessment: response.bmi > 25 ? "overweight" : "general",
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save the vitals. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="vitals-page">
      <section className="vitals-intro">
        <p className="eyebrow">NEW VISIT · VITALS</p>
        <h1>Record patient vitals</h1>
        <p>Record height and weight to calculate this visit’s BMI.</p>
      </section>

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

      <form className="vitals-form" onSubmit={handleSubmit}>
        <div className="vitals-form-heading">
          <h2>Visit measurements</h2>
        </div>

        <div className="vitals-fields">
          <label className="field">
            <span>Visit date <b>*</b></span>
            <input
              type="date"
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Height (cm) <b>*</b></span>
            <input
              type="number"
              min="1"
              step="0.1"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Weight (kg) <b>*</b></span>
            <input
              type="number"
              min="1"
              step="0.1"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              required
            />
          </label>
        </div>

        <aside className="bmi-preview" aria-live="polite">
          <span className="eyebrow">CALCULATED BMI</span>
          <strong>{bmi ? bmi.toFixed(1) : "—"}</strong>
          <span>
            {bmi
              ? bmi > 25
                ? "This visit will continue to the Overweight Assessment."
                : "This visit will continue to the General Assessment."
              : "Enter height and weight to calculate BMI."}
          </span>
        </aside>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-footer">
          <p>All fields are required.</p>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save vitals"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default VitalsPage;