import API from './api';

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  const userData = response.data.data || response.data.user || response.data;
  if (response.data.success && userData) {
    if (!userData.token && response.data.token) {
      userData.token = response.data.token;
    }
    localStorage.setItem('commandflow_user', JSON.stringify(userData));
  }
  return response.data;
};

export const signupUser = async (name, email, password) => {
  const response = await API.post('/auth/register', { name, email, password });
  const userData = response.data.data || response.data.user || response.data;
  if (response.data.success && userData) {
    if (!userData.token && response.data.token) {
      userData.token = response.data.token;
    }
    localStorage.setItem('commandflow_user', JSON.stringify(userData));
  }
  return response.data;
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('commandflow_user') || 'null');
};

export const logoutUser = () => {
  localStorage.removeItem('commandflow_user');
};

export const checkAuth = async () => {
  try {
    const response = await API.get('/auth/me');
    return response.data;
  } catch (err) {
    return { success: false };
  }
};
