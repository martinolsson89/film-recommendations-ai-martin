import { authSession } from "./authSession";

const DEV_API_BASE_URL = 'https://localhost:7103';
const PROD_API_BASE_URL = 'https://film-recommendations-backend-cda7a6gybwabbhey.swedencentral-01.azurewebsites.net';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? DEV_API_BASE_URL : PROD_API_BASE_URL);

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private buildHeaders(requireAuth: boolean, body?: BodyInit | null): HeadersInit {
    const token = authSession.getAccessToken();
    const headers: Record<string, string> = {};

    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (requireAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text() as T;
  }

  private async request<T>(
    endpoint: string,
    init: RequestInit,
    options: { requireAuth?: boolean; retryOn401?: boolean; includeCredentials?: boolean } = {}
  ): Promise<T> {
    const requireAuth = options.requireAuth ?? false;
    const retryOn401 = options.retryOn401 ?? requireAuth;
    const includeCredentials = options.includeCredentials ?? true;
    const body = init.body;

    const execute = async (): Promise<Response> =>
      fetch(`${this.baseUrl}${endpoint}`, {
        ...init,
        headers: this.buildHeaders(requireAuth, body),
        credentials: includeCredentials ? 'include' : 'same-origin'
      });

    let response = await execute();

    if (response.status === 401 && retryOn401) {
      const refreshResponse = await authSession.refresh();

      if (!refreshResponse) {
        throw new Error('Unauthorized');
      }

      response = await execute();
    }

    return this.handleResponse<T>(response);
  }

  async get<T>(
    endpoint: string,
    options: boolean | { requireAuth?: boolean; retryOn401?: boolean; includeCredentials?: boolean } = false
  ): Promise<T> {
    const resolvedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
    return this.request<T>(endpoint, { method: 'GET' }, resolvedOptions);
  }

  async post<T, U>(
    endpoint: string,
    data: U,
    options: boolean | { requireAuth?: boolean; retryOn401?: boolean; includeCredentials?: boolean } = false
  ): Promise<T> {
    const resolvedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data === undefined ? undefined : JSON.stringify(data)
      },
      resolvedOptions
    );
  }

  async put<T, U>(
    endpoint: string,
    data: U,
    options: boolean | { requireAuth?: boolean; retryOn401?: boolean; includeCredentials?: boolean } = false
  ): Promise<T> {
    const resolvedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      },
      resolvedOptions
    );
  }

  async delete<T>(
    endpoint: string,
    options: boolean | { requireAuth?: boolean; retryOn401?: boolean; includeCredentials?: boolean } = false
  ): Promise<T> {
    const resolvedOptions = typeof options === 'boolean' ? { requireAuth: options } : options;
    return this.request<T>(endpoint, { method: 'DELETE' }, resolvedOptions);
  }
}

export const apiService = new ApiService();
