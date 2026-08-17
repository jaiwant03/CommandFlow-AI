import API from './api';

export const parseCommand = async (command) => {
  try {
    const response = await API.post('/ai/parse', { command });
    return response.data;
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message,
      data: {}
    };
  }
};

export const executeCommand = async (command, inputType = 'text', attachments = []) => {
  try {
    const hasFiles = Array.isArray(attachments) && attachments.length > 0;

    if (hasFiles) {
      const formData = new FormData();
      formData.append('command', command);
      formData.append('inputType', inputType);

      const cleanAttachments = attachments.map(a => ({
        filename: a.filename || (a.file ? a.file.name : 'attachment.png'),
        contentType: a.contentType || (a.file ? a.file.type : 'image/png'),
        data: a.data || ''
      }));
      formData.append('attachments', JSON.stringify(cleanAttachments));

      attachments.forEach((att, idx) => {
        const rawFile = att.file || (att instanceof File ? att : null);
        if (rawFile) {
          formData.append('image', rawFile, att.filename || rawFile.name);
        } else if (att.data && typeof att.data === 'string' && att.data.startsWith('data:')) {
          try {
            const dataUrl = att.data;
            const mimeMatch = dataUrl.match(/^data:(.*);base64,/);
            const contentType = mimeMatch ? mimeMatch[1] : (att.contentType || 'image/png');
            const base64Str = dataUrl.includes(';base64,') ? dataUrl.split(';base64,')[1] : dataUrl;
            const byteCharacters = atob(base64Str);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });
            const fileObj = new File([blob], att.filename || `attachment_${idx + 1}.png`, { type: contentType });
            formData.append('image', fileObj, att.filename || `attachment_${idx + 1}.png`);
          } catch (e) {
            console.warn('Could not convert base64 data to File object:', e);
          }
        }
      });

      const response = await API.post('/automations', formData);
      return response.data;
    } else {
      const response = await API.post('/automations', { command, inputType, attachments: [] });
      return response.data;
    }
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || err.message
    };
  }
};

export const fetchAutomations = async () => {
  try {
    const response = await API.get('/automations');
    return response.data;
  } catch (err) {
    return { success: false, data: [] };
  }
};

export const fetchLogs = async () => {
  try {
    const response = await API.get('/automations');
    return response.data;
  } catch (err) {
    return { success: false, data: [] };
  }
};

export const fetchAutomationDetails = async (id) => {
  try {
    const response = await API.get(`/automations/${id}`);
    return response.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
};

export const fetchSchedules = async () => {
  try {
    const response = await API.get('/schedules');
    return response.data;
  } catch (err) {
    return { success: false, data: [] };
  }
};

export const deleteSchedule = async (id) => {
  try {
    const response = await API.delete(`/schedules/${id}`);
    return response.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
};

export const fetchIntegrations = async () => {
  try {
    const response = await API.get('/integrations');
    return response.data;
  } catch (err) {
    return { success: false, data: [] };
  }
};

export const connectIntegration = async (service, credentials) => {
  try {
    const response = await API.post('/integrations/connect', { service, credentials });
    return response.data;
  } catch (err) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
};
