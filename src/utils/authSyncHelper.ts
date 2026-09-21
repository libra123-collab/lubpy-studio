import { User, UserRole } from '../types';
import { getStoredOrganization } from './organizationStore';
import { saveAccountToStorage, removeSavedAccountFromStorage } from './savedAccounts';

/**
 * Converts a DOB string (YYYY-MM-DD from <input type="date">, DD/MM/YYYY, or other)
 * into an 8-digit password string in DDMMYYYY format.
 * E.g., "2001-08-15" -> "15082001"
 * E.g., "15/08/2001" -> "15082001"
 */
export function dobTo8Digits(dobStr?: string): string {
  if (!dobStr) return '';
  const clean = dobStr.trim();

  // Format YYYY-MM-DD or YYYY/MM/DD (standard HTML date input or ISO)
  const ymdMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${d}${m}${y}`;
  }

  // Format DD/MM/YYYY or DD-MM-YYYY or D/M/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${d}${m}${y}`;
  }

  // Clean all non-digits
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 8) {
    // If format is YYYYMMDD (starts with year 19xx or 20xx)
    const possibleYear = parseInt(digits.slice(0, 4), 10);
    if (possibleYear >= 1900 && possibleYear <= 2100) {
      const y = digits.slice(0, 4);
      const m = digits.slice(4, 6);
      const d = digits.slice(6, 8);
      return `${d}${m}${y}`;
    }
    return digits;
  }

  return digits;
}

/**
 * Normalizes a display name string by stripping Vietnamese & international diacritics,
 * converting to lowercase, and removing whitespace and non-alphanumeric characters.
 * Example: "Nguyễn Văn A" -> "nguyenvana"
 */
export function normalizeEmailPrefix(displayName: string): string {
  if (!displayName || typeof displayName !== 'string') return '';
  return displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Converts a display name string (e.g., 'Nguyễn Văn A') into a normalized email prefix format
 * (e.g., 'nguyenvana@lubpystudio.vn') by removing diacritics and whitespace.
 * 
 * Examples:
 *  "Nguyễn Văn A" -> "nguyenvana@lubpystudio.vn"
 *  "Lê Bảo" -> "lebao@lubpystudio.vn"
 *  "Đỗ Đức Mạnh" -> "doducmanh@lubpystudio.vn"
 */
export function normalizeNameToEmail(displayName: string, domain: string = 'lubpystudio.vn'): string {
  const prefix = normalizeEmailPrefix(displayName);
  if (!prefix) return '';
  const cleanDomain = domain.replace(/^@/, '');
  return `${prefix}@${cleanDomain}`;
}

/**
 * Alias to support display name to normalized email conversion
 */
export function displayNameToNormalizedEmail(displayName: string, domain: string = 'lubpystudio.vn'): string {
  return normalizeNameToEmail(displayName, domain);
}

/**
 * Chuyển họ và tên thành email công việc @lubpystudio.vn
 * Ràng buộc điều kiện: Họ tên viết liền không dấu, chữ thường và có đuôi @lubpystudio.vn
 */
export function nameToLubpyEmail(name: string): string {
  return normalizeNameToEmail(name, 'lubpystudio.vn');
}

/**
 * Verifies if the entered password matches any valid password representation
 * for the user: explicit password, 8-digit DOB (DDMMYYYY), or default fallback.
 */
export function verifyInternalPassword(enteredPassword: string, user: { password?: string; dob?: string; [key: string]: any }): boolean {
  if (!enteredPassword || !user) return false;
  const p = enteredPassword.trim();

  // 1. Check explicit stored password
  if (user.password && user.password.trim() === p) {
    return true;
  }

  // 2. Check 8-digit DOB password (DDMMYYYY)
  if (user.dob) {
    const dobDigits = dobTo8Digits(user.dob);
    if (dobDigits && dobDigits === p) {
      return true;
    }
  }

  // 3. Fallback demo passwords for standard accounts
  if (p === '123456' || p === 'admin123' || p === 'tech2026' || p === 'cs2026' || p === 'hr2026' || p === 'acc2026') {
    return true;
  }

  return false;
}

/**
 * Searches across all local storage sources for an internal staff / head user by email.
 */
export function findInternalUserByEmail(rawEmail: string): User | null {
  if (!rawEmail) return null;
  const email = rawEmail.trim().toLowerCase();

  // 1. Check in Department Heads (fintrixity_org_heads)
  try {
    const org = getStoredOrganization();
    if (org && org.heads) {
      for (const deptKey of Object.keys(org.heads)) {
        const head = org.heads[deptKey];
        if (head && head.email && head.email.trim().toLowerCase() === email) {
          return head;
        }
      }
    }
  } catch (e) {}

  // 2. Check in Organization Members (fintrixity_org_members)
  try {
    const org = getStoredOrganization();
    if (org && org.members && Array.isArray(org.members)) {
      const found = org.members.find(m => m.email && m.email.trim().toLowerCase() === email);
      if (found) return found;
    }
  } catch (e) {}

  // 3. Check in lubpy_users
  try {
    const rawUsers = localStorage.getItem('lubpy_users');
    if (rawUsers) {
      const users: User[] = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        const found = users.find(u => u.email && u.email.trim().toLowerCase() === email);
        if (found) return found;
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Fully synchronizes an appointed head or staff account across all storage engines:
 * - fintrixity_org_heads
 * - lubpy_users
 * - lubpy_saved_accounts_v2
 * - triggers event dispatches
 */
export function syncHeadAccountToAllStores(head: User, customPassword?: string): void {
  if (!head || !head.email) return;
  const cleanEmail = head.email.trim().toLowerCase();
  const dobDigits = dobTo8Digits(head.dob);
  const finalPassword = (customPassword && customPassword.trim()) 
    || (head.password && head.password.trim()) 
    || (dobDigits ? dobDigits : '123456');

  const fullHead: User = {
    ...head,
    email: cleanEmail,
    password: finalPassword,
  };

  // 1. Sync to lubpy_users
  try {
    const savedUsers = localStorage.getItem('lubpy_users');
    let usersList: User[] = [];
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) usersList = parsed;
      } catch (e) {}
    }
    const existingIndex = usersList.findIndex(u => u && u.email && u.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      usersList[existingIndex] = { ...usersList[existingIndex], ...fullHead };
    } else {
      usersList.push(fullHead);
    }
    localStorage.setItem('lubpy_users', JSON.stringify(usersList));
  } catch (err) {
    console.error('Failed to sync to lubpy_users:', err);
  }

  // 2. Sync to savedAccounts (lubpy_saved_accounts_v2) with exact password
  try {
    saveAccountToStorage({
      email: cleanEmail,
      name: fullHead.name.trim(),
      role: fullHead.role as UserRole,
      isDepartmentHead: true,
      department: fullHead.department,
      departmentTitle: fullHead.departmentTitle,
      photoUrl: fullHead.photoUrl,
      password: finalPassword,
      savePasswordPreference: true
    });
  } catch (err) {
    console.error('Failed to sync to saved accounts:', err);
  }

  // 3. Dispatch system-wide events
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('lubpy_saved_accounts_updated'));
    window.dispatchEvent(new CustomEvent('lubpy_users_updated'));
    window.dispatchEvent(new CustomEvent('lubpy_staff_updated'));
  } catch (e) {}
}
