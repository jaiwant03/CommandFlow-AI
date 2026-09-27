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

export const getAvatarUrl = (avatar) => {
  if (!avatar) return '';
  return new URL(avatar, API.defaults.baseURL).toString();
};

export const updateProfile = async (name, avatarFile) => {
  const formData = new FormData();
  formData.append('name', name);
  if (avatarFile) formData.append('avatar', avatarFile);

  const response = await API.put('/auth/profile', formData);
  const updatedUser = {
    ...getCurrentUser(),
    ...response.data.data
  };
  localStorage.setItem('commandflow_user', JSON.stringify(updatedUser));
  return updatedUser;
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
