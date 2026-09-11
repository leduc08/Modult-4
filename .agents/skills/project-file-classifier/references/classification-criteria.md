# Tiêu chí Phân loại File chi tiết

Tài liệu tham khảo này liệt kê đầy đủ các loại file thuộc từng nhóm.

---

## 1. FRONTEND

File liên quan đến **giao diện người dùng** phía client:

| Dấu hiệu nhận biết | Ví dụ |
|---|---|
| UI components (React, Vue, Angular, Svelte) | `*.tsx`, `*.jsx`, `*.vue`, `*.svelte` |
| Pages / Layouts / Screens | `pages/`, `layouts/`, `screens/`, `views/` |
| Styles (CSS/SCSS/Tailwind/Styled) | `*.css`, `*.scss`, `*.module.css`, `index.css` |
| Static assets phục vụ giao diện | `assets/`, `public/`, `images/`, `fonts/`, `icons/` |
| Frontend entry points | `App.tsx`, `main.tsx`, `index.html` |
| Client-side state management | `store/`, `context/`, `hooks/`, `reducers/` |
| Frontend routing | `router.ts`, `routes/` (client-side) |
| API calling **từ frontend** | `api/`, `services/` (chứa fetch/axios calls từ client) |
| Build/bundle config cho frontend | `vite.config.*`, `webpack.config.*`, `next.config.*` |
| Frontend testing | `*.test.tsx`, `__tests__/` (component tests) |

---

## 2. BACKEND

File liên quan đến **xử lý phía server**:

| Dấu hiệu nhận biết | Ví dụ |
|---|---|
| Server entry / framework setup | `server.ts`, `app.py`, `main.py`, `server.js`, `index.ts` (Express/Fastify/Koa) |
| API routes / controllers | `routes/`, `controllers/`, `api/` (server-side) |
| Business logic / services | `services/`, `usecases/`, `handlers/` |
| Middleware (auth, logging, CORS) | `middleware/`, `auth/`, `guards/` |
| Server config | `.env.example`, `config/`, `docker-compose.yml`, `Dockerfile` |
| AI/chatbot logic | Gemini/OpenAI integration, prompt engineering, RAG pipeline |
| Payment processing | Stripe/VNPay integration |
| File upload, email, notification | `uploads/`, `mailer/`, `notifications/` |
| Server-side testing | `*.test.ts` (API tests), `e2e/` |

### Phân biệt Backend vs Frontend services:
- File `services/` chứa `fetch()` / `axios` gọi API → **FRONTEND**
- File `services/` chứa `express`, `req`, `res`, DB queries → **BACKEND**

---

## 3. DATABASE

File liên quan đến **dữ liệu và schema**:

| Dấu hiệu nhận biết | Ví dụ |
|---|---|
| Schema definitions | `schema.sql`, `schema.prisma`, `*.model.ts` (chỉ định nghĩa cấu trúc) |
| Migrations | `migrations/`, `*.migration.ts` |
| Seed data | `seed.sql`, `seed.ts`, `seeders/` |
| Queries | `queries/`, `*.query.ts` |
| ERD / data design docs | `ERD.png`, `database_design.md` |
| DB config | `database.config.ts`, `knexfile.js`, `ormconfig.json` |
| Stored procedures / functions | `procedures/`, `functions.sql` |
| Data files (large static datasets) | `vietnamData.ts` (79KB data constants) |

### Phân biệt DATABASE vs BACKEND:
- File `models/User.ts` chỉ **định nghĩa schema** (fields, types, relations) → **DATABASE**
- File `models/User.ts` chứa **business logic** (validate, transform, compute) → **BACKEND**

---

## 4. SKILL

File liên quan đến **knowledge, documentation, workflow**:

| Dấu hiệu nhận biết | Ví dụ |
|---|---|
| Project documentation | `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md` |
| Setup / deployment guides | `setup.md`, `deployment.md`, `getting-started.md` |
| API documentation | `api-guide.md`, `openapi.yaml`, `swagger.json` |
| Coding guidelines / rules | `guidelines/`, `rules/`, `GEMINI.md`, `AGENTS.md` |
| AI skills / prompts | `skills/`, `prompts/`, `instructions/` |
| Workflow definitions | `workflow.md`, `.github/workflows/` |
| Learning materials | `docs/`, `tutorials/` |
| Project management docs | `project-brief.md`, `business.md`, `bug.md`, `Done.md` |
| Architectural decision records | `ADR/`, `decisions/` |

---

## 5. ROOT-LEVEL / CONFIG (không phân nhóm riêng — xếp theo mục đích chính)

Các file config ở root thường phục vụ nhiều nhóm. Quy tắc:

| File | Phân loại | Lý do |
|---|---|---|
| `package.json` | Theo tech stack chính (thường FRONTEND hoặc BACKEND) | Xác định dependencies và scripts |
| `tsconfig.json` | Theo target (DOM → FRONTEND, Node → BACKEND) | Xem `lib` và `module` |
| `.gitignore` | UNCERTAIN hoặc ROOT | Phục vụ chung |
| `.env.example` | BACKEND | Chứa server-side config vars |
| `bun.lock` / `package-lock.json` | Theo `package.json` | Lock file đi kèm |
| `metadata.json` | Theo nội dung | Đọc nội dung để xác định |
