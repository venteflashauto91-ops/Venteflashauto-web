/**
 * UTM parameter utilities.
 * Preserves UTM params across the entire flow.
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

export function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  UTM_KEYS.forEach(key => {
    const val = params.get(key);
    if (val) utm[key] = val;
  });
  return utm;
}

export function buildUrlWithUtm(basePath, extraParams = {}) {
  const utm = getUtmParams();
  const all = { ...utm, ...extraParams };
  const qs = new URLSearchParams(all).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function getStoredUtm() {
  try {
    const stored = sessionStorage.getItem('vfa_utm');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function storeUtm() {
  const utm = getUtmParams();
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem('vfa_utm', JSON.stringify(utm));
  }
  return utm;
}

export function getMergedUtm() {
  return { ...getStoredUtm(), ...getUtmParams() };
}
