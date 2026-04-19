import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

export const predictImage = async (imageBlob) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'image.jpg');
  const res = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const submitFeedback = async (predictionId, correctClass) => {
  const res = await api.post('/feedback', { prediction_id: predictionId, correct_class: correctClass });
  return res.data;
};

export const getAdminStats = async (token) => {
  const res = await api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getFeedbackQueue = async (token) => {
  const res = await api.get('/admin/feedback', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const approveFeedback = async (token, feedbackId) => {
  const res = await api.post(`/admin/feedback/${feedbackId}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const rejectFeedback = async (token, feedbackId) => {
  const res = await api.post(`/admin/feedback/${feedbackId}/reject`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const triggerRetrain = async (token) => {
  const res = await api.post('/admin/retrain', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const adminLogin = async (password) => {
  const res = await api.post('/admin/login', { password });
  return res.data;
};
