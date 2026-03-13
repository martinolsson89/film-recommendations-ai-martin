import { apiService } from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse } from '../types/auth.types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse, LoginRequest>('/api/Auth/login', credentials, {
      includeCredentials: true,
      retryOn401: false
    });
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return apiService.post<RegisterResponse, RegisterRequest>('/api/Auth/register', userData, {
      includeCredentials: true,
      retryOn401: false
    });
  }

  async refresh(): Promise<AuthResponse> {
    return apiService.post<AuthResponse, undefined>('/api/Auth/refresh', undefined, {
      includeCredentials: true,
      retryOn401: false
    });
  }

  async logout(): Promise<void> {
    await apiService.post<void, undefined>('/api/Auth/logout', undefined, {
      includeCredentials: true,
      retryOn401: false
    });
  }
}

export const authService = new AuthService();
