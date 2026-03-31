import axios from 'axios';

const API_BASE_URL = 'https://dotnetbackend-patient-360.onrender.com';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface ClinicalCodesLookupRequest {
  diagnosisTerms?: string[];
  procedureTerms?: string[];
}

export interface ICD10Code {
  Code: string;
  Diagnosis: string;
}

export interface CPTCode {
  Code: string;
  Procedure: string;
}

export interface ClinicalCodesResponse {
  success: boolean;
  data: {
    icd10Codes: Record<string, ICD10Code[]>;
    cptCodes: Record<string, CPTCode[]>;
  };
}

export const clinicalCodesService = {
  async lookupCodes(request: ClinicalCodesLookupRequest): Promise<ClinicalCodesResponse> {
    const response = await apiClient.post('/clinical-codes/lookup', request);
    return response.data;
  }
};