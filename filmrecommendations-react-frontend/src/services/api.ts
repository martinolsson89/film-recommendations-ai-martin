// Use environment variable if available, fallback to production backend
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://film-recommendations-backend-cda7a6gybwabbhey.swedencentral-01.azurewebsites.net';
const API_BASE_URL = 'https://localhost:7103';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    console.log('Auth token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
    console.log('Auth headers:', { ...headers, Authorization: headers.Authorization ? `Bearer ${token?.substring(0, 20)}...` : 'none' });
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text() as T;
  }

  async get<T>(endpoint: string, requireAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: requireAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' }
    });
    
    return this.handleResponse<T>(response);
  }

  async post<T, U>(endpoint: string, data: U, requireAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: requireAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    return this.handleResponse<T>(response);
  }

  async put<T, U>(endpoint: string, data: U, requireAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: requireAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, requireAuth: boolean = false): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: requireAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' }
    });

    return this.handleResponse<T>(response);
  }
}

export const apiService = new ApiService();