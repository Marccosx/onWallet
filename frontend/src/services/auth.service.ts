import { api } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  created_at: string;
}

export const AuthService = {
  login: async (email: string, password: string) => (await api.post<AuthUser>('/auth/login', { email, password })).data,
  logout: async () => { await api.post('/auth/logout'); },
  me: async () => (await api.get<AuthUser>('/auth/me')).data,
  updateMe: async (name: string, email: string) => (await api.patch<AuthUser>('/auth/me', { name, email })).data,
  changePassword: async (currentPassword: string, newPassword: string) => { await api.post('/auth/me/password', { currentPassword, newPassword }); },
  listUsers: async () => (await api.get<AuthUser[]>('/auth/users')).data,
  createUser: async (data: { name: string; email: string; password: string; role: 'ADMIN' | 'USER' }) => (await api.post<AuthUser>('/auth/users', data)).data,
  updateUser: async (id: string, data: Partial<AuthUser> & { password?: string }) => (await api.patch<AuthUser>(`/auth/users/${id}`, data)).data,
};
