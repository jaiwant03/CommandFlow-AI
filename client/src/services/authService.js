import API from './api';

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  if (response.data.success && response.data.user) {
    localStorage.setItem('commandflow_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const signupUser = async (name, email, password) => {
  const response = await API.post('/auth/register', { name, email, password });
  if (response.data.success && response.data.user) {
    localStorage.setItem('commandflow_user', JSON.stringify(response.data.user));
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
