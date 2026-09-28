import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { COUNTRY_CODES, requestOtp, verifyOtp } from '../services/authService';

// Các ô nhập dùng chung cho form Đăng nhập / Đăng ký / Khôi phục / Xác minh trong hồ sơ

export const inputClass = (hasError?: boolean) =>
  `w-full px-4 py-3.5 bg-[#F7F7F7] border rounded-2xl text-sm font-semibold text-[#222222] placeholder:text-stone-400 placeholder:font-medium focus:outline-hidden focus:bg-white focus:border-[#222222] transition-colors ${
    hasError ? 'border-rose-400' : 'border-[#E5E5E5]'
  }`;

export const primaryButtonClass =
  'w-full py-3.5 bg-[#FF385C] hover:bg-[#E00B41] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm';

export const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div className="flex items-start gap-2 text-xs font-semibold text-rose-600">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;

export const FieldLabel: React.FC<{ children: React.ReactNode; optional?: boolean }> = ({ children, optional }) => (
  <label className="flex items-center gap-1.5 text-xs font-bold text-[#222222]">
    {children}
    {optional && <span className="font-medium text-[#717171]">(không bắt buộc)</span>}
  </label>
);

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({ value, onChange, placeholder, hasError, autoComplete, autoFocus }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`${inputClass(hasError)} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#717171] hover:text-[#222222] cursor-pointer"
        title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

interface PhoneFieldProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({ countryCode, onCountryCodeChange, phone, onPhoneChange, hasError, autoFocus }) => (
  <div
    className={`flex items-stretch bg-[#F7F7F7] border rounded-2xl overflow-hidden focus-within:bg-white focus-within:border-[#222222] transition-colors ${
      hasError ? 'border-rose-400' : 'border-[#E5E5E5]'
    }`}
  >
    <select
      value={countryCode}
      onChange={(e) => onCountryCodeChange(e.target.value)}
      className="pl-3 pr-1 bg-transparent text-sm font-bold text-[#222222] border-r border-[#E5E5E5] focus:outline-hidden cursor-pointer"
    >
      {COUNTRY_CODES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.code}
        </option>
      ))}
    </select>
    <input
      type="tel"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={phone}
      onChange={(e) => onPhoneChange(e.target.value.replace(/[^\d\s]/g, ''))}
      placeholder="912 345 678"
      className="flex-1 min-w-0 px-4 py-3.5 bg-transparent text-sm font-semibold text-[#222222] placeholder:text-stone-400 placeholder:font-medium focus:outline-hidden"
    />
  </div>
);

// ---------------------------------------------------------------------------
// OTP 6 số: tự gửi mã khi mount, đếm ngược gửi lại, hỗ trợ dán cả chuỗi mã
// ---------------------------------------------------------------------------

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

interface OtpVerifierProps {
  destination: string; // email hoặc SĐT đầy đủ (khóa để gửi/kiểm tra mã)
  onVerified: () => void | Promise<void>;
  submitLabel?: string;
}

export const OtpVerifier: React.FC<OtpVerifierProps> = ({ destination, onVerified, submitLabel = 'Xác nhận' }) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [demoCode, setDemoCode] = useState('');
  const [isSending, setIsSending] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const sendCode = () => {
    setIsSending(true);
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    // Giả lập độ trễ mạng khi gửi email/SMS
    setTimeout(() => {
      try {
        setDemoCode(requestOtp(destination));
        setCountdown(RESEND_SECONDS);
        otpRefs.current[0]?.focus();
      } catch (err) {
        // Vượt giới hạn gửi mã → không có mã mới, hiện lý do
        setDemoCode('');
        setError(err instanceof Error ? err.message : 'Không gửi được mã.');
      }
      setIsSending(false);
    }, 800);
  };

  useEffect(sendCode, [destination]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    const next = [...otp];
    if (!digits) {
      next[index] = '';
      setOtp(next);
      return;
    }
    digits.split('').slice(0, OTP_LENGTH - index).forEach((d, i) => {
      next[index + i] = d;
    });
    setOtp(next);
    setError('');
    otpRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    else if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 chữ số.');
      return;
    }
    setIsVerifying(true);
    setTimeout(async () => {
      const verifyError = verifyOtp(destination, code);
      if (verifyError) {
        setIsVerifying(false);
        setError(verifyError);
        setOtp(Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
        return;
      }
      try {
        await onVerified();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
      }
      setIsVerifying(false);
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between gap-2">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={OTP_LENGTH}
            value={digit}
            disabled={isSending}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`w-full aspect-square max-w-14 text-center text-xl font-black rounded-2xl border-2 bg-[#F7F7F7] text-[#222222] focus:outline-hidden focus:bg-white focus:border-[#FF385C] disabled:opacity-50 transition-colors ${
              error ? 'border-rose-400' : digit ? 'border-[#222222]' : 'border-[#E5E5E5]'
            }`}
          />
        ))}
      </div>

      <FieldError message={error} />

      {/* Mã demo — xoá khi nối API gửi OTP thật */}
      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
        {isSending ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Đang gửi mã...
          </span>
        ) : demoCode ? (
          <>
            <span className="font-bold">Chế độ demo:</span> mã của bạn là{' '}
            <span className="font-black tracking-widest">{demoCode}</span>
          </>
        ) : (
          <span>Chưa có mã hợp lệ — hãy gửi lại mã.</span>
        )}
      </div>

      <button type="submit" disabled={isSending || isVerifying} className={primaryButtonClass}>
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang xác nhận...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>{submitLabel}</span>
          </>
        )}
      </button>

      <div className="text-center text-xs text-[#717171]">
        {countdown > 0 ? (
          <span>
            Gửi lại mã sau <span className="font-bold text-[#222222]">{countdown}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={sendCode}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 font-bold text-[#FF385C] hover:underline cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Gửi lại mã
          </button>
        )}
      </div>
    </form>
  );
};
