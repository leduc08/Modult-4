// E2E: điều khiển Chrome/Edge thật (headless) trên bản build chạy ở TEST_BASE (mặc định http://localhost:3100)
// Chạy qua: npm test (run-all.mjs tự build + bật server). Đổi trình duyệt: đặt biến CHROME_PATH.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { group, test, expect, summary, REPORT_DIR } from './harness.mjs';

const BASE = process.env.TEST_BASE || 'http://localhost:3100';
const BROWSER_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].filter(Boolean);
const executablePath = BROWSER_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) throw new Error('Không tìm thấy Chrome/Edge — đặt biến CHROME_PATH');
const browser = await chromium.launch({ executablePath, headless: true });
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  globalThis.__shot = (id) => page.screenshot({ path: fileURLToPath(new URL(`./screenshots/${id}.png`, REPORT_DIR)) });
  if (opts.clock) await page.clock.install({ time: opts.clock });
  await page.goto(BASE);
  return page;
};
const ls = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key);

// ---------- helpers tài khoản ----------
const openMenu = (page) => page.getByTitle('Menu tài khoản & Tiện ích').click();
const openProfile = async (page) => {
  await openMenu(page);
  await page.locator('div.absolute.right-0.top-12 button').first().click();
};
const closeDrawer = (page) => page.mouse.click(8, 450);
const submitBtn = (page) => page.locator('form button[type=submit]').last();
const demoCode = async (page) => {
  const el = page.locator('span.tracking-widest').last();
  await page.waitForFunction(() => /^\d{6}$/.test([...document.querySelectorAll('span.tracking-widest')].pop()?.textContent ?? ''));
  return (await el.textContent()).trim();
};
const fillOtp = async (page, code) => {
  await page.locator('input[autocomplete="one-time-code"]').last().fill(code);
};
const register = async (page, { username, name, password, confirm = password, email = '', phone = '', terms = true }) => {
  await openProfile(page);
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await page.getByPlaceholder('nguyenvanan').fill(username);
  await page.getByPlaceholder('Nguyễn Văn An').fill(name);
  await page.getByPlaceholder('Tối thiểu 8 ký tự').fill(password);
  await page.getByPlaceholder('Nhập lại mật khẩu').fill(confirm);
  if (email) await page.getByPlaceholder('ten.ban@gmail.com').fill(email);
  if (phone) await page.getByPlaceholder('912 345 678').fill(phone);
  if (terms) await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
};
const login = async (page, identifier, password) => {
  await openProfile(page);
  await page.getByPlaceholder('vd: nguyenvanan').fill(identifier);
  await page.getByPlaceholder('Nhập mật khẩu').fill(password);
  await submitBtn(page).click();
};
const logout = async (page) => {
  await openProfile(page);
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await closeDrawer(page);
};

// ============================================================================
group('J. Giao diện menu & đăng ký');
{
  const page = await newPage();
  await test('E01', 'Chưa đăng nhập: đầu menu hiện "Đăng nhập / Đăng ký" (bấm được)', async () => {
    await openMenu(page);
    await page.getByText('Đăng nhập / Đăng ký').first().waitFor();
    await page.locator('div.absolute.right-0.top-12 button').first().click();
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).waitFor();
    await closeDrawer(page);
  });
  await test('E02', 'Menu chỉ còn 4 phần, không còn mục "Hồ sơ Travel DNA" rời', async () => {
    await openMenu(page);
    const texts = await page.locator('div.absolute.right-0.top-12 > button').allInnerTexts();
    expect(texts.length).toBe(4);
    expect(texts.join('|')).toContain('Danh sách yêu thích');
    expect(texts.join('|')).toContain('Quản lý chi tiêu');
    expect(texts.join('|')).toContain('Cứu hộ khẩn cấp SOS');
    if (texts.join('|').includes('Travel DNA')) throw new Error('vẫn còn mục Travel DNA');
    await openMenu(page);
  });
  await test('E03', 'Bấm "Tạo tài khoản" khi để trống → hiện lỗi từng ô', async () => {
    await openProfile(page);
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    for (const t of ['Tên đăng nhập 3–20', 'Họ và tên chỉ gồm', 'ít nhất 8 ký tự', 'Điều khoản dịch vụ để tạo']) await page.getByText(t).first().waitFor();
  });
  await test('E04', 'Họ tên chỉ 1 từ → báo nhập đầy đủ họ tên', async () => {
    await page.getByPlaceholder('Nguyễn Văn An').fill('An');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.getByText('đầy đủ họ và tên').waitFor();
  });
  await test('E05', 'Họ tên chứa mã HTML/số → bị chặn', async () => {
    await page.getByPlaceholder('Nguyễn Văn An').fill('<img src=x> An1');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.getByText('chỉ gồm chữ cái').waitFor();
  });
  await test('E06', 'Mật khẩu nhập lại không khớp → báo lỗi', async () => {
    await page.getByPlaceholder('Tối thiểu 8 ký tự').fill('Travel2026');
    await page.getByPlaceholder('Nhập lại mật khẩu').fill('Travel2027');
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await page.getByText('không khớp').waitFor();
  });
  await test('E07', 'Hiện/ẩn mật khẩu bằng nút con mắt', async () => {
    const input = page.getByPlaceholder('Tối thiểu 8 ký tự');
    expect(await input.getAttribute('type')).toBe('password');
    await page.getByTitle('Hiện mật khẩu').first().click();
    expect(await input.getAttribute('type')).toBe('text');
  });
  await test('E08', 'Bấm link "Điều khoản dịch vụ" mở văn bản và KHÔNG tích nhầm ô đồng ý', async () => {
    const box = page.locator('input[type=checkbox]');
    const before = await box.isChecked();
    await page.getByRole('button', { name: 'Điều khoản dịch vụ' }).first().click();
    await page.getByRole('dialog').getByRole('heading', { name: 'Điều khoản dịch vụ' }).waitFor();
    expect(await box.isChecked()).toBe(before);
  });
  await test('E09', 'Văn bản pháp lý: chuyển tab, tô vàng chỗ cần điền, Esc để đóng', async () => {
    await page.getByRole('dialog').getByRole('button', { name: 'Chính sách quyền riêng tư' }).click();
    await page.getByRole('dialog').getByRole('heading', { name: 'Chính sách quyền riêng tư' }).waitFor();
    if ((await page.locator('mark').count()) === 0) throw new Error('không thấy chỗ tô vàng');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
  });
  await test('E10', 'Tab Đăng ký KHÔNG có nút Google', async () => {
    expect(await page.getByText('Tiếp tục với Google').count() + await page.locator('iframe[src*="accounts.google.com"]').count()).toBe(0);
  });
  await test('E11', 'Tab Đăng nhập CÓ nút Google (đã cấu hình Client ID)', async () => {
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).first().click();
    await page.waitForFunction(() => document.querySelector('iframe[src*="accounts.google.com"]') || [...document.querySelectorAll('span')].some((s) => s.textContent === 'Tiếp tục với Google'));
  });
  await closeDrawer(page);

  await test('E12', 'Đăng ký thành công → vào Hồ sơ: tên, @username, "Chưa xác minh"', async () => {
    await register(page, { username: 'tester.an', name: 'Nguyễn Văn An', password: 'Travel2026', email: 'tester.an@gmail.com' });
    await page.getByText('@tester.an').first().waitFor();
    await page.getByText('Chưa xác minh').first().waitFor();
  });
  await test('E13', 'Navbar hiện chữ viết tắt "VA" sau khi đăng nhập', async () => {
    await closeDrawer(page);
    await page.getByTitle('Menu tài khoản & Tiện ích').getByText('VA').waitFor();
  });
  await test('E14', 'Tải lại trang vẫn giữ đăng nhập', async () => {
    await page.reload();
    await openMenu(page);
    await page.getByText('Nguyễn Văn An').first().waitFor();
    await openMenu(page);
  });
  await test('E15', 'Hồ sơ gộp: Thông tin cá nhân ở trên, Travel DNA ở dưới', async () => {
    await openProfile(page);
    const info = await page.getByText('Thông tin cá nhân').boundingBox();
    const dna = await page.getByText('Hồ sơ Travel DNA').first().boundingBox();
    if (!(info && dna && info.y < dna.y)) throw new Error('thứ tự sai');
  });
  await test('E16', 'Travel DNA: "Ăn chay" và "Thích hải sản" loại trừ nhau', async () => {
    await page.getByRole('button', { name: 'Thích hải sản' }).click();
    await page.getByRole('button', { name: 'Ăn chay / Thuần chay' }).click();
    const seafood = await page.getByRole('button', { name: 'Thích hải sản' }).getAttribute('class');
    if (seafood.includes('bg-[#FF385C]')) throw new Error('cả hai cùng được chọn');
  });
  await test('E17', 'Nhập sai OTP khi xác minh email → báo sai mã', async () => {
    await page.getByRole('button', { name: 'Xác minh' }).first().click();
    await demoCode(page);
    await fillOtp(page, '000000');
    await page.getByRole('button', { name: 'Xác minh', exact: true }).last().click();
    await page.getByText('không đúng').waitFor();
  });
  await test('E18', 'Nhập đúng OTP → email "Đã xác minh", badge "Đã xác thực"', async () => {
    await fillOtp(page, await demoCode(page));
    await page.getByRole('button', { name: 'Xác minh', exact: true }).last().click();
    await page.getByText('Đã xác minh').first().waitFor();
    await page.getByText('Đã xác thực').first().waitFor();
  });
  await test('E19', 'Thêm SĐT trong hồ sơ → lưu & xác minh bằng OTP', async () => {
    await page.getByTitle('Thêm').click();
    await page.getByPlaceholder('912 345 678').fill('0912345678');
    await page.getByRole('button', { name: 'Lưu & gửi mã xác minh' }).click();
    await fillOtp(page, await demoCode(page));
    await page.getByRole('button', { name: 'Xác minh', exact: true }).last().click();
    await page.waitForFunction(() => JSON.parse(localStorage.vietgo_accounts).find((a) => a.username === 'tester.an')?.phoneVerified === true);
    await page.getByText('+84 912345678').first().waitFor();
  });
  await test('E20', 'Đổi mật khẩu: sai mật khẩu hiện tại → báo lỗi', async () => {
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();
    await page.getByPlaceholder('Mật khẩu hiện tại').fill('SaiRoi2026');
    await page.getByPlaceholder('Mật khẩu mới (≥ 8 ký tự, có chữ và số)').fill('NewTravel2026');
    await page.getByPlaceholder('Nhập lại mật khẩu mới').fill('NewTravel2026');
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
    await page.getByText('Mật khẩu hiện tại không đúng').waitFor();
  });
  await test('E21', 'Đổi mật khẩu đúng → thông báo thành công', async () => {
    await page.getByPlaceholder('Mật khẩu hiện tại').fill('Travel2026');
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
    await page.getByText('Đã đổi mật khẩu').waitFor();
  });
  await test('E22', 'Đăng xuất → menu quay về "Đăng nhập / Đăng ký"', async () => {
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await closeDrawer(page);
    await openMenu(page);
    await page.getByText('Đăng nhập / Đăng ký').first().waitFor();
    await openMenu(page);
  });
  await test('E23', 'Đăng ký trùng tên đăng nhập → báo lỗi', async () => {
    await register(page, { username: 'tester.an', name: 'Trần Văn Bình', password: 'Travel2026' });
    await page.getByText('đã được sử dụng').waitFor();
    await closeDrawer(page);
  });

  // ------------------------------------------------------------------------
  group('K. Giao diện đăng nhập & khôi phục');
  await test('E24', 'Đăng nhập bằng mật khẩu mới (sau khi đổi)', async () => {
    await page.reload();
    await login(page, 'tester.an', 'NewTravel2026');
    await page.getByText('@tester.an').first().waitFor();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await closeDrawer(page);
  });
  await test('E25', 'Đăng nhập bằng SĐT đã lưu', async () => {
    await page.reload();
    await login(page, '0912345678', 'NewTravel2026');
    await page.getByText('@tester.an').first().waitFor();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await closeDrawer(page);
  });
  await test('E26', 'Sai mật khẩu → báo lỗi và xóa ô mật khẩu', async () => {
    await page.reload();
    await login(page, 'tester.an', 'Sai123456');
    await page.getByText('không đúng').waitFor();
    expect(await page.getByPlaceholder('Nhập mật khẩu').inputValue()).toBe('');
  });
  await test('E27', 'Sai 5 lần → khóa 5 phút, mật khẩu đúng cũng bị chặn', async () => {
    for (let i = 0; i < 4; i++) {
      await page.getByPlaceholder('Nhập mật khẩu').fill('Sai123456');
      await submitBtn(page).click();
      await page.waitForTimeout(150);
    }
    await page.getByText('tạm khóa').first().waitFor();
    await page.getByPlaceholder('Nhập mật khẩu').fill('NewTravel2026');
    await submitBtn(page).click();
    await page.getByText('tạm khóa').first().waitFor();
  });
  await test('E28', 'Quên mật khẩu qua email đã xác minh → đặt mật khẩu mới → đăng nhập được', async () => {
    await page.reload();
    await openProfile(page);
    await page.getByRole('button', { name: 'Quên mật khẩu?' }).click();
    await page.getByPlaceholder('Tên đăng nhập / email / SĐT').fill('tester.an@gmail.com');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByRole('button', { name: /Gửi mã qua Gmail/ }).click();
    await fillOtp(page, await demoCode(page));
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    await page.getByPlaceholder('Tối thiểu 8 ký tự, có chữ và số').fill('Recover2026');
    await page.getByPlaceholder('Nhập lại mật khẩu').fill('Recover2026');
    await page.getByRole('button', { name: 'Lưu mật khẩu mới' }).click();
    await page.getByText('Đặt lại mật khẩu thành công').waitFor();
    await page.getByPlaceholder('vd: nguyenvanan').fill('tester.an');
    await page.getByPlaceholder('Nhập mật khẩu').fill('Recover2026');
    await submitBtn(page).click();
    await page.getByText('@tester.an').first().waitFor();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await closeDrawer(page);
  });
  await test('E29', 'Quên mật khẩu với tài khoản chưa xác minh → báo không khôi phục được', async () => {
    await page.reload();
    await register(page, { username: 'chua.xacminh', name: 'Lê Văn Cường', password: 'Travel2026', email: 'cuong@gmail.com' });
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await page.getByRole('button', { name: 'Quên mật khẩu?' }).click();
    await page.getByPlaceholder('Tên đăng nhập / email / SĐT').fill('chua.xacminh');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByText('chưa xác minh email hoặc số điện thoại').waitFor();
    await closeDrawer(page);
  });
  await test('E30', 'Đăng nhập sai với tài khoản KHÔNG tồn tại → cùng thông báo như sai mật khẩu', async () => {
    await page.reload();
    await login(page, 'khong.ton.tai', 'Sai123456');
    const msg = await page.getByText('Tên đăng nhập hoặc mật khẩu không đúng').first().innerText();
    expect(msg).toContain('sai 5 lần');
    await closeDrawer(page);
  });
  await test('E31', 'Nhập sai OTP 5 lần → mã bị hủy, phải gửi mã mới', async () => {
    await page.reload();
    await openProfile(page);
    await page.getByRole('button', { name: 'Quên mật khẩu?' }).click();
    await page.getByPlaceholder('Tên đăng nhập / email / SĐT').fill('tester.an');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    const gmail = page.getByRole('button', { name: /Gửi mã qua Gmail/ });
    if (await gmail.count()) await gmail.click();
    await demoCode(page);
    for (let i = 0; i < 5; i++) {
      await fillOtp(page, '000000');
      await page.getByRole('button', { name: 'Xác nhận' }).click();
      await page.waitForTimeout(800);
    }
    await page.getByText('Mã đã bị hủy').waitFor();
    await closeDrawer(page);
  });
  await page.context().close();
}

// ============================================================================
// QUẢN LÝ CHI TIÊU
// ============================================================================
const TRIP = { id: 't1', name: 'Chuyến Test', destination: 'Đà Nẵng', duration: '4 ngày 3 đêm', startDate: '2026-10-15', endDate: '2026-10-18', totalBudget: 1000000, createdAt: '28/09/2026' };
const seedBudget = async (page, { trips = [TRIP], expenses = { t1: [] }, current = 't1' } = {}) => {
  await page.evaluate(({ trips, expenses, current }) => {
    localStorage.setItem('vietgo_budget_trips', JSON.stringify(trips));
    localStorage.setItem('vietgo_budget_expenses', JSON.stringify(expenses));
    localStorage.setItem('vietgo_current_trip_id', current);
  }, { trips, expenses, current });
  await page.reload();
};
const openBudget = async (page) => {
  await openMenu(page);
  await page.locator('div.absolute.right-0.top-12').getByText('Quản lý chi tiêu').click();
  await page.getByText('Ngân sách chuyến đi').first().waitFor();
};
const expensesOf = async (page, trip = 't1') => ((await ls(page, 'vietgo_budget_expenses')) ?? {})[trip] ?? [];
const addExpense = async (page, title, amount) => {
  await page.getByRole('button', { name: 'Thêm chi tiêu' }).click();
  await page.getByPlaceholder('VD: Cơm niêu Đà Nẵng, Tiền homestay, Thuê xe máy...').fill(title);
  await page.getByPlaceholder('VD: 250000').fill(String(amount));
  await page.getByRole('button', { name: '+ Lưu khoản chi vào sổ' }).click();
  await page.waitForTimeout(200);
};
const closeModal = async (page) => { await page.reload(); await openBudget(page); };
const fresh = closeModal;
const currentTrip = (page) => page.evaluate(() => localStorage.getItem('vietgo_current_trip_id'));

group('L. Quản lý chi tiêu – khoản chi');
{
  const page = await newPage();
  await seedBudget(page);
  await test('B01', 'Mở "Quản lý chi tiêu" từ menu', () => openBudget(page));
  await test('B02', 'Thêm khoản chi hợp lệ → lưu, cập nhật Đã chi / Còn lại', async () => {
    await addExpense(page, 'Bún chả cá', 150000);
    expect((await expensesOf(page)).length).toBe(1);
    await page.getByText('Bún chả cá').waitFor();
    await page.getByText('850.000').first().waitFor();
  });
  await test('B03', 'Tên khoản chi trống → không lưu', async () => {
    await fresh(page);
    await addExpense(page, '', 50000);
    expect((await expensesOf(page)).length).toBe(1);
    await closeModal(page);
  });
  await test('B04', 'Tên chỉ có khoảng trắng → không lưu', async () => {
    await fresh(page);
    await addExpense(page, '    ', 50000);
    expect((await expensesOf(page)).length).toBe(1);
    await closeModal(page);
  });
  await test('B05', 'Số tiền = 0 → không lưu', async () => {
    await fresh(page);
    await addExpense(page, 'Miễn phí', 0);
    expect((await expensesOf(page)).length).toBe(1);
  });
  await test('B06', 'Số tiền không hợp lệ → có thông báo lỗi cho người dùng', async () => {
    const msg = await page.locator('form').last().innerText();
    if (!/không hợp lệ|lớn hơn 0|phải/i.test(msg)) throw new Error('form im lặng, không báo vì sao không lưu');
    await closeModal(page);
  });
  await test('B07', 'Số tiền âm → không lưu', async () => {
    await fresh(page);
    await addExpense(page, 'Âm tiền', -50000);
    expect((await expensesOf(page)).length).toBe(1);
    await closeModal(page);
  });
  await test('B08', 'Số tiền lẻ 1000.5 → không lưu (VNĐ không có số lẻ)', async () => {
    await fresh(page);
    await addExpense(page, 'Tiền lẻ', '1000.5');
    expect((await expensesOf(page)).length).toBe(1);
    await closeModal(page);
  });
  await test('B09', 'Số tiền phi thực tế (1 triệu tỷ) → bị chặn', async () => {
    await fresh(page);
    await addExpense(page, 'Siêu lớn', '1000000000000000');
    const n = (await expensesOf(page)).length;
    if (n !== 1) { await page.evaluate(() => { const e = JSON.parse(localStorage.vietgo_budget_expenses); e.t1 = e.t1.filter((x) => x.title !== 'Siêu lớn'); localStorage.vietgo_budget_expenses = JSON.stringify(e); }); await closeModal(page); throw new Error('đã lưu 1.000.000.000.000.000 ₫'); }
    await closeModal(page);
  });
  await test('B10', 'Tên khoản chi quá dài (500 ký tự) → bị giới hạn', async () => {
    await fresh(page);
    await addExpense(page, 'A'.repeat(500), 1000);
    const list = await expensesOf(page);
    const long = list.find((x) => x.title.length >= 500);
    if (long) { await page.evaluate(() => { const e = JSON.parse(localStorage.vietgo_budget_expenses); e.t1 = e.t1.filter((x) => x.title.length < 500); localStorage.vietgo_budget_expenses = JSON.stringify(e); }); await closeModal(page); throw new Error('lưu nguyên 500 ký tự, không giới hạn'); }
    await closeModal(page);
  });
  await test('B11', 'Sửa số tiền khoản chi → tổng cập nhật', async () => {
    await seedBudget(page, { expenses: { t1: [{ id: 'e1', tripId: 't1', title: 'Bún chả cá', amount: 150000, category: 'food', date: '28/09', paymentMethod: 'cash' }] } });
    await openBudget(page);
    await page.getByTitle('Chỉnh sửa giá tiền, địa điểm, phương thức thanh toán').first().click();
    await page.getByPlaceholder('VD: 350000').fill('200000');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    expect((await expensesOf(page))[0].amount).toBe(200000);
    await page.getByText('800.000').first().waitFor();
  });
  await test('B12', 'Sửa số tiền thành 0 → không lưu, giữ giá trị cũ', async () => {
    await fresh(page);
    await page.getByTitle('Chỉnh sửa giá tiền, địa điểm, phương thức thanh toán').first().click();
    await page.getByPlaceholder('VD: 350000').fill('0');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    expect((await expensesOf(page))[0].amount).toBe(200000);
    await closeModal(page);
  });
  await test('B13', 'Vượt ngân sách → cảnh báo "Vượt ngân sách", thanh % không quá 100%', async () => {
    await fresh(page);
    await addExpense(page, 'Khách sạn', 1500000);
    await page.getByText('Vượt ngân sách').first().waitFor();
    await page.getByText('100% ngân sách').waitFor();
  });
  await test('B14', 'Tìm kiếm không phân biệt hoa thường ("KHÁCH")', async () => {
    await fresh(page);
    await page.getByPlaceholder('Tìm khoản chi...').fill('KHÁCH');
    await page.getByText('Khách sạn').waitFor();
    expect(await page.getByText('Bún chả cá').count()).toBe(0);
  });
  await test('B15', 'Tìm kiếm không dấu ("bun cha") vẫn ra "Bún chả cá"', async () => {
    await page.getByPlaceholder('Tìm khoản chi...').fill('bun cha');
    await page.getByText('Bún chả cá').waitFor({ timeout: 2000 });
  });
  await test('B16', 'Xóa khoản chi → hỏi xác nhận trước khi xóa', async () => {
    await fresh(page);
    await page.getByPlaceholder('Tìm khoản chi...').fill('');
    let asked = false;
    page.once('dialog', (d) => { asked = true; d.dismiss(); });
    await page.getByTitle('Xóa khoản chi này').first().click();
    await page.waitForTimeout(300);
    if (!asked) throw new Error(`xóa ngay không hỏi (còn ${(await expensesOf(page)).length} khoản)`);
  });
  await test('B17', 'Xóa khoản chi → tổng giảm tương ứng', async () => {
    await fresh(page);
    const before = await expensesOf(page);
    page.once('dialog', (d) => d.accept());
    await page.getByTitle('Xóa khoản chi này').first().click();
    await page.waitForTimeout(300);
    const after = await expensesOf(page);
    expect(after.length).toBe(before.length - 1);
  });
  await test('B18', 'Dữ liệu còn nguyên sau khi tải lại trang', async () => {
    await seedBudget(page); await openBudget(page);
    await addExpense(page, 'Vé Bà Nà Hills', 900000);
    const before = await expensesOf(page);
    await page.reload(); await openBudget(page);
    expect((await expensesOf(page)).length).toBe(before.length);
    await page.getByText(before[0].title).first().waitFor();
  });
  await page.context().close();
}

group('M. Quản lý chi tiêu – ngân sách & chuyến đi');
{
  const page = await newPage();
  await seedBudget(page);
  await openBudget(page);
  const trips = () => ls(page, 'vietgo_budget_trips');
  await test('T01', 'Đổi ngân sách hợp lệ (5 triệu) → cập nhật', async () => {
    await fresh(page);
    await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
    await page.locator('form:has-text("Số tiền ngân sách mới") input').fill('5000000');
    await page.getByRole('button', { name: 'Cập nhật ngân sách' }).click();
    expect((await trips())[0].totalBudget).toBe(5000000);
  });
  await test('T02', 'Đổi ngân sách thành số âm → không lưu', async () => {
    await fresh(page);
    await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
    await page.locator('form:has-text("Số tiền ngân sách mới") input').fill('-1000');
    await page.getByRole('button', { name: 'Cập nhật ngân sách' }).click();
    expect((await trips())[0].totalBudget).toBe(5000000);
    await closeModal(page);
  });
  await test('T03', 'Tạo chuyến mới hợp lệ → chuyển sang chuyến mới, tính đúng "4 ngày 3 đêm"', async () => {
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    await page.getByRole('button', { name: 'Tạo thêm chuyến đi mới' }).click();
    await page.getByPlaceholder('VD: Kỳ nghỉ Phú Quốc, Săn mây Tà Xùa...').fill('Phú Quốc 2026');
    await page.getByPlaceholder('VD: 6000000').fill('7000000');
    await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
    const t = (await trips()).find((x) => x.name === 'Phú Quốc 2026');
    expect(t.totalBudget).toBe(7000000);
    expect(t.duration).toBe('4 ngày 3 đêm');
    expect(await currentTrip(page)).toBe(t.id);
  });
  await test('T04', 'Chi tiêu tách riêng theo từng chuyến', async () => {
    await addExpense(page, 'Vé cáp treo', 600000);
    const cur = await currentTrip(page);
    expect((await expensesOf(page, cur)).length).toBe(1);
    expect((await expensesOf(page, 't1')).length).toBe(0);
  });
  await test('T05', 'Tạo chuyến với tên trống → không tạo', async () => {
    await fresh(page);
    const n = (await trips()).length;
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    await page.getByRole('button', { name: 'Tạo thêm chuyến đi mới' }).click();
    await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
    expect((await trips()).length).toBe(n);
    await closeModal(page);
  });
  await test('T06', 'Tạo chuyến với ngân sách âm → bị chặn', async () => {
    await fresh(page);
    const n = (await trips()).length;
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    await page.getByRole('button', { name: 'Tạo thêm chuyến đi mới' }).click();
    await page.getByPlaceholder('VD: Kỳ nghỉ Phú Quốc, Săn mây Tà Xùa...').fill('Ngân sách âm');
    await page.getByPlaceholder('VD: 6000000').fill('-5000000');
    await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
    const t = (await trips()).find((x) => x.name === 'Ngân sách âm');
    if (t) throw new Error(`đã tạo chuyến với ngân sách ${t.totalBudget.toLocaleString('vi-VN')} ₫`);
    expect((await trips()).length).toBe(n);
    await closeModal(page);
  });
  await test('T07', 'Tạo chuyến với ngân sách 0 → báo lỗi (không tự đổi giá trị)', async () => {
    await fresh(page);
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    await page.getByRole('button', { name: 'Tạo thêm chuyến đi mới' }).click();
    await page.getByPlaceholder('VD: Kỳ nghỉ Phú Quốc, Săn mây Tà Xùa...').fill('Ngân sách không');
    await page.getByPlaceholder('VD: 6000000').fill('0');
    await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
    const t = (await trips()).find((x) => x.name === 'Ngân sách không');
    if (t) throw new Error(`nhập 0 nhưng âm thầm lưu thành ${t.totalBudget.toLocaleString('vi-VN')} ₫`);
    await page.getByText('Ngân sách phải lớn hơn 0').waitFor();
    await closeModal(page);
  });
  await test('T08', 'Xóa chuyến → hỏi xác nhận; bấm Hủy thì giữ nguyên', async () => {
    await fresh(page);
    const n = (await trips()).length;
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    page.once('dialog', (d) => d.dismiss());
    await page.getByTitle('Xóa chuyến đi này').first().click();
    await page.waitForTimeout(200);
    expect((await trips()).length).toBe(n);
  });
  await test('T09', 'Xóa chuyến (đồng ý) → xóa cả chi tiêu của chuyến đó', async () => {
    const list = await trips();
    const victim = list.find((x) => x.name === 'Phú Quốc 2026');
    page.once('dialog', (d) => d.accept());
    await page.getByTitle('Xóa chuyến đi này').nth(list.indexOf(victim)).click();
    await page.waitForTimeout(300);
    if ((await trips()).some((x) => x.id === victim.id)) throw new Error('chuyến vẫn còn');
    if ((await ls(page, 'vietgo_budget_expenses'))[victim.id]) throw new Error('chi tiêu của chuyến vẫn còn');
  });
  await test('T10', 'Không cho xóa chuyến duy nhất còn lại', async () => {
    await seedBudget(page); await openBudget(page);
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    let msg = '';
    page.once('dialog', (d) => { msg = d.message(); d.accept(); });
    await page.getByTitle('Xóa chuyến đi này').first().click();
    await page.waitForTimeout(300);
    expect(msg).toContain('Không thể xóa chuyến đi duy nhất');
    expect((await trips()).length).toBe(1);
  });
  await test('T11', 'Sửa lịch trình: 15/10 → 20/10 tính đúng "6 ngày 5 đêm"', async () => {
    await fresh(page);
    await page.getByTitle('Bấm để chọn lịch trình chuyến đi').click();
    await page.locator('form:has-text("Lưu lịch trình") input[type=date]').nth(1).fill('2026-10-20');
    await page.getByRole('button', { name: 'Lưu lịch trình' }).click();
    expect((await trips())[0].duration).toBe('6 ngày 5 đêm');
  });
  await test('T13', 'Tạo chuyến trùng tên (khác dấu/hoa thường) → báo lỗi', async () => {
    await seedBudget(page); await openBudget(page);
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    await page.getByRole('button', { name: 'Tạo thêm chuyến đi mới' }).click();
    await page.getByPlaceholder('VD: Kỳ nghỉ Phú Quốc, Săn mây Tà Xùa...').fill('chuyen TEST');
    await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
    await page.getByText('trùng tên').waitFor();
    expect((await trips()).length).toBe(1);
  });
  await test('T14', 'Tạo chuyến ngân sách > 10 tỷ → báo lỗi', async () => {
    await fresh(page);
    await page.getByRole('button', { name: 'Đổi chuyến' }).click();
    await page.getByRole('button', { name: 'Tạo thêm chuyến đi mới' }).click();
    await page.getByPlaceholder('VD: Kỳ nghỉ Phú Quốc, Săn mây Tà Xùa...').fill('Siêu sang');
    await page.getByPlaceholder('VD: 6000000').fill('20000000000');
    await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
    await page.getByText('không được vượt quá').waitFor();
  });
  await test('T15', 'Sửa lịch trình dài hơn 90 ngày → báo lỗi, không lưu', async () => {
    await fresh(page);
    await page.getByTitle('Bấm để chọn lịch trình chuyến đi').click();
    await page.locator('form:has-text("Lưu lịch trình") input[type=date]').nth(1).fill('2027-03-01');
    await page.getByRole('button', { name: 'Lưu lịch trình' }).click();
    await page.getByText('tối đa 90 ngày').waitFor();
    expect((await trips())[0].endDate).toBe('2026-10-18');
  });
  await test('T12', 'Chuyến đã bắt đầu (ngày đi trong quá khứ) vẫn sửa được ngày về', async () => {
    await seedBudget(page, { trips: [{ ...TRIP, startDate: '2026-09-20', endDate: '2026-09-25' }] });
    await openBudget(page);
    await page.getByTitle('Bấm để chọn lịch trình chuyến đi').click();
    await page.locator('form:has-text("Lưu lịch trình") input[type=date]').nth(1).fill('2026-09-27');
    await page.getByRole('button', { name: 'Lưu lịch trình' }).click();
    await page.waitForTimeout(300);
    const t = (await trips())[0];
    if (t.endDate !== '2026-09-27') throw new Error('không lưu được: ô "Ngày đi" có min = hôm nay nên form bị trình duyệt chặn');
  });
  await page.context().close();
}

group('N. Quản lý chi tiêu – hóa đơn, CSV, dữ liệu');
{
  const page = await newPage();
  await seedBudget(page);
  await openBudget(page);
  await test('R01x', 'Quét hóa đơn mẫu (Demo 1) → lưu khoản 485.000 ₫', async () => {
    await page.getByRole('button', { name: 'Thêm chi tiêu' }).click();
    await page.getByRole('button', { name: 'Tải ảnh hóa đơn' }).click();
    await page.getByRole('button', { name: /Quét & Bóc tách Demo 1/ }).click();
    await page.getByRole('button', { name: /Lưu ngay vào Sổ chi tiêu|Xác nhận lưu khoản chi này/ }).last().click();
    const list = await expensesOf(page);
    expect(list[0].amount).toBe(485000);
    expect(list[0].note).toBe('Hóa đơn mẫu (Demo)');
  });
  const confirmBtn = () => page.getByRole('button', { name: /Lưu ngay vào Sổ chi tiêu|Xác nhận lưu khoản chi này/ }).last();
  const uploadReceipt = async (file) => {
    await page.getByRole('button', { name: 'Thêm chi tiêu' }).click();
    await page.getByRole('button', { name: 'Tải ảnh hóa đơn' }).click();
    await page.locator('input[type=file]').last().setInputFiles(file);
  };
  // Ảnh hóa đơn giả lập cỡ ảnh chụp điện thoại (3000×4000, nhiều dòng chữ + nhiễu nhẹ) do trình duyệt vẽ
  const bigPng = async () => Buffer.from(
    (await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 3000; c.height = 4000;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#222'; ctx.font = '48px monospace';
      for (let y = 120; y < 3900; y += 64) ctx.fillText(`Mon an so ${y} ........ ${(y * 137) % 999}.000 d`, 150, y);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() * 24) | 0; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL('image/jpeg', 0.95);
    })).split(',')[1], 'base64');
  const tinyPng = { name: 'hoa-don.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') };

  await test('R02x', 'AI không chạy → báo lỗi rõ ràng, KHÔNG tự bịa số tiền', async () => {
    await fresh(page);
    await uploadReceipt(tinyPng);
    await page.getByText('chưa được bật').waitFor({ timeout: 10000 });
    if (await page.getByText('320.000').count()) throw new Error('vẫn hiển thị số tiền giả 320.000 ₫');
    expect(await confirmBtn().count()).toBe(0);
  });
  await test('R03x', 'Nhập tay & giữ ảnh → lưu kèm ảnh, không ghi "đã xác thực AI"', async () => {
    await page.getByRole('button', { name: 'Nhập số tiền thủ công & giữ ảnh hóa đơn' }).click();
    await page.getByText('Đã đính kèm ảnh hóa đơn').waitFor();
    await page.getByPlaceholder('VD: Cơm niêu Đà Nẵng, Tiền homestay, Thuê xe máy...').fill('Nhà hàng hải sản');
    await page.getByPlaceholder('VD: 250000').fill('420000');
    await page.getByRole('button', { name: '+ Lưu khoản chi vào sổ' }).click();
    const item = (await expensesOf(page))[0];
    expect(item.amount).toBe(420000);
    expect(!!item.receiptImage).toBe(true);
    expect(item.note ?? '').notToContain('xác thực AI');
  });
  await test('R04x', 'Lưu 3 hóa đơn ảnh lớn → ảnh được nén, không mất dữ liệu sau khi tải lại', async () => {
    await seedBudget(page);
    await openBudget(page);
    const buffer = await bigPng();
    if (buffer.length < 2 * 1024 * 1024) throw new Error(`ảnh test chỉ ${(buffer.length / 1048576).toFixed(1)}MB — chưa đủ lớn`);
    for (const n of [1, 2, 3]) {
      await uploadReceipt({ name: `anh${n}.jpg`, mimeType: 'image/jpeg', buffer });
      await page.getByRole('button', { name: 'Nhập số tiền thủ công & giữ ảnh hóa đơn' }).click({ timeout: 15000 });
      await page.getByPlaceholder('VD: Cơm niêu Đà Nẵng, Tiền homestay, Thuê xe máy...').fill(`Hóa đơn ${n}`);
      await page.getByPlaceholder('VD: 250000').fill('100000');
      await page.getByRole('button', { name: '+ Lưu khoản chi vào sổ' }).click();
      await page.waitForTimeout(300);
    }
    await page.reload(); await openBudget(page);
    const list = await expensesOf(page);
    if (list.length !== 3) throw new Error(`sau khi tải lại còn ${list.length}/3 khoản`);
    const maxKb = Math.max(...list.map((e) => (e.receiptImage?.length ?? 0) / 1024));
    expect(maxKb).toBeLessThan(1500);
    console.log(`       (ảnh gốc ${(buffer.length / 1024 / 1024).toFixed(1)}MB → lưu ${maxKb.toFixed(0)}KB)`);
  });
  await test('R14x', 'Bộ nhớ đầy → hiện cảnh báo "chưa được lưu" (không mất dữ liệu âm thầm)', async () => {
    await fresh(page);
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (String(k).startsWith('vietgo_budget_expenses')) throw new DOMException('Quota exceeded', 'QuotaExceededError');
        return orig.call(this, k, v);
      };
    });
    await addExpense(page, 'Không lưu được', 50000);
    await page.getByText('Bộ nhớ trình duyệt đã đầy').waitFor();
    await page.reload(); await openBudget(page);
  });
  await test('R10x', 'File hỏng (không phải ảnh thật) → báo không đọc được ảnh', async () => {
    await fresh(page);
    await uploadReceipt({ name: 'gia.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(50_000, 7) });
    await page.getByText('Không đọc được ảnh').waitFor();
  });
  await test('R11x', 'File PDF → báo chỉ hỗ trợ ảnh', async () => {
    await fresh(page);
    await uploadReceipt({ name: 'hoa-don.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
    await page.getByText('Chỉ hỗ trợ ảnh').waitFor();
  });
  await test('R05x', 'Xuất CSV: tên có dấu phẩy / ngoặc kép vẫn đúng cột', async () => {
    await fresh(page);
    await seedBudget(page, { expenses: { t1: [{ id: 'e1', tripId: 't1', title: 'Cơm "niêu", Hội An', amount: 120000, category: 'food', date: '28/09', paymentMethod: 'cash', note: 'chia 2, mỗi người 60k' }] } });
    await openBudget(page);
    await page.getByRole('button', { name: /Tùy chọn/ }).click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('Xuất báo cáo chi tiêu (CSV)').click()]);
    const csv = readFileSync(await dl.path(), 'utf8');
    const row = csv.replace(/^\uFEFF/, '').split('\n')[1];
    // CSV chuẩn RFC 4180: ngoặc kép trong ô phải nhân đôi
    if (!row.includes('"Cơm ""niêu"", Hội An"')) throw new Error(`dòng CSV hỏng: ${row}`);
  });
  await test('R06x', 'Xuất CSV mở bằng Excel không lỗi font tiếng Việt (có BOM UTF-8)', async () => {
    await fresh(page);
    await page.getByRole('button', { name: /Tùy chọn/ }).click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('Xuất báo cáo chi tiêu (CSV)').click()]);
    const buf = readFileSync(await dl.path());
    if (!(buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf)) throw new Error('thiếu BOM → Excel hiển thị "CÆ¡m niÃªu"');
  });
  await test('R07x', 'Xuất CSV chặn chèn công thức Excel (tên bắt đầu bằng "=")', async () => {
    await seedBudget(page, { expenses: { t1: [{ id: 'e2', tripId: 't1', title: '=HYPERLINK("http://x","Bấm")', amount: 1000, category: 'other', date: '', paymentMethod: 'cash' }] } });
    await openBudget(page);
    await page.getByRole('button', { name: /Tùy chọn/ }).click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('Xuất báo cáo chi tiêu (CSV)').click()]);
    const row = readFileSync(await dl.path(), 'utf8').replace(/^\uFEFF/, '').split('\n')[1];
    if (/,"=/.test(row)) throw new Error('ô bắt đầu bằng "=" → Excel sẽ chạy như công thức');
  });
  await page.context().close();
}
{
  const page = await newPage({ clock: new Date('2026-09-28T10:00:00+07:00') });
  await seedBudget(page);
  await openBudget(page);
  await test('R08x', 'Khoản chi hôm qua không còn hiển thị "Hôm nay"', async () => {
    await addExpense(page, 'Cà phê sáng', 30000);
    await page.clock.setSystemTime(new Date('2026-09-30T10:00:00+07:00'));
    await page.reload(); await openBudget(page);
    const label = (await expensesOf(page))[0].date;
    if (/Hôm nay/.test(label)) throw new Error(`2 ngày sau vẫn ghi "${label}" — ngày được lưu dạng chữ cố định`);
  });
  await page.context().close();
}
{
  const page = await newPage();
  await seedBudget(page);
  await test('R09x', 'Chi tiêu của tài khoản A không hiện cho tài khoản B cùng máy', async () => {
    await register(page, { username: 'user.a', name: 'Người Dùng A', password: 'Travel2026' });
    await closeDrawer(page);
    await openBudget(page);
    await addExpense(page, 'Chi tiêu riêng của A', 999000);
    await logout(page);
    await register(page, { username: 'user.b', name: 'Người Dùng B', password: 'Travel2026' });
    await closeDrawer(page);
    await openBudget(page);
    if (await page.getByText('Chi tiêu riêng của A').count()) throw new Error('B thấy chi tiêu của A (dữ liệu chi tiêu không gắn với tài khoản)');
  });
  await test('R12x', 'A đăng nhập lại → vẫn thấy đúng chi tiêu của mình', async () => {
    await logout(page);
    await login(page, 'user.a', 'Travel2026');
    await closeDrawer(page);
    await openBudget(page);
    await page.getByText('Chi tiêu riêng của A').waitFor();
  });
  await test('R13x', 'Khách (chưa đăng nhập) không thấy chi tiêu của A', async () => {
    await logout(page);
    await openBudget(page);
    expect(await page.getByText('Chi tiêu riêng của A').count()).toBe(0);
  });
  await page.context().close();
}

await browser.close();
const report = summary('E2E – Giao diện');
writeFileSync(new URL('./reports/report-e2e.json', import.meta.url), JSON.stringify(report, null, 2));
