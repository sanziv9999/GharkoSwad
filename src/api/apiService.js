import { API_CONFIG } from './apiConfig';

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let errorMessage = 'Something went wrong';

  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      errorMessage = error.message || JSON.stringify(error) || errorMessage;
    } else {
      errorMessage = await response.text() || errorMessage;
    }
    console.error(`API error: ${response.status} - ${errorMessage}`);
    throw new Error(errorMessage);
  }

  if (contentType && contentType.includes('application/json')) {
    const result = await response.json();
    console.log('API response:', result);
    if (result.status !== 'success') {
      throw new Error(result.message || 'Operation failed');
    }
    return result;
  }

  const text = await response.text();
  console.warn('Unexpected non-JSON response:', text);
  return { status: 'success', message: text };
};

export const apiService = {
  async register(userData) {
    console.log('Register request:', userData);
    const response = await fetch(`${API_CONFIG.BASE_URL}/register`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async verifyOtp(otpData) {
    console.log('Verify OTP request:', otpData);
    const response = await fetch(`${API_CONFIG.BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(otpData),
    });
    return handleResponse(response);
  },

  async login(credentials) {
    console.log('Login request:', credentials);
    const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  async forgotPassword(email) {
    console.log('Forgot password request:', { email });
    const response = await fetch(`${API_CONFIG.BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify({ email }),
    });
    const result = await handleResponse(response);
    return { message: result.message };
  },

  async resetPassword(resetData) {
    console.log('Reset password request:', resetData);
    const response = await fetch(`${API_CONFIG.BASE_URL}/reset-password`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      body: JSON.stringify(resetData),
    });
    const result = await handleResponse(response);
    return { message: result.message };
  },

  async get(endpoint, token = null) {
    console.log(`GET request: ${endpoint}`);
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return handleResponse(response);
  },

  async post(endpoint, data, token = null) {
    console.log(`POST request: ${endpoint}`, data);
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};