import axios from 'axios';

const API_URL = '/api';

// Dataset operations
export const getDatasets = async () => {
  const response = await axios.get(`${API_URL}/datasets`);
  return response.data.datasets;
};

export const getDataset = async (id) => {
  const response = await axios.get(`${API_URL}/datasets/${id}`);
  return response.data.dataset;
};

export const uploadDataset = async (formData) => {
  const response = await axios.post(`${API_URL}/datasets/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateDataset = async (id, data) => {
  const response = await axios.put(`${API_URL}/datasets/${id}`, data);
  return response.data.dataset;
};

export const deleteDataset = async (id) => {
  const response = await axios.delete(`${API_URL}/datasets/${id}`);
  return response.data;
};

export const exportDataset = async (id) => {
  const response = await axios.get(`${API_URL}/datasets/${id}/export`, {
    responseType: 'blob',
  });
  return response.data;
};

// OAI operations
export const getOAI = async (id) => {
  const response = await axios.get(`${API_URL}/oais/${id}`);
  return response.data.oai;
};

export const createOAI = async (datasetId, data) => {
  const response = await axios.post(`${API_URL}/datasets/${datasetId}/oais`, data);
  return response.data.oai;
};

export const updateOAI = async (id, data) => {
  const response = await axios.put(`${API_URL}/oais/${id}`, data);
  return response.data.oai;
};

export const deleteOAI = async (id) => {
  const response = await axios.delete(`${API_URL}/oais/${id}`);
  return response.data;
};

export const bulkUpdateOAIs = async (updates) => {
  const response = await axios.put(`${API_URL}/oais/bulk/update`, { updates });
  return response.data;
};
