import { API_CONFIG } from './apiConfig';

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let errorMessage = 'Something went wrong';

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json().catch(() => ({})); // Handle invalid JSON
      errorMessage = error.message || JSON.stringify(error) || errorMessage;
    } else {
      errorMessage = await response.text().catch(() => '') || errorMessage;
    }
    console.error(`API error: ${response.status} - ${errorMessage} - URL: ${response.url}`);
    throw new Error(errorMessage);
  }

  if (contentType && contentType.includes('application/json')) {
    const result = await response.json().catch(() => ({})); // Handle invalid JSON
    console.log('API response:', result);
    if (result.status !== 'success' && response.status !== 204) { // Allow 204 No Content
      throw new Error(result.message || 'Operation failed');
    }
    return result; // Return the full response object { status, message, data }
  }

  const text = await response.text().catch(() => '');
  console.warn('Unexpected non-JSON response:', text);
  return { status: 'success', message: text || 'Operation successful' };
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
    console.log('Request body JSON:', JSON.stringify(data, null, 2));
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

  async put(endpoint, data, token = null) {
    console.log(`PUT request: ${endpoint}`, data);
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
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
    return result.data; // Return the data array directly
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

  async getAllFoods(token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    console.log(`Requesting: ${API_CONFIG.BASE_URL}/food/list with token: ${tokenFromStorage}`);
    const result = await this.get('/food/list', tokenFromStorage);
    return result.data; // Return the data array directly
  },

  async addToCart(userId, foodId, quantity = 1, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const parsedFoodId = parseInt(foodId, 10);
    if (isNaN(parsedFoodId)) {
      throw new Error('Invalid foodId: must be a valid number');
    }
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      throw new Error('Invalid userId: must be a valid number');
    }
    const endpoint = `/cart?userId=${parsedUserId}&foodId=${parsedFoodId}&quantity=${quantity}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    const response = await this.post(endpoint, {}, tokenFromStorage); // Empty body, params in URL
    console.log('Add to cart response:', response);
    return response;
  },

  async getCartItems(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart?userId=${userId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    const result = await this.get(endpoint, tokenFromStorage);
    return result.data || []; // Return the data array or empty array if null/undefined
  },

  async increaseCartQuantity(userId, foodId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const parsedFoodId = parseInt(foodId, 10);
    if (isNaN(parsedFoodId)) {
      throw new Error('Invalid foodId: must be a valid number');
    }
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      throw new Error('Invalid userId: must be a valid number');
    }
    const endpoint = `/cart/increase/${parsedFoodId}?userId=${parsedUserId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.put(endpoint, {}, tokenFromStorage); // Using PUT for update
  },

  async decreaseCartQuantity(userId, foodId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const parsedFoodId = parseInt(foodId, 10);
    if (isNaN(parsedFoodId)) {
      throw new Error('Invalid foodId: must be a valid number');
    }
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      throw new Error('Invalid userId: must be a valid number');
    }
    const endpoint = `/cart/decrease/${parsedFoodId}?userId=${parsedUserId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.put(endpoint, {}, tokenFromStorage); // Using PUT for update
  },

  async deleteCartItem(userId, foodId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const parsedFoodId = parseInt(foodId, 10);
    if (isNaN(parsedFoodId)) {
      throw new Error('Invalid foodId: must be a valid number');
    }
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      throw new Error('Invalid userId: must be a valid number');
    }
    const endpoint = `/cart/${parsedFoodId}?userId=${parsedUserId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.delete(endpoint, tokenFromStorage);
  },

  async clearCart(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    const endpoint = `/cart?userId=${userId}`;
    console.log(`Requesting: ${API_CONFIG.BASE_URL}${endpoint} with token: ${tokenFromStorage}`);
    return this.delete(endpoint, tokenFromStorage);
  },

  async placeOrder(orderData, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    console.log('Placing order request:', orderData);
    const response = await this.post('/orders/place', orderData, tokenFromStorage);
    return response.data; // Return the OrderResponse data
  },

  async verifyEsewaPayment(transactionUuid, amount, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    console.log('Verifying eSewa payment:', { transactionUuid, amount });
    
    // Validate input parameters
    if (!transactionUuid || !amount) {
      throw new Error('transactionUuid and amount are required');
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('amount must be a valid positive number');
    }
    
    const requestBody = {
      transaction_uuid: transactionUuid, // Match backend DTO field name
      amount: parsedAmount // Ensure amount is a number
    };
    
    console.log('Sending verification request with body:', requestBody);
    const response = await this.post('/orders/verify-esewa', requestBody, tokenFromStorage);
    console.log('Verification response:', response);
    return response; // Return full response object
  },

  async cancelOrder(userId, orderIdOrItems, token = null) {
    const tokenFromStorage = localStorage.getItem('token');
    console.log('Cancelling order:', { userId, orderIdOrItems });
    
    // Validate input parameters
    if (!userId) {
      throw new Error('userId is required');
    }
    
    // Check if second parameter is an array (selected items) or orderId
    if (Array.isArray(orderIdOrItems)) {
      // Cancelling specific order items
      if (orderIdOrItems.length === 0) {
        throw new Error('At least one item must be selected for cancellation');
      }
      
      const requestBody = {
        userId: parseInt(userId, 10),
        orderItemIds: orderIdOrItems.map(id => parseInt(id, 10))
      };
      
      console.log('Sending cancel order items request with body:', requestBody);
      const response = await this.put('/orders/cancel-order-items', requestBody, tokenFromStorage);
      console.log('Cancel order items response:', response);
      return response;
    } else {
      // Cancelling entire order
      const orderId = orderIdOrItems;
      if (!orderId) {
        throw new Error('orderId is required');
      }
      
      const requestBody = {
        userId: parseInt(userId, 10),
        orderId: parseInt(orderId, 10)
      };
      
      console.log('Sending cancel order request with body:', requestBody);
      const response = await this.put('/orders/cancel-order', requestBody, tokenFromStorage);
      console.log('Cancel order response:', response);
      return response;
    }
  },

  async getOrdersByUserId(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    console.log('Fetching orders for user:', userId);
    
    if (!userId) {
      throw new Error('userId is required');
    }
    
    const response = await this.get(`/orders/user/${userId}/status`, tokenFromStorage);
    console.log('Orders retrieved:', response);
    return response;
  },

  async getOrdersByChefId(chefId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    console.log('Fetching orders for chef:', chefId);
    
    if (!chefId) {
      throw new Error('chefId is required');
    }
    
    const response = await this.get(`/orders/chef/${chefId}`, tokenFromStorage);
    console.log('Chef orders retrieved:', response);
    return response;
  },

  async updateOrderStatus(orderId, status, userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    console.log('Updating order status:', { orderId, status, userId });
    
    if (!orderId || !status || !userId) {
      throw new Error('orderId, status, and userId are required');
    }
    
    const requestBody = {
      userId: parseInt(userId, 10),
      status: status
    };
    
    console.log('Sending order status update request with body:', requestBody);
    const response = await this.put(`/orders/${orderId}/status`, requestBody, tokenFromStorage);
    console.log('Order status updated:', response);
    return response;
  },

  // Delivery-specific API methods
  async getReadyOrders(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    if (!userId) throw new Error('userId is required');
    const response = await this.get(`/orders/delivery/${userId}/ready`, tokenFromStorage);
    return response;
  },

  async getDeliveryOrders(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    if (!userId) throw new Error('userId is required');
    const response = await this.get(`/orders/delivery/${userId}/status?status=PICKED_UP`, tokenFromStorage);
    return response;
  },

  async updateOrderDeliveryStatus(orderId, status, userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    if (!orderId || !status || !userId) throw new Error('orderId, status, and userId are required');
    const requestBody = { userId: parseInt(userId, 10), status };
    const response = await this.put(`/orders/${orderId}/delivery-status`, requestBody, tokenFromStorage);
    return response;
  },

  async updatePaymentStatus(orderId, userId, paymentStatus, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    if (!orderId || !userId || !paymentStatus) throw new Error('orderId, userId, and paymentStatus are required');
    const requestBody = { userId: parseInt(userId, 10), paymentStatus };
    const response = await this.put(`/orders/${orderId}/payment-status`, requestBody, tokenFromStorage);
    return response;
  },

  async assignOrderToDelivery(orderId, deliveryId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    console.log('Assigning order to delivery person:', { orderId, deliveryId });
    
    if (!orderId || !deliveryId) {
      throw new Error('orderId and deliveryId are required');
    }
    
    const requestBody = {
      deliveryId: parseInt(deliveryId, 10)
    };
    
    const response = await this.put(`/orders/${orderId}/assign-delivery`, requestBody, tokenFromStorage);
    console.log('Order assignment response:', response);
    return response;
  },

  async updateDeliveryLocation(deliveryId, latitude, longitude, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    console.log('Updating delivery location:', { deliveryId, latitude, longitude });
    
    if (!deliveryId || !latitude || !longitude) {
      throw new Error('deliveryId, latitude, and longitude are required');
    }
    
    const requestBody = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date().toISOString()
    };
    
    const response = await this.put(`/delivery/${deliveryId}/location`, requestBody, tokenFromStorage);
    console.log('Location update response:', response);
    return response;
  },

  async getDeliveryLocation(deliveryId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    console.log('Fetching delivery location for:', deliveryId);
    
    if (!deliveryId) {
      throw new Error('deliveryId is required');
    }
    
    const response = await this.get(`/delivery/${deliveryId}/location`, tokenFromStorage);
    console.log('Delivery location response:', response);
    return response;
  },

  async getAllChefs(token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    const result = await this.get('/users/chefs', tokenFromStorage);
    return result.data; // Assuming the API returns { status, message, data: [...] }
  },

  async getUserProfile(userId, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    if (!userId) throw new Error('userId is required');
    const response = await this.get(`/users/${userId}/profile`, tokenFromStorage);
    return response.data;
  },

  async updateUserProfile(userId, formData, token = null) {
    const tokenFromStorage = localStorage.getItem('token') || token;
    if (!userId) throw new Error('userId is required');
    const headers = {
      ...(tokenFromStorage && { Authorization: `Bearer ${tokenFromStorage}` }),
    };
    const response = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}/profile`, {
      method: 'PUT',
      headers,
      body: formData,
    });
    return handleResponse(response);
  }
};