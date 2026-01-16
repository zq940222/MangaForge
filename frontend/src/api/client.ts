import axios from 'axios'

const API_BASE_URL = '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Default user ID for development (matches backend DEFAULT_DEV_USER_ID)
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    // For demo, use a fixed user ID
    // In production, this would come from auth state
    config.headers['X-User-ID'] = DEV_USER_ID
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized')
    }
    return Promise.reject(error)
  }
)

export type ApiError = {
  detail: string
}
