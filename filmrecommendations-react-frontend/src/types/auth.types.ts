export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  userName: string;
}

export interface RegisterResponse {
  message: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
}
