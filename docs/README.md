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
# Sửa GEMINI_API_KEY trong .env
```

## ⚙️ Cấu hình

Tạo file `.env` ở thư mục gốc với nội dung:

```env
GEMINI_API_KEY=your_gemini_api_key_here
APP_URL=http://localhost:3000
```

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
| AI | Google Gemini 3.7 Flash (RAG) |
| Map | Leaflet.js |

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/chat` | AI Chatbot (RAG) |
| POST | `/api/plan-trip` | Lập lịch trình AI |
| POST | `/api/modify-itinerary` | Chỉnh sửa lịch trình |
| POST | `/api/reserve` | Đặt bàn / vé (mock) |

## 📄 License

Private project.
