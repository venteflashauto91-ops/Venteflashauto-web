const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const EVENTS = {
  PAGE_VIEW: 'page_view',
  ESTIMATION_STARTED: 'estimation_started',
  ESTIMATION_COMPLETED: 'estimation_completed',
  FORM_STEP_COMPLETED: 'form_step_completed',
  LEAD_SUBMITTED: 'lead_submitted',
  PHOTO_UPLOADED: 'photo_uploaded',
  RDV_SELECTED: 'rdv_selected',
};

export async function trackEvent(event, properties = {}) {
  try {
    await fetch(`${API}/tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties: { ...properties, timestamp: new Date().toISOString() } }),
    });
  } catch (e) {
    // Silent fail - tracking should never block UX
  }
}
