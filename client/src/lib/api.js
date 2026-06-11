const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (res.status === 401) {
    window.location.href = '/auth/login'
    return
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Students
  getStudents: () => request('/students'),
  getStudent: (fileNo) => request(`/students/${encodeURIComponent(fileNo)}`),
  createStudent: (data) => request('/students', { method: 'POST', body: data }),
  updateStudent: (fileNo, data) => request(`/students/${encodeURIComponent(fileNo)}`, { method: 'PUT', body: data }),

  // Updates
  getUpdates: (fileNo) => request(`/updates/${encodeURIComponent(fileNo)}`),
  addUpdate: (data) => request('/updates', { method: 'POST', body: data }),
  updateUpdate: (updateId, data) => request(`/updates/${updateId}`, { method: 'PUT', body: data }),

  // Payments
  getPayments: (fileNo) => request(`/payments/${encodeURIComponent(fileNo)}`),
  addPayment: (data) => request('/payments', { method: 'POST', body: data }),

  // Enrolments
  getEnrolments: (fileNo) => request(`/enrolments/${encodeURIComponent(fileNo)}`),
  addEnrolment: (data) => request('/enrolments', { method: 'POST', body: data }),
  updateEnrolment: (id, data) => request(`/enrolments/${id}`, { method: 'PUT', body: data }),

  // Checklist
  getChecklist: (fileNo) => request(`/checklist/${encodeURIComponent(fileNo)}`),
  updateChecklist: (fileNo, data) => request(`/checklist/${encodeURIComponent(fileNo)}`, { method: 'PUT', body: data }),

  // Gmail
  getThreads: (fileNo) => request(`/gmail/${encodeURIComponent(fileNo)}`),

  // Drive
  getFiles: (fileNo) => request(`/drive/${encodeURIComponent(fileNo)}`),

  // Setup
  getSetupStatus: () => request('/setup/status'),
  createSpreadsheet: () => request('/setup/create-spreadsheet', { method: 'POST' }),
  linkSpreadsheet: (id) => request('/setup/link-spreadsheet', { method: 'POST', body: { spreadsheetId: id } }),

  // Drive import
  scanDriveStudents: () => request('/import/scan'),
  confirmDriveImport: (students) => request('/import/confirm', { method: 'POST', body: { students } }),
}
