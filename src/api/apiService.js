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
    if (result.status !== 'success') {
      throw new Error(result.message || 'Operation failed');
    }
    return result; // Return the full response object { status, message, data }
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

  // Fetch foods by user ID
  async getFoodsById(id, params = {}, token = null) {
    const queryString = new URLSearchParams({ userId: id, ...params }).toString();
    const endpoint = `/food/list/by-user${queryString ? `?${queryString}` : ''}`;
    const tokenFromStorage = localStorage.getItem('token');
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    const result = await this.get(endpoint, tokenFromStorage);
    return result.data; // Return the data array directly
  },

  // Add food item
  async addFood(formData, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    return this.postMultipart('/food/add', formData, tokenFromStorage);
  },

  // Update food item
  async updateFood(id, formData, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    return this.patchMultipart(`/food/update/${id}`, formData, tokenFromStorage);
  },

  // Delete food item
  async deleteFood(id, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    return this.delete(`/food/delete/${id}`, tokenFromStorage);
  },

  // Fetch all food items
  async getAllFoods(token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    console.log(`Requesting: ${API_CONFIG.BASE_URL}/food/list with token: ${tokenFromStorage}`);
    const result = await this.get('/food/list', tokenFromStorage);
    return result.data; // Return the data array directly
  },

  // Add item to cart
  async addToCart(userId, foodId, quantity = 1, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart?userId=${userId}&foodId=${foodId}&quantity=${quantity}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.post(endpoint, {}, tokenFromStorage);
  },

  // Get cart items for a user
  async getCartItems(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart?userId=${userId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    const result = await this.get(endpoint, tokenFromStorage);
    return result.data; // Return the data array directly
  },

  // Increase quantity of an item in cart
  async increaseCartQuantity(userId, foodId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart/increase/${foodId}?userId=${userId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.post(endpoint, {}, tokenFromStorage);
  },

  // Decrease quantity of an item in cart
  async decreaseCartQuantity(userId, foodId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart/decrease/${foodId}?userId=${userId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.post(endpoint, {}, tokenFromStorage);
  },

  // Delete an item from cart
  async deleteCartItem(userId, foodId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart/${foodId}?userId=${userId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.delete(endpoint, tokenFromStorage);
  },

  // Clear all items from cart
  async clearCart(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart?userId=${userId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.delete(endpoint, tokenFromStorage);
  },
};