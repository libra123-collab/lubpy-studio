import { User } from '../types';

const USER_SESSION_KEY = 'lubpy_active_user';
const TOKEN_KEY = 'lubpy_auth_token';

export function saveUserSession(user: User, token?: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    const sessionPayload = {
      user,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days session
    };
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionPayload));
    // Also mirror to localStorage for seamless tab sync
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionPayload));
    localStorage.setItem('lubpy_user', JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user session:', e);
  }
}

export function getUserSession(): User | null {
  try {
    let stored = sessionStorage.getItem(USER_SESSION_KEY) || localStorage.getItem(USER_SESSION_KEY);
    if (!stored) {
      const legacy = localStorage.getItem('lubpy_user');
      if (legacy) {
        return JSON.parse(legacy);
      }
      return null;
    }

    const payload = JSON.parse(stored);
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      clearUserSession();
      return null;
    }

    return payload.user || null;
  } catch (e) {
    clearUserSession();
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function clearUserSession(): void {
  try {
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem('lubpy_auth_session_enc');
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('lubpy_user');
    localStorage.removeItem('lubpy_client_auth_temp_state');
  } catch (e) {
    console.error('Failed to clear user session:', e);
  }
}
