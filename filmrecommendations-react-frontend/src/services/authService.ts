import { apiService } from './api';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse, LoginRequest>('/api/Auth/login', credentials);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiService.post<AuthResponse, RegisterRequest>('/api/Auth/register', userData);
  }

  async validateToken(token: string): Promise<boolean> {
    // Simple token presence check - backend handles validation
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeToken(): void {
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();