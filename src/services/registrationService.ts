import axios, { AxiosResponse } from 'axios'
import { PublicRegistrationRequest, RegistrationResult } from '../types/user'

const API_BASE_URL = 'https://dotnetbackend-patient-360.onrender.com'

// Create axios instance for registration
const registrationApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const registrationService = {
  // Register new user
  async register(request: PublicRegistrationRequest): Promise<RegistrationResult> {
    try {
      const response: AxiosResponse<RegistrationResult> = await registrationApi.post('/api/registration/register', request)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Too many registration attempts. Please try again later.')
        }
        throw new Error(error.response?.data?.message || 'Registration failed')
      }
      throw new Error('Registration failed')
    }
  },

  // Check email availability
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ available: boolean }> = await registrationApi.get(
        `/api/registration/check-email?email=${encodeURIComponent(email)}`
      )
      return response.data.available
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to check email availability')
      }
      throw new Error('Failed to check email availability')
    }
  },
}
