import React, { useState } from 'react';
import {
  Mail,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Loader2,
  KeyRound,
  User,
  AtSign,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  EMAIL_REGEX,
  formatPhone,
  isValidPhone,
  validateUsername,
  validateFullName,
  validatePassword,
  passwordStrength,
  register,
  loginWithPassword,
  signInWithGoogle,
  findRecoveryChannels,
  resetPassword,
  RecoveryChannel
} from '../services/authService';
import { GoogleSignInButton } from './GoogleSignInButton';
import { LegalDocId } from './LegalModal';
import {
  FieldError,
  FieldLabel,
  OtpVerifier,
  PasswordField,
  PhoneField,
  inputClass,
  primaryButtonClass
} from './AuthFields';

type AuthTab = 'login' | 'register';
type View = 'auth' | 'forgot';

// Quên mật khẩu: tìm tài khoản -> chọn kênh đã xác minh -> nhập OTP -> đặt mật khẩu mới
type ForgotStep = 'identify' | 'channel' | 'verify' | 'reset';

interface AuthFormProps {
  onLogin: (user: AuthUser) => void;
  onOpenLegal: (doc: LegalDocId) => void;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');

const STRENGTH_LABELS = ['', 'Yếu', 'Trung bình', 'Mạnh'];
const STRENGTH_COLORS = ['bg-[#E5E5E5]', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onOpenLegal }) => {
  const [view, setView] = useState<View>('auth');
  const [tab, setTab] = useState<AuthTab>('login');
  const [notice, setNotice] = useState('');

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setNotice('');
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5E5] shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF385C]/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

      <div className="relative z-10">
        {view === 'forgot' ? (
          <ForgotPasswordFlow
            onBack={() => setView('auth')}
            onDone={() => {
              setView('auth');
              setTab('login');
              setNotice('Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.');
            }}
          />
        ) : (
          <>
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF385C] text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#222222]">Chào mừng đến với VietGo</h3>
              <p className="text-sm text-[#717171]">Lưu hành trình, yêu thích và Travel DNA của riêng bạn.</p>
            </div>

            {/* Tab switcher Đăng nhập / Đăng ký */}
            <div className="grid grid-cols-2 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-full mb-6">
              {(['login', 'register'] as AuthTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
                    tab === t ? 'bg-white text-[#222222] shadow-sm' : 'text-[#717171] hover:text-[#222222]'
                  }`}
                >
                  {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            {notice && (
              <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {tab === 'login' ? (
              <LoginPanel onLogin={onLogin} onForgot={() => { setNotice(''); setView('forgot'); }} onGoRegister={() => switchTab('register')} onOpenLegal={onOpenLegal} />
            ) : (
              <RegisterPanel onLogin={onLogin} onOpenLegal={onOpenLegal} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TAB ĐĂNG NHẬP: mật khẩu hoặc Google
// ============================================================================

const LoginPanel: React.FC<{
  onLogin: (user: AuthUser) => void;
  onForgot: () => void;
  onGoRegister: () => void;
  onOpenLegal: (doc: LegalDocId) => void;
}> = ({
  onLogin,
  onOpenLegal,
  onForgot,
  onGoRegister
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    setIsSubmitting(true);
    try {
      onLogin(await loginWithPassword(identifier, password));
    } catch (err) {
      setError(errorMessage(err));
      setPassword('');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div className="space-y-2">
          <FieldLabel>Tên đăng nhập, email hoặc SĐT</FieldLabel>
          <input
            type="text"
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
            placeholder="vd: nguyenvanan"
            autoComplete="username"
            maxLength={100}
            className={inputClass(!!error)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FieldLabel>Mật khẩu</FieldLabel>
            <button type="button" onClick={onForgot} className="text-xs font-bold text-[#FF385C] hover:underline cursor-pointer">
              Quên mật khẩu?
            </button>
          </div>
          <PasswordField
            value={password}
            onChange={(v) => { setPassword(v); setError(''); }}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            hasError={!!error}
          />
        </div>

        <FieldError message={error} />

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Đăng nhập</span>
        </button>
      </form>

      <OrDivider />

      <GoogleSignInButton text="signin_with" onSuccess={(profile) => onLogin(signInWithGoogle(profile))} />
      <p className="text-[11px] text-center text-[#717171] -mt-2 leading-relaxed">
        Đăng nhập bằng Google lần đầu sẽ tạo tài khoản mới — đồng nghĩa bạn đồng ý với{' '}
        <LegalLink onClick={() => onOpenLegal('terms')}>Điều khoản dịch vụ</LegalLink> và{' '}
        <LegalLink onClick={() => onOpenLegal('privacy')}>Chính sách quyền riêng tư</LegalLink>.
      </p>

      <p className="text-xs text-center text-[#717171]">
        Chưa có tài khoản?{' '}
        <button onClick={onGoRegister} className="font-bold text-[#FF385C] hover:underline cursor-pointer">
          Đăng ký ngay
        </button>
      </p>
    </div>
  );
};

const OrDivider: React.FC<{ label?: string }> = ({ label = 'hoặc' }) => (
  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-[#717171]">
    <div className="flex-1 border-t border-[#E5E5E5]" />
    {label}
    <div className="flex-1 border-t border-[#E5E5E5]" />
  </div>
);

// ============================================================================
// TAB ĐĂNG KÝ
// ============================================================================

type RegisterErrors = Partial<Record<'username' | 'name' | 'password' | 'confirm' | 'email' | 'phone' | 'terms' | 'form', string>>;

const RegisterPanel: React.FC<{ onLogin: (user: AuthUser) => void; onOpenLegal: (doc: LegalDocId) => void }> = ({ onLogin, onOpenLegal }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+84');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = passwordStrength(password);

  const clearError = (field: keyof RegisterErrors) => setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));

  const validate = (): RegisterErrors => {
    const next: RegisterErrors = {};
    const usernameError = validateUsername(username);
    if (usernameError) next.username = usernameError;
    const nameError = validateFullName(name);
    if (nameError) next.name = nameError;
    const passwordError = validatePassword(password, username);
    if (passwordError) next.password = passwordError;
    if (confirm !== password) next.confirm = 'Mật khẩu nhập lại không khớp.';
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) next.email = 'Email không hợp lệ.';
    if (phone.trim() && !isValidPhone(phone)) next.phone = 'Số điện thoại không hợp lệ (9–11 chữ số).';
    if (!acceptedTerms) next.terms = 'Bạn cần đồng ý với Điều khoản dịch vụ để tạo tài khoản.';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      onLogin(
        await register({
          username,
          name,
          password,
          email: email.trim() || undefined,
          phone: phone.trim() ? formatPhone(countryCode, phone) : undefined
        })
      );
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-2">
        <FieldLabel>Tên đăng nhập</FieldLabel>
        <div className="relative">
          <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717171]" />
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s/g, '')); clearError('username'); }}
            placeholder="nguyenvanan"
            autoComplete="username"
            maxLength={20}
            className={`${inputClass(!!errors.username)} pl-10`}
          />
        </div>
        <FieldError message={errors.username} />
      </div>

      <div className="space-y-2">
        <FieldLabel>Họ và tên</FieldLabel>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717171]" />
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError('name'); }}
            placeholder="Nguyễn Văn An"
            autoComplete="name"
            maxLength={50}
            className={`${inputClass(!!errors.name)} pl-10`}
          />
        </div>
        <FieldError message={errors.name} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel>Mật khẩu</FieldLabel>
          <PasswordField
            value={password}
            onChange={(v) => { setPassword(v); clearError('password'); }}
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            hasError={!!errors.password}
          />
          {password && (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${strength >= level ? STRENGTH_COLORS[strength] : 'bg-[#E5E5E5]'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-[#717171]">{STRENGTH_LABELS[strength]}</span>
            </div>
          )}
          <FieldError message={errors.password} />
        </div>
        <div className="space-y-2">
          <FieldLabel>Nhập lại mật khẩu</FieldLabel>
          <PasswordField
            value={confirm}
            onChange={(v) => { setConfirm(v); clearError('confirm'); }}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            hasError={!!errors.confirm}
          />
          <FieldError message={errors.confirm} />
        </div>
      </div>

      <div className="pt-1 border-t border-dashed border-[#E5E5E5]" />

      <div className="space-y-2">
        <FieldLabel optional>Gmail</FieldLabel>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717171]" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
            placeholder="ten.ban@gmail.com"
            autoComplete="email"
            className={`${inputClass(!!errors.email)} pl-10`}
          />
        </div>
        <FieldError message={errors.email} />
      </div>

      <div className="space-y-2">
        <FieldLabel optional>Số điện thoại</FieldLabel>
        <PhoneField
          countryCode={countryCode}
          onCountryCodeChange={setCountryCode}
          phone={phone}
          onPhoneChange={(v) => { setPhone(v); clearError('phone'); }}
          hasError={!!errors.phone}
        />
        <FieldError message={errors.phone} />
      </div>

      <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-[11px] text-sky-900 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 text-sky-600" />
        <span>
          Gmail và số điện thoại sẽ được lưu vào hồ sơ. Hãy <b>xác minh</b> chúng trong phần Hồ sơ cá nhân để có thể
          lấy lại mật khẩu khi quên.
        </span>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2.5 text-xs text-[#222222] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => { setAcceptedTerms(e.target.checked); clearError('terms'); }}
            className="mt-0.5 w-4 h-4 accent-[#FF385C] cursor-pointer"
          />
          <span>
            Tôi đã đọc và đồng ý với <LegalLink onClick={() => onOpenLegal('terms')}>Điều khoản dịch vụ</LegalLink> và{' '}
            <LegalLink onClick={() => onOpenLegal('privacy')}>Chính sách quyền riêng tư</LegalLink> của VietGo.
          </span>
        </label>
        <FieldError message={errors.terms} />
      </div>

      <FieldError message={errors.form} />

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        <span>Tạo tài khoản</span>
      </button>
    </form>
  );
};

// ============================================================================
// QUÊN MẬT KHẨU
// ============================================================================

const ForgotPasswordFlow: React.FC<{ onBack: () => void; onDone: () => void }> = ({ onBack, onDone }) => {
  const [step, setStep] = useState<ForgotStep>('identify');
  const [identifier, setIdentifier] = useState('');
  const [account, setAccount] = useState<{ accountId: string; username: string; channels: RecoveryChannel[] } | null>(null);
  const [channel, setChannel] = useState<RecoveryChannel | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = () => {
    setError('');
    if (step === 'identify') onBack();
    else if (step === 'channel') setStep('identify');
    else if (step === 'verify') setStep('channel');
    else setStep('identify');
  };

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const found = findRecoveryChannels(identifier);
      setAccount(found);
      setError('');
      if (found.channels.length === 1) {
        setChannel(found.channels[0]);
        setStep('verify');
      } else {
        setStep('channel');
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordError = validatePassword(password, account?.username);
    if (passwordError) return setError(passwordError);
    if (confirm !== password) return setError('Mật khẩu nhập lại không khớp.');
    if (!account) return;
    setIsSubmitting(true);
    try {
      await resetPassword(account.accountId, password);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  const headers: Record<ForgotStep, { icon: React.ElementType; title: string; subtitle: React.ReactNode }> = {
    identify: {
      icon: KeyRound,
      title: 'Quên mật khẩu',
      subtitle: 'Nhập tên đăng nhập, email hoặc số điện thoại của tài khoản.'
    },
    channel: {
      icon: ShieldCheck,
      title: 'Chọn cách nhận mã',
      subtitle: 'Mã khôi phục chỉ được gửi tới email / SĐT đã xác minh.'
    },
    verify: {
      icon: channel?.channel === 'phone' ? Smartphone : Mail,
      title: 'Nhập mã khôi phục',
      subtitle: (
        <>
          Mã 6 số đã được gửi tới <span className="font-bold text-[#222222]">{channel?.masked}</span>
        </>
      )
    },
    reset: {
      icon: KeyRound,
      title: 'Đặt mật khẩu mới',
      subtitle: (
        <>
          Cho tài khoản <span className="font-bold text-[#222222]">@{account?.username}</span>
        </>
      )
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader onBack={goBack} {...headers[step]} />

      {step === 'identify' && (
        <form onSubmit={handleIdentify} className="space-y-4">
          <input
            type="text"
            autoFocus
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
            placeholder="Tên đăng nhập / email / SĐT"
            className={inputClass(!!error)}
          />
          <FieldError message={error} />
          <button type="submit" disabled={!identifier.trim()} className={primaryButtonClass}>
            Tiếp tục
          </button>
        </form>
      )}

      {step === 'channel' && account && (
        <div className="space-y-3">
          {account.channels.map((c) => (
            <MethodButton
              key={c.channel}
              icon={c.channel === 'email' ? <Mail className="w-5 h-5 text-[#FF385C]" /> : <Smartphone className="w-5 h-5 text-sky-600" />}
              iconBg={c.channel === 'email' ? 'bg-rose-50' : 'bg-sky-50'}
              title={c.channel === 'email' ? 'Gửi mã qua Gmail' : 'Gửi mã qua SMS'}
              subtitle={c.masked}
              onClick={() => { setChannel(c); setStep('verify'); }}
            />
          ))}
        </div>
      )}

      {step === 'verify' && channel && (
        <OtpVerifier destination={channel.destination} submitLabel="Xác nhận" onVerified={() => setStep('reset')} />
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <FieldLabel>Mật khẩu mới</FieldLabel>
            <PasswordField
              autoFocus
              value={password}
              onChange={(v) => { setPassword(v); setError(''); }}
              placeholder="Tối thiểu 8 ký tự, có chữ và số"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Nhập lại mật khẩu mới</FieldLabel>
            <PasswordField
              value={confirm}
              onChange={(v) => { setConfirm(v); setError(''); }}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
            />
          </div>
          <FieldError message={error} />
          <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Lưu mật khẩu mới</span>
          </button>
        </form>
      )}
    </div>
  );
};

// ============================================================================
// UI helpers
// ============================================================================

const StepHeader: React.FC<{ onBack: () => void; icon: React.ElementType; title: string; subtitle: React.ReactNode }> = ({
  onBack,
  icon: Icon,
  title,
  subtitle
}) => (
  <div className="space-y-3">
    <button
      type="button"
      onClick={onBack}
      className="p-2 -ml-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] cursor-pointer transition-colors"
      title="Quay lại"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
    <div className="w-12 h-12 rounded-2xl bg-[#FF385C]/10 flex items-center justify-center">
      <Icon className="w-6 h-6 text-[#FF385C]" />
    </div>
    <div className="space-y-1">
      <h3 className="text-xl font-black text-[#222222]">{title}</h3>
      <p className="text-sm text-[#717171]">{subtitle}</p>
    </div>
  </div>
);

const MethodButton: React.FC<{ icon: React.ReactNode; iconBg: string; title: string; subtitle: string; onClick: () => void }> = ({
  icon,
  iconBg,
  title,
  subtitle,
  onClick
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full p-4 bg-white border border-[#E5E5E5] hover:border-[#222222] hover:shadow-sm rounded-3xl flex items-center gap-4 text-left cursor-pointer transition-all group"
  >
    <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-bold text-[#222222]">{title}</div>
      <div className="text-xs text-[#717171] truncate">{subtitle}</div>
    </div>
    <ChevronRight className="w-5 h-5 text-[#717171] group-hover:translate-x-0.5 transition-transform" />
  </button>
);

// Link mở văn bản pháp lý — chặn sự kiện để không tích/bỏ tích checkbox bao ngoài
const LegalLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className="font-bold text-[#222222] underline hover:text-[#FF385C] cursor-pointer"
  >
    {children}
  </button>
);
