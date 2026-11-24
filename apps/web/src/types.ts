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