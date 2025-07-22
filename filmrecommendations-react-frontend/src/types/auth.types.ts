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
  token: string;
  userId: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
}