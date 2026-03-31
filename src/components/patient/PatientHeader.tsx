import React from 'react';
import { User, Calendar, Hash, Activity } from 'lucide-react';

interface PatientHeaderProps {
  patientData: any;
  documentsProcessed?: number;
  conflictsPending?: number;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ 
  patientData, 
  documentsProcessed = 0,
  conflictsPending = 0 
}) => {
  const getPatientInfo = () => {
    if (!patientData) return null;
    
    // Try different possible data structures
    const patient = patientData.patient || {};
    const demographics = patientData.demographics || {};
    const patientInfo = patientData.patient_information || {};
    
    return {
      name: patient.name || demographics.name || patientInfo.name || 'Unknown Patient',
      dob: patient.dob || demographics.date_of_birth || demographics.dob || patientInfo.date_of_birth || 'N/A',
      age: patient.age || demographics.age || patientInfo.age || 'N/A',
      gender: patient.sex || patient.gender || patient.gender_identity || demographics.gender || demographics.sex || patientInfo.gender || 'N/A',
      mrn: patient.patient_id || patient.mrn || demographics.mrn || demographics.medical_record_number || patientInfo.mrn || 'N/A',
    };
  };

  const info = getPatientInfo();
  if (!info) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Patient Info */}
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            
            {/* Details */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{info.name}</h2>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>DOB: {info.dob}</span>
                </div>
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  <span>Age: {info.age}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>Gender: {info.gender}</span>
                </div>
                <div className="flex items-center">
                  <Hash className="h-4 w-4 mr-1" />
                  <span>MRN: {info.mrn}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-600 font-medium">Documents Processed</div>
              <div className="text-2xl font-bold text-green-700">{documentsProcessed}</div>
            </div>
            
            {conflictsPending > 0 && (
              <div className="px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-xs text-orange-600 font-medium">Conflicts Pending</div>
                <div className="text-2xl font-bold text-orange-700">{conflictsPending}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
