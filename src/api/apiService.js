import { API_CONFIG } from './apiConfig';

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let errorMessage = 'Something went wrong';

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      errorMessage = error.message || JSON.stringify(error) || errorMessage;
    } else {
      errorMessage = await response.text() || errorMessage;
    }
    console.error(`API error: ${response.status} - ${errorMessage} - URL: ${response.url}`);
    throw new Error(errorMessage);
  }

  if (contentType && contentType.includes('application/json')) {
    const result = await response.json();
    console.log('API response:', result);
    if (Array.isArray(result)) {
      return { status: 'success', data: result }; // Wrap array in a success object
    }
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
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
        method: 'POST',
        headers: API_CONFIG.HEADERS,
        body: JSON.stringify(credentials),
      });
      return handleResponse(response);
    } catch (err) {
      console.error('Fetch error:', err.message, 'URL:', `${API_CONFIG.BASE_URL}/login`);
      throw err;
    }
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
    console.log('Request headers:', headers);
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

  async postMultipart(endpoint, formData, token = null) {
    console.log(`Multipart POST request: ${endpoint}`, formData);
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }), // Omit Content-Type for multipart
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  async patchMultipart(endpoint, formData, token = null) {
    console.log(`Multipart PATCH request: ${endpoint}`, formData);
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }), // Omit Content-Type for multipart
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  async delete(endpoint, token = null) {
    console.log(`DELETE request: ${endpoint}`);
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return handleResponse(response);
  },

  async getFoodsById(id, params = {}, token = null) {
    const queryString = new URLSearchParams({ userId: id, ...params }).toString();
    const endpoint = `/food/list/by-user${queryString ? `?${queryString}` : ''}`;
    const tokenFromStorage = localStorage.getItem('token');
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    const result = await this.get(endpoint, tokenFromStorage);
    return Array.isArray(result.data) ? result.data : [result.data]; // Adjust based on API response
  },

  async addFood(formData, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    return this.postMultipart('/food/add', formData, tokenFromStorage);
  },

  async updateFood(id, formData, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    return this.patchMultipart(`/food/update/${id}`, formData, tokenFromStorage);
  },

  async deleteFood(id, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    return this.delete(`/food/delete/${id}`, tokenFromStorage);
  },

  // New method to fetch all food items
  async getAllFoods(token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    console.log(`Requesting: ${API_CONFIG.BASE_URL}/food/list with token: ${tokenFromStorage}`);
    const result = await this.get('/food/list', tokenFromStorage);
    return Array.isArray(result.data) ? result.data : [result.data]; // Ensure data is an array
  },
};