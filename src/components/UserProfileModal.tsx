import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { saveUserSession } from '../utils/session';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  User as UserIcon, X, Camera, Upload, Lock, Phone, Calendar, CheckCircle2, AlertCircle, Eye, EyeOff, Save, Sparkles, Shield
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onTriggerToast?: (msg: string) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onTriggerToast
}: UserProfileModalProps) {
  const [name, setName] = useState(user.name || '');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [dob, setDob] = useState(user.dob || '');
  
  // Password state
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setName(user.name || '');
    setPhotoUrl(user.photoUrl || '');
    setPhone(user.phone || '');
    setDob(user.dob || '');
    setChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  }, [user, isOpen]);

  // Handle local image file upload converting & compressing to small base64 JPEG
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Dung lượng ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 256, 256, 0.75);
        if (compressed) {
          setPhotoUrl(compressed);
          setErrorMsg('');
        }
      } catch (err) {
        console.error('Failed to compress avatar:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Họ và Tên!');
      return;
    }

    if (changePassword) {
      if (!newPassword || newPassword.length < 6) {
        setErrorMsg('Mật khẩu mới phải chứa ít nhất 6 ký tự!');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Mật khẩu mới và Nhập lại mật khẩu không trùng khớp!');
        return;
      }
      if (user.password && currentPassword && user.password !== currentPassword) {
        setErrorMsg('Mật khẩu hiện tại không chính xác!');
        return;
      }
    }

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      photoUrl: photoUrl || user.photoUrl,
      phone: phone.trim(),
      dob: dob,
      password: changePassword ? newPassword : user.password
    };

    // 1. Update session storage
    saveUserSession(updatedUser);

    // 2. Update localStorage master users table
    try {
      const userEmailLower = (updatedUser?.email || '').toLowerCase().trim();
      const savedUsers = localStorage.getItem('lubpy_users');
      if (savedUsers) {
        const usersList: User[] = JSON.parse(savedUsers);
        if (Array.isArray(usersList)) {
          const updatedList = usersList.map(u => 
            u && u.email && u.email.toLowerCase().trim() === userEmailLower ? { ...u, ...updatedUser } : u
          );
          localStorage.setItem('lubpy_users', JSON.stringify(updatedList));
        }
      }

      // 3. Update Org heads/members if present
      const savedHeads = localStorage.getItem('fintrixity_org_heads');
      if (savedHeads) {
        const headsObj = JSON.parse(savedHeads);
        let updatedHead = false;
        if (headsObj && typeof headsObj === 'object') {
          for (const k of Object.keys(headsObj)) {
            if (headsObj[k]?.email && headsObj[k].email.toLowerCase().trim() === userEmailLower) {
              headsObj[k] = { ...headsObj[k], ...updatedUser };
              updatedHead = true;
            }
          }
          if (updatedHead) {
            localStorage.setItem('fintrixity_org_heads', JSON.stringify(headsObj));
          }
        }
      }

      const savedMembers = localStorage.getItem('fintrixity_org_members');
      if (savedMembers) {
        const membersList: User[] = JSON.parse(savedMembers);
        if (Array.isArray(membersList)) {
          const updatedMembers = membersList.map(m =>
            m && m.email && m.email.toLowerCase().trim() === userEmailLower ? { ...m, ...updatedUser } : m
          );
          localStorage.setItem('fintrixity_org_members', JSON.stringify(updatedMembers));
        }
      }

      // 4. Update HR developers list if present
      const savedHRDevs = localStorage.getItem('lubpy_hr_developers');
      if (savedHRDevs) {
        const hrDevs = JSON.parse(savedHRDevs);
        if (Array.isArray(hrDevs)) {
          const updatedHRDevs = hrDevs.map((d: any) => 
            d && d.email && d.email.toLowerCase().trim() === userEmailLower 
              ? { ...d, name: updatedUser.name, phone: updatedUser.phone, photoUrl: updatedUser.photoUrl, dob: updatedUser.dob }
              : d
          );
          localStorage.setItem('lubpy_hr_developers', JSON.stringify(updatedHRDevs));
        }
      }

    } catch (e) {
      console.error('Error syncing profile update:', e);
    }

    // Call parent handler
    onUpdateUser(updatedUser);

    if (onTriggerToast) {
      onTriggerToast('🎉 Cập nhật hồ sơ cá nhân thành công!');
    } else {
      setSuccessMsg('🎉 Cập nhật thông tin hồ sơ thành công!');
    }

    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Cập Nhật Hồ Sơ Cá Nhân</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                  LUBPY PROFILE
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Chỉnh sửa ảnh đại diện, họ tên, ngày sinh, số điện thoại &amp; mật khẩu
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {errorMsg && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Avatar Photo Section */}
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-3">
            <label className="block text-xs font-black uppercase text-gray-300 tracking-wider">
              1. Ảnh Đại Diện (Avatar Photo)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <img 
                  src={photoUrl || user.photoUrl} 
                  alt="Avatar Preview" 
                  className="w-20 h-20 rounded-full border-2 border-sky-400/50 object-cover bg-slate-900 shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <label 
                  htmlFor="avatar-file-input"
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  title="Chọn ảnh từ thiết bị"
                >
                  <Camera className="w-6 h-6" />
                </label>
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="avatar-file-input"
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow active:scale-95 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy...</span>
                  </label>
                  <input 
                    id="avatar-file-input"
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-[10px] text-gray-500 font-mono">Tối đa 5MB (.jpg, .png)</span>
                </div>

                <div className="pt-1">
                  <input 
                    type="url"
                    value={photoUrl.startsWith('data:') ? '' : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Hoặc dán đường dẫn ảnh HTTPS vào đây..."
                    className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3 py-1.5 rounded-xl focus:border-sky-400 font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">Bấm "Tải ảnh từ máy..." để tải ảnh từ thiết bị của bạn.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Information Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Họ và Tên <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Số Điện Thoại</span>
                </label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0987654321..."
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ngày Tháng Năm Sinh</span>
                </label>
                <input 
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:border-sky-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Email (Không thể thay đổi)
                </label>
                <input 
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-950/40 border border-white/5 text-xs text-gray-500 px-3.5 py-2.5 rounded-xl font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* 3. Password Section Toggle */}
          <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-gray-300 tracking-wider flex items-center gap-2 cursor-pointer">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Đổi Mật Khẩu Đăng Nhập</span>
              </label>

              <input 
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            {changePassword && (
              <div className="space-y-3 pt-2 border-t border-white/5 animate-slideDown">
                {user.password && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                      Mật Khẩu Hiện Tại:
                    </label>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại..."
                      className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3.5 py-2 rounded-xl focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                      Mật Khẩu Mới (Tối thiểu 6 ký tự):
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mật khẩu mới..."
                        className="w-full bg-slate-900 border border-white/10 text-xs text-white pl-3.5 pr-8 py-2 rounded-xl focus:border-amber-400"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                      Nhập Lại Mật Khẩu Mới:
                    </label>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      className="w-full bg-slate-900 border border-white/10 text-xs text-white px-3.5 py-2 rounded-xl focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thông Tin</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
