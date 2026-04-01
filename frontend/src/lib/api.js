import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// ── Autobiz (secure, backend-only) ────────────────────────────────

export async function identifyVehicle(plate) {
  const res = await axios.post(`${API}/autobiz/identify`, { plate });
  return res.data;
}

export async function getQuotation(vehicle, mileage) {
  const res = await axios.post(`${API}/autobiz/quote`, { vehicle, mileage });
  return res.data;
}

// ── Leads ──────────────────────────────────────────────────────────

export async function saveLead(leadData) {
  const res = await axios.post(`${API}/leads/save`, leadData);
  return res.data;
}

// ── Upload ─────────────────────────────────────────────────────────

export async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ── Garages & Appointments ──────────────────────────────────────────

export async function getGarages(postalCode) {
  const params = postalCode ? { postal_code: postalCode } : {};
  const res = await axios.get(`${API}/garages`, { params });
  return res.data;
}

export async function getAppointmentConfig() {
  const res = await axios.get(`${API}/appointments/config`);
  return res.data;
}

export async function getAvailableSlots(garageId, date) {
  const res = await axios.get(`${API}/appointments/available`, { params: { garage_id: garageId, date } });
  return res.data;
}

// ── Ranges & Settings ──────────────────────────────────────────────

export async function getRanges() {
  const res = await axios.get(`${API}/ranges`);
  return res.data;
}

export async function getSettings() {
  const res = await axios.get(`${API}/settings`);
  return res.data;
}

// ── Tracking ───────────────────────────────────────────────────────

export async function trackEvent(event, properties = {}) {
  try {
    await axios.post(`${API}/tracking`, { event, properties });
  } catch {
    // silent
  }
}

// ── File URL ───────────────────────────────────────────────────────

export function getFileUrl(path) {
  return `${API}/files/${path}`;
}
