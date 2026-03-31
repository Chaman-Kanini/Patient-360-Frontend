export interface ICD10Code {
  diagnosis: string;
  code: string;
  description: string;
}

export interface CPTCode {
  procedure: string;
  code: string;
  description: string;
}

export interface MedicalCodesResponse {
  patientContextId: string;
  patientIdentifier: string;
  patientName: string;
  medicalCodes: {
    icd10Codes: ICD10Code[];
    cptCodes: CPTCode[];
    summary: {
      totalDiagnoses: number;
      diagnosesMatched: number;
      totalProcedures: number;
      proceduresMatched: number;
    };
  };
}

export interface ConsolidatedPatientData {
  patientContextId: string;
  patientIdentifier?: string;
  patientName: string;
  status: string;
  lastConsolidatedAt?: string;
  consolidatedData: any;
  patientSummary?: string;
  medicalCodes?: {
    icd10Codes: ICD10Code[];
    cptCodes: CPTCode[];
    summary: {
      totalDiagnoses: number;
      diagnosesMatched: number;
      totalProcedures: number;
      proceduresMatched: number;
    };
  };
}

export interface ConflictData {
  patientContextId: string;
  patientIdentifier?: string;
  patientName: string;
  hasConflicts: boolean;
  conflictCount: number;
  lastConsolidatedAt?: string;
  conflicts: any;
  summary?: ConflictSummary;
}

export interface ConflictSummary {
  totalConflicts: number;
  criticalConflicts: number;
  warningConflicts: number;
  infoConflicts: number;
  conflictsByCategory: Record<string, number>;
}

export interface PatientContext {
  id: string;
  patientIdentifier?: string;
  patientName: string;
  status: string;
  hasConflicts: boolean;
  conflictCount: number;
  lastConsolidatedAt?: string;
  createdAt: string;
}
