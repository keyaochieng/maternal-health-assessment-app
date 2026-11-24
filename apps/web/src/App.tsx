import { useEffect, useState } from "react";
import "./App.css";
import { todayInNairobi } from "./api";
import AssessmentPage from "./pages/AssessmentPage";
import PatientListPage from "./pages/PatientListPage";
import PatientRegistrationPage from "./pages/PatientRegistrationPage";
import VitalsPage from "./pages/VitalsPage";
import type { AssessmentType, Patient, SavedVitals } from "./types";

type Screen = "patients" | "registration" | "vitals" | "assessment";

type SavedAppState = {
  screen: Screen;
  selectedPatient: Patient | null;
  visitDate: string;
  assessmentType: AssessmentType;
};

const VISIT_STATE_KEY = "mamashealth-current-visit";

function readSavedAppState(): SavedAppState {
  const defaultState: SavedAppState = {
    screen: "patients",
    selectedPatient: null,
    visitDate: "",
    assessmentType: "general",
  };

  try {
    const saved = sessionStorage.getItem(VISIT_STATE_KEY);
    if (!saved) return defaultState;

    const parsed = JSON.parse(saved) as Partial<SavedAppState>;
    const validScreens: Screen[] = [
      "patients",
      "registration",
      "vitals",
      "assessment",
    ];

    if (!parsed.screen || !validScreens.includes(parsed.screen)) {
      return defaultState;
    }

    return {
      screen: parsed.screen,
      selectedPatient: parsed.selectedPatient ?? null,
      visitDate: parsed.visitDate ?? "",
      assessmentType:
        parsed.assessmentType === "overweight" ? "overweight" : "general",
    };
  } catch {
    return defaultState;
  }
}

function App() {
  const [initialState] = useState(readSavedAppState);
  const [screen, setScreen] = useState<Screen>(initialState.screen);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    initialState.selectedPatient,
  );
  const [visitDate, setVisitDate] = useState(initialState.visitDate);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(
    initialState.assessmentType,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedState: SavedAppState = {
      screen,
      selectedPatient,
      visitDate,
      assessmentType,
    };

    sessionStorage.setItem(VISIT_STATE_KEY, JSON.stringify(savedState));
  }, [screen, selectedPatient, visitDate, assessmentType]);

  function startVisit(patient: Patient) {
    setSelectedPatient(patient);
    setVisitDate("");
    setAssessmentType("general");
    setScreen("vitals");
  }

  function handleVitalsSaved(vitals: SavedVitals) {
    setVisitDate(vitals.visit_date);
    setAssessmentType(vitals.next_assessment);
    setScreen("assessment");
  }

  function finishAssessment() {
    setSelectedPatient(null);
    setVisitDate("");
    setAssessmentType("general");
    setScreen("patients");
    setRefreshKey((value) => value + 1);
  }

  const isVisitInProgress = screen === "vitals" || screen === "assessment";

  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="/" aria-label="mamashealth home">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <span>mamashealth</span>
        </a>

        <div className="masthead-label">
          MATERNAL HEALTH <span>—</span> PATIENT RECORDS
        </div>

        <time className="masthead-date">{todayInNairobi()}</time>
      </header>

      <nav className="main-nav" aria-label="Main navigation">
        <button
          className={
            screen === "patients" ? "nav-button is-active" : "nav-button"
          }
          onClick={() => setScreen("patients")}
        >
          Patients
        </button>

        <button
          className={
            screen === "registration" ? "nav-button is-active" : "nav-button"
          }
          onClick={() => setScreen("registration")}
        >
          Register patient
        </button>
      </nav>

      {isVisitInProgress && (
        <div className="visit-progress" aria-label="Current visit progress">
          <span className={screen === "vitals" ? "is-active" : "is-complete"}>
            01 &nbsp; Vitals
          </span>
          <span className={screen === "assessment" ? "is-active" : ""}>
            02 &nbsp; Assessment
          </span>
        </div>
      )}

      {screen === "patients" && (
        <PatientListPage
          refreshKey={refreshKey}
          onRegister={() => setScreen("registration")}
          onStartVisit={startVisit}
        />
      )}

      {screen === "registration" && (
        <PatientRegistrationPage
          onRegistered={(patient) => {
            setSelectedPatient(patient);
            setVisitDate("");
            setScreen("vitals");
          }}
        />
      )}

      {screen === "vitals" && selectedPatient && (
        <VitalsPage patient={selectedPatient} onSaved={handleVitalsSaved} />
      )}

      {screen === "assessment" && selectedPatient && (
        <AssessmentPage
          patient={selectedPatient}
          visitDate={visitDate}
          assessmentType={assessmentType}
          onSaved={finishAssessment}
        />
      )}

      <footer className="page-footer">
        <span>mamashealth</span>
        <span>
          {screen === "patients"
            ? "Patient records"
            : screen === "registration"
              ? "New patient"
              : screen === "vitals"
                ? "New visit · Vitals"
                : "New visit · Assessment"}
        </span>
      </footer>
    </div>
  );
}

export default App;