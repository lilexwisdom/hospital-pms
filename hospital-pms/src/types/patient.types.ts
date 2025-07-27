export interface Patient {
  id: string;
  name: string;
  encrypted_ssn: ArrayBuffer;
  ssn_hash: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: {
    postcode?: string;
    roadAddress?: string;
    jibunAddress?: string;
    addressDetail?: string;
    extraAddress?: string;
  };
  address_detail: string | null;
  emergency_contact: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  status: 'pending' | 'active' | 'inactive';
  patient_number: string | null;
  created_by: string | null;
  cs_manager: string | null;
  assigned_bd_id: string | null;
  created_at: string;
  updated_at: string;
  
  // Disease flags
  flag_hypertension: boolean;
  flag_diabetes: boolean;
  flag_hyperlipidemia: boolean;
  flag_anticoagulant: boolean;
  flag_asthma: boolean;
  flag_allergy: boolean;
  flag_cardiovascular: boolean;
  flag_pregnancy: boolean;
  
  // Relations
  created_by_profile: {
    id: string;
    name: string;
    role: string;
  } | null;
  cs_manager_profile: {
    id: string;
    name: string;
    role: string;
  } | null;
  assigned_bd_profile: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface PatientFilters {
  search?: string;
  status?: 'pending' | 'active' | 'inactive' | 'all';
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  diseaseFlags?: string[];
}

export interface PatientListResponse {
  data: Patient[];
  count: number;
  totalPages: number;
  currentPage: number;
}