import { useState, type FormEvent } from "react";
import { apiRequest } from "../api";
import type { AssessmentType, Patient } from "../types";

type Props = {
  patient: Patient;
  visitDate: string;
  assessmentType: AssessmentType;
  onSaved: () => void;
};

function AssessmentPage({
  patient,
  visitDate,
  assessmentType,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isOverweight = assessmentType === "overweight";
  const title = isOverweight
    ? "Overweight Assessment"
    : "General Assessment";
  const question = isOverweight
    ? "Have you ever been on a diet to lose weight?"
    : "Are you currently using any drugs?";

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

    const values = new FormData(event.currentTarget);
    const yesNoAnswer = String(values.get("yes_no_answer") ?? "");
    const generalHealth = String(values.get("general_health") ?? "");
    const comments = String(values.get("comments") ?? "").trim();

    const body = isOverweight
      ? {
          visit_date: visitDate,
          general_health: generalHealth,
          on_diet: yesNoAnswer,
          comments,
        }
      : {
          visit_date: visitDate,
          general_health: generalHealth,
          using_drugs: yesNoAnswer,
          comments,
        };

    try {
      await apiRequest(
        `/patients/${encodeURIComponent(patient.patient_id)}/assessments/${assessmentType}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      onSaved();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save assessment.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="content-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">VISIT RECORD / ASSESSMENT</p>
          <h1>{title}</h1>
          <p className="page-description">
            This form was selected from the BMI recorded for this visit.
          </p>
        </div>
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
        <div>
          <span>Visit date</span>
          <strong>{visitDate}</strong>
        </div>
      </section>

      {errorMessage && (
        <div className="notice notice-error" role="alert">{errorMessage}</div>
      )}

      <form className="record-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="section-heading">
            <span>A</span>
            <h2>Visit assessment</h2>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>General health <b>*</b></span>
              <select name="general_health" defaultValue="" required>
                <option value="" disabled>Select an option</option>
                <option value="Good">Good</option>
                <option value="Poor">Poor</option>
              </select>
            </label>

            <fieldset className="yes-no-field">
              <legend>{question} <b>*</b></legend>
              <label>
                <input
                  type="radio"
                  name="yes_no_answer"
                  value="Yes"
                  required
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="yes_no_answer"
                  value="No"
                  required
                />
                No
              </label>
            </fieldset>

            <label className="field comments-field">
              <span>Comments <b>*</b></span>
              <textarea
                name="comments"
                rows={5}
                maxLength={2000}
                placeholder="Add relevant notes about this visit."
                required
              />
            </label>
          </div>
        </section>

        <div className="form-footer">
          <p>All fields are required.</p>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save assessment"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default AssessmentPage;