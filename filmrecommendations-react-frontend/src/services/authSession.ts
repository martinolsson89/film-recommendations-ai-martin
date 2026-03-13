import type { AuthResponse } from "../types/auth.types";

type RefreshHandler = () => Promise<AuthResponse | null>;
type AuthSuccessHandler = (response: AuthResponse) => void;
type AuthClearHandler = () => void;

let accessToken: string | null = null;
let refreshHandler: RefreshHandler | null = null;
let authSuccessHandler: AuthSuccessHandler | null = null;
let authClearHandler: AuthClearHandler | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;

export const authSession = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string | null): void {
    accessToken = token;
  },

  configure(options: {
    refreshHandler: RefreshHandler;
    onAuthSuccess: AuthSuccessHandler;
    onAuthCleared: AuthClearHandler;
  }): void {
    refreshHandler = options.refreshHandler;
    authSuccessHandler = options.onAuthSuccess;
    authClearHandler = options.onAuthCleared;
  },

  applyAuthResponse(response: AuthResponse): void {
    accessToken = response.accessToken;
    authSuccessHandler?.(response);
  },

  clear(): void {
    accessToken = null;
    authClearHandler?.();
  },

  async refresh(): Promise<AuthResponse | null> {
    if (!refreshHandler) {
      return null;
    }

    if (!refreshPromise) {
      refreshPromise = refreshHandler()
        .then((response) => {
          if (response) {
            this.applyAuthResponse(response);
            return response;
          }

          this.clear();
          return null;
        })
        .catch(() => {
          this.clear();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  }
};
