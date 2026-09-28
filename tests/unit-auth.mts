// Unit test tầng logic tài khoản (authService) — chạy trên Node với localStorage giả lập
import { writeFileSync } from 'node:fs';
import { group, test, expect, expectThrow, summary } from './harness.mjs';

// Chạy: npx --prefix .. tsx unit-auth.mts   (hoặc npm test để chạy toàn bộ)

const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; }
};
const reset = () => { for (const k of Object.keys(store)) delete store[k]; };
const accounts = () => JSON.parse(store['vietgo_accounts'] ?? '[]');
const patchRaw = (username: string, patch: object) => {
  const list = accounts().map((a: any) => (a.username === username ? { ...a, ...patch } : a));
  store['vietgo_accounts'] = JSON.stringify(list);
};

const A = await import(new URL('../frontend/src/services/authService.ts', import.meta.url).href);
const G = (sub: string, email: string, name = 'Người Dùng Google', picture: string | null = 'https://lh3.googleusercontent.com/a/x') =>
  ({ sub, email, name, picture });

// ---------------------------------------------------------------------------
group('A. Ràng buộc nhập liệu');
await test('U01', 'Tên đăng nhập hợp lệ (chữ, số, . _)', () => expect(A.validateUsername('nguyen.van_an1')).toBe(''));
await test('U02', 'Tên đăng nhập < 3 ký tự bị chặn', () => expect(A.validateUsername('ab')).toContain('3–20'));
await test('U03', 'Tên đăng nhập > 20 ký tự bị chặn', () => expect(A.validateUsername('a'.repeat(21))).toContain('3–20'));
await test('U04', 'Tên đăng nhập có dấu tiếng Việt bị chặn', () => expect(A.validateUsername('nguyễn')).toContain('không dấu'));
await test('U05', 'Tên đăng nhập bắt đầu bằng dấu chấm bị chặn', () => expect(A.validateUsername('.abc')).toContain('đầu, cuối'));
await test('U06', 'Tên đăng nhập có "__" liền nhau bị chặn', () => expect(A.validateUsername('ab__c')).toContain('liền nhau'));
await test('U07', 'Tên dành riêng (admin) bị chặn', () => expect(A.validateUsername('admin')).toContain('không được phép'));
await test('U08', 'Tên đăng nhập viết hoa được chuẩn hóa thành chữ thường', () => expect(A.validateUsername('NguyenVanAn')).toBe(''));
await test('U09', 'Mật khẩu 7 ký tự bị chặn', () => expect(A.validatePassword('abc1234')).toContain('8 ký tự'));
await test('U10', 'Mật khẩu chỉ có chữ bị chặn', () => expect(A.validatePassword('abcdefgh')).toContain('chữ và số'));
await test('U11', 'Mật khẩu chỉ có số bị chặn', () => expect(A.validatePassword('12345678')).toContain('chữ và số'));
await test('U12', 'Mật khẩu chứa tên đăng nhập bị chặn (không phân biệt hoa thường)', () =>
  expect(A.validatePassword('XNguyenVanAn9', 'nguyenvanan')).toContain('tên đăng nhập'));
await test('U13', 'Mật khẩu > 64 ký tự bị chặn', () => expect(A.validatePassword('a1'.repeat(33))).toContain('64'));
await test('U14', 'Mật khẩu hợp lệ', () => expect(A.validatePassword('Travel2026', 'nguyenvanan')).toBe(''));
await test('U15', 'Email: chặn "a@b", "a b@x.com"; nhận "a@b.co"', () => {
  expect(A.EMAIL_REGEX.test('a@b')).toBeFalsy();
  expect(A.EMAIL_REGEX.test('a b@x.com')).toBeFalsy();
  expect(A.EMAIL_REGEX.test('a@b.co')).toBeTruthy();
});
await test('U16', 'SĐT: bỏ số 0 đầu và chuẩn hóa "+84 912345678"', () => {
  expect(A.isValidPhone('0912 345 678')).toBeTruthy();
  expect(A.formatPhone('+84', '0912 345 678')).toBe('+84 912345678');
});
await test('U17', 'SĐT quá ngắn (5 số) bị chặn', () => expect(A.isValidPhone('12345')).toBeFalsy());
await test('U18', 'Độ mạnh mật khẩu: yếu / trung bình / mạnh', () => {
  expect(A.passwordStrength('abc')).toBe(1);
  expect(A.passwordStrength('Abcdefgh')).toBe(2);
  expect(A.passwordStrength('Abcdef1!')).toBe(3);
});
await test('U19', 'Che email/SĐT khi khôi phục', () => {
  expect(A.maskEmail('nguyenan@gmail.com')).toBe('ng••••••@gmail.com');
  expect(A.maskPhone('+84 912345678')).toBe('+84 •••• 678');
});

// ---------------------------------------------------------------------------
group('B. Đăng ký');
reset();
let an: any;
await test('R01', 'Đăng ký thành công, email chưa xác minh, có mật khẩu', async () => {
  an = await A.register({ username: 'NguyenVanAn', name: '  Nguyễn   Văn  An ', password: 'Travel2026', email: ' AN@Gmail.com ', phone: '+84 912345678' });
  expect(an.username).toBe('nguyenvanan');
  expect(an.name).toBe('Nguyễn Văn An');
  expect(an.email).toBe('an@gmail.com');
  expect(an.emailVerified).toBe(false);
  expect(an.hasPassword).toBe(true);
});
await test('R02', 'Trùng tên đăng nhập (khác hoa thường) bị chặn', () =>
  expectThrow(() => A.register({ username: 'NGUYENVANAN', name: 'A B', password: 'Travel2026' }), 'đã được sử dụng'));
await test('R03', 'Trùng email (khác hoa thường, có khoảng trắng) bị chặn', () =>
  expectThrow(() => A.register({ username: 'khac1', name: 'A B', password: 'Travel2026', email: 'An@GMAIL.com' }), 'Email này'));
await test('R04', 'Trùng số điện thoại bị chặn', () =>
  expectThrow(() => A.register({ username: 'khac2', name: 'A B', password: 'Travel2026', phone: '+84 912345678' }), 'Số điện thoại'));
await test('R05', 'Mật khẩu không lưu dạng rõ trong bộ nhớ', () => {
  expect(JSON.stringify(store).includes('Travel2026')).toBeFalsy();
  expect(accounts()[0].passwordHash).toMatch(/^[0-9a-f]{64}$/);
});
await test('R06', 'Dữ liệu trả về cho UI không lộ passwordHash / googleId', () => {
  const u: any = A.getUser(an.id);
  expect('passwordHash' in u).toBeFalsy();
  expect('googleId' in u).toBeFalsy();
  expect('failedLogins' in u).toBeFalsy();
});
await test('R07', 'Đăng ký bằng email đã gắn Google → gợi ý dùng Google', async () => {
  A.signInWithGoogle(G('g-reg', 'google.user@gmail.com'));
  await expectThrow(() => A.register({ username: 'khac3', name: 'A B', password: 'Travel2026', email: 'google.user@gmail.com' }), 'Google');
});

await test('R08', 'Tầng dịch vụ chặn đăng ký mật khẩu yếu (bỏ qua form)', () =>
  expectThrow(() => A.register({ username: 'weak.pw', name: 'Yếu Mật Khẩu', password: '123' }), '8 ký tự'));
await test('R09', 'Tầng dịch vụ chặn tên đăng nhập không hợp lệ', () =>
  expectThrow(() => A.register({ username: 'admin', name: 'Quản Trị', password: 'Travel2026' }), 'không được phép'));
await test('R10', 'Tầng dịch vụ chặn họ tên chỉ 1 từ / có ký tự lạ', async () => {
  await expectThrow(() => A.register({ username: 'one.word', name: 'An', password: 'Travel2026' }), 'đầy đủ họ và tên');
  await expectThrow(() => A.register({ username: 'html.name', name: '<b>An</b> Nguyễn', password: 'Travel2026' }), 'chữ cái');
});
await test('R11', 'Tầng dịch vụ chặn email sai định dạng', () =>
  expectThrow(() => A.register({ username: 'bad.mail', name: 'Sai Email', password: 'Travel2026', email: 'abc@' }), 'Email không hợp lệ'));

// ---------------------------------------------------------------------------
group('C. Đăng nhập bằng mật khẩu');
await test('L01', 'Đăng nhập bằng tên đăng nhập', async () => expect((await A.loginWithPassword('nguyenvanan', 'Travel2026')).id).toBe(an.id));
await test('L02', 'Đăng nhập bằng email', async () => expect((await A.loginWithPassword('an@gmail.com', 'Travel2026')).id).toBe(an.id));
await test('L03', 'Đăng nhập bằng SĐT dạng 0912...', async () => expect((await A.loginWithPassword('0912345678', 'Travel2026')).id).toBe(an.id));
await test('L04', 'Tên đăng nhập viết hoa + khoảng trắng vẫn đăng nhập được', async () =>
  expect((await A.loginWithPassword('  NguyenVanAn ', 'Travel2026')).id).toBe(an.id));
await test('L05', 'Mật khẩu phân biệt hoa thường', () => expectThrow(() => A.loginWithPassword('nguyenvanan', 'travel2026'), 'không đúng'));
let wrongMsg = '';
let unknownMsg = '';
await test('L06', 'Sai mật khẩu → thông báo chung + cảnh báo khóa sau 5 lần', async () => {
  wrongMsg = await expectThrow(() => A.loginWithPassword('nguyenvanan', 'Sai12345'), 'sai 5 lần');
});
await test('L07', 'Không lộ tài khoản có tồn tại hay không (thông báo giống nhau)', async () => {
  unknownMsg = await expectThrow(() => A.loginWithPassword('khongtontai', 'Sai12345'));
  if (wrongMsg !== unknownMsg) throw new Error(`khác nhau → lộ tài khoản tồn tại: "${unknownMsg}" vs "${wrongMsg}"`);
});
await test('L08', 'Đăng nhập đúng reset bộ đếm sai', async () => {
  await A.loginWithPassword('nguyenvanan', 'Travel2026');
  expect(accounts().find((a: any) => a.username === 'nguyenvanan').failedLogins).toBe(0);
});
await test('L09', 'Sai 5 lần liên tiếp → khóa 5 phút', async () => {
  for (let i = 0; i < 4; i++) await expectThrow(() => A.loginWithPassword('nguyenvanan', 'Sai12345'));
  await expectThrow(() => A.loginWithPassword('nguyenvanan', 'Sai12345'), 'tạm khóa 5 phút');
});
await test('L10', 'Đang khóa: mật khẩu đúng vẫn bị từ chối', () => expectThrow(() => A.loginWithPassword('nguyenvanan', 'Travel2026'), 'tạm khóa'));
await test('L11', 'Hết 5 phút → đăng nhập lại được', async () => {
  patchRaw('nguyenvanan', { lockedUntil: Date.now() - 1000 });
  expect((await A.loginWithPassword('nguyenvanan', 'Travel2026')).id).toBe(an.id);
});
await test('L12', 'Tài khoản Google chưa có mật khẩu → hướng dẫn dùng Google', () =>
  expectThrow(() => A.loginWithPassword('google.user', 'Whatever1'), 'Google'));

// ---------------------------------------------------------------------------
group('D. Đăng nhập / liên kết Google');
reset();
await test('G00', 'Tạo nhiều tài khoản liên tiếp → ID không trùng', async () => {
  const ids = [
    (await A.register({ username: 'id.a', name: 'A A', password: 'Travel2026' })).id,
    A.signInWithGoogle(G('id-b', 'idb@gmail.com')).id,
    A.signInWithGoogle(G('id-c', 'idc@gmail.com')).id
  ];
  if (new Set(ids).size < ids.length) throw new Error(`trùng ID: ${ids.join(', ')} → thao tác trên tài khoản này sửa nhầm tài khoản kia`);
});
reset();
await test('G01', 'Google lần đầu → tạo tài khoản với tên, Gmail, ảnh', () => {
  const u = A.signInWithGoogle(G('g1', 'Binh.Tran@gmail.com', 'Trần Bình'));
  expect(u.username).toBe('binh.tran');
  expect(u.name).toBe('Trần Bình');
  expect(u.email).toBe('binh.tran@gmail.com');
  expect(u.emailVerified).toBe(true);
  expect(u.hasPassword).toBe(false);
  expect(u.googleEmail).toBe('binh.tran@gmail.com');
  expect(!!u.avatarUrl).toBe(true);
});
await test('G02', 'Đăng nhập Google lần 2 → cùng tài khoản, cập nhật ảnh, không tạo trùng', () => {
  const first = A.getUser(accounts()[0].id)!;
  const u = A.signInWithGoogle(G('g1', 'binh.tran@gmail.com', 'Trần Bình', 'https://new/avatar'));
  expect(u.id).toBe(first.id);
  expect(u.avatarUrl).toBe('https://new/avatar');
  expect(accounts().length).toBe(1);
});
await test('G03', 'Nhận diện theo Google ID dù Gmail đổi tên', () => {
  const u = A.signInWithGoogle(G('g1', 'binh.moi@gmail.com'));
  expect(u.username).toBe('binh.tran');
  expect(accounts().length).toBe(1);
});
await test('G16', 'Tên Google dài / nhiều khoảng trắng được chuẩn hóa', () => {
  const u = A.signInWithGoogle(G('g-long', 'long.name@gmail.com', '  Nguyễn    Văn   ' + 'A'.repeat(80)));
  expect(u.name.includes('  ')).toBe(false);
  expect(u.name.length <= 50).toBe(true);
});
await test('G04', 'Email trùng tài khoản ĐÃ xác minh → tự liên kết', async () => {
  const u = await A.register({ username: 'chi.le', name: 'Lê Chi', password: 'Travel2026', email: 'chi@gmail.com' });
  A.markVerified(u.id, 'email');
  const g = A.signInWithGoogle(G('g2', 'chi@gmail.com'));
  expect(g.id).toBe(u.id);
  expect(g.googleEmail).toBe('chi@gmail.com');
  expect(g.hasPassword).toBe(true);
});
await test('G05', 'Email trùng tài khoản CHƯA xác minh → từ chối (chống chiếm tài khoản)', async () => {
  await A.register({ username: 'attacker', name: 'Kẻ Gian', password: 'Travel2026', email: 'victim@gmail.com' });
  await expectThrow(() => A.signInWithGoogle(G('g-victim', 'victim@gmail.com')), 'chưa xác minh');
  if (accounts().some((a: any) => a.googleId === 'g-victim')) throw new Error('đã liên kết nhầm');
});
await test('G06', 'Email thuộc tài khoản đã liên kết Google KHÁC → từ chối', () =>
  expectThrow(() => A.signInWithGoogle(G('g-other', 'chi@gmail.com')), 'Google khác'));
await test('G07', 'Trùng phần trước @ ở 2 domain → tên đăng nhập không trùng', () => {
  const a = A.signInWithGoogle(G('g3', 'minh@gmail.com'));
  const b = A.signInWithGoogle(G('g4', 'minh@company.vn'));
  expect(a.username).toBe('minh');
  expect(b.username).toBe('minh1');
});
await test('G08', 'Gmail ngắn / ký tự lạ → tên đăng nhập sinh ra vẫn hợp lệ', () => {
  for (const [sub, email] of [['g5', 'ab@gmail.com'], ['g6', 'a..b+tag@gmail.com'], ['g7', '_x_@gmail.com'], ['g8', 'x@gmail.com']]) {
    const u = A.signInWithGoogle(G(sub, email));
    const err = A.validateUsername(u.username);
    if (err) throw new Error(`${email} → "${u.username}": ${err}`);
  }
});
await test('G09', 'Gmail "admin@..." không sinh tên dành riêng "admin"', () => {
  const u = A.signInWithGoogle(G('g9', 'admin@gmail.com'));
  if (u.username === 'admin') throw new Error('sinh ra tên dành riêng');
});
await test('G10', 'Liên kết Google từ hồ sơ (tài khoản chưa có email) → gán email đã xác minh', async () => {
  const u = await A.register({ username: 'dung.pham', name: 'Phạm Dũng', password: 'Travel2026' });
  const l = A.linkGoogle(u.id, G('g10', 'dung@gmail.com'));
  expect(l.email).toBe('dung@gmail.com');
  expect(l.emailVerified).toBe(true);
});
await test('G11', 'Liên kết khi đã liên kết → từ chối', () => {
  const id = accounts().find((a: any) => a.username === 'dung.pham').id;
  return expectThrow(() => A.linkGoogle(id, G('g11', 'dung2@gmail.com')), 'đã liên kết');
});
await test('G12', 'Liên kết Google đang dùng cho tài khoản khác → từ chối', async () => {
  const u = await A.register({ username: 'em.vo', name: 'Võ Em', password: 'Travel2026' });
  await expectThrow(() => A.linkGoogle(u.id, G('g1', 'binh.moi@gmail.com')), 'tài khoản VietGo khác');
});
await test('G13', 'Liên kết Google có email trùng email tài khoản → đánh dấu đã xác minh', async () => {
  const u = await A.register({ username: 'giang.do', name: 'Đỗ Giang', password: 'Travel2026', email: 'giang@gmail.com' });
  expect(A.linkGoogle(u.id, G('g13', 'giang@gmail.com')).emailVerified).toBe(true);
});
await test('G14', 'Hủy liên kết khi chưa có mật khẩu → chặn', () => {
  const id = accounts().find((a: any) => a.username === 'binh.tran').id;
  return expectThrow(() => A.unlinkGoogle(id), 'tạo mật khẩu');
});
await test('G15', 'Hủy liên kết khi đã có mật khẩu → thành công', () => {
  const id = accounts().find((a: any) => a.username === 'dung.pham').id;
  expect(A.unlinkGoogle(id).googleEmail).toBe(undefined);
});

// ---------------------------------------------------------------------------
group('E. Mật khẩu & khôi phục');
reset();
const hoa = await A.register({ username: 'hoa.nguyen', name: 'Nguyễn Hoa', password: 'Travel2026', email: 'hoa@gmail.com', phone: '+84 987654321' });
await test('P01', 'Chưa xác minh kênh nào → không khôi phục được', () => expectThrow(() => A.findRecoveryChannels('hoa.nguyen'), 'chưa xác minh'));
await test('P02', 'Xác minh email → khôi phục qua email (đã che)', () => {
  A.markVerified(hoa.id, 'email');
  const r = A.findRecoveryChannels('hoa.nguyen');
  expect(r.channels.length).toBe(1);
  expect(r.channels[0].masked).toBe('ho•••@gmail.com'.replace('•••', '••'));
});
await test('P03', 'Tìm tài khoản khôi phục bằng SĐT 0987...', () => {
  A.markVerified(hoa.id, 'phone');
  expect(A.findRecoveryChannels('0987654321').channels.length).toBe(2);
});
await test('P04', 'Tài khoản không tồn tại → báo không tìm thấy', () => expectThrow(() => A.findRecoveryChannels('ai.do'), 'Không tìm thấy'));
await test('P05', 'Đặt lại mật khẩu → mật khẩu mới dùng được, cũ bị từ chối', async () => {
  await A.resetPassword(hoa.id, 'NewPass2026');
  expect((await A.loginWithPassword('hoa.nguyen', 'NewPass2026')).id).toBe(hoa.id);
  await expectThrow(() => A.loginWithPassword('hoa.nguyen', 'Travel2026'));
});
await test('P06', 'Đặt lại mật khẩu mở khóa tài khoản đang bị khóa', async () => {
  patchRaw('hoa.nguyen', { lockedUntil: Date.now() + 300000 });
  await A.resetPassword(hoa.id, 'Reset2026x');
  expect((await A.loginWithPassword('hoa.nguyen', 'Reset2026x')).id).toBe(hoa.id);
});
await test('P07', 'Đổi mật khẩu: sai mật khẩu hiện tại → chặn', () => expectThrow(() => A.setPassword(hoa.id, 'Another2026', 'sai'), 'hiện tại'));
await test('P08', 'Đổi mật khẩu: trùng mật khẩu cũ → chặn', () => expectThrow(() => A.setPassword(hoa.id, 'Reset2026x', 'Reset2026x'), 'khác'));
await test('P09', 'Tài khoản Google tạo mật khẩu lần đầu không cần mật khẩu cũ', async () => {
  const g = A.signInWithGoogle(G('gp', 'khanh@gmail.com'));
  expect((await A.setPassword(g.id, 'SaiGon2026')).hasPassword).toBe(true);
  expect((await A.loginWithPassword('khanh', 'SaiGon2026')).id).toBe(g.id);
});
await test('P10', 'Tầng dịch vụ tự chặn mật khẩu yếu (phòng khi UI bị bỏ qua)', async () => {
  await expectThrow(() => A.setPassword(hoa.id, '1', 'Reset2026x'));
});

await test('P11', 'Đặt lại mật khẩu yếu (sau OTP) cũng bị chặn', () => expectThrow(() => A.resetPassword(hoa.id, 'abc'), '8 ký tự'));
await test('P12', 'Mật khẩu mới chứa tên đăng nhập bị chặn', () =>
  expectThrow(() => A.setPassword(hoa.id, 'hoa.nguyen2026', 'Reset2026x'), 'tên đăng nhập'));

// ---------------------------------------------------------------------------
group('F. Mã OTP');
A.resetOtpState();
await test('O01', 'Nhập đúng mã → hợp lệ', () => { const c = A.requestOtp('x@gmail.com'); expect(A.verifyOtp('x@gmail.com', c)).toBe(''); });
await test('O02', 'Nhập sai mã → báo sai', () => { A.requestOtp('y@gmail.com'); expect(A.verifyOtp('y@gmail.com', '000000')).toContain('không đúng'); });
await test('O03', 'Mã đã dùng không dùng lại được', () => {
  const c = A.requestOtp('z@gmail.com'); A.verifyOtp('z@gmail.com', c); expect(A.verifyOtp('z@gmail.com', c)).toContain('hết hạn');
});
await test('O04', 'Mã quá 5 phút → hết hạn', () => {
  const c = A.requestOtp('t@gmail.com');
  const realNow = Date.now; Date.now = () => realNow() + 5 * 60 * 1000 + 1;
  try { expect(A.verifyOtp('t@gmail.com', c)).toContain('hết hạn'); } finally { Date.now = realNow; }
});
await test('O05', 'Gửi lại mã → mã cũ mất hiệu lực', () => {
  const old = A.requestOtp('u@gmail.com'); let fresh = A.requestOtp('u@gmail.com');
  while (fresh === old) fresh = A.requestOtp('u@gmail.com');
  expect(A.verifyOtp('u@gmail.com', old)).toContain('không đúng');
  expect(A.verifyOtp('u@gmail.com', fresh)).toBe('');
});
await test('O06', 'Mã của email A không dùng được cho email B', () => {
  const c = A.requestOtp('a1@gmail.com'); A.requestOtp('b1@gmail.com');
  if (A.verifyOtp('b1@gmail.com', c) === '' && c !== undefined) {
    // chỉ hợp lệ nếu vô tình trùng mã (xác suất 1/900000)
    throw new Error('mã chéo được chấp nhận');
  }
});
await test('O07', 'Chống dò mã: sau 5 lần sai phải hủy mã', () => {
  const c = A.requestOtp('brute@gmail.com');
  for (let i = 0; i < 5; i++) A.verifyOtp('brute@gmail.com', '000000');
  if (A.verifyOtp('brute@gmail.com', c) === '') throw new Error('vẫn chấp nhận mã đúng sau 5 lần sai → có thể dò 6 chữ số');
});

await test('O08', 'Nhập sai → báo số lần thử còn lại', () => {
  A.requestOtp('count@gmail.com');
  expect(A.verifyOtp('count@gmail.com', '000000')).toContain('Còn 4 lần');
});
await test('O09', 'Sai lần thứ 5 → báo mã đã bị hủy', () => {
  A.requestOtp('cancel@gmail.com');
  let msg = '';
  for (let i = 0; i < 5; i++) msg = A.verifyOtp('cancel@gmail.com', '000000');
  expect(msg).toContain('Mã đã bị hủy');
});
await test('O10', 'Gửi mã quá 5 lần / 15 phút cho cùng địa chỉ → chặn', async () => {
  for (let i = 0; i < 5; i++) A.requestOtp('spam@gmail.com');
  await expectThrow(() => A.requestOtp('spam@gmail.com'), 'quá nhiều lần');
});
await test('O11', 'Giới hạn gửi mã tính riêng từng địa chỉ', () => { A.requestOtp('other@gmail.com'); });
await test('O12', 'Sau 15 phút được gửi mã lại', () => {
  const realNow = Date.now; Date.now = () => realNow() + 15 * 60 * 1000 + 1;
  try { A.requestOtp('spam@gmail.com'); } finally { Date.now = realNow; }
});

// ---------------------------------------------------------------------------
group('G. Liên hệ & phiên');
await test('C01', 'Đổi email → trạng thái xác minh email bị reset', () => {
  expect(A.updateContact(hoa.id, 'email', 'hoa.moi@gmail.com').emailVerified).toBe(false);
});
await test('C02', 'Đổi sang email của tài khoản khác → chặn', () => expectThrow(() => A.updateContact(hoa.id, 'email', 'khanh@gmail.com'), 'tài khoản khác'));
await test('C03', 'Đổi SĐT → trạng thái xác minh SĐT bị reset', () => expect(A.updateContact(hoa.id, 'phone', '+84 911111111').phoneVerified).toBe(false));
await test('C04', 'Đổi email về đúng Gmail đã liên kết Google → tự xác minh', () => {
  const k = accounts().find((a: any) => a.username === 'khanh');
  A.updateContact(k.id, 'email', 'khac@gmail.com');
  expect(A.updateContact(k.id, 'email', 'KHANH@gmail.com').emailVerified).toBe(true);
});
await test('C07', 'Cập nhật email sai định dạng → chặn', () => expectThrow(() => A.updateContact(hoa.id, 'email', 'khong-phai-email'), 'không hợp lệ'));
await test('C08', 'Cập nhật SĐT sai định dạng → chặn', () => expectThrow(() => A.updateContact(hoa.id, 'phone', '12345'), 'không hợp lệ'));
await test('C05', 'Phiên của tài khoản không còn tồn tại → trả về null (tự đăng xuất)', () => expect(A.getUser('user-khong-ton-tai')).toBe(null));
await test('C06', 'Dữ liệu hỏng trong bộ nhớ không làm sập app', () => {
  store['vietgo_accounts'] = '{hỏng';
  expect(A.getUser('x')).toBe(null);
});

const report = summary('Unit – Tài khoản');
writeFileSync(new URL('./reports/report-unit-auth.json', import.meta.url), JSON.stringify(report, null, 2));
