import API, { SERVER_BASE_URL } from './api';

export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  const userData = response.data.data || response.data.user || response.data;
  if (response.data.success && userData) {
    if (!userData.token && response.data.token) {
      userData.token = response.data.token;
    }
    localStorage.setItem('commandflow_user', JSON.stringify(userData));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: userData }));
    }
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: userData }));
    }
  }
  return response.data;
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('commandflow_user') || 'null');
};

export const getAvatarUrl = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return '';
  if (avatar.startsWith('data:') || avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  try {
    return new URL(avatar, SERVER_BASE_URL).toString();
  } catch (e) {
    return `${SERVER_BASE_URL}/${avatar.replace(/^\/+/, '')}`;
  }
};

export const updateProfile = async (name, avatarFile, avatarBase64) => {
  const formData = new FormData();
  formData.append('name', name);
  if (avatarBase64) {
    formData.append('avatarBase64', avatarBase64);
  }
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  const response = await API.put('/auth/profile', formData);
  const current = getCurrentUser() || {};
  const updatedUser = {
    ...current,
    ...response.data.data
  };
  localStorage.setItem('commandflow_user', JSON.stringify(updatedUser));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));
  }
  return updatedUser;
};

export const logoutUser = () => {
  localStorage.removeItem('commandflow_user');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: null }));
  }
};

export const checkAuth = async () => {
  try {
    const response = await API.get('/auth/me');
    if (response.data && response.data.success && response.data.data) {
      const current = getCurrentUser();
      if (current) {
        const synced = {
          ...current,
          ...response.data.data
        };
        if (current.token && !synced.token) {
          synced.token = current.token;
        }
        localStorage.setItem('commandflow_user', JSON.stringify(synced));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: synced }));
        }
      }
    }
    return response.data;
  } catch (err) {
    return { success: false };
  }
};
