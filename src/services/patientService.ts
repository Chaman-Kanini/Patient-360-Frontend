import axios from 'axios';
import { ConsolidatedPatientData, ConflictData, MedicalCodesResponse } from '../types/patient';

const API_BASE_URL = 'https://dotnetbackend-patient-360.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      if (config.headers && typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = (config.headers || {}) as any;
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const patientService = {
  async getConsolidatedData(patientId: string): Promise<ConsolidatedPatientData> {
    try {
      const response = await apiClient.get(`/api/patient/${patientId}/consolidated-data`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch consolidated data');
      }
      throw error;
    }
  },

  async getConflicts(patientId: string, category?: string, severity?: string): Promise<ConflictData> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (severity) params.append('severity', severity);

      const response = await apiClient.get(`/api/patient/${patientId}/conflicts?${params}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch conflicts');
      }
      throw error;
    }
  },

  async consolidatePatientData(patientId: string): Promise<any> {
    try {
      const response = await apiClient.post(`/api/patient/${patientId}/consolidate`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to consolidate patient data');
      }
      throw error;
    }
  },

  async getMedicalCodes(patientId: string): Promise<MedicalCodesResponse> {
    try {
      const response = await apiClient.get(`/api/patient/${patientId}/medical-codes`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch medical codes');
      }
      throw error;
    }
  },

  async getRagBatches(): Promise<any> {
    try {
      const response = await apiClient.get('/api/patient/rag-batches');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch RAG batches');
      }
      throw error;
    }
  },

  async getRagBatchData(batchId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/patient/rag-batches/${batchId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch RAG batch data');
      }
      throw error;
    }
  },

  async getRagBatchPdfs(batchId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/api/patient/rag-batches/${batchId}/pdfs`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch PDF files');
      }
      throw error;
    }
  },

  async viewPdf(batchId: string, fileName: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/patient/rag-batches/${batchId}/pdfs/${encodeURIComponent(fileName)}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to load PDF');
      }
      throw error;
    }
  },

  async downloadPdf(batchId: string, fileName: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/patient/rag-batches/${batchId}/pdfs/${encodeURIComponent(fileName)}?download=true`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to download PDF');
      }
      throw error;
    }
  },

  async askChatbotWithHistory(question: string, batchId?: string): Promise<any> {
    try {
      const response = await apiClient.post('/api/patient/chatbot/ask', {
        question,
        batchId
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get chatbot response');
      }
      throw error;
    }
  },

  async getChatHistory(batchId?: string): Promise<any> {
    try {
      const params = batchId ? `?batchId=${batchId}` : '';
      const response = await apiClient.get(`/api/patient/chatbot/history${params}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch chat history');
      }
      throw error;
    }
  },

};
