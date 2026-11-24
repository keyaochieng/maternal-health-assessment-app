import { useState, type FormEvent } from "react";
import "./App.css";
import VitalsPage from "./pages/VitalsPage";
import type { Patient } from "./types";

type ApiResponse = Patient & {
  detail?: string | { msg?: string }[];
};

type Page = "registration" | "vitals";

function todayInNairobi(): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function App() {
  const [activePage, setActivePage] = useState<Page>("registration");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedPatient, setSavedPatient] = useState<Patient | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const value = (fieldName: string) =>
      String(formData.get(fieldName) ?? "").trim();

    const patientData = {
      patient_id: value("patient_id"),
      registration_date: value("registration_date"),
      first_name: value("first_name"),
      middle_name: value("middle_name") || null,
      last_name: value("last_name"),
      date_of_birth: value("date_of_birth"),
      gender: value("gender"),
    };

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        const detail = result.detail;
        const message =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((item) => item.msg).filter(Boolean).join(" ")
              : "Please review the details and try again.";

        setErrorMessage(message);
        return;
      }

      setSavedPatient(result);
      setActivePage("vitals");
    } catch {
      setErrorMessage(
        "I couldn't reach the API. Check that FastAPI and PostgreSQL are running.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="/" aria-label="mamashealth home">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span>mamashealth</span>
        </a>

        <div className="masthead-label">
          MATERNAL HEALTH <span>—</span> PATIENT RECORDS
        </div>

        <time className="masthead-date">{todayInNairobi()}</time>
      </header>

      <nav className="workflow" aria-label="Patient workflow">
        <div
          className={`workflow-step ${
            activePage === "registration" ? "is-active" : ""
          }`}
          aria-current={activePage === "registration" ? "step" : undefined}
        >
          <span className="step-number">01</span>
          <span>Registration</span>
        </div>

        <div
          className={`workflow-step ${
            activePage === "vitals" ? "is-active" : ""
          }`}
          aria-current={activePage === "vitals" ? "step" : undefined}
        >
          <span className="step-number">02</span>
          <span>Vitals</span>
        </div>

        <div className="workflow-step">
          <span className="step-number">03</span>
          <span>Assessment</span>
        </div>

        <div className="workflow-step">
          <span className="step-number">04</span>
          <span>Patient list</span>
        </div>
      </nav>

      {activePage === "registration" ? (
        <main className="main-layout">
          <section className="page-intro">
            <p className="eyebrow">NEW PATIENT / INTAKE</p>
            <div className="large-number" aria-hidden="true">01</div>
            <h1>Register<br />the patient.</h1>
            <p className="intro-copy">
              Create a patient record before recording a visit or assessment.
            </p>
            <div className="intro-rule" />
            <p className="intro-note">
              A unique patient number keeps every visit connected to the right
              person.
            </p>
          </section>

          <section className="form-area" aria-labelledby="form-title">
            <div className="form-heading">
              <div>
                <p className="eyebrow">PATIENT RECORD</p>
                <h2 id="form-title">Personal details</h2>
              </div>
              <p className="required-note"><span>*</span> Required</p>
            </div>

            {errorMessage && (
              <div className="message message-error" role="alert">
                <strong>Could not save</strong>
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              onChange={() => setErrorMessage("")}
            >
              <div className="form-section">
                <div className="section-heading">
                  <span className="section-letter">A</span>
                  <h3>Patient identity</h3>
                </div>

                <label className="field patient-number">
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
                    <input
                      name="first_name"
                      type="text"
                      autoComplete="given-name"
                      maxLength={100}
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Middle name</span>
                    <input
                      name="middle_name"
                      type="text"
                      autoComplete="additional-name"
                      maxLength={100}
                    />
                    <small>Optional</small>
                  </label>

                  <label className="field">
                    <span>Last name <b>*</b></span>
                    <input
                      name="last_name"
                      type="text"
                      autoComplete="family-name"
                      maxLength={100}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <div className="section-heading">
                  <span className="section-letter">B</span>
                  <h3>Registration details</h3>
                </div>

                <div className="field-grid">
                  <label className="field">
                    <span>Date of birth <b>*</b></span>
                    <input
                      name="date_of_birth"
                      type="date"
                      autoComplete="bday"
                      required
                    />
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
              </div>

              <div className="form-footer">
                <p>Fields marked <b>*</b> are required.</p>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save patient"}
                  {!isSaving && <span aria-hidden="true">↗</span>}
                </button>
              </div>
            </form>
          </section>
        </main>
      ) : savedPatient ? (
        <VitalsPage patient={savedPatient} />
      ) : null}

      <footer className="page-footer">
        <span>mamashealth</span>
        <span>
          Patient intake · Step {activePage === "registration" ? "1" : "2"} of 4
        </span>
      </footer>
    </div>
  );
}

export default App;