import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, ShieldAlert, User as UserIcon, Users, HeartHandshake, Settings, 
  Lock, KeyRound, Building2, Briefcase, Calculator, Github, Eye, EyeOff, ShieldCheck, 
  Crown, Key, ArrowRight, ArrowLeft, Check, BookmarkCheck, Trash2, Sparkles, Clock, 
  UserCheck, Mail, Smartphone, Send, Calendar
} from 'lucide-react';
import { UserRole, User } from '../types';
import { getSavedAccounts, saveAccountToStorage, removeSavedAccountFromStorage, SavedAccount } from '../utils/savedAccounts';
import { getStoredOrganization } from '../utils/organizationStore';
import { saveUserSession } from '../utils/session';
import { api } from '../utils/apiClient';
import { findInternalUserByEmail, verifyInternalPassword, dobTo8Digits, normalizeNameToEmail, normalizeEmailPrefix } from '../utils/authSyncHelper';

export const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
  </svg>
);

export type AuthViewMode = 'signup-client' | 'login-internal' | 'login-client' | 'login-admin' | 'signup-internal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  language: 'en' | 'vi';
  initialView?: AuthViewMode;
  initialRole?: UserRole;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  language,
  initialView,
  initialRole,
  initialMode = 'login'
}: AuthModalProps) {
  // Determine starting view mode
  const [viewMode, setViewMode] = useState<AuthViewMode>(() => {
    if (initialView && initialView !== ('signup-internal' as any) && initialView !== ('signup-admin' as any)) {
      return initialView;
    }
    if (initialRole === 'admin') {
      return 'login-admin';
    }
    if (initialMode === 'signup') {
      return 'signup-client';
    }
    return initialRole && initialRole !== 'client' ? 'login-internal' : 'login-client';
  });

  // Multi-step form step for Sign Up forms (Step 1: Basic Identity, Step 2: In-depth Profile, Step 3: Security & Confirm)
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3>(1);

  // Saved accounts state for Quick Login / Remember Account feature
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => getSavedAccounts());
  const [rememberAccount, setRememberAccount] = useState<boolean>(true);
  const [selectedSavedEmail, setSelectedSavedEmail] = useState<string | null>(null);
  const [autoFilledMsg, setAutoFilledMsg] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState<UserRole>('tech');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDeptHead, setIsDeptHead] = useState<boolean>(true);
  const [adminSecurityKey, setAdminSecurityKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'github'>('google');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  // Profile fields for multi-step registration
  const [dob, setDob] = useState('');
  const [hometown, setHometown] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [workEnvironment, setWorkEnvironment] = useState('Trường học / Đại học');
  const [hasWorkUnit, setHasWorkUnit] = useState<'Có' | 'Không'>('Không');
  const [workUnitName, setWorkUnitName] = useState('');
  const [projectScope, setProjectScope] = useState<'Cá nhân' | 'Nhóm'>('Cá nhân');
  const [serviceNeeds, setServiceNeeds] = useState('');
  const [experience, setExperience] = useState('');
  const [competence, setCompetence] = useState('');
  const [skills, setSkills] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  const [registeredSuccessMsg, setRegisteredSuccessMsg] = useState<string | null>(null);

  // Client Authentication & Onboarding Step State: 'LOGIN' | 'OTP' | 'ONBOARDING' | 'DONE'
  const [authStep, setAuthStep] = useState<'LOGIN' | 'OTP' | 'ONBOARDING' | 'DONE'>('LOGIN');
  const [clientAuthMethod, setClientAuthMethod] = useState<'password_login' | 'google' | 'email_otp' | 'phone_otp'>('password_login');

  // OTP Management State
  const [otpInput, setOtpInput] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [otpResendCountdown, setOtpResendCountdown] = useState<number>(0);

  // Restore temp auth step state on component mount if user refreshed page during OTP or Onboarding
  useEffect(() => {
    const temp = localStorage.getItem('lubpy_client_auth_temp_state');
    if (temp) {
      try {
        const parsed = JSON.parse(temp);
        if (parsed && (parsed.authStep === 'OTP' || parsed.authStep === 'ONBOARDING')) {
          setAuthStep(parsed.authStep);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.dob) setDob(parsed.dob);
          if (parsed.occupation) setOccupation(parsed.occupation);
          if (parsed.workEnvironment) setWorkEnvironment(parsed.workEnvironment);
          if (parsed.clientAuthMethod) setClientAuthMethod(parsed.clientAuthMethod);
          if (parsed.generatedOtp) setGeneratedOtp(parsed.generatedOtp);
          if (parsed.otpInput) setOtpInput(parsed.otpInput);
          if (parsed.otpNotice) setOtpNotice(parsed.otpNotice);
          if (typeof parsed.otpResendCountdown === 'number') setOtpResendCountdown(parsed.otpResendCountdown);
        }
      } catch (e) {}
    }
  }, []);

  // Save temp auth state to localStorage whenever authStep or client fields change
  useEffect(() => {
    if (authStep === 'OTP' || authStep === 'ONBOARDING') {
      const payload = {
        authStep,
        email,
        fullName,
        phone,
        dob,
        occupation,
        workEnvironment,
        clientAuthMethod,
        generatedOtp,
        otpInput,
        otpNotice,
        otpResendCountdown,
        timestamp: Date.now()
      };
      localStorage.setItem('lubpy_client_auth_temp_state', JSON.stringify(payload));
    } else if (authStep === 'DONE' || authStep === 'LOGIN') {
      if (authStep === 'DONE') {
        localStorage.removeItem('lubpy_client_auth_temp_state');
      }
    }
  }, [authStep, email, fullName, phone, dob, occupation, workEnvironment, clientAuthMethod, generatedOtp, otpInput, otpNotice, otpResendCountdown]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (otpResendCountdown > 0) {
      timer = setInterval(() => {
        setOtpResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpResendCountdown]);

  // Sync state when modal opens or initialView changes
  useEffect(() => {
    if (isOpen) {
      setSavedAccounts(getSavedAccounts());
      let activeView: AuthViewMode = 'login-client';
      if (initialView && initialView !== ('signup-internal' as any) && initialView !== ('signup-admin' as any)) {
        activeView = initialView;
      } else if (initialRole === 'admin') {
        activeView = 'login-admin';
      } else if (initialMode === 'signup') {
        activeView = 'signup-client';
      } else {
        activeView = initialRole && initialRole !== 'client' ? 'login-internal' : 'login-client';
      }

      setViewMode(activeView);
      setSignUpStep(1);
      setError(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
      resetFields();
    }
  }, [isOpen, initialView, initialMode, initialRole]);

  useEffect(() => {
    const handleSyncSavedAccounts = () => {
      setSavedAccounts(getSavedAccounts());
    };
    window.addEventListener('storage', handleSyncSavedAccounts);
    window.addEventListener('lubpy_saved_accounts_updated', handleSyncSavedAccounts);
    window.addEventListener('lubpy_users_updated', handleSyncSavedAccounts);
    return () => {
      window.removeEventListener('storage', handleSyncSavedAccounts);
      window.removeEventListener('lubpy_saved_accounts_updated', handleSyncSavedAccounts);
      window.removeEventListener('lubpy_users_updated', handleSyncSavedAccounts);
    };
  }, []);

  if (!isOpen) return null;

  function resetFields() {
    const temp = localStorage.getItem('lubpy_client_auth_temp_state');
    if (temp) {
      try {
        const parsed = JSON.parse(temp);
        if (parsed && (parsed.authStep === 'OTP' || parsed.authStep === 'ONBOARDING')) {
          setAuthStep(parsed.authStep);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.dob) setDob(parsed.dob);
          if (parsed.occupation) setOccupation(parsed.occupation);
          if (parsed.workEnvironment) setWorkEnvironment(parsed.workEnvironment);
          if (parsed.clientAuthMethod) setClientAuthMethod(parsed.clientAuthMethod);
          if (parsed.generatedOtp) setGeneratedOtp(parsed.generatedOtp);
          if (parsed.otpInput) setOtpInput(parsed.otpInput);
          if (parsed.otpNotice) setOtpNotice(parsed.otpNotice);
          if (typeof parsed.otpResendCountdown === 'number') setOtpResendCountdown(parsed.otpResendCountdown);
          setError(null);
          return;
        }
      } catch (e) {}
    }

    setEmail('');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
    setDob('');
    setHometown('');
    setPhone('');
    setOccupation('');
    setWorkEnvironment('Trường học');
    setHasWorkUnit('Không');
    setWorkUnitName('');
    setProjectScope('Cá nhân');
    setServiceNeeds('');
    setRegisteredSuccessMsg(null);
    setAdminSecurityKey('');
    setError(null);
    setAuthStep('LOGIN');
    setClientAuthMethod('password_login');
    setOtpInput(['', '', '', '', '', '']);
    setOtpNotice(null);
    setOtpResendCountdown(0);
  }

  // Handle Saved Account Quick Selection
  const handleSelectSavedAccount = (acc: SavedAccount) => {
    setSelectedSavedEmail(acc.email);
    setEmail(acc.email);
    setFullName(acc.name);
    setSelectedRole(acc.role);
    setIsDeptHead(acc.isDepartmentHead !== undefined ? acc.isDepartmentHead : true);

    // Auto-fill saved password or compute from stored data
    let resolvedPass = acc.savedPassword ? acc.savedPassword.trim() : '';
    if (!resolvedPass) {
      const local = findInternalUserByEmail(acc.email);
      resolvedPass = (local?.password && local.password.trim())
        || (local?.dob ? dobTo8Digits(local.dob) : '');
    }
    setPassword(resolvedPass);

    if (acc.role === 'admin') {
      setViewMode('login-admin');
      setAdminSecurityKey(acc.adminSecurityKey || 'ADMIN_SUPER_KEY_2026');
    } else if (acc.role === 'client') {
      setViewMode('login-client');
    } else {
      setViewMode('login-internal');
    }

    setRememberAccount(true);
    setError(null);
    setAutoFilledMsg(`✨ Đã chọn tài khoản: ${acc.name}. ${resolvedPass ? 'Mật khẩu đã được tự động điền sẵn (1-chạm đăng nhập ngay).' : 'Vui lòng nhập mật khẩu để tiếp tục.'}`);
    setTimeout(() => setAutoFilledMsg(null), 5000);
  };

  const handleRemoveSavedAccount = (e: React.MouseEvent, accEmail: string) => {
    e.stopPropagation();
    const updated = removeSavedAccountFromStorage(accEmail);
    setSavedAccounts(updated);
    if (selectedSavedEmail === accEmail) {
      setSelectedSavedEmail(null);
    }
  };

  function applyQuickDemoCredentials(role: UserRole, head: boolean = true) {
    setSelectedRole(role);
    setIsDeptHead(head);
    setError(null);

    if (role === 'admin') {
      setEmail('superadmin@lubpystudio.vn');
      setFullName('LUBPY Super Admin');
      setPassword('admin123');
      setAdminSecurityKey('ADMIN_SUPER_KEY_2026');
    } else if (role === 'tech') {
      if (head) {
        setEmail('truetechengineer@lubpystudio.vn');
        setFullName('Phan Quốc Bảo (Tech Lead)');
        setPassword('tech2026');
      } else {
        setEmail('techengineer@lubpystudio.vn');
        setFullName('Trần Hoàng Nam (Senior Backend)');
        setPassword('tech2026');
      }
    } else if (role === 'cs') {
      if (head) {
        setEmail('truecs@lubpystudio.vn');
        setFullName('Đặng Ngọc Mai (CS Head)');
        setPassword('cs2026');
      } else {
        setEmail('cs@lubpystudio.vn');
        setFullName('Vũ Thùy Linh (Support Specialist)');
        setPassword('cs2026');
      }
    } else if (role === 'hr') {
      if (head) {
        setEmail('truehr@lubpystudio.vn');
        setFullName('Lê Thị Thanh Hương (HR Manager)');
        setPassword('hr2026');
      } else {
        setEmail('hr@lubpystudio.vn');
        setFullName('Phạm Hồng Ánh (Recruiter)');
        setPassword('hr2026');
      }
    } else if (role === 'accounting') {
      if (head) {
        setEmail('trueaccounting@lubpystudio.vn');
        setFullName('Nguyễn Văn Minh (Chief Accountant)');
        setPassword('acc2026');
      } else {
        setEmail('accounting@lubpystudio.vn');
        setFullName('Đỗ Thị Yến (Financial Analyst)');
        setPassword('acc2026');
      }
    }
  }

  // Clear fields on role or level selection as requested
  function handleSelectInternalRole(role: UserRole) {
    setSelectedRole(role);
    setFullName('');
    setEmail('');
    setPassword('');
    setError(null);
    setSelectedSavedEmail(null);
  }

  function handleSelectInternalLevel(head: boolean) {
    setIsDeptHead(head);
    setFullName('');
    setEmail('');
    setPassword('');
    setError(null);
    setSelectedSavedEmail(null);
  }

  const applyDefaultInternalCredentials = applyQuickDemoCredentials;

  // Handle Step Advancement Validation for Internal & Admin Sign Up
  const handleNextStepInternal = () => {
    setError(null);
    if (signUpStep === 1) {
      if (!fullName.trim() || !dob.trim() || !hometown.trim() || !phone.trim() || !email.trim()) {
        setError(language === 'vi'
          ? 'Vui lòng điền đầy đủ Bước 1: Họ tên, Ngày sinh, Quê quán, Số điện thoại và Email.'
          : 'Please complete Step 1: Full name, DOB, Hometown, Phone, and Email.');
        return;
      }
      const formattedEmail = email.trim().toLowerCase();
      if (!formattedEmail.endsWith('@lubpystudio.vn')) {
        setError(language === 'vi'
          ? 'Email cán bộ nghiệp vụ bắt buộc phải thuộc tên miền doanh nghiệp @lubpystudio.vn.'
          : 'Staff email must use corporate domain @lubpystudio.vn.');
        return;
      }
      setSignUpStep(2);
    } else if (signUpStep === 2) {
      if (selectedRole !== 'admin') {
        if (!experience.trim() || !competence.trim() || !skills.trim() || !careerGoals.trim()) {
          setError(language === 'vi'
            ? 'Vui lòng điền đầy đủ Bước 2: Kinh nghiệm làm việc, Năng lực chuyên môn, Kỹ năng và Định hướng nghề nghiệp.'
            : 'Please complete Step 2: Experience, Competence, Skills, and Career Goals.');
          return;
        }
      }
      setSignUpStep(3);
    }
  };

  // Handle Step Advancement Validation for Client Sign Up
  const handleNextStepClient = () => {
    setError(null);
    if (signUpStep === 1) {
      if (!fullName.trim() || !phone.trim() || !dob.trim() || !hometown.trim() || !email.trim()) {
        setError('Vui lòng điền đầy đủ Bước 1: Họ và tên, Số điện thoại, Ngày sinh, Quê quán và Gmail cá nhân.');
        return;
      }
      const cleanPhone = phone.trim().replace(/[\s\-\.]/g, '');
      const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setError('⚠️ Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam hợp lệ gồm 10 chữ số (VD: 0912345678).');
        return;
      }
      if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
        setError('⚠️ Vui lòng sử dụng địa chỉ Gmail cá nhân chính chủ (kết thúc bằng @gmail.com) để xác thực.');
        return;
      }
      setSignUpStep(2);
    } else if (signUpStep === 2) {
      if (!occupation.trim()) {
        setError('Vui lòng nhập Nghề nghiệp hiện tại.');
        return;
      }
      if (hasWorkUnit === 'Có' && !workUnitName.trim()) {
        setError('Vui lòng nhập Tên đơn vị công tác.');
        return;
      }
      if (!serviceNeeds.trim()) {
        setError('Vui lòng mô tả Nhu cầu sử dụng dịch vụ.');
        return;
      }
      setSignUpStep(3);
    }
  };

  // Final Submit for Client Sign Up (Sign In)
  const handleSignUpClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate mandatory fields
    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ và tên.');
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, '');
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phone.trim() || !phoneRegex.test(cleanPhone)) {
      setError('⚠️ Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam hợp lệ (10 chữ số).');
      return;
    }
    if (!dob.trim()) {
      setError('Vui lòng chọn Ngày tháng năm sinh.');
      return;
    }
    if (!hometown.trim()) {
      setError('Vui lòng nhập Quê quán / Địa chỉ.');
      return;
    }

    const formattedEmail = email.trim().toLowerCase();
    if (!formattedEmail || !formattedEmail.endsWith('@gmail.com')) {
      setError('⚠️ Vui lòng sử dụng địa chỉ Gmail cá nhân chính chủ (@gmail.com) để xác thực.');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError('Mật khẩu tự tạo phải từ 6 ký tự trở lên.');
      return;
    }
    if (!confirmPassword.trim() || password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp với mật khẩu đã tạo. Vui lòng kiểm tra lại!');
      return;
    }
    if (!occupation.trim()) {
      setError('Vui lòng nhập Nghề nghiệp hiện tại.');
      return;
    }
    if (hasWorkUnit === 'Có' && !workUnitName.trim()) {
      setError('Vui lòng nhập Tên đơn vị công tác.');
      return;
    }
    if (!serviceNeeds.trim()) {
      setError('Vui lòng nhập Nhu cầu sử dụng dịch vụ.');
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ LUBPY STUDIO.');
      return;
    }

    setIsSubmitting(true);
    api.auth.register({
      name: fullName.trim(),
      email: formattedEmail,
      password: password.trim(),
      phone: phone.trim(),
      dob: dob.trim(),
      hometown: hometown.trim(),
      occupation: occupation.trim(),
      workEnvironment: hasWorkUnit === 'Có' ? workUnitName.trim() : 'Cá nhân',
      skills: serviceNeeds.trim(),
    })
      .then((res: any) => {
        setIsSubmitting(false);
        setRegisteredSuccessMsg(`🎉 Đăng ký tài khoản thành công! Khách hàng ${fullName.trim()} (${formattedEmail}) vui lòng nhập Email và Mật khẩu vừa tạo để đăng nhập.`);
        setViewMode('login-client');
        setClientAuthMethod('password_login');
        setError(null);
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      });
  };

  // Submit Client Login with Email, Full Name, and Password
  const handleLogInClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedEmail = email.trim().toLowerCase();
    const enteredName = fullName.trim();
    const enteredPassword = password.trim();

    if (!formattedEmail) {
      setError('Vui lòng nhập Email cá nhân (@gmail.com).');
      return;
    }
    if (!formattedEmail.endsWith('@gmail.com')) {
      setError('⚠️ Vui lòng sử dụng địa chỉ Gmail cá nhân chính chủ (@gmail.com).');
      return;
    }
    if (!enteredName) {
      setError('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!enteredPassword) {
      setError('Vui lòng nhập Mật khẩu đã tạo.');
      return;
    }

    setIsSubmitting(true);
    api.auth.login({
      email: formattedEmail,
      password: enteredPassword,
    })
      .then((res: any) => {
        setIsSubmitting(false);
        const authenticatedUser = res.user;

        if (rememberAccount) {
          saveAccountToStorage({
            email: formattedEmail,
            name: authenticatedUser.name,
            role: 'client',
          });
        }

        saveUserSession(authenticatedUser, res.token);
        onLoginSuccess(authenticatedUser);
        onClose();
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError(err.message || 'Email hoặc mật khẩu không chính xác.');
      });
  };

  // Instant Sign Up with Google for Clients
  const handleGoogleSignUpClient = () => {
    setError(null);
    setIsSubmitting(true);

    const clientEmail = email.trim().toLowerCase().endsWith('@gmail.com')
      ? email.trim().toLowerCase()
      : (fullName.trim() ? `${fullName.trim().toLowerCase().replace(/\s+/g, '')}@gmail.com` : 'khachhang.lubpy@gmail.com');
    const clientName = fullName.trim() || 'Khách Hàng Google';

    setTimeout(() => {
      setIsSubmitting(false);
      const photoUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(clientName)}&backgroundColor=0f172a`;
      const newUser: User = {
        uid: `client_google_${Date.now()}`,
        name: clientName,
        email: clientEmail,
        photoUrl: photoUrl,
        role: 'client',
        dob: dob || undefined,
        hometown: hometown || undefined,
        phone: phone || undefined,
        occupation: occupation || 'Khách Hàng Google',
        skills: serviceNeeds || 'Xác thực Google OAuth 2.0'
      };
      onLoginSuccess(newUser);
      onClose();
    }, 850);
  };

  // Log In Submit for Internal Staff
  const handleLogInInternalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError(language === 'vi' ? '⚠️ Vui lòng nhập đầy đủ Email và Mật khẩu do Admin cấp.' : 'Please enter Email and Password provided by Admin.');
      return;
    }

    const formattedEmail = email.trim().toLowerCase();
    const enteredPassword = password.trim();

    // Check if user is an existing appointed internal staff
    const localUser = findInternalUserByEmail(formattedEmail);

    if (!formattedEmail.endsWith('@lubpystudio.vn') && !localUser) {
      setError(language === 'vi' 
        ? '⚠️ Email không hợp lệ! Email cán bộ phải có đuôi @lubpystudio.vn do Admin cấp.' 
        : 'Invalid corporate email. Must end with @lubpystudio.vn');
      return;
    }

    setIsSubmitting(true);

    // Strictly authenticate via Backend PostgreSQL API
    api.auth.login({
      email: formattedEmail,
      password: enteredPassword,
    })
      .then((res: any) => {
        setIsSubmitting(false);
        const authenticatedUser = res.user;

        saveAccountToStorage({
          email: formattedEmail,
          name: authenticatedUser.name,
          role: authenticatedUser.role,
          isDepartmentHead: authenticatedUser.isDepartmentHead,
          department: authenticatedUser.department,
          departmentTitle: authenticatedUser.departmentTitle,
          photoUrl: authenticatedUser.photoUrl,
          password: enteredPassword,
          savePasswordPreference: true
        });
        setSavedAccounts(getSavedAccounts());

        saveUserSession(authenticatedUser, res.token);
        onLoginSuccess(authenticatedUser);
        onClose();
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError(err.message || (language === 'vi' 
          ? 'Email hoặc mật khẩu không chính xác.' 
          : 'Incorrect email or password.'));
      });
  };

  // Google Sign-In with strict personal account (@gmail.com) check
  const handleGoogleClientSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const formattedEmail = email.trim().toLowerCase();

    if (!formattedEmail) {
      setError('Vui lòng nhập địa chỉ Email Google cá nhân (@gmail.com).');
      return;
    }

    // Checking 3 authentication methods logic: Block corporate / school email domains
    const isPersonalAccount = formattedEmail.endsWith('@gmail.com');
    if (!isPersonalAccount) {
      setError("Hệ thống chỉ hỗ trợ đăng nhập bằng tài khoản Google cá nhân (@gmail.com)!");
      return;
    }

    if (!fullName.trim()) {
      const namePart = formattedEmail.split('@')[0].replace(/[._]/g, ' ');
      setFullName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
    }

    // Google Sign-In verified -> advance directly to ONBOARDING
    setAuthStep('ONBOARDING');
  };

  // Send 6-digit OTP via Email or SMS
  const handleSendOtpClient = (method: 'email_otp' | 'phone_otp') => {
    setError(null);
    if (method === 'email_otp') {
      const formattedEmail = email.trim().toLowerCase();
      if (!formattedEmail || !formattedEmail.includes('@')) {
        setError('Vui lòng nhập địa chỉ Email Gmail hợp lệ.');
        return;
      }
      if (!formattedEmail.endsWith('@gmail.com')) {
        setError('Hệ thống chỉ hỗ trợ gửi mã OTP tới tài khoản Gmail cá nhân (@gmail.com). Không hỗ trợ Email doanh nghiệp hoặc trường học.');
        return;
      }
      setIsSubmitting(true);
      api.auth.sendOtp(formattedEmail, 'email')
        .then((res: any) => {
          setIsSubmitting(false);
          setOtpNotice(`Mã OTP 6 số đã được gửi tới Gmail: ${formattedEmail}`);
          setOtpInput(['', '', '', '', '', '']);
          setOtpResendCountdown(60);
          setAuthStep('OTP');
        })
        .catch((err: any) => {
          setIsSubmitting(false);
          setError(err.message || 'Không thể gửi mã OTP.');
        });
    } else {
      const cleanPhone = phone.trim();
      if (!cleanPhone || cleanPhone.length < 9) {
        setError('Vui lòng nhập số điện thoại hợp lệ (từ 9-11 chữ số).');
        return;
      }
      setIsSubmitting(true);
      api.auth.sendOtp(cleanPhone, 'phone')
        .then((res: any) => {
          setIsSubmitting(false);
          setOtpNotice(`Mã SMS OTP 6 số đã gửi tới số điện thoại: ${cleanPhone}`);
          setOtpInput(['', '', '', '', '', '']);
          setOtpResendCountdown(60);
          setAuthStep('OTP');
        })
        .catch((err: any) => {
          setIsSubmitting(false);
          setError(err.message || 'Không thể gửi mã OTP.');
        });
    }
  };

  // Handle OTP Digit Boxes input
  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otpInput];
    newOtp[index] = digit;
    setOtpInput(newOtp);

    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpInput];
      if (newOtp[index]) {
        newOtp[index] = '';
        setOtpInput(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtpInput(newOtp);
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = ['', '', '', '', '', ''];
      const digits = pasted.split('');
      digits.forEach((d, idx) => {
        if (idx < 6) newOtp[idx] = d;
      });
      setOtpInput(newOtp);
      const targetIdx = Math.min(digits.length - 1, 5);
      const targetInput = document.getElementById(`otp-input-${targetIdx >= 0 ? targetIdx : 0}`);
      if (targetInput) targetInput.focus();
    }
  };

  // Verify OTP 6-digit code
  const handleVerifyOtpClient = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const entered = otpInput.join('');
    if (entered.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }
    const target = clientAuthMethod === 'phone_otp' ? phone.trim() : email.trim().toLowerCase();
    setIsSubmitting(true);
    api.auth.verifyOtp(target, entered)
      .then((res: any) => {
        setIsSubmitting(false);
        setAuthStep('ONBOARDING');
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      });
  };

  // Save Onboarding Form and Redirect to Client Dashboard
  const handleSaveOnboardingClient = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict field validations for 4 mandatory fields
    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ và tên đầy đủ.');
      return;
    }
    if (!dob.trim()) {
      setError('Vui lòng chọn Ngày tháng năm sinh.');
      return;
    }
    if (!occupation.trim()) {
      setError('Vui lòng chọn hoặc nhập Nghề nghiệp hiện tại.');
      return;
    }
    if (!workEnvironment.trim()) {
      setError('Vui lòng chọn Môi trường làm việc.');
      return;
    }

    const clientEmail = clientAuthMethod === 'phone_otp' 
      ? (email.trim().toLowerCase() || `${phone.trim()}@lubpystudio.vn`) 
      : email.trim().toLowerCase();

    setIsSubmitting(true);
    api.auth.register({
      name: fullName.trim(),
      email: clientEmail,
      password: password.trim() || 'Client@123456',
      phone: phone.trim() || undefined,
      dob: dob.trim(),
      occupation: occupation.trim(),
      workEnvironment: workEnvironment.trim(),
    })
      .then((res: any) => {
        setIsSubmitting(false);
        const newUser = res.user;

        if (rememberAccount) {
          saveAccountToStorage({
            email: clientEmail,
            name: fullName.trim(),
            role: 'client',
            photoUrl: newUser.photoUrl,
            savePasswordPreference: rememberAccount
          });
          setSavedAccounts(getSavedAccounts());
        }

        saveUserSession(newUser, res.token);
        localStorage.removeItem('lubpy_client_auth_temp_state');
        setAuthStep('DONE');
        onLoginSuccess(newUser);
        onClose();
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError(err.message || 'Lỗi hoàn tất thông tin khách hàng.');
      });
  };

  // Log In Submit for Super Admin
  const handleLogInAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim() || !adminSecurityKey.trim()) {
      setError(language === 'vi' 
        ? 'Email hoặc mật khẩu không chính xác.' 
        : 'Invalid email or password.');
      return;
    }

    const formattedEmail = email.trim().toLowerCase();
    if (!formattedEmail.endsWith('@lubpystudio.vn')) {
      setError(language === 'vi' 
        ? 'Email hoặc mật khẩu không chính xác.' 
        : 'Invalid email or password.');
      return;
    }

    setIsSubmitting(true);
    api.auth.adminLogin({
      email: formattedEmail,
      password: password.trim(),
      adminSecurityKey: adminSecurityKey.trim(),
    })
      .then((res: any) => {
        setIsSubmitting(false);
        const newUser = res.user;

        saveAccountToStorage({
          email: formattedEmail,
          name: newUser.name,
          role: 'admin',
          isDepartmentHead: true,
          department: newUser.department || 'Ban Quản Trị Hệ Thống',
          departmentTitle: newUser.departmentTitle || 'Tổng Giám Đốc / Super Admin',
          photoUrl: newUser.photoUrl,
          password: password.trim(),
          adminSecurityKey: adminSecurityKey.trim() || 'ADMIN_SUPER_KEY_2026',
          savePasswordPreference: true
        });
        setSavedAccounts(getSavedAccounts());

        saveUserSession(newUser, res.token);
        onLoginSuccess(newUser);
        onClose();
      })
      .catch((err: any) => {
        setIsSubmitting(false);
        setError(err.message || (language === 'vi' 
          ? 'Email, mật khẩu hoặc Admin Security Key không chính xác.' 
          : 'Invalid admin credentials.'));
      });
  };

  // Final Submit for Super Admin Sign Up
  const handleSignUpAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim() || password.length < 6) {
      setError(language === 'vi' ? 'Mật khẩu quản trị phải từ 6 ký tự trở lên.' : 'Password must be at least 6 characters.');
      return;
    }
    if (adminSecurityKey.trim() !== 'ADMIN_SUPER_KEY_2026' && adminSecurityKey.trim() !== 'SUPER_ADMIN_2026') {
      setError(language === 'vi' 
        ? 'Mã kích hoạt độc quyền Admin Security Key không hợp lệ. Vui lòng liên hệ Hội Đồng Quản Trị LUBPY.' 
        : 'Invalid Admin Security Key.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const cleanEmail = (email.trim() || normalizeNameToEmail(fullName.trim())).toLowerCase();
      const newUser: User = {
        uid: `super_admin_${Date.now()}`,
        name: fullName.trim(),
        email: cleanEmail,
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=0f172a`,
        role: 'admin',
        isDepartmentHead: true,
        department: 'Ban Quản Trị Hệ Thống',
        departmentTitle: 'Tổng Giám Đốc / Super Admin',
        createdByAdmin: false,
        dob: dob || undefined,
        hometown: hometown || undefined,
        phone: phone || undefined,
        experience: experience || 'Ban Điều Hành & Quản Trị Tối Cao LUBPY STUDIO',
        competence: competence || 'Quản lý toàn bộ hệ thống, phân quyền cán bộ, tài chính & dự án',
        skills: skills || 'Leadership, System Architecture, Corporate Governance, Finance',
        careerGoals: careerGoals || 'Phát triển LUBPY STUDIO thành hệ sinh thái công nghệ hàng đầu'
      };
      onLoginSuccess(newUser);
      onClose();
    }, 900);
  };

  const isLogInMode = viewMode.startsWith('login');
  const isSignUpMode = viewMode.startsWith('signup');

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto" id="auth-modal-overlay">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 my-auto" id="auth-modal-card">
        {/* Top Accent Bar depending on active portal theme */}
        <div className={`absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r transition-all duration-500 ${
          viewMode.includes('client') 
            ? 'from-sky-500 via-cyan-400 to-blue-500' 
            : viewMode.includes('admin') 
            ? 'from-amber-500 via-rose-500 to-pink-500' 
            : 'from-indigo-500 via-purple-500 to-pink-500'
        }`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg bg-white/5 hover:bg-white/10 z-20"
          id="auth-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7 max-h-[85vh] overflow-y-auto pr-2" id="auth-modal-body">

          {/* ======================================================= */}
          {/* TOP PORTAL NAVIGATION SWITCHER (Strict 2-Portal Structure + Dedicated Admin Gateway) */}
          {/* ======================================================= */}
          <div className="mb-6 bg-slate-950/90 p-2 rounded-2xl border border-white/10 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-1.5">
              {isLogInMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setViewMode('login-internal'); setError(null); }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      viewMode === 'login-internal' 
                        ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{language === 'vi' ? '🏢 Cổng Cán Bộ Nghiệp Vụ' : '🏢 Staff Portal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setViewMode('login-client'); setError(null); }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      viewMode === 'login-client' 
                        ? 'bg-sky-600 text-white shadow-lg border border-sky-400' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-sky-300" />
                    <span>{language === 'vi' ? '👤 Cổng Khách Hàng & Học Viên' : '👤 Client Portal'}</span>
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between p-2.5 bg-sky-950/60 border border-sky-500/30 rounded-xl text-xs text-sky-200">
                  <div className="flex items-center gap-2 font-bold">
                    <UserIcon className="w-4 h-4 text-sky-400" />
                    <span>{language === 'vi' ? '📝 Đăng Ký Tài Khoản Khách Hàng / Học Viên' : '📝 Client & Student Registration'}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">Tài khoản Cán bộ do HR cấp trực tiếp</span>
                </div>
              )}
            </div>

            {/* Dedicated Secure Admin Portal Entry Strip */}
            {isLogInMode && (
              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {language === 'vi' ? 'Phân quyền quản trị tối cao:' : 'Super Admin Gate:'}
                </span>
                <button
                  type="button"
                  onClick={() => { 
                    setViewMode('login-admin'); 
                    setError(null); 
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    viewMode.includes('admin')
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>{language === 'vi' ? '🔑 Cổng Độc Quyền Super Admin' : '🔑 Super Admin Access'}</span>
                </button>
              </div>
            )}
          </div>

          {/* SAVED ACCOUNTS / QUICK LOGIN SELECTOR CARD */}
          {isLogInMode && savedAccounts.length > 0 && (
            <div className="mb-5 bg-gradient-to-r from-amber-950/40 via-slate-950 to-indigo-950/40 p-3.5 rounded-2xl border border-amber-500/30 shadow-xl space-y-2.5" id="saved-accounts-section">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span>⚡ Danh Sách Tài Khoản Đã Lưu Trên Thiết Bị</span>
                      <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] rounded-full border border-amber-500/30 font-mono">
                        {savedAccounts.length}
                      </span>
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Nhấp vào tài khoản bên dưới để tự động điền thông tin đăng nhập 1-chạm
                    </p>
                  </div>
                </div>
              </div>

              {autoFilledMsg && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold rounded-xl animate-fadeIn flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{autoFilledMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {savedAccounts.map((acc, idx) => {
                  const isSelected = selectedSavedEmail === acc.email || email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <div
                      key={`${acc.id || acc.email}_${idx}`}
                      onClick={() => handleSelectSavedAccount(acc)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                        isSelected
                          ? 'bg-amber-900/40 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                          : 'bg-slate-900/90 border-white/10 hover:border-amber-500/40 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow">
                          {acc.photoUrl ? (
                            <img src={acc.photoUrl} alt={acc.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate flex items-center gap-1">
                            <span className="truncate">{acc.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono truncate">{acc.email}</div>
                          <div className="text-[9px] uppercase font-mono tracking-wider text-amber-400/90 truncate mt-0.5">
                            {acc.role === 'admin' ? '👑 Super Admin' : (acc.departmentTitle || acc.role)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {acc.savedPassword && (
                          <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] border border-emerald-500/20 font-mono" title="Đã lưu mật khẩu">
                            🔑
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedAccount(e, acc.email)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Xóa tài khoản này khỏi danh sách lưu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ======================================================= */}
          {/* PAGE 1: ĐĂNG KÝ CÁN BỘ & NGHIỆP VỤ NỘI BỘ (MULTI-STEP) */}
          {/* ======================================================= */}
          {viewMode === 'signup-internal' && (
            <div className="space-y-4 animate-fadeIn" id="page-signup-internal">
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/40 rounded-2xl shadow-xl text-center">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full inline-block mb-1.5">
                  {language === 'vi' ? '🏢 LUBPY STUDIO • CỔNG CÁN BỘ & QUẢN LÝ NỘI BỘ' : '🏢 LUBPY INTERNAL PERSONNEL PORTAL'}
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase bg-gradient-to-r from-white via-indigo-200 to-pink-300 bg-clip-text text-transparent">
                  {language === 'vi' ? '📝 ĐĂNG KÝ TÀI KHOẢN CÁN BỘ NGHIỆP VỤ' : '📝 INTERNAL STAFF REGISTRATION'}
                </h2>
              </div>

              {/* Admin Security Enforcement Notice */}
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2 shadow.md">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-amber-300 font-bold block mb-0.5">🔒 QUY ĐỊNH BẢO MẬT & PHÂN QUYỀN TRUNG TÂM:</strong>
                  Chỉ Super Admin mới có quyền tự tạo, cập nhật thông tin tài khoản và thực hiện bổ nhiệm các Trưởng phòng Đội ngũ Kỹ thuật. Việc giới hạn này nhằm ngăn chặn các đối tượng lạ tự ý đăng ký tạo tài khoản cán bộ trái phép.
                </p>
              </div>

              {/* Progress Stepper Bar */}
              <div className="flex items-center justify-between mb-4 px-2 sm:px-8 bg-slate-950/60 p-3 rounded-xl border border-indigo-500/20">
                <div className={`flex flex-col items-center gap-1 ${signUpStep >= 1 ? 'text-indigo-400 font-extrabold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                    signUpStep === 1 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400/50' 
                      : signUpStep > 1 
                      ? 'bg-emerald-600 border-emerald-400 text-white' 
                      : 'bg-slate-800 border-slate-700 text-gray-400'
                  }`}>
                    {signUpStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-[10px] text-center font-bold">{language === 'vi' ? '1. Định Danh' : '1. Identity'}</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${signUpStep >= 2 ? 'bg-indigo-500' : 'bg-slate-800'}`} />

                <div className={`flex flex-col items-center gap-1 ${signUpStep >= 2 ? 'text-indigo-400 font-extrabold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                    signUpStep === 2 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400/50' 
                      : signUpStep > 2 
                      ? 'bg-emerald-600 border-emerald-400 text-white' 
                      : 'bg-slate-800 border-slate-700 text-gray-400'
                  }`}>
                    {signUpStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="text-[10px] text-center font-bold">{language === 'vi' ? '2. Hồ Sơ' : '2. Profile'}</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${signUpStep >= 3 ? 'bg-indigo-500' : 'bg-slate-800'}`} />

                <div className={`flex flex-col items-center gap-1 ${signUpStep >= 3 ? 'text-indigo-400 font-extrabold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                    signUpStep === 3 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400/50' 
                      : 'bg-slate-800 border-slate-700 text-gray-400'
                  }`}>
                    3
                  </div>
                  <span className="text-[10px] text-center font-bold">{language === 'vi' ? '3. Bảo Mật' : '3. Security'}</span>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSignUpAdminSubmit} className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/30">

                {/* STEP 1: BASIC IDENTITY INFO */}
                {signUpStep === 1 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-indigo-400" />
                      <span>Bước 1: Thông tin cá nhân &amp; Định danh email doanh nghiệp:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Họ và tên cán bộ *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={fullName}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setFullName(newName);
                            const autoEmail = normalizeNameToEmail(newName);
                            if (autoEmail) {
                              setEmail(autoEmail);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Ngày tháng năm sinh *</label>
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Quê quán / Nơi ở hiện tại *</label>
                        <input
                          type="text"
                          required
                          placeholder="Hà Nội / TP. Hồ Chí Minh / Đà Nẵng..."
                          value={hometown}
                          onChange={(e) => setHometown(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Số điện thoại liên hệ *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0912 345 678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-gray-300 block">Email doanh nghiệp (@lubpystudio.vn) *</label>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">⚡ @lubpystudio.vn</span>
                        </div>
                        <input
                          type="email"
                          required
                          placeholder="nguyenvana@lubpystudio.vn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-[10px] text-indigo-300/80 mt-1 block">Yêu cầu sử dụng email chính thức có đuôi @lubpystudio.vn</span>
                        {fullName.trim() && (
                          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                            ✓ Email chuẩn hóa tự động: <strong className="text-white font-bold">{email || normalizeNameToEmail(fullName)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: IN-DEPTH PROFILE INFO */}
                {signUpStep === 2 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      <span>Bước 2: Phòng ban nghiệp vụ, vị trí &amp; Hồ sơ năng lực:</span>
                    </div>

                    {/* Department Role Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300 block">Chọn Bộ Phận Đăng Ký:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('tech')}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedRole === 'tech' ? 'bg-indigo-900/80 border-indigo-400 text-white' : 'bg-slate-900 border-white/10 text-gray-400'
                          }`}
                        >
                          <div className="text-xs font-bold">Tech Engineering</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('cs')}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedRole === 'cs' ? 'bg-emerald-900/80 border-emerald-400 text-white' : 'bg-slate-900 border-white/10 text-gray-400'
                          }`}
                        >
                          <div className="text-xs font-bold">Customer Support</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('hr')}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedRole === 'hr' ? 'bg-purple-900/80 border-purple-400 text-white' : 'bg-slate-900 border-white/10 text-gray-400'
                          }`}
                        >
                          <div className="text-xs font-bold">Human Resources</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('accounting')}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedRole === 'accounting' ? 'bg-navy-900/80 border-blue-400 text-white' : 'bg-slate-900 border-white/10 text-gray-400'
                          }`}
                        >
                          <div className="text-xs font-bold">Accounting &amp; Finance</div>
                        </button>
                      </div>
                    </div>

                    {/* Level Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-300 block">Cấp bậc bổ nhiệm nghiệp vụ:</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => setIsDeptHead(true)}
                          className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                            isDeptHead ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          👑 Trưởng Nghiệp Vụ (Department Head)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDeptHead(false)}
                          className={`py-2 px-3 rounded-lg font-bold transition-all cursor-pointer text-center ${
                            !isDeptHead ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          👤 Thành Viên Đội Ngũ (Staff Member)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Kinh nghiệm làm việc thực tế *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Mô tả kinh nghiệm thực chiến trong lĩnh vực chuyên môn tương ứng..."
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Năng lực chuyên môn *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Mô tả kiến thức chuyên sâu, quy trình, công cụ thành thạo..."
                          value={competence}
                          onChange={(e) => setCompetence(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-300 block mb-1">Kỹ năng làm việc &amp; Công nghệ *</label>
                          <input
                            type="text"
                            required
                            placeholder="Kỹ năng mềm, phần mềm, công cụ..."
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-300 block mb-1">Định hướng mục tiêu nghề nghiệp *</label>
                          <input
                            type="text"
                            required
                            placeholder="Mục tiêu phát triển tại LUBPY..."
                            value={careerGoals}
                            onChange={(e) => setCareerGoals(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SECURITY & CONFIRMATION */}
                {signUpStep === 3 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>Bước 3: Thiết lập Mật Khẩu Nội Bộ &amp; Xác nhận bảo mật:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Mật khẩu khởi tạo *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Xác nhận mật khẩu *</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-white/10 rounded-xl space-y-2">
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-0"
                        />
                        <span>Tôi cam kết thông tin khai báo là hoàn toàn chính xác và tuân thủ quy chế bảo mật LUBPY STUDIO.</span>
                      </label>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-2 items-center bg-red-950/50 text-red-300 text-xs p-2.5 rounded-lg border border-red-500/30">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* STEPPER BUTTON CONTROLS */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  {signUpStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setSignUpStep((prev) => (prev - 1) as 1 | 2 | 3)}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-gray-300 font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>
                  ) : <div />}

                  {signUpStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStepInternal}
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                    >
                      <span>Tiếp tục (Bước {signUpStep + 1})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-3 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <span>📝 HOÀN TẤT ĐĂNG KÝ CÁN BỘ</span>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Page Footer Link */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setViewMode('login-internal'); setError(null); }}
                  className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                >
                  Đã có tài khoản? 👉 Đăng nhập
                </button>
              </div>
            </div>
          )}


          {/* ======================================================= */}
          {/* PAGE 2: ĐĂNG KÝ KHÁCH HÀNG & HỌC VIÊN (MULTI-STEP) */}
          {/* ======================================================= */}
          {viewMode === 'signup-client' && (
            <div className="space-y-4 animate-fadeIn" id="page-signup-client">
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-sky-950 via-blue-950 to-slate-950 border border-sky-500/40 rounded-2xl shadow-xl text-center">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full inline-block mb-1.5">
                  {language === 'vi' ? '👤 LUBPY STUDIO • CỔNG KHÁCH HÀNG & HỌC VIÊN' : '👤 LUBPY CLIENT & STUDENT PORTAL'}
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase bg-gradient-to-r from-sky-200 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  {language === 'vi' ? '📝 TRANG ĐĂNG KÝ KHÁCH HÀNG & HỌC VIÊN' : '📝 CLIENT & STUDENT REGISTRATION'}
                </h2>
              </div>

              {/* Quick Google Sign Up Card for Clients */}
              <div className="p-4 bg-gradient-to-r from-sky-950/90 via-blue-950/80 to-slate-950 border border-sky-400/40 rounded-2xl shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black text-sky-300 uppercase tracking-wide">
                      <GoogleIcon />
                      <span>🚀 Đăng Ký Nhanh Bằng Google (@gmail.com)</span>
                    </div>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {language === 'vi' 
                        ? 'Dành cho Khách hàng & Học viên. Xác thực tài khoản Google 1-chạm không mất thời gian điền form.' 
                        : '1-click Google authentication for Clients & Students.'
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignUpClient}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-200 shrink-0 hover:scale-[1.02] active:scale-95"
                  >
                    <GoogleIcon />
                    <span>{language === 'vi' ? 'Đăng ký bằng Google' : 'Sign Up with Google'}</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-sky-500/20"></div>
                <span className="flex-shrink mx-3 text-[10px] text-sky-300/80 font-bold uppercase tracking-widest">
                  {language === 'vi' ? 'HOẶC ĐĂNG KÝ FORM HỒ SƠ 3 BƯỚC' : 'OR REGISTER WITH FORM'}
                </span>
                <div className="flex-grow border-t border-sky-500/20"></div>
              </div>

              {/* Progress Stepper Bar */}
              <div className="flex items-center justify-between mb-4 px-2 sm:px-8 bg-slate-950/60 p-3 rounded-xl border border-sky-500/20">
                <div className={`flex flex-col items-center gap-1 ${signUpStep >= 1 ? 'text-sky-400 font-extrabold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                    signUpStep === 1 
                      ? 'bg-sky-600 border-sky-400 text-white shadow-lg ring-2 ring-sky-400/50' 
                      : signUpStep > 1 
                      ? 'bg-emerald-600 border-emerald-400 text-white' 
                      : 'bg-slate-800 border-slate-700 text-gray-400'
                  }`}>
                    {signUpStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-[10px] text-center font-bold">{language === 'vi' ? '1. Định Danh' : '1. Identity'}</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${signUpStep >= 2 ? 'bg-sky-500' : 'bg-slate-800'}`} />

                <div className={`flex flex-col items-center gap-1 ${signUpStep >= 2 ? 'text-sky-400 font-extrabold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                    signUpStep === 2 
                      ? 'bg-sky-600 border-sky-400 text-white shadow-lg ring-2 ring-sky-400/50' 
                      : signUpStep > 2 
                      ? 'bg-emerald-600 border-emerald-400 text-white' 
                      : 'bg-slate-800 border-slate-700 text-gray-400'
                  }`}>
                    {signUpStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="text-[10px] text-center font-bold">{language === 'vi' ? '2. Nhu Cầu' : '2. Profile'}</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${signUpStep >= 3 ? 'bg-sky-500' : 'bg-slate-800'}`} />

                <div className={`flex flex-col items-center gap-1 ${signUpStep >= 3 ? 'text-sky-400 font-extrabold' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                    signUpStep === 3 
                      ? 'bg-sky-600 border-sky-400 text-white shadow-lg ring-2 ring-sky-400/50' 
                      : 'bg-slate-800 border-slate-700 text-gray-400'
                  }`}>
                    3
                  </div>
                  <span className="text-[10px] text-center font-bold">{language === 'vi' ? '3. Bảo Mật' : '3. Security'}</span>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSignUpClientSubmit} className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-sky-500/30">

                {/* STEP 1: BASIC IDENTITY INFO */}
                {signUpStep === 1 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="text-xs font-extrabold text-sky-300 uppercase tracking-wider border-b border-sky-500/20 pb-1.5 flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-sky-400" />
                      <span>Bước 1: Thông tin liên hệ &amp; Email cá nhân:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Họ và tên *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Số điện thoại liên hệ *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0912 345 678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Ngày tháng năm sinh *</label>
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Quê quán / Địa chỉ hiện tại *</label>
                        <input
                          type="text"
                          required
                          placeholder="Hà Nội / TP. HCM..."
                          value={hometown}
                          onChange={(e) => setHometown(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-gray-300 block mb-1">Địa chỉ Email cá nhân (@gmail.com) *</label>
                        <input
                          type="email"
                          required
                          placeholder="khachhang@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROFILE & NEEDS */}
                {signUpStep === 2 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="text-xs font-extrabold text-sky-300 uppercase tracking-wider border-b border-sky-500/20 pb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-sky-400" />
                      <span>Bước 2: Nghề nghiệp, Đơn vị công tác &amp; Nhu cầu dịch vụ:</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Nghề nghiệp hiện tại *</label>
                        <input
                          type="text"
                          required
                          placeholder="Sinh viên CNTT / Kỹ sư phần mềm / Quản lý / Khác..."
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-300 block mb-1">Có đơn vị công tác / Công ty không? *</label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
                            <button
                              type="button"
                              onClick={() => setHasWorkUnit('Có')}
                              className={`py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                                hasWorkUnit === 'Có' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              🏢 Có đơn vị
                            </button>
                            <button
                              type="button"
                              onClick={() => setHasWorkUnit('Không')}
                              className={`py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                                hasWorkUnit === 'Không' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              👤 Cá nhân / Tự do
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-300 block mb-1">Dự án cho cá nhân hay nhóm? *</label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
                            <button
                              type="button"
                              onClick={() => setProjectScope('Cá nhân')}
                              className={`py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                                projectScope === 'Cá nhân' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              👤 Cá nhân
                            </button>
                            <button
                              type="button"
                              onClick={() => setProjectScope('Nhóm')}
                              className={`py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                                projectScope === 'Nhóm' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              👥 Nhóm / Đội ngũ
                            </button>
                          </div>
                        </div>
                      </div>

                      {hasWorkUnit === 'Có' && (
                        <div className="animate-fadeIn">
                          <label className="text-xs font-bold text-gray-300 block mb-1">Tên đơn vị công tác / Trường học *</label>
                          <input
                            type="text"
                            required
                            placeholder="Nhập tên Công ty / Trường học / Viện nghiên cứu..."
                            value={workUnitName}
                            onChange={(e) => setWorkUnitName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Nhu cầu sử dụng dịch vụ LUBPY *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Mô tả nhu cầu: Đồ án tốt nghiệp IT, Thiết kế Website/Mobile App, Thuê Server/VPS, Khóa học..."
                          value={serviceNeeds}
                          onChange={(e) => setServiceNeeds(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SECURITY & CONFIRMATION */}
                {signUpStep === 3 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="text-xs font-extrabold text-sky-300 uppercase tracking-wider border-b border-sky-500/20 pb-1.5 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-sky-400" />
                      <span>Bước 3: Mật khẩu bảo mật &amp; Xác nhận tạo tài khoản:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Mật khẩu khởi tạo *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">Xác nhận mật khẩu *</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-white/10 rounded-xl">
                      <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-0"
                        />
                        <span>Tôi đồng ý với Điều khoản dịch vụ &amp; Chính sách bảo mật dữ liệu của LUBPY STUDIO.</span>
                      </label>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-2 items-center bg-red-950/50 text-red-300 text-xs p-2.5 rounded-lg border border-red-500/30">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* STEPPER BUTTON CONTROLS */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  {signUpStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setSignUpStep((prev) => (prev - 1) as 1 | 2 | 3)}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-gray-300 font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại</span>
                    </button>
                  ) : <div />}

                  {signUpStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNextStepClient}
                      className="py-2.5 px-5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-600/30"
                    >
                      <span>Tiếp tục (Bước {signUpStep + 1})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-3 px-6 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-sky-500/30"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <span>📝 HOÀN TẤT ĐĂNG KÝ KHÁCH HÀNG</span>
                      )}
                    </button>
                  )}
                </div>
              </form>

              {/* Page Footer Link */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setViewMode('login-client'); setError(null); }}
                  className="text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer"
                >
                  Đã có tài khoản? 👉 Đăng nhập
                </button>
              </div>
            </div>
          )}


          {/* ======================================================= */}
          {/* PAGE 3: ĐĂNG NHẬP CÁN BỘ & NGHIỆP VỤ NỘI BỘ */}
          {/* ======================================================= */}
          {viewMode === 'login-internal' && (
            <div className="space-y-4 animate-fadeIn" id="page-login-internal">
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/40 rounded-2xl shadow-xl text-center">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full inline-block mb-1.5">
                  {language === 'vi' ? '🏢 LUBPY STUDIO • CỔNG TÀI KHOẢN CÁN BỘ' : '🏢 LUBPY INTERNAL PERSONNEL PORTAL'}
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase bg-gradient-to-r from-white via-indigo-200 to-pink-300 bg-clip-text text-transparent">
                  {language === 'vi' ? '🔑 TRANG ĐĂNG NHẬP CÁN BỘ & QUẢN LÝ' : '🔑 INTERNAL STAFF LOG IN'}
                </h2>
                <p className="text-xs text-indigo-200/80 mt-1">
                  {language === 'vi' 
                    ? 'Chọn bộ phận chuyên môn & đăng nhập bằng Email doanh nghiệp @lubpystudio.vn' 
                    : 'Select department role and sign in with corporate email @lubpystudio.vn'
                  }
                </p>
              </div>

              {/* Department Role Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-indigo-300 block uppercase tracking-wider">
                  {language === 'vi' ? 'Chọn Bộ Phận Cán Bộ Đăng Nhập:' : 'Select Staff Department:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectInternalRole('tech')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      selectedRole === 'tech' 
                        ? 'bg-emerald-900/60 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-400/50' 
                        : 'bg-slate-950/60 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Tech Developer</div>
                      <div className="text-[10px] opacity-75 truncate">Kỹ Thuật</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectInternalRole('cs')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      selectedRole === 'cs' 
                        ? 'bg-amber-900/60 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50' 
                        : 'bg-slate-950/60 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">CS Support</div>
                      <div className="text-[10px] opacity-75 truncate">Chăm Sóc KH</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectInternalRole('hr')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      selectedRole === 'hr' 
                        ? 'bg-indigo-900/60 border-indigo-400 text-white shadow-lg ring-1 ring-indigo-400/50' 
                        : 'bg-slate-950/60 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">HR Manager</div>
                      <div className="text-[10px] opacity-75 truncate">Nhân Sự</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectInternalRole('accounting')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      selectedRole === 'accounting' 
                        ? 'bg-purple-900/60 border-purple-400 text-white shadow-lg ring-1 ring-purple-400/50' 
                        : 'bg-slate-950/60 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Accounting</div>
                      <div className="text-[10px] opacity-75 truncate">Kế Toán</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogInInternalSubmit} className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/30">
                {/* Level Toggle: Trưởng Nghiệp Vụ vs Thành Viên */}
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Cấp bậc truy cập hệ thống:</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectInternalLevel(true)}
                      className={`py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                        isDeptHead ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      👑 Trưởng Nghiệp Vụ (Head)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectInternalLevel(false)}
                      className={`py-2 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                        !isDeptHead ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      👤 Thành Viên Đội Ngũ (Staff)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Họ và tên hiển thị *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên cán bộ..."
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Email doanh nghiệp (@lubpystudio.vn) *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@lubpystudio.vn"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Mật khẩu nội bộ *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-indigo-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-300 bg-slate-900/70 p-2.5 rounded-xl border border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberAccount}
                      onChange={(e) => setRememberAccount(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-800 text-indigo-500 focus:ring-0 cursor-pointer"
                    />
                    <span>💾 Lưu tài khoản &amp; mật khẩu cho các lần đăng nhập sau</span>
                  </label>
                </div>

                {error && (
                  <div className="flex gap-2 items-center bg-red-950/50 text-red-300 text-xs p-2.5 rounded-lg border border-red-500/30">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>🔑 ĐĂNG NHẬP CÁN BỘ HỆ THỐNG</span>
                    </>
                  )}
                </button>
              </form>

              {/* Page Footer Note */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300/80">
                <span>🔒 Tài khoản Cán bộ Nghiệp vụ do Ban Quản Trị / HR trực tiếp cấp thông qua luồng Provisioning.</span>
              </div>
            </div>
          )}


          {/* ======================================================= */}
          {/* PAGE 4: ĐĂNG NHẬP KHÁCH HÀNG & HỌC VIÊN (3 PHƯƠNG THỨC & ONBOARDING) */}
          {/* ======================================================= */}
          {viewMode === 'login-client' && (
            <div className="space-y-4 animate-fadeIn" id="page-login-client">
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-sky-950 via-blue-950 to-slate-950 border border-sky-500/40 rounded-2xl shadow-xl text-center relative overflow-hidden">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full inline-block mb-1.5">
                  {language === 'vi' ? '👤 LUBPY STUDIO • CỔNG KHÁCH HÀNG & HỌC VIÊN' : '👤 LUBPY CLIENT & STUDENT PORTAL'}
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase bg-gradient-to-r from-sky-200 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  {language === 'vi' ? '🔑 XÁC THỰC & ĐĂNG NHẬP KHÁCH HÀNG' : '🔑 CLIENT AUTHENTICATION & LOGIN'}
                </h2>
              </div>

              {/* Stepper Progress Bar */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-sky-500/30 text-[11px] font-extrabold text-center">
                <div className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authStep === 'LOGIN' ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-900 text-sky-400/70'
                }`}>
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">1</span>
                  <span>1. Phương Thức</span>
                </div>

                <div className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authStep === 'OTP' ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-900 text-sky-400/70'
                }`}>
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">2</span>
                  <span>2. Mã OTP 6 Số</span>
                </div>

                <div className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authStep === 'ONBOARDING' ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-900 text-sky-400/70'
                }`}>
                  <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">3</span>
                  <span>3. Hồ Sơ (Onboarding)</span>
                </div>
              </div>

              {/* BƯỚC 1: CHỌN 1 TRONG 3 PHƯƠNG THỨC ĐĂNG NHẬP */}
              {authStep === 'LOGIN' && (
                <div className="p-4 bg-slate-950/90 border border-sky-500/30 rounded-2xl space-y-4">
                  <div className="text-xs font-bold text-sky-300 uppercase tracking-wider text-center">
                    {language === 'vi' ? 'Phương thức đăng nhập xác thực:' : 'Choose Authentication Method:'}
                  </div>

                  {/* Tab selector buttons for 4 authentication methods */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setClientAuthMethod('password_login'); setError(null); }}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        clientAuthMethod === 'password_login' 
                          ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-1 ring-sky-400/50' 
                          : 'bg-slate-900 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-sky-300" />
                      <span>Mật Khẩu Tạo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setClientAuthMethod('google'); setError(null); }}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        clientAuthMethod === 'google' 
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md' 
                          : 'bg-slate-900 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <GoogleIcon />
                      <span>Google (@gmail)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setClientAuthMethod('email_otp'); setError(null); }}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        clientAuthMethod === 'email_otp' 
                          ? 'bg-sky-600 text-white border-sky-400 shadow-md' 
                          : 'bg-slate-900 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Mail className="w-4 h-4 text-sky-300" />
                      <span>Email + OTP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setClientAuthMethod('phone_otp'); setError(null); }}
                      className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        clientAuthMethod === 'phone_otp' 
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md' 
                          : 'bg-slate-900 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-cyan-300" />
                      <span>SĐT + OTP</span>
                    </button>
                  </div>

                  {/* FORM INTERFACES BY AUTH METHOD */}
                  {/* METHOD 0: PASSWORD LOGIN (EMAIL + HỌ TÊN + MẬT KHẨU TỰ TẠO) */}
                  {clientAuthMethod === 'password_login' && (
                    <form onSubmit={handleLogInClientSubmit} className="space-y-3 pt-1">
                      {registeredSuccessMsg && (
                        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 font-semibold leading-relaxed animate-fadeIn">
                          {registeredSuccessMsg}
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Địa chỉ Email cá nhân (@gmail.com) *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="khachhang@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Họ và tên khách hàng *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Mật khẩu đã tự tạo khi đăng ký *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-300 bg-slate-900/70 p-2.5 rounded-xl border border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                          <input
                            type="checkbox"
                            checked={rememberAccount}
                            onChange={(e) => setRememberAccount(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-0 cursor-pointer"
                          />
                          <span>💾 Ghi nhớ email, họ tên &amp; mật khẩu</span>
                        </label>
                      </div>

                      {error && (
                        <div className="flex gap-2 items-center bg-red-950/80 text-red-200 text-xs p-3 rounded-xl border border-red-500/50">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-sky-500/30"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <span>🔑 ĐĂNG NHẬP BẰNG MẬT KHẨU KHÁCH HÀNG</span>
                        )}
                      </button>
                    </form>
                  )}

                  {/* FORM INTERFACES BY AUTH METHOD */}
                  {/* METHOD 1: GOOGLE SIGN-IN */}
                  {clientAuthMethod === 'google' && (
                    <form onSubmit={handleGoogleClientSignIn} className="space-y-3 pt-1">
                      <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[11px] text-blue-200 leading-relaxed">
                        ⚠️ <strong>Chặn email tổ chức:</strong> Hệ thống chỉ hỗ trợ đăng nhập bằng tài khoản Google cá nhân (<code className="bg-blue-900/60 px-1 py-0.5 rounded text-blue-300 font-mono">@gmail.com</code>). Email doanh nghiệp / trường học sẽ bị chặn tự động.
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Email Google Cá Nhân (@gmail.com) *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="khachhang@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Họ và tên hiển thị (Có thể tùy chỉnh lại ở bước Hồ Sơ)
                        </label>
                        <input
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {error && (
                        <div className="flex gap-2 items-center bg-red-950/80 text-red-200 text-xs p-3 rounded-xl border border-red-500/50">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        <GoogleIcon />
                        <span>🚀 ĐĂNG NHẬP GOOGLE CÁ NHÂN</span>
                      </button>
                    </form>
                  )}

                  {/* METHOD 2: EMAIL + OTP 6 SỐ */}
                  {clientAuthMethod === 'email_otp' && (
                    <div className="space-y-3 pt-1">
                      <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl text-[11px] text-sky-200 leading-relaxed">
                        📩 Hệ thống sẽ gửi mã OTP 6 số xác thực về hộp thư Gmail của bạn.
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Địa chỉ Gmail nhận mã OTP 6 số *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="nguyenvana@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {error && (
                        <div className="flex gap-2 items-center bg-red-950/80 text-red-200 text-xs p-3 rounded-xl border border-red-500/50">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSendOtpClient('email_otp')}
                        className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Send className="w-4 h-4" />
                        <span>📩 GỬI MÃ OTP 6 SỐ VỀ GMAIL</span>
                      </button>
                    </div>
                  )}

                  {/* METHOD 3: SỐ ĐIỆN THOẠI + SMS OTP */}
                  {clientAuthMethod === 'phone_otp' && (
                    <div className="space-y-3 pt-1">
                      <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-200 leading-relaxed">
                        📱 Tin nhắn SMS chứa mã OTP 6 số sẽ được gửi về số điện thoại cá nhân.
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Số điện thoại nhận tin nhắn SMS OTP *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0987654321"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      {error && (
                        <div className="flex gap-2 items-center bg-red-950/80 text-red-200 text-xs p-3 rounded-xl border border-red-500/50">
                          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSendOtpClient('phone_otp')}
                        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>📱 GỬI MÃ SMS OTP 6 SỐ</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* BƯỚC 2: NHẬP VÀ XÁC THỰC MÃ OTP 6 SỐ */}
              {authStep === 'OTP' && (
                <div className="p-5 bg-slate-950/90 border border-sky-500/40 rounded-2xl space-y-4">
                  {otpNotice && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{otpNotice}</span>
                    </div>
                  )}

                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-white">NHẬP MÃ XÁC THỰC OTP 6 CHỮ SỐ</h3>
                    <p className="text-xs text-gray-400">Vui lòng nhập 6 ô mã số OTP vừa được hệ thống gửi</p>
                  </div>

                  {/* 6 OTP Input Boxes */}
                  <form onSubmit={handleVerifyOtpClient} className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      {otpInput.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-10 h-12 text-center text-lg font-black font-mono bg-slate-900 border border-sky-500/40 text-sky-300 rounded-xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none"
                        />
                      ))}
                    </div>

                    {error && (
                      <div className="flex gap-2 items-center bg-red-950/80 text-red-200 text-xs p-3 rounded-xl border border-red-500/50">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <button
                        type="button"
                        onClick={() => { setAuthStep('LOGIN'); setError(null); }}
                        className="text-sky-400 hover:underline cursor-pointer"
                      >
                        ⬅️ Chọn lại phương thức
                      </button>

                      <button
                        type="button"
                        disabled={otpResendCountdown > 0}
                        onClick={() => handleSendOtpClient(clientAuthMethod === 'phone_otp' ? 'phone_otp' : 'email_otp')}
                        className={`text-xs ${otpResendCountdown > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-sky-400 hover:underline cursor-pointer'}`}
                      >
                        {otpResendCountdown > 0 ? `Gửi lại mã (${otpResendCountdown}s)` : '🔄 Gửi lại mã OTP'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>XÁC THỰC MÃ OTP &amp; ĐI TẾP</span>
                    </button>
                  </form>
                </div>
              )}

              {/* BƯỚC 3: MÀN HÌNH THU THẬP THÔNG TIN KHÁCH HÀNG (ONBOARDING STEP) */}
              {authStep === 'ONBOARDING' && (
                <div className="p-5 bg-slate-950/90 border border-sky-500/50 rounded-2xl space-y-4 shadow-2xl">
                  <div className="p-3 bg-gradient-to-r from-sky-950 to-blue-950 border border-sky-400/30 rounded-xl text-center">
                    <h3 className="text-sm font-black text-white uppercase text-sky-200">
                      📋 BƯỚC 3: THU THẬP THÔNG TIN KHÁCH HÀNG (ONBOARDING)
                    </h3>
                    <p className="text-[11px] text-sky-300/80 mt-0.5">
                      Hoàn tất 4 thông tin bắt buộc dưới đây để khởi tạo trang tổng quan Client Dashboard
                    </p>
                  </div>

                  <form onSubmit={handleSaveOnboardingClient} className="space-y-3">
                    {/* 1. Họ và tên */}
                    <div>
                      <label className="text-xs font-bold text-sky-300 block mb-1">
                        1. Họ và tên đầy đủ *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-sky-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    {/* 2. Ngày tháng năm sinh */}
                    <div>
                      <label className="text-xs font-bold text-sky-300 block mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        2. Ngày tháng năm sinh *
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-sky-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    {/* 3. Nghề nghiệp */}
                    <div>
                      <label className="text-xs font-bold text-sky-300 block mb-1">
                        3. Nghề nghiệp hiện tại *
                      </label>
                      <select
                        required
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-sky-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                      >
                        <option value="">-- Chọn Nghề nghiệp --</option>
                        <option value="Sinh viên">Sinh viên / Học sinh</option>
                        <option value="Lập trình viên">Lập trình viên / Developer</option>
                        <option value="Quản lý dự án">Quản lý / Product Owner / PM</option>
                        <option value="Freelancer">Freelancer / Tự do</option>
                        <option value="Nghiên cứu sinh">Nghiên cứu sinh / Giảng viên</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    {/* 4. Môi trường làm việc */}
                    <div>
                      <label className="text-xs font-bold text-sky-300 block mb-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-sky-400" />
                        4. Môi trường làm việc *
                      </label>
                      <select
                        required
                        value={workEnvironment}
                        onChange={(e) => setWorkEnvironment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-sky-500/30 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400 cursor-pointer"
                      >
                        <option value="Trường học">Trường học / Đại học / Đào tạo</option>
                        <option value="Doanh nghiệp">Doanh nghiệp / Công ty IT</option>
                        <option value="Freelance">Freelance / Tự do</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-300 bg-slate-900/70 p-2.5 rounded-xl border border-white/10">
                      <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                        <input
                          type="checkbox"
                          checked={rememberAccount}
                          onChange={(e) => setRememberAccount(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-slate-800 text-sky-500 focus:ring-0 cursor-pointer"
                        />
                        <span>💾 Lưu tài khoản cho các lần đăng nhập sau</span>
                      </label>
                    </div>

                    {error && (
                      <div className="flex gap-2 items-center bg-red-950/80 text-red-200 text-xs p-3 rounded-xl border border-red-500/50">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>LƯU &amp; TIẾP TỤC (CHUYỂN SANG DASHBOARD)</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}


          {/* ======================================================= */}
          {/* PAGE 5: ĐĂNG NHẬP SUPER ADMIN ĐỘC QUYỀN */}
          {/* ======================================================= */}
          {viewMode === 'login-admin' && (
            <div className="space-y-4 animate-fadeIn" id="page-login-admin">
              {/* Header Banner */}
              <div className="p-4 bg-gradient-to-r from-rose-950 via-red-950 to-slate-950 border border-rose-500/50 rounded-2xl shadow-2xl text-center relative overflow-hidden">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full inline-flex items-center gap-1 mb-1.5">
                  <ShieldCheck className="w-3 h-3 text-rose-400" />
                  <span>👑 CỔNG ĐỘC QUYỀN SUPER ADMIN</span>
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase bg-gradient-to-r from-rose-200 via-amber-200 to-pink-300 bg-clip-text text-transparent">
                  {language === 'vi' ? '🔑 ĐĂNG NHẬP QUẢN TRỊ VIÊN TỐI CAO (SUPER ADMIN)' : '🔑 SUPER ADMIN LOGIN'}
                </h2>
              </div>

              {/* Form */}
              <form onSubmit={handleLogInAdminSubmit} className="space-y-4 bg-slate-950/90 p-5 rounded-2xl border border-rose-500/40 shadow-xl">
                <div>
                  <label className="text-xs font-bold text-rose-300 block mb-1">Email Super Admin (@lubpystudio.vn) *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="superadmin@lubpystudio.vn"
                    className="w-full px-3 py-2 bg-slate-900 border border-rose-500/30 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-rose-300 block mb-1">Mật khẩu quản trị tối cao *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu bảo vệ"
                      className="w-full px-3 py-2 pr-10 bg-slate-900 border border-rose-500/30 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-rose-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-300 block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      Mã xác thực độc quyền Admin Security Key *
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminKey ? 'text' : 'password'}
                      required
                      value={adminSecurityKey}
                      onChange={(e) => setAdminSecurityKey(e.target.value)}
                      placeholder="ADMIN_SUPER_KEY_2026"
                      className="w-full px-3 py-2 pr-10 bg-slate-900 border border-amber-500/40 rounded-lg text-xs text-amber-200 font-mono tracking-widest focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminKey(!showAdminKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showAdminKey ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">Mã bảo mật kích hoạt demo: <code className="text-amber-300 font-mono bg-black/40 px-1 py-0.5 rounded">ADMIN_SUPER_KEY_2026</code></span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-300 bg-slate-900/70 p-2.5 rounded-xl border border-white/10">
                  <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={rememberAccount}
                      onChange={(e) => setRememberAccount(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span>💾 Lưu tài khoản Super Admin &amp; Mật khẩu trên thiết bị</span>
                  </label>
                </div>

                {error && (
                  <div className="flex gap-2 items-center bg-red-950/80 text-red-200 text-xs p-3 rounded-xl border border-red-500/50">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-rose-950/50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Crown className="w-4 h-4 text-amber-300" />
                      <span>👑 ĐĂNG NHẬP SUPER ADMIN</span>
                    </>
                  )}
                </button>
              </form>

              {/* Page Footer Note */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-amber-300/80">
                <span>🛡️ Cổng Quản Trị Tối Cao. Hệ thống kiểm soát bảo mật đa tầng.</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
