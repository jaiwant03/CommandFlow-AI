import API from './api';

export const parseCommand = async (command) => {
  const response = await API.post('/ai/parse', { command });
  return response.data;
};

export const executeCommand = async (command, inputType = 'text') => {
  const response = await API.post('/automations', { command, inputType });
  return response.data;
};

export const fetchAutomations = async () => {
  const response = await API.get('/automations');
  return response.data;
};

export const fetchLogs = async () => {
  const response = await API.get('/automations');
  return response.data;
};

export const fetchAutomationDetails = async (id) => {
  const response = await API.get(`/automations/${id}`);
  return response.data;
};

export const fetchSchedules = async () => {
  const response = await API.get('/schedules');
  return response.data;
};

export const deleteSchedule = async (id) => {
  const response = await API.delete(`/schedules/${id}`);
  return response.data;
};

export const fetchIntegrations = async () => {
  const response = await API.get('/integrations');
  return response.data;
};

export const connectIntegration = async (service, credentials) => {
  const response = await API.post('/integrations/connect', { service, credentials });
  return response.data;
};
