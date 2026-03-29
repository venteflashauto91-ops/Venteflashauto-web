import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export async function identifyVehicle(immatriculation) {
  const res = await axios.post(`${API}/vehicle/identify`, { immatriculation });
  return res.data;
}

export async function estimateVehicle(vehicleData) {
  const res = await axios.post(`${API}/vehicle/estimate`, vehicleData);
  return res.data;
}

export async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function submitLead(leadData) {
  const res = await axios.post(`${API}/leads`, leadData);
  return res.data;
}

export async function savePartialLead(step, data) {
  const res = await axios.post(`${API}/leads/partial`, { step, data });
  return res.data;
}

export async function getAppointmentSlots(date) {
  const res = await axios.get(`${API}/appointments/slots`, { params: { date } });
  return res.data;
}

export async function getCenters() {
  const res = await axios.get(`${API}/centers`);
  return res.data;
}

export function getFileUrl(path) {
  return `${API}/files/${path}`;
}
