const handleResponse = async (response) => {
  if (response.ok) {
    return response.json();
  } else {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    } else {
      const errorText = await response.text();
      throw new Error(errorText || 'Something went wrong');
    }
  }
};

export const login = (credentials) => {
  return fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then(handleResponse);
};

export const setupMFA = (username) => {
  return fetch('/api/auth/setup-mfa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  }).then(handleResponse);
};

export const checkAuth = () => {
  return fetch('/api/auth/check').then(handleResponse);
};

export const logout = () => {
  return fetch('/api/auth/logout', { method: 'POST' }).then(handleResponse);
};

export const getClients = () => {
  return fetch('/api/clients').then(handleResponse);
};

export const addClient = (clientData) => {
  return fetch('/api/admin/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  }).then(handleResponse);
};

export const updateClient = (clientId, clientData) => {
  return fetch(`/api/admin/clients/${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  }).then(handleResponse);
};

export const deleteClient = (clientId) => {
  return fetch(`/api/admin/clients/${clientId}`, {
    method: 'DELETE',
  }).then(handleResponse);
};

export const getAdmins = () => {
  return fetch('/api/admin/admins').then(handleResponse);
};

export const addAdmin = (adminData) => {
  return fetch('/api/admin/admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminData),
  }).then(handleResponse);
};

export const addSuperAdmin = (adminData) => {
  return fetch('/api/admin/superadmins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminData),
  }).then(handleResponse);
};

export const updateAdmin = (adminId, adminData) => {
  return fetch(`/api/admin/admins/${adminId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminData),
  }).then(handleResponse);
};

export const toggleAdminBlock = (adminId, isBlocked) => {
  return fetch(`/api/admin/admins/${adminId}/block`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocked: !isBlocked }),
  }).then(handleResponse);
};

export const getNews = () => {
  return fetch('/api/news/scrape').then(handleResponse);
};

export const getClientLogs = (clientId) => {
  return fetch(`/api/clients/${clientId}/logs`).then(handleResponse);
};

export const getClientLogStats = (clientId) => {
  return fetch(`/api/clients/${clientId}/logstats`).then(handleResponse);
};

export const getSIEMToken = () => {
  return fetch('/api/auth/siem-access-token', {
    method: 'POST',
    credentials: 'include' // Include MSSP auth cookie
  }).then(handleResponse);
};
