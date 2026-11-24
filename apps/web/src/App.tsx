import { useEffect, useState } from "react";
import "./App.css";
import { todayInNairobi } from "./api";
import AssessmentPage from "./pages/AssessmentPage";
import PatientListPage from "./pages/PatientListPage";
import PatientRegistrationPage from "./pages/PatientRegistrationPage";
import VitalsPage from "./pages/VitalsPage";
import type {
  AssessmentType,
  MaternalRiskLevel,
  Patient,
  SavedVitals,
} from "./types";

type Screen = "patients" | "registration" | "vitals" | "assessment";

type SavedAppState = {
  screen: Screen;
  selectedPatient: Patient | null;
  visitDate: string;
  assessmentType: AssessmentType;
  riskLevel: MaternalRiskLevel | null;
};

const VISIT_STATE_KEY = "mamashealth-current-visit";

function readSavedAppState(): SavedAppState {
  const defaultState: SavedAppState = {
    screen: "patients",
    selectedPatient: null,
    visitDate: "",
    assessmentType: "general",
    riskLevel: null,
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
    const validRiskLevels: MaternalRiskLevel[] = [
      "Low Risk",
      "Mid Risk",
      "High Risk",
    ];

    if (!parsed.screen || !validScreens.includes(parsed.screen)) {
      return defaultState;
    }

    const riskLevel = validRiskLevels.includes(
      parsed.riskLevel as MaternalRiskLevel,
    )
      ? (parsed.riskLevel as MaternalRiskLevel)
      : null;

    return {
      screen: parsed.screen,
      selectedPatient: parsed.selectedPatient ?? null,
      visitDate: parsed.visitDate ?? "",
      assessmentType:
        parsed.assessmentType === "overweight" ? "overweight" : "general",
      riskLevel,
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
  const [riskLevel, setRiskLevel] = useState<MaternalRiskLevel | null>(
    initialState.riskLevel,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedState: SavedAppState = {
      screen,
      selectedPatient,
      visitDate,
      assessmentType,
      riskLevel,
    };

    sessionStorage.setItem(VISIT_STATE_KEY, JSON.stringify(savedState));
  }, [screen, selectedPatient, visitDate, assessmentType, riskLevel]);

  function startVisit(patient: Patient) {
    setSelectedPatient(patient);
    setVisitDate("");
    setAssessmentType("general");
    setRiskLevel(null);
    setScreen("vitals");
  }

  function handleVitalsSaved(vitals: SavedVitals) {
    setVisitDate(vitals.visit_date);
    setAssessmentType(vitals.next_assessment);
    setRiskLevel(vitals.risk_level);
    // I refresh the patient report as soon as vitals are saved, since that already creates a visit.
    setRefreshKey((value) => value + 1);
    setScreen("assessment");
  }

  function finishAssessment() {
    setSelectedPatient(null);
    setVisitDate("");
    setAssessmentType("general");
    setRiskLevel(null);
    setScreen("patients");
    setRefreshKey((value) => value + 1);
  }

  const isVisitInProgress = screen === "vitals" || screen === "assessment";

  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="/" aria-label="SuperHealth home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SuperHealth</span>
        </a>

        <div className="masthead-label">
          PATIENT CARE <span>—</span> RECORDS
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
            setRiskLevel(null);
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
          riskLevel={riskLevel}
          onSaved={finishAssessment}
        />
      )}

      <footer className="page-footer">
        <span>Superhealth</span>
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
