// Saffron Grill POS - Central API Client
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // When running locally via Vite dev server, forward to local Apache backend
  if (import.meta.env.DEV) {
    return '/backend';
  }
  // In production (InfinityFree, cPanel, Apache):
  // If app is served from a subdirectory containing /frontend, go up one level
  const isFrontendSubdir = window.location.pathname.includes('/frontend');
  return isFrontendSubdir ? '../backend' : './backend';
};

const API_BASE_URL = getBaseUrl();

export async function request(endpoint, options = {}) {
  let targetUrl;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    targetUrl = new URL(endpoint);
  } else {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    targetUrl = new URL(cleanEndpoint, new URL(base, window.location.href));
  }

  if (options.params) {
    Object.keys(options.params).forEach((key) => {
      const val = options.params[key];
      if (val !== undefined && val !== null && val !== '') {
        targetUrl.searchParams.append(key, val);
      }
    });
  }

  const defaultHeaders = {
    'Accept': 'application/json',
  };

  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(targetUrl.toString(), {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    // If response is not valid JSON (e.g. HTML 404 or Apache error)
    const err = new Error(`Server returned non-JSON response (HTTP ${response.status}).`);
    err.status = response.status;
    err.rawText = rawText;
    throw err;
  }

  if (!response.ok || (data && data.success === false)) {
    const errorMsg = (data && data.message) || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (endpoint, params = {}) => request(endpoint, { method: 'GET', params }),
  post: (endpoint, body = {}, params = {}) => request(endpoint, { method: 'POST', body, params }),
};

export default api;
