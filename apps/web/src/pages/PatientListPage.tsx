import { useEffect, useMemo, useState } from "react";
import { apiRequest, todayInNairobi } from "../api";
import type { Patient, PatientReport } from "../types";

type PatientRow = {
  patient: Patient;
  report: PatientReport | null;
};

type Props = {
  refreshKey: number;
  onRegister: () => void;
  onStartVisit: (patient: Patient) => void;
};

function calculateAge(dateOfBirth: string, asOf: string): number {
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  const reference = new Date(`${asOf}T00:00:00`);
  let age = reference.getFullYear() - birth.getFullYear();

  const birthdayHasPassed =
    reference.getMonth() > birth.getMonth() ||
    (reference.getMonth() === birth.getMonth() &&
      reference.getDate() >= birth.getDate());

  if (!birthdayHasPassed) {
    age -= 1;
  }

  return age;
}

function PatientListPage({ refreshKey, onRegister, onStartVisit }: Props) {
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [search, setSearch] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadPatients() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const query = visitDate
          ? `?visit_date=${encodeURIComponent(visitDate)}`
          : "";

        const [patients, reports] = await Promise.all([
          apiRequest<Patient[]>("/patients"),
          apiRequest<PatientReport[]>(`/patients/report${query}`),
        ]);

        if (ignore) return;

        const reportsByPatient = new Map(
          reports.map((report) => [report.patient_id, report]),
        );

        const matchingPatients = visitDate
          ? patients.filter((patient) => reportsByPatient.has(patient.patient_id))
          : patients;

        setRows(
          matchingPatients.map((patient) => ({
            patient,
            report: reportsByPatient.get(patient.patient_id) ?? null,
          })),
        );
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load patients.",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadPatients();

    return () => {
      ignore = true;
    };
  }, [visitDate, refreshKey]);

  const visibleRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return rows;

    return rows.filter(({ patient }) => {
      const name = [
        patient.first_name,
        patient.middle_name,
        patient.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        patient.patient_id.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [rows, search]);

  return (
    <main className="content-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">PATIENT RECORDS</p>
          <h1>Patients</h1>
          <p className="page-description">
            Find a patient to start a visit, or register someone new.
          </p>
        </div>
        <button className="primary-button" onClick={onRegister}>
          Register patient <span aria-hidden="true">+</span>
        </button>
      </div>

      <div className="list-controls">
        <label className="search-field">
          <span>Search by name or patient number</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="e.g. Amina or PAT-00824"
          />
        </label>

        <label className="date-filter">
          <span>Visit date</span>
          <input
            type="date"
            value={visitDate}
            onChange={(event) => setVisitDate(event.target.value)}
          />
        </label>

        {visitDate && (
          <button className="text-button" onClick={() => setVisitDate("")}>
            Clear date
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="notice notice-error" role="alert">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <p className="list-message" role="status">Loading patient records…</p>
      ) : visibleRows.length === 0 ? (
        <div className="empty-state">
          <p className="eyebrow">
            {visitDate ? "NO VISITS ON THIS DATE" : "NO MATCHING PATIENTS"}
          </p>
          <h2>{visitDate ? "No visits found." : "No patients found."}</h2>
          <p>
            {visitDate
              ? "Choose another date or clear the filter to see all patients."
              : "Try another search, or register a new patient."}
          </p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="patient-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age</th>
                <th>Last BMI status</th>
                <th>Visit date</th>
                <th><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ patient, report }) => {
                const name = [
                  patient.first_name,
                  patient.middle_name,
                  patient.last_name,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={patient.patient_id}>
                    <td>
                      <strong>{name}</strong>
                      <small>{patient.patient_id}</small>
                    </td>
                    <td>
                      {report?.age ??
                        calculateAge(patient.date_of_birth, todayInNairobi())}
                    </td>
                    <td>
                      {report ? (
                        <span
                          className={`status-label status-${report.last_bmi_status.toLowerCase()}`}
                        >
                          <span aria-hidden="true" />
                          {report.last_bmi_status}
                        </span>
                      ) : (
                        <span className="muted-value">Awaiting first vitals</span>
                      )}
                    </td>
                    <td>{report?.visit_date ?? "—"}</td>
                    <td className="action-cell">
                      <button
                        className="row-action"
                        onClick={() => onStartVisit(patient)}
                      >
                        Start visit <span aria-hidden="true">→</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default PatientListPage;