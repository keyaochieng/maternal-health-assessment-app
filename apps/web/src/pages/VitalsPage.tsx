import { useState, type FormEvent } from "react";
import { apiRequest, todayInNairobi } from "../api";
import type { MaternalRiskLevel, Patient, SavedVitals } from "../types";
import "./VitalsPage.css";

type Props = {
  patient: Patient;
  onSaved: (vitals: SavedVitals) => void;
};

type VitalsResponse = {
  bmi: number;
  risk_level: MaternalRiskLevel | null;
};

function VitalsPage({ patient, onSaved }: Props) {
  const [visitDate, setVisitDate] = useState(todayInNairobi());
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [systolicBp, setSystolicBp] = useState("");
  const [diastolicBp, setDiastolicBp] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [bodyTemperature, setBodyTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const height = Number(heightCm);
  const weight = Number(weightKg);
  const bmi =
    height > 0 && weight > 0 ? weight / (height / 100) ** 2 : null;

  const riskInputs = [
    systolicBp,
    diastolicBp,
    bloodSugar,
    bodyTemperature,
    heartRate,
  ];
  const hasAnyRiskInput = riskInputs.some((value) => value.trim() !== "");
  const hasAllRiskInputs = riskInputs.every((value) => value.trim() !== "");

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

    if (hasAnyRiskInput && !hasAllRiskInputs) {
      setError(
        "Enter all four optional maternal measurements, or leave them blank.",
      );
      return;
    }

    setIsSaving(true);

    const requestBody = {
      visit_date: visitDate,
      height_cm: height,
      weight_kg: weight,
      ...(hasAllRiskInputs
        ? {
            systolic_bp: Number(systolicBp),
            diastolic_bp: Number(diastolicBp),
            blood_sugar: Number(bloodSugar),
            body_temperature: Number(bodyTemperature),
            heart_rate: Number(heartRate),
          }
        : {}),
    };

    try {
      const response = await apiRequest<VitalsResponse>(
        `/patients/${encodeURIComponent(patient.patient_id)}/vitals`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
      );

      onSaved({
        visit_date: visitDate,
        bmi: response.bmi,
        next_assessment: response.bmi > 25 ? "overweight" : "general",
        risk_level: response.risk_level,
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

        <fieldset className="risk-inputs">
          <legend>
            Maternal risk measurements <span>Optional</span>
          </legend>
          <p>
            Enter all four to receive a model prediction. Age is calculated
            from the patient’s date of birth.
          </p>

          <div className="risk-fields">
            <label className="field">
              <span>Systolic blood pressure (mmHg)</span>
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                value={systolicBp}
                onChange={(event) => setSystolicBp(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Diastolic blood pressure (mmHg)</span>
              <input
                type="number"
                min="1"
                max="200"
                step="1"
                value={diastolicBp}
                onChange={(event) => setDiastolicBp(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Blood sugar (mmol/L)</span>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={bloodSugar}
                onChange={(event) => setBloodSugar(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Body temperature (°F)</span>
              <input
                type="number"
                min="1"
                max="120"
                step="0.1"
                value={bodyTemperature}
                onChange={(event) => setBodyTemperature(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Heart rate (bpm)</span>
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                value={heartRate}
                onChange={(event) => setHeartRate(event.target.value)}
              />
            </label>
          </div>
        </fieldset>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="form-footer">
          <p>
            Fields marked * are required. Maternal risk measurements are
            optional.
          </p>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save vitals"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default VitalsPage;