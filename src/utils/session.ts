import { User } from '../types';

const USER_SESSION_KEY = 'lubpy_active_user';
const TOKEN_KEY = 'lubpy_auth_token';

// Maximum safe length for base64 photoUrl in storage (approx 40KB)
const MAX_PHOTO_DATA_URL_LEN = 40000;

function getFallbackAvatar(email?: string, name?: string): string {
  const seed = email || name || 'lubpy_user';
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0f172a`;
}

export function sanitizeUserForStorage(user: User): User {
  if (!user) return user;
  let photoUrl = user.photoUrl;

  // If photoUrl is missing or an oversized base64 data URL, fall back to dicebear
  if (!photoUrl) {
    photoUrl = getFallbackAvatar(user.email, user.name);
  } else if (photoUrl.startsWith('data:') && photoUrl.length > MAX_PHOTO_DATA_URL_LEN) {
    photoUrl = getFallbackAvatar(user.email, user.name);
  }

  return {
    ...user,
    photoUrl
  };
}

/**
 * Frees up localStorage when a QuotaExceededError is encountered
 */
export function purgeOversizedStorageItems(): void {
  try {
    // 1. Remove obsolete or expendable temp keys
    const expendableKeys = [
      'lubpy_client_auth_temp_state',
      'lubpy_auth_session_enc',
      'lubpy_temp_state',
      'lubpy_upload_cache',
      'lubpy_draft_project'
    ];
    expendableKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    // 2. Prune old notifications if they take up excessive space (>50KB)
    try {
      const rawNotifs = localStorage.getItem('lubpy_admin_notifications');
      if (rawNotifs && rawNotifs.length > 50000) {
        const parsed = JSON.parse(rawNotifs);
        if (Array.isArray(parsed)) {
          localStorage.setItem('lubpy_admin_notifications', JSON.stringify(parsed.slice(0, 10)));
        }
      }
    } catch (e) {}

    // 3. Prune bloated users list in lubpy_users
    try {
      const rawUsers = localStorage.getItem('lubpy_users');
      if (rawUsers && rawUsers.length > 80000) {
        const parsedUsers = JSON.parse(rawUsers);
        if (Array.isArray(parsedUsers)) {
          const sanitizedUsers = parsedUsers.map((u: any) => ({
            ...u,
            photoUrl: u.photoUrl && u.photoUrl.length > MAX_PHOTO_DATA_URL_LEN
              ? getFallbackAvatar(u.email, u.name)
              : u.photoUrl
          }));
          localStorage.setItem('lubpy_users', JSON.stringify(sanitizedUsers));
        }
      }
    } catch (e) {}

    // 4. Prune bloated saved accounts in lubpy_saved_accounts_v2
    try {
      const rawSaved = localStorage.getItem('lubpy_saved_accounts_v2');
      if (rawSaved && rawSaved.length > 60000) {
        const parsedSaved = JSON.parse(rawSaved);
        if (Array.isArray(parsedSaved)) {
          const minimalSaved = parsedSaved.slice(0, 8).map((a: any) => ({
            ...a,
            photoUrl: a.photoUrl && a.photoUrl.length > MAX_PHOTO_DATA_URL_LEN
              ? getFallbackAvatar(a.email, a.name)
              : a.photoUrl
          }));
          localStorage.setItem('lubpy_saved_accounts_v2', JSON.stringify(minimalSaved));
        }
      }
    } catch (e) {}

    // 5. Prune org heads if photos are oversized
    try {
      const rawHeads = localStorage.getItem('fintrixity_org_heads');
      if (rawHeads && rawHeads.length > 60000) {
        const parsedHeads = JSON.parse(rawHeads);
        if (parsedHeads && typeof parsedHeads === 'object') {
          Object.keys(parsedHeads).forEach(k => {
            if (parsedHeads[k]?.photoUrl && parsedHeads[k].photoUrl.length > MAX_PHOTO_DATA_URL_LEN) {
              parsedHeads[k].photoUrl = getFallbackAvatar(parsedHeads[k].email, parsedHeads[k].name);
            }
          });
          localStorage.setItem('fintrixity_org_heads', JSON.stringify(parsedHeads));
        }
      }
    } catch (e) {}
  } catch (err) {
    console.warn('Storage purge error:', err);
  }
}

export function saveUserSession(user: User, token?: string): void {
  try {
    const safeUser = sanitizeUserForStorage(user);

    if (token) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch (e) {
        try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e2) {}
      }
    }

    const sessionPayload = {
      user: safeUser,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days session
    };
    const payloadStr = JSON.stringify(sessionPayload);
    const userStr = JSON.stringify(safeUser);

    // 1. Always save to sessionStorage first (isolated, reliable tab quota)
    try {
      sessionStorage.setItem(USER_SESSION_KEY, payloadStr);
    } catch (e) {
      console.warn('Could not write to sessionStorage:', e);
    }

    // 2. Mirror to localStorage with QuotaExceeded fallback protection
    try {
      localStorage.setItem(USER_SESSION_KEY, payloadStr);
      localStorage.setItem('lubpy_user', userStr);
    } catch (quotaError) {
      console.warn('localStorage quota exceeded during saveUserSession; running auto-purge...', quotaError);
      purgeOversizedStorageItems();

      // Retry with minimal user (guaranteed lightweight < 500 bytes)
      try {
        const minimalUser: User = {
          ...safeUser,
          photoUrl: getFallbackAvatar(safeUser.email, safeUser.name)
        };
        const minimalPayload = JSON.stringify({
          user: minimalUser,
          timestamp: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        localStorage.setItem(USER_SESSION_KEY, minimalPayload);
        localStorage.setItem('lubpy_user', JSON.stringify(minimalUser));
      } catch (finalRetryErr) {
        console.warn('localStorage is entirely full, session is safely preserved in sessionStorage:', finalRetryErr);
      }
    }
  } catch (e) {
    console.warn('Session save notice:', e);
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
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function clearUserSession(): void {
  try {
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem('lubpy_auth_session_enc');
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('lubpy_user');
    localStorage.removeItem('lubpy_client_auth_temp_state');
  } catch (e) {
    console.warn('Failed to clear user session:', e);
  }
}
