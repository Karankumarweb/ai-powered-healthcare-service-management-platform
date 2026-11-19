import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AdminSummary,
  AiChatResponse,
  Appointment,
  AuthResponse,
  AvailabilitySlot,
  Doctor,
  NotificationItem,
  Patient,
  ServiceRequest,
  StructuredSummaryResponse,
  UserProfile,
} from '../types/healthcare';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

const TOKEN_KEY = 'careflow_access_token';
const REFRESH_KEY = 'careflow_refresh_token';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const refresh = tokenStorage.getRefresh();
      if (refresh) {
        originalRequest._retry = true;
        try {
          const res = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refresh,
          });
          tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        } catch {
          tokenStorage.clear();
        }
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || err.message || 'Request failed';
  }
  return err instanceof Error ? err.message : 'Unexpected error occurred';
}

export const authApi = {
  register: (payload: { fullName: string; email: string; password: string; role: string }) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),
  login: (payload: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),
  demoLogin: (role: 'ADMIN' | 'DOCTOR' | 'PATIENT') =>
    api.post<AuthResponse>('/auth/demo-login', { role }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get<UserProfile>('/auth/me').then((r) => r.data),
  updateMe: (fullName: string) => api.put<UserProfile>('/auth/me', { fullName }).then((r) => r.data),
};

export const patientApi = {
  list: (query = '', page = 0, size = 20) =>
    api
      .get<{ content: Patient[]; totalElements: number }>('/patients', {
        params: { query, page, size },
      })
      .then((r) => r.data),
  getById: (id: number) => api.get<Patient>(`/patients/${id}`).then((r) => r.data),
  getByUserId: (userId: number) => api.get<Patient>(`/patients/by-user/${userId}`).then((r) => r.data),
  create: (payload: Partial<Patient>) => api.post<Patient>('/patients', payload).then((r) => r.data),
  update: (id: number, payload: Partial<Patient>) =>
    api.put<Patient>(`/patients/${id}`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/patients/${id}`),
};

export const doctorApi = {
  list: (specialization = '', query = '') =>
    api
      .get<{ content: Doctor[]; totalElements: number }>('/doctors', {
        params: { specialization, query },
      })
      .then((r) => r.data),
  getById: (id: number) => api.get<Doctor>(`/doctors/${id}`).then((r) => r.data),
  getByUserId: (userId: number) => api.get<Doctor>(`/doctors/by-user/${userId}`).then((r) => r.data),
  updateAvailability: (doctorId: number, slots: Omit<AvailabilitySlot, 'id'>[]) =>
    api.put<AvailabilitySlot[]>(`/doctors/${doctorId}/availability`, slots).then((r) => r.data),
};

export const appointmentApi = {
  list: () => api.get<{ content: Appointment[]; totalElements: number }>('/appointments').then((r) => r.data),
  book: (payload: {
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    visitType: 'IN_PERSON' | 'VIDEO_TELEHEALTH';
    reason: string;
    notes?: string;
  }) => api.post<Appointment>('/appointments', payload).then((r) => r.data),
  reschedule: (id: number, payload: { appointmentDate: string; startTime: string; endTime: string }) =>
    api.patch<Appointment>(`/appointments/${id}/reschedule`, payload).then((r) => r.data),
  cancel: (id: number, reason: string) =>
    api.patch<Appointment>(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),
  complete: (id: number) => api.patch<Appointment>(`/appointments/${id}/complete`).then((r) => r.data),
};

export const serviceRequestApi = {
  list: () => api.get<{ content: ServiceRequest[]; totalElements: number }>('/service-requests').then((r) => r.data),
  create: (payload: {
    patientId?: number;
    category: string;
    subject: string;
    description: string;
    aiSummary?: string;
    priority: string;
  }) => api.post<ServiceRequest>('/service-requests', payload).then((r) => r.data),
  updateStatus: (id: number, status: string, aiSummary?: string) =>
    api.patch<ServiceRequest>(`/service-requests/${id}/status`, { status, aiSummary }).then((r) => r.data),
};

export const notificationApi = {
  listMy: () => api.get<{ content: NotificationItem[]; totalElements: number }>('/notifications/my').then((r) => r.data),
  markRead: (id: number) => api.patch<NotificationItem>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

export const aiApi = {
  chat: (payload: {
    message: string;
    consentToProcess: boolean;
    history?: { role: string; content: string }[];
  }) => api.post<AiChatResponse>('/ai/chat', payload).then((r) => r.data),
  summarizeRequest: (payload: {
    category: string;
    subject: string;
    description: string;
    consentToProcess: boolean;
  }) => api.post<StructuredSummaryResponse>('/ai/summarize-request', payload).then((r) => r.data),
};

export const analyticsApi = {
  summary: () => api.get<AdminSummary>('/analytics/summary').then((r) => r.data),
};
