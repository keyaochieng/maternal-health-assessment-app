import { useState, type FormEvent } from "react";
import { apiRequest, todayInNairobi } from "../api";
import type { Patient } from "../types";

type PatientInput = Omit<Patient, "id">;

type Props = {
  onRegistered: (patient: Patient) => void;
};

function PatientRegistrationPage({ onRegistered }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const values = new FormData(event.currentTarget);
    const value = (name: string) => String(values.get(name) ?? "").trim();

    const patientData: PatientInput = {
      patient_id: value("patient_id"),
      registration_date: value("registration_date"),
      first_name: value("first_name"),
      middle_name: value("middle_name") || null,
      last_name: value("last_name"),
      date_of_birth: value("date_of_birth"),
      gender: value("gender"),
    };

    try {
      const patient = await apiRequest<Patient>("/patients", {
        method: "POST",
        body: JSON.stringify(patientData),
      });
      onRegistered(patient);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not register patient.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="content-page registration-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">NEW PATIENT / INTAKE</p>
          <h1>Register patient</h1>
          <p className="page-description">
            Register each patient once. You can start future visits from the
            patient list.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="notice notice-error" role="alert">
          <strong>Could not register patient.</strong> {errorMessage}
        </div>
      )}

      <form className="record-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="section-heading">
            <span>A</span>
            <h2>Patient identity</h2>
          </div>

          <label className="field field-narrow">
            <span>Patient No. <b>*</b></span>
            <input
              name="patient_id"
              type="text"
              placeholder="e.g. PAT-00824"
              autoComplete="off"
              maxLength={50}
              required
            />
            <small>This number must be unique.</small>
          </label>

          <div className="field-grid">
            <label className="field">
              <span>First name <b>*</b></span>
              <input name="first_name" autoComplete="given-name" required />
            </label>

            <label className="field">
              <span>Middle name</span>
              <input name="middle_name" autoComplete="additional-name" />
              <small>Optional</small>
            </label>

            <label className="field">
              <span>Last name <b>*</b></span>
              <input name="last_name" autoComplete="family-name" required />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="section-heading">
            <span>B</span>
            <h2>Registration details</h2>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Date of birth <b>*</b></span>
              <input name="date_of_birth" type="date" required />
            </label>

            <label className="field">
              <span>Gender <b>*</b></span>
              <select name="gender" defaultValue="" required>
                <option value="" disabled>Select an option</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="field">
              <span>Registration date <b>*</b></span>
              <input
                name="registration_date"
                type="date"
                defaultValue={todayInNairobi()}
                required
              />
            </label>
          </div>
        </section>

        <div className="form-footer">
          <p>Fields marked * are required.</p>
          <button className="primary-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save and start first visit"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default PatientRegistrationPage;