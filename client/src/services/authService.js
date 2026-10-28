import api from './api';

export const authService = {
  register: async (registrationData) => {
    const response = await api.post('/auth/register', registrationData);
    return response.data;
  },

  verifyRegisterOtp: async ({ email, otp }) => {
    const response = await api.post('/auth/register/verify-otp', { email, otp });
    return response.data;
  },

  sendLoginOtp: async ({ identifier }) => {
    const response = await api.post('/auth/login/send-otp', { identifier });
    return response.data;
  },

  verifyLoginOtp: async ({ identifier, otp }) => {
    const response = await api.post('/auth/login/verify-otp', { identifier, otp });
    return response.data;
  },

  resendOtp: async ({ identifier, purpose }) => {
    const response = await api.post('/auth/resend-otp', { identifier, purpose });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    } finally {
      localStorage.removeItem('neosoft_token');
      localStorage.removeItem('neosoft_user');
    }
  }
};

export default authService;
