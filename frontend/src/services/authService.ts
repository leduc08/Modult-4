import { AuthMethod, AuthUser, GoogleProfile } from '../types';

// ============================================================================
// Mock account store — lưu tài khoản trong localStorage để demo toàn bộ luồng UI.
// Riêng đăng nhập Google là thật: ID token được backend xác thực (/api/auth/google).
// Khi có backend lưu tài khoản: thay các hàm bên dưới bằng API call, giữ nguyên chữ ký.
// ============================================================================

const ACCOUNTS_KEY = 'vietgo_accounts';
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5; // nhập sai quá số lần này thì mã bị hủy
const OTP_MAX_SENDS = 5; // số lần gửi mã tối đa cho 1 địa chỉ trong OTP_SEND_WINDOW_MS
const OTP_SEND_WINDOW_MS = 15 * 60 * 1000;
const NAME_MAX_LENGTH = 50;

// ID ngẫu nhiên — không dùng Date.now() vì 2 tài khoản tạo cùng mili giây sẽ trùng ID
const newAccountId = () =>
  `user-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`;

interface StoredAccount extends Omit<AuthUser, 'hasPassword'> {
  passwordHash: string | null; // null: tài khoản tạo bằng Google, chưa đặt mật khẩu
  googleId?: string; // Google `sub` — định danh ổn định, không đổi khi user đổi email
  failedLogins: number;
  lockedUntil: number | null;
  createdAt: string;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_REGEX = /^[a-z0-9._]{3,20}$/;
const RESERVED_USERNAMES = ['admin', 'root', 'support', 'vietgo', 'system', 'moderator'];

export const COUNTRY_CODES = [
  { code: '+84', flag: '🇻🇳' },
  { code: '+1', flag: '🇺🇸' },
  { code: '+82', flag: '🇰🇷' },
  { code: '+81', flag: '🇯🇵' },
  { code: '+86', flag: '🇨🇳' }
];

// ---------------------------------------------------------------------------
// Validation & format helpers
// ---------------------------------------------------------------------------

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const phoneDigits = (raw: string) => raw.replace(/\D/g, '').replace(/^0/, '');

export const formatPhone = (countryCode: string, raw: string) => `${countryCode} ${phoneDigits(raw)}`;

export const isValidPhone = (raw: string) => {
  const digits = phoneDigits(raw);
  return digits.length >= 9 && digits.length <= 11;
};

export const validateUsername = (username: string) => {
  const value = username.trim().toLowerCase();
  if (!USERNAME_REGEX.test(value)) {
    return 'Tên đăng nhập 3–20 ký tự, chỉ gồm chữ thường không dấu, số, dấu chấm hoặc gạch dưới.';
  }
  if (/^[._]|[._]$/.test(value) || /[._]{2}/.test(value)) {
    return 'Dấu chấm/gạch dưới không được ở đầu, cuối hoặc đứng liền nhau.';
  }
  if (RESERVED_USERNAMES.includes(value)) return 'Tên đăng nhập này không được phép sử dụng.';
  return '';
};

// Chữ cái Unicode (có dấu tiếng Việt) và khoảng trắng, tối thiểu 2 từ
const NAME_REGEX = /^[\p{L}\s]+$/u;
export const validateFullName = (name: string) => {
  const value = name.trim().replace(/\s+/g, ' ');
  if (!NAME_REGEX.test(value)) return 'Họ và tên chỉ gồm chữ cái và khoảng trắng.';
  if (value.split(' ').length < 2 || value.length > NAME_MAX_LENGTH) {
    return `Vui lòng nhập đầy đủ họ và tên (tối đa ${NAME_MAX_LENGTH} ký tự).`;
  }
  return '';
};

export const validatePassword = (password: string, username?: string) => {
  if (password.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
  if (password.length > 64) return 'Mật khẩu tối đa 64 ký tự.';
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Mật khẩu cần có cả chữ và số.';
  if (username && password.toLowerCase().includes(username.trim().toLowerCase())) {
    return 'Mật khẩu không được chứa tên đăng nhập.';
  }
  return '';
};

export const passwordStrength = (password: string): 0 | 1 | 2 | 3 => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score++;
  return Math.max(1, score) as 1 | 2 | 3;
};

export const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(2, local.length - 2))}@${domain}`;
};

export const maskPhone = (phone: string) => {
  const [code, digits = ''] = phone.split(' ');
  return `${code} •••• ${digits.slice(-3)}`;
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const loadAccounts = (): StoredAccount[] => {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveAccounts = (accounts: StoredAccount[]) => {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {}
};

const toAuthUser = ({ passwordHash, googleId, failedLogins, lockedUntil, createdAt, ...user }: StoredAccount): AuthUser => ({
  ...user,
  hasPassword: !!passwordHash
});

const patchAccount = (id: string, patch: Partial<StoredAccount>): AuthUser => {
  const accounts = loadAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) throw new Error('Không tìm thấy tài khoản.');
  accounts[index] = { ...accounts[index], ...patch };
  saveAccounts(accounts);
  return toAuthUser(accounts[index]);
};

const getAccount = (id: string) => {
  const account = loadAccounts().find((a) => a.id === id);
  if (!account) throw new Error('Không tìm thấy tài khoản.');
  return account;
};

// Đồng bộ lại phiên đăng nhập với dữ liệu mới nhất trong kho (null nếu tài khoản không còn)
export const getUser = (id: string): AuthUser | null => {
  const account = loadAccounts().find((a) => a.id === id);
  return account ? toAuthUser(account) : null;
};

// Không lưu mật khẩu dạng rõ — băm SHA-256 kèm username làm salt.
// crypto.subtle chỉ có trong secure context (https / localhost), nên có fallback cho LAN http.
const hashPassword = async (username: string, password: string) => {
  const input = `vietgo:${username}:${password}`;
  if (globalThis.crypto?.subtle) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return `djb2-${(h >>> 0).toString(16)}`;
};

const findByEmail = (accounts: StoredAccount[], email: string) =>
  accounts.find((a) => a.email && a.email === normalizeEmail(email));

const findByPhone = (accounts: StoredAccount[], phone: string) =>
  accounts.find((a) => a.phone && a.phone === phone);

const findByIdentifier = (accounts: StoredAccount[], identifier: string) => {
  const value = identifier.trim().toLowerCase();
  const digits = phoneDigits(value);
  return accounts.find(
    (a) =>
      a.username === value ||
      a.email === value ||
      (digits.length >= 9 && a.phone?.split(' ')[1] === digits)
  );
};

const uniqueUsernameFrom = (accounts: StoredAccount[], email: string) => {
  let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '').replace(/^[._]+|[._]+$/g, '').replace(/[._]{2,}/g, '.').slice(0, 16);
  if (base.length < 3) base = `${base}_vn`.replace(/^_/, 'vn_');
  let username = base;
  for (let i = 1; accounts.some((a) => a.username === username) || RESERVED_USERNAMES.includes(username); i++) {
    username = `${base}${i}`;
  }
  return username;
};

// ---------------------------------------------------------------------------
// OTP (demo: mã trả về cho UI hiển thị thay vì gửi email/SMS thật)
// ---------------------------------------------------------------------------

const pendingOtps = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const otpSendLog = new Map<string, number[]>();

// Ném lỗi nếu gửi quá OTP_MAX_SENDS lần trong 15 phút (chống spam email/SMS)
export const requestOtp = (destination: string) => {
  const now = Date.now();
  const recent = (otpSendLog.get(destination) ?? []).filter((t) => now - t < OTP_SEND_WINDOW_MS);
  if (recent.length >= OTP_MAX_SENDS) {
    const waitMinutes = Math.ceil((OTP_SEND_WINDOW_MS - (now - recent[0])) / 60000);
    throw new Error(`Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau ${waitMinutes} phút.`);
  }
  otpSendLog.set(destination, [...recent, now]);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  pendingOtps.set(destination, { code, expiresAt: now + OTP_TTL_MS, attempts: 0 });
  return code;
};

export const verifyOtp = (destination: string, code: string) => {
  const pending = pendingOtps.get(destination);
  if (!pending || pending.expiresAt < Date.now()) return 'Mã đã hết hạn. Vui lòng gửi lại mã.';
  if (pending.code !== code) {
    pending.attempts++;
    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      // Hủy mã để không thể dò đủ 6 chữ số
      pendingOtps.delete(destination);
      return 'Bạn đã nhập sai quá 5 lần. Mã đã bị hủy, vui lòng gửi lại mã mới.';
    }
    return `Mã xác nhận không đúng. Còn ${OTP_MAX_ATTEMPTS - pending.attempts} lần thử.`;
  }
  pendingOtps.delete(destination);
  return '';
};

// Xóa trạng thái OTP trong bộ nhớ (dùng cho test)
export const resetOtpState = () => {
  pendingOtps.clear();
  otpSendLog.clear();
};

// ---------------------------------------------------------------------------
// Đăng ký & đăng nhập bằng mật khẩu
// ---------------------------------------------------------------------------

export interface RegisterInput {
  username: string;
  name: string;
  password: string;
  email?: string;
  phone?: string;
}

export const register = async (input: RegisterInput): Promise<AuthUser> => {
  const accounts = loadAccounts();
  const username = input.username.trim().toLowerCase();
  const email = input.email ? normalizeEmail(input.email) : undefined;
  const name = input.name.trim().replace(/\s+/g, ' ');

  // Kiểm tra lại ở tầng dịch vụ — không phụ thuộc hoàn toàn vào form
  const usernameError = validateUsername(username);
  if (usernameError) throw new Error(usernameError);
  const nameError = validateFullName(name);
  if (nameError) throw new Error(nameError);
  const passwordError = validatePassword(input.password, username);
  if (passwordError) throw new Error(passwordError);
  if (email && !EMAIL_REGEX.test(email)) throw new Error('Email không hợp lệ.');

  if (accounts.some((a) => a.username === username)) throw new Error('Tên đăng nhập đã được sử dụng.');
  if (email) {
    const owner = findByEmail(accounts, email);
    if (owner?.googleId) throw new Error('Email này đã gắn với một tài khoản Google. Hãy dùng "Tiếp tục với Google".');
    if (owner) throw new Error('Email này đã gắn với một tài khoản khác.');
  }
  if (input.phone && findByPhone(accounts, input.phone)) throw new Error('Số điện thoại này đã gắn với một tài khoản khác.');

  const account: StoredAccount = {
    id: newAccountId(),
    username,
    name,
    email,
    phone: input.phone,
    emailVerified: false,
    phoneVerified: false,
    passwordHash: await hashPassword(username, input.password),
    failedLogins: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString()
  };
  saveAccounts([...accounts, account]);
  return toAuthUser(account);
};

const INVALID_CREDENTIALS =
  'Tên đăng nhập hoặc mật khẩu không đúng. Lưu ý: nhập sai 5 lần liên tiếp sẽ bị tạm khóa 5 phút.';

export const loginWithPassword = async (identifier: string, password: string): Promise<AuthUser> => {
  const account = findByIdentifier(loadAccounts(), identifier);
  // Không tiết lộ tài khoản có tồn tại hay không
  if (!account) throw new Error(INVALID_CREDENTIALS);

  if (account.lockedUntil && account.lockedUntil > Date.now()) {
    const minutes = Math.ceil((account.lockedUntil - Date.now()) / 60000);
    throw new Error(`Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau ${minutes} phút hoặc dùng "Quên mật khẩu".`);
  }
  if (!account.passwordHash) {
    throw new Error('Tài khoản này đăng nhập bằng Google và chưa đặt mật khẩu. Hãy chọn "Tiếp tục với Google".');
  }

  if (account.passwordHash !== (await hashPassword(account.username, password))) {
    const failedLogins = (account.failedLogins ?? 0) + 1;
    if (failedLogins >= MAX_FAILED_LOGINS) {
      patchAccount(account.id, { failedLogins: 0, lockedUntil: Date.now() + LOCK_DURATION_MS });
      throw new Error('Bạn đã nhập sai 5 lần. Tài khoản tạm khóa 5 phút.');
    }
    patchAccount(account.id, { failedLogins });
    // Cùng thông báo với trường hợp tài khoản không tồn tại → không lộ tài khoản nào có thật
    throw new Error(INVALID_CREDENTIALS);
  }

  return patchAccount(account.id, { failedLogins: 0, lockedUntil: null });
};

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------

/**
 * Đăng nhập / đăng ký bằng Google (profile đã được backend xác thực).
 * 1. Đã liên kết (khớp Google sub)     -> đăng nhập, cập nhật ảnh đại diện.
 * 2. Email trùng tài khoản đã xác minh -> tự liên kết rồi đăng nhập.
 * 3. Email trùng tài khoản CHƯA xác minh -> từ chối: tránh chiếm tài khoản do người
 *    khác đăng ký trước bằng email của bạn; chủ tài khoản phải đăng nhập mật khẩu rồi liên kết.
 * 4. Chưa có -> tạo tài khoản mới với tên, email, ảnh từ Google.
 */
const normalizeGoogleProfile = (profile: GoogleProfile): GoogleProfile => ({
  ...profile,
  email: normalizeEmail(profile.email),
  name: (profile.name || profile.email.split('@')[0]).trim().replace(/\s+/g, ' ').slice(0, NAME_MAX_LENGTH)
});

export const signInWithGoogle = (rawProfile: GoogleProfile): AuthUser => {
  const profile = normalizeGoogleProfile(rawProfile);
  const accounts = loadAccounts();

  const linked = accounts.find((a) => a.googleId === profile.sub);
  if (linked) {
    return patchAccount(linked.id, {
      avatarUrl: profile.picture ?? linked.avatarUrl,
      googleEmail: profile.email,
      failedLogins: 0,
      lockedUntil: null
    });
  }

  const sameEmail = findByEmail(accounts, profile.email);
  if (sameEmail) {
    if (sameEmail.googleId) {
      throw new Error('Email này thuộc tài khoản đã liên kết với một tài khoản Google khác.');
    }
    if (!sameEmail.emailVerified) {
      throw new Error(
        `Email ${profile.email} đã được dùng để đăng ký tài khoản @${sameEmail.username} nhưng chưa xác minh. ` +
          'Hãy đăng nhập bằng mật khẩu, sau đó liên kết Google trong Hồ sơ cá nhân.'
      );
    }
    return patchAccount(sameEmail.id, {
      googleId: profile.sub,
      googleEmail: profile.email,
      avatarUrl: sameEmail.avatarUrl ?? profile.picture ?? undefined
    });
  }

  const account: StoredAccount = {
    id: newAccountId(),
    username: uniqueUsernameFrom(accounts, profile.email),
    name: profile.name,
    email: profile.email,
    emailVerified: true,
    phoneVerified: false,
    avatarUrl: profile.picture ?? undefined,
    googleId: profile.sub,
    googleEmail: profile.email,
    passwordHash: null,
    failedLogins: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString()
  };
  saveAccounts([...accounts, account]);
  return toAuthUser(account);
};

// Liên kết Google cho tài khoản đang đăng nhập (từ Hồ sơ cá nhân)
export const linkGoogle = (accountId: string, rawProfile: GoogleProfile): AuthUser => {
  const profile = normalizeGoogleProfile(rawProfile);
  const accounts = loadAccounts();
  const account = getAccount(accountId);
  if (account.googleId) throw new Error('Tài khoản đã liên kết Google. Hãy hủy liên kết trước khi đổi tài khoản Google.');

  const other = accounts.find((a) => a.id !== accountId && (a.googleId === profile.sub || a.email === profile.email));
  if (other) throw new Error(`Tài khoản Google ${profile.email} đang được dùng cho một tài khoản VietGo khác.`);

  // Chưa có email -> dùng email Google (đã xác minh). Trùng email -> đánh dấu đã xác minh.
  const emailPatch: Partial<StoredAccount> = !account.email
    ? { email: profile.email, emailVerified: true }
    : account.email === profile.email
      ? { emailVerified: true }
      : {};

  return patchAccount(accountId, {
    ...emailPatch,
    googleId: profile.sub,
    googleEmail: profile.email,
    avatarUrl: account.avatarUrl ?? profile.picture ?? undefined
  });
};

export const unlinkGoogle = (accountId: string): AuthUser => {
  const account = getAccount(accountId);
  // Không cho hủy liên kết nếu đó là cách đăng nhập duy nhất
  if (!account.passwordHash) throw new Error('Hãy tạo mật khẩu trước khi hủy liên kết Google, nếu không bạn sẽ không thể đăng nhập lại.');
  return patchAccount(accountId, { googleId: undefined, googleEmail: undefined });
};

// ---------------------------------------------------------------------------
// Mật khẩu & khôi phục
// ---------------------------------------------------------------------------

export const setPassword = async (accountId: string, newPassword: string, currentPassword?: string) => {
  const account = getAccount(accountId);
  const passwordError = validatePassword(newPassword, account.username);
  if (passwordError) throw new Error(passwordError);
  if (account.passwordHash) {
    if (!currentPassword || account.passwordHash !== (await hashPassword(account.username, currentPassword))) {
      throw new Error('Mật khẩu hiện tại không đúng.');
    }
  }
  const newHash = await hashPassword(account.username, newPassword);
  if (newHash === account.passwordHash) throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
  return patchAccount(accountId, { passwordHash: newHash, failedLogins: 0, lockedUntil: null });
};

export interface RecoveryChannel {
  channel: AuthMethod;
  destination: string;
  masked: string;
}

export const findRecoveryChannels = (identifier: string) => {
  const account = findByIdentifier(loadAccounts(), identifier);
  if (!account) throw new Error('Không tìm thấy tài khoản với thông tin này.');
  const channels: RecoveryChannel[] = [];
  if (account.email && account.emailVerified) {
    channels.push({ channel: 'email', destination: account.email, masked: maskEmail(account.email) });
  }
  if (account.phone && account.phoneVerified) {
    channels.push({ channel: 'phone', destination: account.phone, masked: maskPhone(account.phone) });
  }
  if (channels.length === 0) {
    throw new Error('Tài khoản chưa xác minh email hoặc số điện thoại nên không thể khôi phục tự động.');
  }
  return { accountId: account.id, username: account.username, channels };
};

// Đã qua OTP khôi phục nên không cần mật khẩu cũ; đồng thời mở khóa tài khoản
export const resetPassword = async (accountId: string, newPassword: string) => {
  const account = getAccount(accountId);
  const passwordError = validatePassword(newPassword, account.username);
  if (passwordError) throw new Error(passwordError);
  patchAccount(accountId, {
    passwordHash: await hashPassword(account.username, newPassword),
    failedLogins: 0,
    lockedUntil: null
  });
};

// ---------------------------------------------------------------------------
// Liên hệ & xác minh
// ---------------------------------------------------------------------------

// Đổi email/SĐT sẽ reset trạng thái xác minh của kênh đó
export const updateContact = (accountId: string, channel: AuthMethod, value: string): AuthUser => {
  const others = loadAccounts().filter((a) => a.id !== accountId);
  if (channel === 'email') {
    const email = normalizeEmail(value);
    if (!EMAIL_REGEX.test(email)) throw new Error('Email không hợp lệ.');
    if (findByEmail(others, email) || others.some((a) => a.googleEmail === email)) {
      throw new Error('Email này đã gắn với một tài khoản khác.');
    }
    const account = getAccount(accountId);
    // Email trùng với Google đã liên kết -> Google đã xác minh sẵn
    return patchAccount(accountId, { email, emailVerified: account.googleEmail === email });
  }
  if (!/^\+\d{1,3} \d{9,11}$/.test(value)) throw new Error('Số điện thoại không hợp lệ.');
  if (findByPhone(others, value)) throw new Error('Số điện thoại này đã gắn với một tài khoản khác.');
  return patchAccount(accountId, { phone: value, phoneVerified: false });
};

export const markVerified = (accountId: string, channel: AuthMethod): AuthUser =>
  patchAccount(accountId, channel === 'email' ? { emailVerified: true } : { phoneVerified: true });
