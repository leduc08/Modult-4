# Technical Guidelines — React Native

Best practices bắt buộc tuân thủ khi phát triển ứng dụng React Native / Expo. Đọc kỹ tài liệu này trước khi tạo hoặc chỉnh sửa bất kỳ component hay service nào.

---

## 🚀 Performance & Rendering

- **List dài**: LUÔN dùng `FlatList` hoặc `SectionList`, TUYỆT ĐỐI KHÔNG dùng `ScrollView + .map()`.
  - `keyExtractor`: Trả về ID duy nhất và ổn định (không dùng array index).
  - `getItemLayout`: Khi item có chiều cao cố định để bỏ qua đo đạc layout, tăng tốc độ cuộn.
  - Wrap item component bằng `React.memo` nếu danh sách có trên 20 phần tử.
  - Thiết lập `windowSize={10}`, `maxToRenderPerBatch={10}` khi tối ưu hóa.
- **List rất lớn (> 1000 items)**: Cân nhắc sử dụng `FlashList` từ `@shopify/flash-list`.
- **`useMemo`**:
  - Dùng cho tính toán nặng (> 1ms): lọc, sắp xếp, tính toán mảng dữ liệu.
  - Dùng cho object/array truyền xuống component bọc `React.memo` hoặc Context Provider.
  - Đảm bảo dependencies array đầy đủ và ổn định.
- **`useCallback`**: Dùng cho function truyền xuống memoized child component hoặc function nằm trong deps của effect.
- **Tránh inline objects/functions** khi truyền tới component đã memoize:
  - ❌ `<Item onPress={() => handle(id)} style={{ padding: 10 }} />`
  - ✅ `useCallback` + trích xuất ra `StyleSheet.create()`.
- **`StyleSheet.create()`**: LUÔN đặt ở ngoài component (top-level scope), không tạo lại bên trong hàm render.

---

## 🎨 UI Patterns

- **Text**: MỌI chuỗi văn bản đều phải bọc trong `<Text>` (khác với web HTML) — nếu không React Native sẽ văng runtime error.
- **Flexbox First**: Rất hạn chế dùng `position: absolute`. Sử dụng `flex: 1` để chiếm trọn không gian cha.
- **Padding vs Margin**:
  - `padding`: Khoảng cách bên trong (từ viền container cha vào nội dung con).
  - `margin`: Khoảng cách bên ngoài (giữa các component với nhau).
  - Giữ nguyên tắc nhất quán trong toàn bộ codebase.
- **Image**: Sử dụng `expo-image` thay cho `Image` mặc định — hỗ trợ cache, blurhash placeholder và hiệu ứng chuyển cảnh mượt mà.
- **Text Overflow**: Sử dụng `numberOfLines={N}` kết hợp `ellipsizeMode="tail"`.
- **Touch Target**: Tối thiểu `44dp` (iOS) / `48dp` (Android). Dùng `hitSlop={8}` nếu icon hiển thị nhỏ hơn kích thước này.
- **Loading State 4 Phase**: Luôn mô hình hóa trạng thái thành `idle | loading | error | success` (không chỉ dùng biến boolean `isLoading`).
- **Empty State**: Luôn có component xử lý khi danh sách trống, tránh màn hình trắng trơn.

---

## 📱 Layout & Keyboard

- **Safe Area**: Sử dụng `SafeAreaProvider` và hook `useSafeAreaInsets()` để padding chính xác theo notch, dynamic island và thanh điều hướng hệ thống.
- **`KeyboardAvoidingView`**: Bọc các màn hình có chứa form/input:
  - iOS: `behavior="padding"`
  - Android: `behavior="height"` hoặc thiết lập manifest `windowSoftInputMode="adjustResize"`.
- **Dismiss Keyboard**: Trên `ScrollView`, đặt `keyboardShouldPersistTaps="handled"` để cho phép chạm nút bấm ngay cả khi bàn phím đang mở.

---

## 🔄 State & Effects

- **Ưu tiên State Cục bộ**: Nếu chỉ 1 component sử dụng → dùng `useState` nội bộ.
- **Lift State Up**: Chỉ đưa state lên cha khi có từ 2 component con trở lên cần chia sẻ dữ liệu.
- **Context API**: Dành cho dữ liệu dùng chung toàn app (theme, auth, i18n). Dữ liệu `value` trong Provider PHẢI được bọc trong `useMemo` để tránh re-render dây chuyền.
- **Tránh lạm dụng Redux/Zustand**: Với các app vừa và nhỏ, kiến trúc Services + Custom Hooks là đủ đơn giản và hiệu quả.
- **Cleanup trong `useEffect`**: Luôn return hàm cleanup đối với subscriptions, timers, event listeners.
- **Async Effect**: Không viết `useEffect(async () => ...)`. Hãy khai báo hàm async bên trong rồi gọi ngay:
  ```ts
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const data = await fetchData();
      if (isMounted) setData(data);
    })();
    return () => { isMounted = false; };
  }, []);
  ```
- **Deps Array**: Luôn tuân thủ lint `react-hooks/exhaustive-deps`.
- **Tránh Mutate State Trực Tiếp**: Luôn gọi `setState` với object/array mới.

---

## 📝 Forms

- **Controlled Inputs**: Sử dụng `<TextInput value={val} onChangeText={setVal} />`.
- **Validation**: Validate khi submit thay vì validate liên tục mỗi lần gõ phím (trừ kiểm tra format đơn giản như regex email).
- **Focus Next Input**: Sử dụng `ref` và event `onSubmitEditing={() => nextRef.current?.focus()}`.
- **Debounce Search**: Trì hoãn 300-500ms trước khi kích hoạt API call tìm kiếm.

---

## 🌐 Networking

- **Timeout cho Fetch**: Luôn thiết lập timeout bằng `AbortController` (fetch chuẩn không có timeout mặc định).
- **Phân loại 4 trường hợp**: Success, 4xx Client Error, 5xx Server Error, và Network/Offline Error.
- **Offline Detection**: Sử dụng `@react-native-community/netinfo` để lắng nghe trạng thái mạng và lưu trữ hàng đợi request nếu cần.
- **Retry Logic**: Chỉ retry đối với lỗi tạm thời (5xx, mất mạng) kèm thuật toán exponential backoff; KHÔNG retry đối với lỗi 4xx.
- **UI Feedback**: Luôn cung cấp trạng thái trực quan rõ ràng khi đang tải hoặc gặp sự cố.

---

## 💾 Storage

- **AsyncStorage**: Vì là bất đồng bộ nên LUÔN dùng `await`, không gọi dạng fire-and-forget nếu cần bảo đảm dữ liệu đã ghi xong.
- **MMKV**: Dùng khi cần đọc/ghi đồng bộ (synchronous / high performance) hoặc chia sẻ dữ liệu với widget native.
- **JSON Safe Parse**: Luôn bọc trong `try / catch`, nếu dữ liệu hỏng cần có fallback về giá trị mặc định.
- **Schema Migration**: Khi bổ sung thuộc tính mới, luôn cung cấp giá trị fallback mặc định trong logic đọc dữ liệu.

---

## 🚨 Errors & Boundaries

- **Global Error Handler**: Thiết lập `ErrorUtils.setGlobalHandler` để bắt các lỗi JS chưa bắt và gửi về hệ thống giám sát.
- **Error Boundary**: Bọc các màn hình chính để app không bị crash văng ra ngoài.
- **Thông báo Thân thiện**: Hiển thị thông báo dễ hiểu cho người dùng ("Đã có lỗi xảy ra, vui lòng thử lại sau"), tuyệt đối không để lộ stack trace ra UI.
- **Logging**: Tích hợp Sentry hoặc logger tập trung.

---

## 🧭 Navigation (Expo Router)

- `router.push('/path')`: Đẩy màn hình mới vào stack, có nút back.
- `router.replace('/path')`: Thay thế màn hình hiện tại, không back lại được (dùng cho flow sau login/logout).
- `router.back()`: Quay lại màn hình trước đó.
- `useLocalSearchParams()`: Đọc params dynamic trên URL route.
- Không lưu tạm form state phụ thuộc vào stack navigation; nếu cần hãy lưu nháp cục bộ (draft storage).

---

## 📐 Platform-Specific

- Sử dụng `Platform.OS === 'ios' | 'android'` để phân nhánh logic.
- Dùng `Platform.select({ ios: {...}, android: {...} })` cho cấu hình style/props.
- Đặt đuôi file `.ios.tsx` / `.android.tsx` chỉ khi component ở 2 nền tảng khác biệt hoàn toàn về cấu trúc.

---

## ♿ Accessibility

- Thêm `accessibilityLabel` cho các nút chỉ có biểu tượng icon.
- Đặt `accessibilityRole="button"` cho các custom touchable components.
- Đặt `accessibilityState={{ selected: true }}` cho các tab hoặc radio đang được chọn.
- Độ tương phản chữ/nền tối thiểu 4.5:1 (chuẩn WCAG AA).
- Hỗ trợ Dynamic Type / Font Scaling từ hệ thống.

---

## 🔧 Development Ergonomics

- **Bảo vệ `console.log`**: Bọc bằng điều kiện `if (__DEV__)` để không bị lọt vào production build.
- **Metro Bundler**: Nếu cache bị lỗi hoặc cũ, khởi động lại bằng `npx expo start -c`.
- **TypeScript Strict**: Không lạm dụng `any`; ưu tiên `unknown` kết hợp type narrowing.

---

## 🌍 Environment & Configuration (Local / Dev / UAT / Staging / Production)

- **Nguyên tắc**: Tuyệt đối không hardcode API URL, Client ID, Sentry DSN trong source code.
- Sử dụng Dynamic `app.config.js` dựa theo biến môi trường `APP_VARIANT` (`local`, `dev`, `uat`, `staging`, `production`).
- Quản lý Secret: Dùng EAS Secrets cho cloud build và `.env.local` (nằm trong `.gitignore`) cho môi trường nội bộ.
- Phân biệt App Icon và Bundle ID/Package name giữa bản dev/staging với bản production để tránh cài đè hoặc nhầm lẫn dữ liệu thật.

---

## ❌ Anti-Patterns Cần Phát Hiện & Tránh

1. Gọi `console.log` mà không có `__DEV__`.
2. Dùng `setInterval` / event listener mà không return hàm dọn dẹp (cleanup).
3. Gọi fetch dữ liệu trực tiếp trong render body thay vì trong `useEffect`.
4. Dùng `key={index}` cho `FlatList` khi danh sách có thể thêm/xóa/sắp xếp.
5. Tạo `StyleSheet.create` bên trong hàm render component.
6. Import chéo giữa các màn hình screen với nhau (thay vì đưa component chung vào `components/ui/`).
7. Viết business logic, data transformation trực tiếp bên trong file Screen (hãy chuyển vào layer `services/` hoặc custom hook).
8. Trỏ app dev vào database hoặc backend của môi trường Production.
