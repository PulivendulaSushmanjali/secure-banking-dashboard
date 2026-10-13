const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('fortis_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      error.message = 'Unable to connect to the banking server. Please ensure the backend is running.';
    }
    throw error;
  }
}

export const api = {
  auth: {
    register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: payload }),
    resendOtp: (payload) => request('/auth/resend-otp', { method: 'POST', body: payload }),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },
  user: {
    getProfile: () => request('/user/profile'),
  },
  account: {
    getAccount: () => request('/account'),
    getBalance: () => request('/account/balance'),
  },
  transactions: {
    getTransactions: () => request('/transactions'),
    simulate: (payload) => request('/transactions/simulate', { method: 'POST', body: payload }),
  },
};
