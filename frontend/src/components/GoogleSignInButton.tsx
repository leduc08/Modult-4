import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GoogleProfile } from '../types';

// ============================================================================
// Nút "Đăng nhập bằng Google" (Google Identity Services).
// Luồng: bấm nút -> popup chọn tài khoản Gmail -> Google trả ID token (JWT)
// -> gửi lên /api/auth/google để backend xác thực -> nhận tên, email, ảnh đại diện.
// ============================================================================

const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdApi {
  initialize: (config: Record<string, unknown>) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
  disableAutoSelect: () => void;
}

const googleId = () => (window as unknown as { google?: { accounts?: { id?: GoogleIdApi } } }).google?.accounts?.id;

let gsiPromise: Promise<void> | null = null;
const loadGsi = () =>
  (gsiPromise ??= new Promise<void>((resolve, reject) => {
    if (googleId()) return resolve();
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiPromise = null;
      reject(new Error('Không tải được Google Sign-In. Kiểm tra kết nối mạng.'));
    };
    document.head.appendChild(script);
  }));

let clientIdPromise: Promise<string> | null = null;
const fetchClientId = () =>
  (clientIdPromise ??= fetch('/api/auth/google/config')
    .then((res) => (res.ok ? res.json() : { clientId: '' }))
    .then((data) => (data.clientId as string) || '')
    .catch(() => {
      clientIdPromise = null;
      return '';
    }));

const verifyCredential = async (credential: string): Promise<GoogleProfile> => {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Xác thực Google thất bại.');
  return data as GoogleProfile;
};

// google.accounts.id.initialize là cấu hình toàn cục -> chỉ khởi tạo một lần,
// callback chuyển tiếp tới nút đang hiển thị gần nhất.
let initializedClientId = '';
let activeHandler: ((response: GoogleCredentialResponse) => void) | null = null;

export const signOutGoogle = () => googleId()?.disableAutoSelect();

type Status = 'loading' | 'ready' | 'unconfigured' | 'error';

interface GoogleSignInButtonProps {
  onSuccess: (profile: GoogleProfile) => void;
  text?: 'continue_with' | 'signin_with' | 'signup_with';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess, text = 'continue_with' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const [status, setStatus] = useState<Status>('loading');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const handleCredential = async ({ credential }: GoogleCredentialResponse) => {
      setError('');
      setIsVerifying(true);
      try {
        const profile = await verifyCredential(credential);
        onSuccessRef.current(profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại.');
      } finally {
        setIsVerifying(false);
      }
    };

    (async () => {
      const clientId = await fetchClientId();
      if (cancelled) return;
      if (!clientId) return setStatus('unconfigured');

      try {
        await loadGsi();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Không tải được Google Sign-In.');
        }
        return;
      }
      const api = googleId();
      if (cancelled || !api || !containerRef.current) return;

      if (initializedClientId !== clientId) {
        api.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => activeHandler?.(response),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true
        });
        initializedClientId = clientId;
      }
      activeHandler = handleCredential;

      api.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text,
        logo_alignment: 'left',
        locale: 'vi',
        width: Math.min(Math.max(containerRef.current.offsetWidth, 200), 400)
      });
      setStatus('ready');
    })();

    return () => {
      cancelled = true;
      if (activeHandler === handleCredential) activeHandler = null;
    };
  }, [text]);

  return (
    <div className="space-y-2">
      <div className="relative min-h-[44px] flex justify-center">
        {/* Google tự render nút chính thức vào đây */}
        <div ref={containerRef} className="w-full flex justify-center" />

        {status !== 'ready' && (
          <div
            className={`absolute inset-0 w-full h-11 rounded-full border border-[#E5E5E5] bg-white flex items-center justify-center gap-3 text-sm font-bold text-[#222222] ${
              status === 'loading' ? 'animate-pulse' : 'opacity-60 cursor-not-allowed'
            }`}
          >
            <GoogleLogo />
            <span>Tiếp tục với Google</span>
          </div>
        )}

        {isVerifying && (
          <div className="absolute inset-0 rounded-full bg-white/90 flex items-center justify-center gap-2 text-xs font-bold text-[#222222]">
            <Loader2 className="w-4 h-4 animate-spin text-[#FF385C]" />
            Đang xác thực với Google...
          </div>
        )}
      </div>

      {status === 'unconfigured' && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Đăng nhập Google chưa được bật: máy chủ chưa có <b>GOOGLE_CLIENT_ID</b>. Xem hướng dẫn trong{' '}
            <b>SETUP_GOOGLE_LOGIN.md</b>.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs font-semibold text-rose-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);
