import axios from 'axios';

const RAG_API_BASE_URL = 'https://rag-service-patient-360.onrender.com';

const ragApiClient = axios.create({
  baseURL: RAG_API_BASE_URL,
  timeout: 1000000, // 5 minutes
});

export interface RagUploadResponse {
  batch_id: string;
  status: string;
  message: string;
  output_file?: string;
  timestamp: string;
  data?: any;
}

export interface QuestionRequest {
  question: string;
  batch_id?: string;
  top_k?: number;
}

export interface QuestionResponse {
  question: string;
  answer: string;
  log_file: string;
  timestamp: string;
}

export interface ChatbotRequest {
  question: string;
  batchId?: string;
}

export interface SourceDocument {
  name: string;
  fileName: string;
  chunks_used: number;
}

export interface ChatbotResponse {
  success: boolean;
  answer: string;
  timestamp: string;
  sourceDocuments?: SourceDocument[];
  conversationId?: string;
}

export interface CodeSearchResult {
  code: string;
  description: string;
  short_description?: string;
  distance?: number;
}

export interface CodeSearchResponse {
  success: boolean;
  data: CodeSearchResult[];
  query: string;
  type: string;
  count: number;
}

export const ragService = {
  async testConnection(): Promise<boolean> {
    try {
      const response = await ragApiClient.get('/', { timeout: 5000 });
      console.log('RAG API Connection Test:', response.data);
      return true;
    } catch (error) {
      console.error('RAG API Connection Failed:', error);
      return false;
    }
  },

  async uploadBatch(files: File[]): Promise<RagUploadResponse> {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await ragApiClient.post<RagUploadResponse>('/api/batch/upload', formData);
      
      console.log('RAG API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('RAG API Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Request config:', error.config);
        throw new Error(error.response?.data?.detail || error.message || 'RAG upload failed');
      }
      throw error;
    }
  },

  async askQuestion(request: QuestionRequest): Promise<QuestionResponse> {
    try {
      const response = await ragApiClient.post<QuestionResponse>('/api/qa/ask', request);
      return response.data;
    } catch (error) {
      console.error('RAG Q&A Error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message || 'Failed to get answer');
      }
      throw error;
    }
  },

  async askChatbot(question: string, batchId?: string): Promise<ChatbotResponse> {
    try {
      const response = await ragApiClient.post<ChatbotResponse>('/api/patient/chatbot/ask', {
        question,
        batchId
      });
      return response.data;
    } catch (error) {
      console.error('Chatbot Error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message || 'Failed to get chatbot response');
      }
      throw error;
    }
  },

  async searchCodes(query: string, type: 'icd10' | 'cpt', topK: number = 15): Promise<CodeSearchResponse> {
    try {
      const response = await ragApiClient.get<CodeSearchResponse>('/api/codes/search', {
        params: { query, type, top_k: topK },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error('Code Search Error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message || 'Failed to search codes');
      }
      throw error;
    }
  },

  async finalizeCodes(batchId: string, codes: { icd10: any[]; cpt: any[] }): Promise<any> {
    try {
      const response = await ragApiClient.post(`/api/batch/finalize-codes/${batchId}`, codes);
      return response.data;
    } catch (error) {
      console.error('Finalize Codes Error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message || 'Failed to finalize codes');
      }
      throw error;
    }
  },

  async getFinalizedCodes(batchId: string): Promise<any> {
    try {
      const response = await ragApiClient.get(`/api/batch/finalized-codes/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Get Finalized Codes Error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message || 'Failed to get finalized codes');
      }
      throw error;
    }
  }
};