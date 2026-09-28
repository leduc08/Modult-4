import React, { useState } from 'react';
import { Mail, Smartphone, ShieldCheck, ShieldAlert, CheckCircle2, Pencil, Plus, X, KeyRound } from 'lucide-react';
import { AuthMethod, AuthUser } from '../types';
import {
  EMAIL_REGEX,
  formatPhone,
  isValidPhone,
  markVerified,
  updateContact,
  linkGoogle,
  unlinkGoogle,
  setPassword,
  validatePassword
} from '../services/authService';
import { FieldError, OtpVerifier, PasswordField, PhoneField, inputClass } from './AuthFields';
import { GoogleLogo, GoogleSignInButton, signOutGoogle } from './GoogleSignInButton';

// Thông tin liên hệ + xác minh kênh khôi phục (Gmail / SĐT) + liên kết Google + mật khẩu

interface AccountSecurityProps {
  user: AuthUser;
  onUpdate: (user: AuthUser) => void;
}

type RowMode = 'view' | 'edit' | 'verify';

export const AccountSecurity: React.FC<AccountSecurityProps> = ({ user, onUpdate }) => {
  const hasRecovery = (user.email && user.emailVerified) || (user.phone && user.phoneVerified);

  return (
    <div className="space-y-3">
      <div
        className={`p-3 rounded-2xl border text-[11px] flex items-start gap-2 ${
          hasRecovery ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}
      >
        {hasRecovery ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
        <span>
          {hasRecovery
            ? 'Tài khoản đã được bảo vệ — bạn có thể lấy lại mật khẩu qua kênh đã xác minh.'
            : 'Hãy xác minh ít nhất một Gmail hoặc số điện thoại để có thể khôi phục tài khoản khi quên mật khẩu.'}
        </span>
      </div>

      <ContactRow channel="email" user={user} onUpdate={onUpdate} />
      <ContactRow channel="phone" user={user} onUpdate={onUpdate} />
      <GoogleLinkRow user={user} onUpdate={onUpdate} />
      <PasswordRow user={user} onUpdate={onUpdate} />
    </div>
  );
};

const GoogleLinkRow: React.FC<AccountSecurityProps> = ({ user, onUpdate }) => {
  const [error, setError] = useState('');

  const handleUnlink = () => {
    if (!window.confirm(`Hủy liên kết tài khoản Google ${user.googleEmail}? Bạn sẽ không đăng nhập bằng Google được nữa.`)) return;
    try {
      onUpdate(unlinkGoogle(user.id));
      signOutGoogle();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
          <GoogleLogo className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717171]">Tài khoản Google</span>
            {user.googleEmail && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Đã liên kết
              </span>
            )}
          </div>
          <div className={`text-xs font-bold truncate ${user.googleEmail ? 'text-[#222222]' : 'text-stone-400 italic'}`}>
            {user.googleEmail || 'Chưa liên kết'}
          </div>
        </div>
        {user.googleEmail && (
          <button
            onClick={handleUnlink}
            className="px-3 py-1.5 rounded-full bg-white border border-[#E5E5E5] hover:border-rose-300 hover:text-rose-600 text-[#222222] text-[11px] font-bold cursor-pointer transition-colors shrink-0"
          >
            Hủy liên kết
          </button>
        )}
      </div>

      {!user.googleEmail && (
        <GoogleSignInButton
          text="continue_with"
          onSuccess={(profile) => {
            onUpdate(linkGoogle(user.id, profile));
            setError('');
          }}
        />
      )}
      <FieldError message={error} />
    </div>
  );
};

const PasswordRow: React.FC<AccountSecurityProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState('');
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setIsEditing(false);
    setCurrent('');
    setPasswordValue('');
    setConfirm('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordError = validatePassword(password, user.username);
    if (passwordError) return setError(passwordError);
    if (confirm !== password) return setError('Mật khẩu nhập lại không khớp.');
    setIsSubmitting(true);
    try {
      onUpdate(await setPassword(user.id, password, user.hasPassword ? current : undefined));
      setSuccess(user.hasPassword ? 'Đã đổi mật khẩu.' : 'Đã tạo mật khẩu. Giờ bạn có thể đăng nhập bằng tên đăng nhập + mật khẩu.');
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
          <KeyRound className="w-4 h-4 text-[#FF385C]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#717171]">Mật khẩu</div>
          <div className={`text-xs font-bold ${user.hasPassword ? 'text-[#222222]' : 'text-stone-400 italic'}`}>
            {user.hasPassword ? '••••••••' : 'Chưa đặt — đang đăng nhập bằng Google'}
          </div>
        </div>
        {isEditing ? (
          <button onClick={close} className="p-2 rounded-full hover:bg-white text-[#717171] hover:text-[#222222] cursor-pointer shrink-0" title="Hủy">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => { setIsEditing(true); setSuccess(''); }}
            className="px-3 py-1.5 rounded-full bg-white border border-[#E5E5E5] hover:border-[#222222] text-[#222222] text-[11px] font-bold cursor-pointer transition-colors shrink-0"
          >
            {user.hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}
          </button>
        )}
      </div>

      {success && !isEditing && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> {success}
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit} className="space-y-2.5 animate-in fade-in duration-200">
          {user.hasPassword && (
            <PasswordField value={current} onChange={(v) => { setCurrent(v); setError(''); }} placeholder="Mật khẩu hiện tại" autoComplete="current-password" autoFocus />
          )}
          <PasswordField value={password} onChange={(v) => { setPasswordValue(v); setError(''); }} placeholder="Mật khẩu mới (≥ 8 ký tự, có chữ và số)" autoComplete="new-password" autoFocus={!user.hasPassword} />
          <PasswordField value={confirm} onChange={(v) => { setConfirm(v); setError(''); }} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
          <FieldError message={error} />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-2xl bg-[#222222] hover:bg-black disabled:opacity-60 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            {user.hasPassword ? 'Lưu mật khẩu mới' : 'Tạo mật khẩu'}
          </button>
        </form>
      )}
    </div>
  );
};

const ContactRow: React.FC<{ channel: AuthMethod; user: AuthUser; onUpdate: (user: AuthUser) => void }> = ({
  channel,
  user,
  onUpdate
}) => {
  const isEmail = channel === 'email';
  const value = isEmail ? user.email : user.phone;
  const verified = isEmail ? user.emailVerified : user.phoneVerified;
  const Icon = isEmail ? Mail : Smartphone;

  const [mode, setMode] = useState<RowMode>('view');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const startEdit = () => {
    setEmail(user.email ?? '');
    const [code, digits] = (user.phone ?? '').split(' ');
    setCountryCode(code || '+84');
    setPhone(digits ?? '');
    setError('');
    setMode('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEmail && !EMAIL_REGEX.test(email.trim())) return setError('Email không hợp lệ.');
    if (!isEmail && !isValidPhone(phone)) return setError('Số điện thoại không hợp lệ (9–11 chữ số).');

    const nextValue = isEmail ? email.trim().toLowerCase() : formatPhone(countryCode, phone);
    try {
      // Không đổi gì thì chuyển thẳng sang xác minh
      const updated = nextValue === value ? user : updateContact(user.id, channel, nextValue);
      onUpdate(updated);
      setMode('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#FF385C]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717171]">
              {isEmail ? 'Gmail' : 'Số điện thoại'}
            </span>
            {value &&
              (verified ? (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> Đã xác minh
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700">Chưa xác minh</span>
              ))}
          </div>
          <div className={`text-xs font-bold truncate ${value ? 'text-[#222222]' : 'text-stone-400 italic'}`}>
            {value || 'Chưa cập nhật'}
          </div>
        </div>

        {mode === 'view' ? (
          <div className="flex items-center gap-1.5 shrink-0">
            {value && !verified && (
              <button
                onClick={() => setMode('verify')}
                className="px-3 py-1.5 rounded-full bg-[#FF385C] hover:bg-[#E00B41] text-white text-[11px] font-bold cursor-pointer transition-colors"
              >
                Xác minh
              </button>
            )}
            <button
              onClick={startEdit}
              className="p-2 rounded-full bg-white border border-[#E5E5E5] hover:border-[#222222] text-[#222222] cursor-pointer transition-colors"
              title={value ? 'Sửa' : 'Thêm'}
            >
              {value ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMode('view')}
            className="p-2 rounded-full hover:bg-white text-[#717171] hover:text-[#222222] cursor-pointer shrink-0"
            title="Hủy"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {mode === 'edit' && (
        <form onSubmit={handleSave} className="space-y-2.5 animate-in fade-in duration-200">
          {isEmail ? (
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="ten.ban@gmail.com"
              className={`${inputClass(!!error)} bg-white`}
            />
          ) : (
            <PhoneField
              autoFocus
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              phone={phone}
              onPhoneChange={(v) => { setPhone(v); setError(''); }}
              hasError={!!error}
            />
          )}
          <FieldError message={error} />
          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-[#222222] hover:bg-black text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Lưu & gửi mã xác minh
          </button>
        </form>
      )}

      {mode === 'verify' && value && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <p className="text-xs text-[#717171]">
            Nhập mã 6 số đã gửi {isEmail ? 'đến' : 'qua SMS tới'} <span className="font-bold text-[#222222]">{value}</span>
          </p>
          <OtpVerifier
            destination={value}
            submitLabel="Xác minh"
            onVerified={() => {
              onUpdate(markVerified(user.id, channel));
              setMode('view');
            }}
          />
        </div>
      )}
    </div>
  );
};
