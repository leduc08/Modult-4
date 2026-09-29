# VietGo AI — Trợ lý Du lịch Thông minh Việt Nam 🇻🇳

Nền tảng du lịch thông minh toàn diện dành cho Việt Nam với AI Chatbot RAG, Lập lịch trình & Ngân sách tự động, Bản đồ thông minh và Cẩm nang 34+ tỉnh thành.

## 🚀 Cài đặt

```bash
# Clone repo
git clone <repo-url>
cd Modult-4

# Cài dependencies
npm install
# hoặc: bun install

# Tạo file .env từ template
cp .env.example .env
# Sửa DEEPSEEK_API_KEY trong .env
```

## ⚙️ Cấu hình

Tạo file `.env` ở thư mục gốc với nội dung:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-flash
DEEPSEEK_THINKING=disabled
APP_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SECRET_KEY=sb_secret_your_key_here
# Optional. Enables web search only when neither Supabase knowledge table has a relevant match.
TAVILY_API_KEY=your_tavily_api_key_here
```

Lấy URL và key trong Supabase tại **Project Settings → API Keys**. Publishable key có thể dùng trong trình duyệt với Row Level Security (RLS) được cấu hình đúng. Secret key chỉ dùng ở backend hoặc script quản trị/import; không đưa key này lên frontend, Git hoặc chat. TAVILY_API_KEY là tùy chọn để tìm web khi Supabase không có nội dung phù hợp.

## 🏃 Chạy Development

```bash
npm run dev
```

Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

## 📦 Build Production

```bash
npm run build
npm start
```

## 📂 Cấu trúc dự án

```text
Modult-4/
├── frontend/           # Giao diện React + Vite + TailwindCSS
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       └── components/  # 11 React components
├── backend/            # Express server + API endpoints
│   └── server.ts
├── database/           # Data layer
│   ├── types.ts        # TypeScript interfaces
│   └── vietnamData.ts  # Kho dữ liệu 34+ tỉnh thành
├── ai/                 # AI & RAG logic
│   ├── ragContext.ts   # RAG context builder
│   └── systemPrompt.ts # Gemini AI prompts
├── docs/               # Tài liệu
├── config/             # Cấu hình
├── .agents/skills/     # AI agent skills
├── .env.example
├── package.json
└── tsconfig.json
```

## 🛠️ Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 19, Vite, TailwindCSS 4, Leaflet, Motion |
| Backend | Express 4, TypeScript |
| AI | DeepSeek Chat API (RAG, JSON output) |
| Map | Leaflet.js |

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | AI Chatbot (RAG) |
| POST | `/api/plan-trip` | Lập lịch trình AI |
| POST | `/api/modify-itinerary` | Chỉnh sửa lịch trình |
| POST | `/api/reserve` | Đặt bàn / vé (mock) |

## Kho tri thức Kaggle bổ sung

Đã tích hợp [Vietnam tourism v2](https://www.kaggle.com/datasets/vuonglsts/vietnam-tourism-v2) vào RAG cho DeepSeek.
Dữ liệu gốc và ghi chú nguồn/giấy phép nằm ở `database/datasets/vietnam-tourism-v2/README.md`.
Backend tìm các đoạn văn phù hợp với câu hỏi; dữ liệu địa điểm có tọa độ hiện có vẫn phục vụ bản đồ.
Khi triển khai production, giữ thư mục `database/datasets/` cùng bản build và chạy từ thư mục gốc project.

Để nhập cả hai split train/valid lên Supabase, đặt `SUPABASE_URL` và `SUPABASE_SECRET_KEY` trong `.env`, chạy file `supabase/migrations/202609270001_vietnam_tourism_knowledge.sql` trong Supabase SQL Editor một lần, rồi chạy `npm run import:kaggle`. Script upsert theo ID nguồn nên chạy lại không tạo dòng trùng. Secret key chỉ được dùng bởi script chạy ở máy local.

Dữ liệu du lịch mẫu của project (điểm đến, POI, món ăn, lễ hội, quà lưu niệm và mẹo du lịch) được lưu riêng trong bảng `tourism_catalog`. Chạy `supabase/migrations/202609270002_tourism_catalog.sql` một lần trong SQL Editor rồi chạy `npm run import:tourism`. Script upsert bằng ID ổn định và giữ toàn bộ trường gốc trong `payload` JSONB.

AI chat ưu tiên tìm kiếm trực tiếp trong `tourism_catalog`, sau đó tìm bảng Kaggle `knowledge_documents`; chỉ gửi vài kết quả liên quan sang DeepSeek để tiết kiệm token. Nếu cả hai kho không có dữ liệu phù hợp, backend dùng Tavily khi `TAVILY_API_KEY` đã cấu hình; nếu chưa có key thì AI trả lời bằng kiến thức tổng quát và nêu rõ giới hạn. Chạy thêm migration `supabase/migrations/202609270003_ai_knowledge_search.sql` trong SQL Editor để bật tìm kiếm toàn văn an toàn cho service role.

Kiểm thử truy xuất dữ liệu: `npx tsx --test scripts/tourismKnowledge.test.ts`.

## 📄 License

Private project.
