# Technical guidelines — React Native

Best practices bắt buộc follow khi code React Native. AI đọc file này trước khi tạo/sửa component.

---

## 🚀 Performance & rendering

- **List dài** → LUÔN dùng `FlatList` / `SectionList`, KHÔNG dùng `ScrollView + .map()`
  - `keyExtractor` return unique + stable ID (không dùng index)
  - `getItemLayout` khi item height fixed → skip measurement, scroll nhanh hơn
  - Item component wrap `React.memo` nếu list > 20 items
  - `windowSize={10}`, `maxToRenderPerBatch={10}` khi tune
- **List rất dài (>1000)** → cân nhắc `FlashList` từ `@shopify/flash-list`
- **`useMemo`** cho:
  - Compute nặng (> 1ms): filter/sort/reduce list
  - Object/array truyền xuống `React.memo` child hoặc Context Provider
  - Dep phải stable
- **`useCallback`** cho function truyền xuống memoized child hoặc dùng làm dep của effect
- **Tránh inline** khi truyền tới memoized component:
  - ❌ `<Item onPress={() => handle(id)} style={{ padding: 10 }} />`
  - ✅ `useCallback` + `StyleSheet.create()` extract
- **`StyleSheet.create()` OUTSIDE component** (top-level) — không tạo trong render body

---

## 🎨 UI patterns

- **Text**: MỌI text phải wrap `<Text>` (không như HTML) — RN sẽ throw error
- **Flexbox first**: hiếm khi cần `position: absolute`. `flex: 1` để fill parent
- **Padding vs margin**:
  - Padding = khoảng cách trong (parent → children)
  - Margin = khoảng cách ngoài (component-to-component)
  - Chọn 1 pattern nhất quán, tránh mix
- **Image**: dùng `expo-image` thay `Image` — có cache, blurhash placeholder, transition mượt
- **`numberOfLines={N}` + `ellipsizeMode="tail"`** cho text overflow
- **Touch target ≥ 44dp** (Apple) / **48dp** (Google) — `hitSlop={8}` nếu icon nhỏ
- **Loading states 4 phase**: `idle | loading | error | success` (không dùng boolean isLoading)
- **Empty state component** — không để screen trắng khi list rỗng

---

## 📱 Layout & keyboard

- **`SafeAreaProvider` + `useSafeAreaInsets()`** — tùy chỉnh padding theo notch/dynamic island
- **`KeyboardAvoidingView`** wrap mọi screen có form input
  - iOS: `behavior="padding"`
  - Android: `behavior="height"` hoặc manifest `windowSoftInputMode="adjustResize"`
- **`ScrollView keyboardShouldPersistTaps="handled"`** — cho phép tap button khi keyboard mở

---

## 🔄 State & effects

- **State cục bộ trước**: nếu chỉ 1 component dùng → `useState` local
- **Lift up** chỉ khi 2+ children cần share
- **Context cho cross-cutting** (theme, auth, i18n) — value phải wrap `useMemo` tránh re-render cascade
- **KHÔNG Redux/Zustand** cho small-medium app — services + hooks đủ
- **`useEffect` cleanup**: return function để cleanup subscription/timer/listener
- **Async trong effect**: KHÔNG `useEffect(async () => ...)` — wrap `(async () => {})()`
- **Deps array đầy đủ** — ESLint plugin `react-hooks/exhaustive-deps` warn stale closure
- **KHÔNG mutate state trong render** — luôn setState với new object/array

---

## 📝 Forms

- **Controlled input**: `<TextInput value={x} onChangeText={setX} />`
- **Validate on submit**, không on-every-keystroke (trừ email format check)
- **Focus next input**: `ref` + `onSubmitEditing={() => nextRef.current?.focus()}`
- **Debounce search input**: 300-500ms trước khi fire API call

---

## 🌐 Networking

- **Timeout cho fetch** — dùng AbortController (fetch không có timeout default)
- **Handle 4 case**: success / 4xx client error / 5xx server error / network error
- **Offline detection**: `@react-native-community/netinfo` listener → queue request
- **Retry** on transient error (5xx, network) với exponential backoff — không retry 4xx
- **Loading + error UI state** — không để user không biết gì đang xảy ra

---

## 💾 Storage

- **AsyncStorage async** → LUÔN `await`, không fire-and-forget nếu cần confirm
- **MMKV sync** → dùng khi cần blocking read (VD widget bridge)
- **JSON parse/stringify null-safe** — wrap try/catch, corrupt data → reset default
- **Schema migration**: khi thêm field mới, provide default value trong read logic

---

## 🚨 Errors

- **Global error handler**: `ErrorUtils.setGlobalHandler` bắt uncaught JS errors → log
- **Error boundary component** wrap top-level screens
- **User-facing message**: friendly ("Có lỗi, thử lại nha"), KHÔNG expose stack trace
- **Log errors** qua Sentry / custom logger

---

## 🧭 Navigation (Expo Router)

- `router.push('/path')` — push screen mới, có back
- `router.replace('/path')` — thay screen hiện tại, KHÔNG back được (dùng sau login/logout)
- `router.back()` — pop 1 level
- `useLocalSearchParams()` — read `[id]` dynamic
- KHÔNG persist form data qua navigation — user back mất → chấp nhận hoặc lưu draft local

---

## 📐 Platform-specific

- `Platform.OS === "ios" | "android"` — branching logic
- `Platform.select({ ios: {...}, android: {...} })` — style/config object
- File extension `.ios.tsx` / `.android.tsx` khi component khác hoàn toàn
- Đừng abuse — hầu hết code cross-platform được

---

## ♿ Accessibility

- `accessibilityLabel` cho icon-only Pressable (VD "Xoá", "Menu")
- `accessibilityRole="button"` cho custom interactive
- `accessibilityState={{ selected: true }}` cho tab active
- Contrast text/bg ≥ 4.5:1 (WCAG AA)
- Support font scaling — không hardcode fontSize quá nhỏ

---

## 🔧 Development ergonomics

- **`__DEV__` guard** cho console.log để không leak vào production build
- **Fast Refresh** works khi save — nếu không, `r` trong Metro để force reload
- **Metro cache stale** → `--clear` flag hoặc `npx expo start -c`
- **TypeScript strict** — không dùng `any`, prefer `unknown` + narrow
- **ESLint tự fix** on save (VS Code setting `editor.codeActionsOnSave`)

---

## 🧪 Testable structure

- **Components**: props in, callbacks out — không side effect trong render
- **Business logic** trong `services/` — dễ test unit không cần render
- **Mock service layer** (không mock fetch trực tiếp)

---

## 🌍 Environment management (dev/uat/staging/production)

### Tiers

| Env | Purpose | Ai dùng | Backend | Bundle ID |
|---|---|---|---|---|
| **Local** | Dev cá nhân | Dev đang code | `localhost:PORT` hoặc LAN IP | `com.app.dev` |
| **Dev** | Shared dev backend | Toàn team dev | `dev-api.myapp.com` | `com.app.dev` |
| **UAT** | User acceptance testing | QA + stakeholder | `uat-api.myapp.com` | `com.app.uat` |
| **Staging** | Mirror production, final rehearsal | Team pre-release | `staging-api.myapp.com` | `com.app.staging` |
| **Production** | Real users | End users | `api.myapp.com` | `com.app` |

### Cái gì đổi theo env (KHÔNG hardcode trong code)

- **API base URL** — backend endpoint
- **OAuth client ID** — Google/Apple sign-in (mỗi env 1 client riêng)
- **Firebase project** — FCM push (mỗi env 1 project để tách notification)
- **Sentry DSN** — analytics/crash tách theo env, không lẫn error
- **Feature flags** — VD `enableExperimentalWidget=true` chỉ trong dev/uat
- **Log level** — verbose (dev) → warn (production)
- **App name + icon** — dev/staging có suffix hoặc màu khác để phân biệt cùng install trên 1 device
- **Debug menu** — chỉ hiện ở dev/uat, ẩn production

### Implementation với Expo

**1. Dynamic `app.config.js`** (thay `app.json`):

```js
const APP_VARIANT = process.env.APP_VARIANT ?? "local";

const config = {
  local: {
    name: "MyApp Dev",
    bundleIdentifier: "com.myapp.dev",
    package: "com.myapp.dev",
    icon: "./assets/icon-dev.png",
    extra: {
      apiUrl: "http://192.168.1.3:5047",
      sentryDsn: null,
      env: "local",
    },
  },
  dev: {
    name: "MyApp Dev",
    bundleIdentifier: "com.myapp.dev",
    package: "com.myapp.dev",
    icon: "./assets/icon-dev.png",
    extra: {
      apiUrl: "https://dev-api.myapp.com",
      sentryDsn: "https://xxx@sentry.io/dev",
      env: "dev",
    },
  },
  uat: { /* ... */ },
  staging: { /* ... */ },
  production: {
    name: "MyApp",
    bundleIdentifier: "com.myapp",
    package: "com.myapp",
    icon: "./assets/icon.png",
    extra: {
      apiUrl: "https://api.myapp.com",
      sentryDsn: "https://xxx@sentry.io/prod",
      env: "production",
    },
  },
};

export default {
  expo: {
    slug: "myapp",
    version: "1.0.0",
    ...config[APP_VARIANT],
  },
};
```

**2. Access config trong code**:

```ts
// services/env.ts
import Constants from "expo-constants";

interface AppEnv {
  apiUrl: string;
  sentryDsn: string | null;
  env: "local" | "dev" | "uat" | "staging" | "production";
}

export const ENV = Constants.expoConfig?.extra as AppEnv;

// Dùng:
import { ENV } from "./services/env";
const API_BASE_URL = ENV.apiUrl;
const isProduction = ENV.env === "production";
```

**3. Build với variant**:

```bash
# Local (default)
npx expo start

# Dev
APP_VARIANT=dev npx expo start
APP_VARIANT=dev npx expo prebuild --clean
APP_VARIANT=dev eas build --profile dev

# Production
APP_VARIANT=production eas build --profile production
```

**4. EAS build profiles** (`eas.json`):

```json
{
  "build": {
    "dev": {
      "env": { "APP_VARIANT": "dev" },
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "uat": {
      "env": { "APP_VARIANT": "uat" },
      "distribution": "internal"
    },
    "staging": {
      "env": { "APP_VARIANT": "staging" },
      "distribution": "internal"
    },
    "production": {
      "env": { "APP_VARIANT": "production" },
      "distribution": "store"
    }
  }
}
```

### Secrets management

- **KHÔNG commit** file có secret (API key, Sentry DSN, OAuth secret) vào git
- Dùng `EAS Secret` cho cloud build: `eas secret:create --scope project --name SENTRY_DSN --value "https://..."`
- Local dev: file `.env.local` (add vào `.gitignore`) đọc qua `expo-env`
- Public config (bundle ID, app name, apiUrl public) — commit OK

### Feature flags

Cho phép bật/tắt feature theo env hoặc user cụ thể (không cần rebuild):

```ts
// services/feature-flags.ts
import { ENV } from "./env";
import { isDebugUser } from "./auth";

export const FLAGS = {
  enableExperimentalWidget: ENV.env !== "production" || isDebugUser(),
  enableAnalytics: ENV.env === "production" || ENV.env === "staging",
  showDebugMenu: ENV.env === "local" || ENV.env === "dev" || isDebugUser(),
};
```

### Deployment flow

```
Local dev → git push
         ↓
Dev env (auto deploy on merge to develop branch)
         ↓ QA test
UAT env (manual promote)
         ↓ stakeholder review
Staging env (release candidate)
         ↓ smoke test + regression
Production (release)
```

- **Rollback plan** — mỗi release giữ version cũ 30 ngày, có thể roll back qua Play Console / EAS Update
- **Feature flag** để disable feature bad trong production mà không cần rebuild
- **Migration script** cho DB schema — reversible

### Best practices

- **Never** trỏ dev app tới production backend (đã có case dev QA làm hỏng data thật)
- **Icon + app name khác nhau** dev/staging → tránh dev thao tác nhầm production
- **Analytics tag env** — Sentry/PostHog có tag `env=production` để filter
- **Version bump discipline**: mỗi ship production tăng version (semver — major.minor.patch)
- **Changelog** commit vào repo, publish qua release note

---

## ❌ Anti-patterns (thấy phải flag)

- `console.log` không có `if (__DEV__)` — leak vào production
- `setInterval` trong component không cleanup → memory leak
- `useState` với object nested nhiều — nên tách nhỏ hoặc dùng reducer
- Fetch trong render body (không trong useEffect) — infinite loop
- `key={index}` cho FlatList item khi list reorder được → bug
- Inline function `onPress={() => longWork()}` chạy heavy compute
- `Text` với style thay đổi theo state không dùng key → animation không trigger
- Import chéo 2 screen → tách component vào `components/ui/`
- Business logic trong screen file (nên ở services layer)
- Hardcode env-specific value (API URL, OAuth ID, Sentry DSN) — phải qua `expo-constants` extra
- Commit secret vào git — dùng EAS Secret hoặc `.env.local` gitignore
- Dev/staging app chung bundle ID với production — không phân biệt được install cùng lúc
- Dev app trỏ production backend — dễ hỏng data thật
