export type Patient = {
  id: number;
  patient_id: string;
  registration_date: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  gender: string;
};

export type BmiStatus = "Underweight" | "Normal" | "Overweight";

export type PatientReport = {
  patient_id: string;
  patient_name: string;
  age: number;
  visit_date: string;
  last_bmi_status: BmiStatus;
};

export type SavedVitals = {
  bmi: number;
  visit_date: string;
  next_assessment: "general" | "overweight";
};

export type AssessmentType = "general" | "overweight";