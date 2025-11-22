import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// URL de base pour les fichiers uploadés (sans /api)
export const BASE_URL = API_URL.replace('/api', '');

// Helper pour construire les URLs des fichiers uploadés
export const getUploadUrl = (path) => {
  if (!path) return null;
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Sinon, construire l'URL avec BASE_URL
  return `${BASE_URL}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne déconnecter que si c'est une erreur d'authentification de l'application
    // Pas si c'est une erreur Stripe ou autre service externe
    // Ou si on est sur une page client publique
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isStripeError = url.includes('/stripe/');
      const isClientPage = window.location.pathname.startsWith('/client/');

      // Si ce n'est pas une erreur Stripe et qu'on n'est pas sur une page client, c'est probablement un problème d'auth
      if (!isStripeError && !isClientPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me')
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

// Sessions
export const sessionsAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  searchAvailable: (params) => api.get('/sessions/search/available', { params }),
  getNextAvailableDates: (params) => api.get('/sessions/next-available', { params }),
  getAvailableCapacity: (sessionId, productId) => api.get('/sessions/available-capacity', { params: { sessionId, productId } }),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id, data) => api.delete(`/sessions/${id}`, { data })
};

// Bookings
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  addPayment: (id, data) => api.post(`/bookings/${id}/payment`, data),
  cancel: (id, data) => api.post(`/bookings/${id}/cancel`, data),
  move: (id, data) => api.post(`/bookings/${id}/move`, data),
  markProductDetailsSent: (id) => api.post(`/bookings/${id}/mark-product-details-sent`),
  delete: (id) => api.delete(`/bookings/${id}`),
  // Notes
  getNotes: (id) => api.get(`/bookings/${id}/notes`),
  addNote: (id, data) => api.post(`/bookings/${id}/notes`, data),
  updateNote: (id, noteId, data) => api.put(`/bookings/${id}/notes/${noteId}`, data),
  deleteNote: (id, noteId) => api.delete(`/bookings/${id}/notes/${noteId}`)
};

// Gift Vouchers
export const giftVouchersAPI = {
  getAll: (params) => api.get('/gift-vouchers', { params }),
  getByCode: (code) => api.get(`/gift-vouchers/${code}`),
  verifyCode: (code) => api.get(`/gift-vouchers/${code}/verify`),
  getActivePromoCodes: () => api.get('/gift-vouchers/promo/active'),
  create: (data) => api.post('/gift-vouchers', data),
  use: (code, data) => api.post(`/gift-vouchers/${code}/use`, data),
  delete: (id) => api.delete(`/gift-vouchers/${id}`)
};

// Email
export const emailAPI = {
  sendBookingConfirmation: (bookingId) => api.post(`/email/booking-confirmation/${bookingId}`),
  sendBookingReminder: (bookingId) => api.post(`/email/booking-reminder/${bookingId}`),
  sendCustomEmail: (data) => api.post('/email/custom', data),
  sendFormReminder: (bookingId) => api.post(`/email/form-reminder/${bookingId}`)
};

// Email Templates
export const emailTemplatesAPI = {
  getAll: () => api.get('/email-templates'),
  getByType: (type) => api.get(`/email-templates/${type}`),
  create: (data) => api.post('/email-templates', data),
  update: (id, data) => api.put(`/email-templates/${id}`, data),
  delete: (id) => api.delete(`/email-templates/${id}`),
  getAvailableVariables: () => api.get('/email-templates/variables'),
  initialize: () => api.post('/email-templates/initialize')
};

// Stripe
export const stripeAPI = {
  // Payment Intent (utilisé pour les paiements côté client en iframe)
  createPaymentIntent: (data) => axios.post(`${API_URL}/stripe/create-payment-intent`, data),
  getBookingByPaymentIntent: (paymentIntentId) => axios.get(`${API_URL}/stripe/payment-intent/${paymentIntentId}/booking`),
  createGiftVoucherPaymentIntent: (data) => axios.post(`${API_URL}/stripe/create-gift-voucher-payment-intent`, data),
  getGiftVoucherByPaymentIntent: (paymentIntentId) => axios.get(`${API_URL}/stripe/payment-intent/${paymentIntentId}/gift-voucher`),
  // Stripe Connect
  connectOnboard: () => api.post('/stripe/connect/onboard'),
  getConnectAccount: () => api.get('/stripe/connect/account'),
  getDashboardLink: () => api.post('/stripe/connect/dashboard'),
  disconnectAccount: () => api.post('/stripe/connect/disconnect')
};

// Participants
export const participantsAPI = {
  getByBooking: (bookingId) => api.get(`/participants/booking/${bookingId}`),
  upsert: (bookingId, data) => api.post(`/participants/booking/${bookingId}`, data),
  getSessionWetsuitSummary: (sessionId) => api.get(`/participants/session/${sessionId}/wetsuit-summary`),
  delete: (id) => api.delete(`/participants/${id}`)
};

// Resellers
export const resellersAPI = {
  getAll: () => api.get('/resellers'),
  create: (data) => api.post('/resellers', data),
  update: (id, data) => api.put(`/resellers/${id}`, data),
  delete: (id) => api.delete(`/resellers/${id}`)
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  getByGuideId: (guideId) => api.get(`/settings/guide/${guideId}`),
  update: (data) => api.put('/settings', data),
  updateLogo: (data) => api.patch('/settings/logo', data)
};

// Team
export const teamAPI = {
  getMembers: () => api.get('/team/members'),
  addMember: (data) => api.post('/team/members', data),
  updateMember: (memberId, data) => api.put(`/team/members/${memberId}`, data),
  deleteMember: (memberId) => api.delete(`/team/members/${memberId}`),
  getMyLeader: () => api.get('/team/my-leader')
};

// Newsletter
export const newsletterAPI = {
  subscribe: (data) => api.post('/newsletter/subscribe', data),
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
  getAll: (params) => api.get('/newsletter', { params }),
  delete: (id) => api.delete(`/newsletter/${id}`),
  sendEmail: (data) => api.post('/newsletter/send', data),
  sendTestEmail: (data) => api.post('/newsletter/test-send', data)
};

// Equipment Lists
export const equipmentListsAPI = {
  getAll: () => api.get('/equipment-lists'),
  getById: (id) => api.get(`/equipment-lists/${id}`),
  create: (data) => api.post('/equipment-lists', data),
  update: (id, data) => api.put(`/equipment-lists/${id}`, data),
  delete: (id) => api.delete(`/equipment-lists/${id}`)
};

// Upload
export const uploadAPI = {
  images: (formData) => {
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  logo: (formData) => {
    return api.post('/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (url) => api.delete('/upload/images', { data: { url } })
};

// Activity Config (formulaires dynamiques par activité)
export const activityConfigAPI = {
  getAll: () => api.get('/activity-config'),
  get: (activityTypeId) => api.get(`/activity-config/${activityTypeId}`),
  getPublic: (activityTypeId, guideId) => api.get(`/activity-config/public/${activityTypeId}`, { params: { guideId } }),
  update: (activityTypeId, data) => api.put(`/activity-config/${activityTypeId}`, data),
  reset: (activityTypeId) => api.delete(`/activity-config/${activityTypeId}`),
  getWetsuitBrands: () => api.get('/activity-config/wetsuit-brands')
};

export default api;
