/**
 * Form Validation Rules & Helpers for LUBPY STUDIO
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return 'Vui lòng nhập email.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Email không đúng cú pháp hợp lệ (VD: user@lubpystudio.vn).';
  }
  return null;
}

export function validatePhoneVN(phone: string): string | null {
  if (!phone || !phone.trim()) {
    return 'Vui lòng nhập số điện thoại.';
  }
  const cleanPhone = phone.trim().replace(/\s/g, '');
  // Vietnam phone regex: 10 digits starting with 0
  const phoneRegex = /^0[35789][0-9]{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return 'Số điện thoại phải đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).';
  }
  return null;
}

export function validateFutureDate(dateStr: string, fieldName: string = 'Ngày hạn nộp'): string | null {
  if (!dateStr) {
    return `Vui lòng chọn ${fieldName.toLowerCase()}.`;
  }
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(selectedDate.getTime())) {
    return `${fieldName} không hợp lệ.`;
  }

  if (selectedDate <= today) {
    return `${fieldName} phải lớn hơn ngày hiện tại (không thể chọn ngày trong quá khứ).`;
  }
  return null;
}

export function validateRequired(val: string, fieldName: string): string | null {
  if (!val || !val.trim()) {
    return `Vui lòng nhập ${fieldName.toLowerCase()}.`;
  }
  return null;
}

export function validateNumberPositive(val: number | string, fieldName: string): string | null {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) {
    return `${fieldName} phải là số dương lớn hơn 0.`;
  }
  return null;
}

export { normalizeEmailPrefix, normalizeNameToEmail, nameToLubpyEmail, displayNameToNormalizedEmail } from './authSyncHelper';
