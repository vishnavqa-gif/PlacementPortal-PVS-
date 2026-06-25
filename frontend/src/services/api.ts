import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - auto-refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, null, {
            params: { refresh_token: refreshToken }
          });
          localStorage.setItem('access_token', res.data.access_token);
          original.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) => api.post('/auth/reset-password', { token, new_password }),
  changePassword: (current_password: string, new_password: string) => api.post('/auth/change-password', { current_password, new_password }),
  getMe: () => api.get('/auth/me'),
};

// Student
export const studentApi = {
  getDashboard: () => api.get('/student/dashboard'),
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data: any) => api.put('/student/profile', data),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/student/resume/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getMyInterviews: (status?: string) => api.get('/student/interviews', { params: { status } }),
  getAnnouncements: () => api.get('/student/announcements'),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Students
  listStudents: (params?: any) => api.get('/admin/students', { params }),
  createStudent: (data: any) => api.post('/admin/students', data),
  updateStudentStatus: (id: string, status: string) => api.put(`/admin/students/${id}/status`, null, { params: { new_status: status } }),
  deleteStudent: (id: string) => api.delete(`/admin/students/${id}`),
  // Technologies
  listTechnologies: () => api.get('/admin/technologies'),
  createTechnology: (data: any) => api.post('/admin/technologies', data),
  updateTechnology: (id: string, data: any) => api.put(`/admin/technologies/${id}`, data),
  deleteTechnology: (id: string) => api.delete(`/admin/technologies/${id}`),
  // Interviewers
  listInterviewers: () => api.get('/admin/interviewers'),
  createInterviewer: (data: any) => api.post('/admin/interviewers', data),
  updateInterviewer: (id: string, data: any) => api.put(`/admin/interviewers/${id}`, data),
  deleteInterviewer: (id: string) => api.delete(`/admin/interviewers/${id}`),
  // Cabins
  listCabins: () => api.get('/admin/cabins'),
  createCabin: (data: any) => api.post('/admin/cabins', data),
  updateCabin: (id: string, data: any) => api.put(`/admin/cabins/${id}`, data),
  // Slots
  listSlots: () => api.get('/admin/slots'),
  createSlot: (data: any) => api.post('/admin/slots', data),
  deleteSlot: (id: string) => api.delete(`/admin/slots/${id}`),
  // Interviews
  listInterviews: (params?: any) => api.get('/admin/interviews', { params }),
  scheduleInterview: (data: any) => api.post('/admin/interviews', data),
  updateInterviewStatus: (id: string, data: any) => api.put(`/admin/interviews/${id}/status`, data),
  addFeedback: (id: string, data: any) => api.post(`/admin/interviews/${id}/feedback`, data),
  getAvailableSlots: (params: any) => api.get('/admin/available-slots', { params }),
  // Announcements
  listAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data: any) => api.post('/admin/announcements', data),
  // Audit
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
  // Reports
  dailyReport: (date?: string) => api.get('/reports/daily', { params: { report_date: date } }),
  weeklyReport: () => api.get('/reports/weekly'),
  monthlyReport: (year?: number, month?: number) => api.get('/reports/monthly', { params: { year, month } }),
  exportExcel: () => api.get('/reports/export/excel', { responseType: 'blob' }),
  exportPdf: () => api.get('/reports/export/pdf', { responseType: 'blob' }),
};

// Interview booking
export const interviewApi = {
  book: (data: any) => api.post('/interviews/book', data),
  cancel: (id: string, reason?: string) => api.delete(`/interviews/${id}/cancel`, { params: { reason } }),
};

// Super Admin
export const superAdminApi = {
  listAdmins: () => api.get('/super-admin/admins'),
  addAdmin: (data: any) => api.post('/super-admin/admins', data),
  removeAdmin: (id: string) => api.delete(`/super-admin/admins/${id}`),
  getSettings: () => api.get('/super-admin/settings'),
  updateSetting: (key: string, value: string) => api.put(`/super-admin/settings/${key}`, null, { params: { value } }),
  getAuditLogs: () => api.get('/super-admin/audit-logs'),
};
