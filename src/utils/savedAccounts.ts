import { UserRole } from '../types';
import { getStoredOrganization } from './organizationStore';
import { dobTo8Digits } from './authSyncHelper';

export interface SavedAccount {
  id: string; // email
  email: string;
  name: string;
  role: UserRole;
  isDepartmentHead?: boolean;
  department?: string;
  departmentTitle?: string;
  photoUrl?: string;
  savedPassword?: string;
  adminSecurityKey?: string;
  lastLoggedInAt: number;
}

const SAVED_ACCOUNTS_KEY = 'lubpy_saved_accounts_v2';

// Standard default saved account (Only Super Admin is kept pre-populated)
const DEFAULT_SAVED_ACCOUNTS: SavedAccount[] = [
  {
    id: 'superadmin@lubpystudio.vn',
    email: 'superadmin@lubpystudio.vn',
    name: 'LUBPY Super Admin',
    role: 'admin',
    isDepartmentHead: true,
    department: 'Ban Quản Trị Hệ Thống',
    departmentTitle: 'Tổng Giám Đốc / Super Admin',
    photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=superadmin_king_01&backgroundColor=0f172a',
    savedPassword: 'admin123',
    adminSecurityKey: 'ADMIN_SUPER_KEY_2026',
    lastLoggedInAt: Date.now()
  }
];

function sanitizePhotoUrl(photoUrl?: string, email?: string): string {
  if (!photoUrl) {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email || 'user')}&backgroundColor=0f172a`;
  }
  // Strip excessively large data URLs (>150KB) to prevent quota exceeded errors in localStorage
  if (photoUrl.length > 150000) {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email || 'user')}&backgroundColor=0f172a`;
  }
  return photoUrl;
}

function safeSetItem(key: string, data: any[]): void {
  try {
    const cleanedData = data.map(item => ({
      ...item,
      photoUrl: sanitizePhotoUrl(item.photoUrl, item.email)
    }));
    localStorage.setItem(key, JSON.stringify(cleanedData));
  } catch (e) {
    console.warn(`QuotaExceededError setting ${key}, pruning storage and retrying...`, e);
    try {
      // Emergency cleanup: strip unnecessary data and prune
      const minimalData = data.slice(0, 10).map(item => ({
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        isDepartmentHead: item.isDepartmentHead,
        department: item.department,
        departmentTitle: item.departmentTitle,
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(item.email || 'user')}&backgroundColor=0f172a`,
        savedPassword: item.savedPassword,
        adminSecurityKey: item.adminSecurityKey,
        lastLoggedInAt: item.lastLoggedInAt
      }));
      localStorage.setItem(key, JSON.stringify(minimalData));
    } catch (err) {
      console.error(`Failed to save ${key} to localStorage even after emergency cleanup:`, err);
    }
  }
}

export function getSavedAccounts(): SavedAccount[] {
  try {
    let current: SavedAccount[] = [];
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) current = parsed;
      } catch (e) {
        console.error('Error parsing saved accounts:', e);
      }
    }

    // Get list of manually removed account emails
    let removedEmails = new Set<string>();
    try {
      const rawRemoved = localStorage.getItem('lubpy_removed_saved_accounts');
      if (rawRemoved) {
        const parsedRemoved = JSON.parse(rawRemoved);
        if (Array.isArray(parsedRemoved)) {
          removedEmails = new Set(
            parsedRemoved
              .filter(Boolean)
              .map((e: any) => String(e).trim().toLowerCase())
          );
        }
      }
    } catch (e) {}

    // 1. Always ensure Super Admin is available
    const superAdmin = DEFAULT_SAVED_ACCOUNTS[0];

    // 2. Fetch official Appointed Department Heads from orgData (fintrixity_org_heads)
    const org = getStoredOrganization();
    const headMap = new Map<string, any>();

    if (org && org.heads) {
      Object.values(org.heads).forEach((h: any) => {
        if (h && h.email) {
          const cleanEmail = String(h.email).trim().toLowerCase();
          headMap.set(cleanEmail, h);
        }
      });
    }

    // Also get valid members from org.members
    const memberMap = new Map<string, any>();
    if (org && org.members && Array.isArray(org.members)) {
      org.members.forEach((m: any) => {
        if (m && m.email) {
          memberMap.set(String(m.email).trim().toLowerCase(), m);
        }
      });
    }

    // 3. Filter current list: strictly keep Super Admin + Appointed Dept Heads + Active Appointed Members + Registered Client accounts
    // Any internal staff account that is not currently appointed in headMap or memberMap MUST BE REMOVED!
    const superAdminEmail = (superAdmin?.email || '').toLowerCase();
    let filteredCurrent = current.filter(acc => {
      if (!acc || !acc.email) return false;
      const em = String(acc.email).trim().toLowerCase();
      if (removedEmails.has(em)) return false;
      if (em === superAdminEmail || acc.role === 'admin') return true;
      if (acc.role === 'client') return true;
      // Internal staff role: MUST be actively appointed in headMap or memberMap
      return headMap.has(em) || memberMap.has(em);
    });

    // Ensure Super Admin is present
    if (superAdminEmail && !removedEmails.has(superAdminEmail) && !filteredCurrent.some(a => a && a.email && String(a.email).toLowerCase() === superAdminEmail)) {
      filteredCurrent.unshift(superAdmin);
    }

    // Ensure all currently Appointed Dept Heads are present in the saved list
    headMap.forEach((headUser, cleanEmail) => {
      if (!cleanEmail || removedEmails.has(cleanEmail)) return;

      const existingIdx = filteredCurrent.findIndex(a => a && a.email && String(a.email).toLowerCase() === cleanEmail);
      const computedPassword = headUser.password 
        || (headUser.dob ? dobTo8Digits(headUser.dob) : '') 
        || (existingIdx >= 0 && filteredCurrent[existingIdx].savedPassword ? filteredCurrent[existingIdx].savedPassword : '123456');

      const entry: SavedAccount = {
        id: cleanEmail,
        email: cleanEmail,
        name: headUser.name || cleanEmail,
        role: headUser.role,
        isDepartmentHead: true,
        department: headUser.department,
        departmentTitle: headUser.departmentTitle,
        photoUrl: sanitizePhotoUrl(headUser.photoUrl, cleanEmail),
        savedPassword: computedPassword,
        lastLoggedInAt: existingIdx >= 0 ? filteredCurrent[existingIdx].lastLoggedInAt : Date.now() - 5000
      };

      if (existingIdx >= 0) {
        filteredCurrent[existingIdx] = { ...filteredCurrent[existingIdx], ...entry };
      } else {
        filteredCurrent.push(entry);
      }
    });

    safeSetItem(SAVED_ACCOUNTS_KEY, filteredCurrent);

    return filteredCurrent.sort((a, b) => (b.lastLoggedInAt || 0) - (a.lastLoggedInAt || 0));
  } catch (e) {
    console.error('Failed to load saved accounts:', e);
    return DEFAULT_SAVED_ACCOUNTS;
  }
}

export function saveAccountToStorage(account: {
  email: string;
  name: string;
  role: UserRole;
  isDepartmentHead?: boolean;
  department?: string;
  departmentTitle?: string;
  photoUrl?: string;
  password?: string;
  adminSecurityKey?: string;
  savePasswordPreference?: boolean;
}): void {
  try {
    const cleanEmail = account.email.trim().toLowerCase();

    // Clear from removed list if previously removed
    try {
      const rawRemoved = localStorage.getItem('lubpy_removed_saved_accounts');
      if (rawRemoved) {
        const parsedRemoved = JSON.parse(rawRemoved);
        if (Array.isArray(parsedRemoved)) {
          const updatedRemoved = parsedRemoved
            .filter(Boolean)
            .map((e: any) => String(e).trim().toLowerCase())
            .filter((e: string) => e !== cleanEmail);
          try {
            localStorage.setItem('lubpy_removed_saved_accounts', JSON.stringify(updatedRemoved));
          } catch (e) {}
        }
      }
    } catch (e) {}

    const current = getSavedAccounts();
    const existingIndex = current.findIndex(a => a && a.email && String(a.email).trim().toLowerCase() === cleanEmail);

    const newEntry: SavedAccount = {
      id: cleanEmail,
      email: cleanEmail,
      name: account.name || cleanEmail,
      role: account.role,
      isDepartmentHead: account.isDepartmentHead,
      department: account.department,
      departmentTitle: account.departmentTitle,
      photoUrl: sanitizePhotoUrl(account.photoUrl, cleanEmail),
      savedPassword: account.savePasswordPreference !== false ? (account.password || '123456') : undefined,
      adminSecurityKey: account.savePasswordPreference !== false ? (account.adminSecurityKey || (account.role === 'admin' ? 'ADMIN_SUPER_KEY_2026' : undefined)) : undefined,
      lastLoggedInAt: Date.now()
    };

    if (existingIndex >= 0) {
      current[existingIndex] = {
        ...current[existingIndex],
        ...newEntry
      };
    } else {
      current.unshift(newEntry);
    }

    safeSetItem(SAVED_ACCOUNTS_KEY, current);
  } catch (e) {
    console.error('Failed to save account to local storage:', e);
  }
}

export function removeSavedAccountFromStorage(email: string): SavedAccount[] {
  try {
    if (!email) return getSavedAccounts();
    const cleanEmail = email.trim().toLowerCase();

    // Track removed email
    try {
      const rawRemoved = localStorage.getItem('lubpy_removed_saved_accounts');
      let removedList: string[] = [];
      if (rawRemoved) {
        try {
          const parsed = JSON.parse(rawRemoved);
          if (Array.isArray(parsed)) removedList = parsed.filter(Boolean).map(String);
        } catch (e) {}
      }
      if (!removedList.includes(cleanEmail)) {
        removedList.push(cleanEmail);
      }
      try {
        localStorage.setItem('lubpy_removed_saved_accounts', JSON.stringify(removedList));
      } catch (e) {}
    } catch (e) {}

    const current = getSavedAccounts();
    const updated = current.filter(a => a && a.email && String(a.email).trim().toLowerCase() !== cleanEmail);
    safeSetItem(SAVED_ACCOUNTS_KEY, updated);
    return updated;
  } catch (e) {
    console.error('Failed to remove saved account:', e);
    return [];
  }
}
