# LUBPY STUDIO - Enterprise Full-Stack Web Platform

Dự án full-stack hoàn chỉnh bao gồm Frontend (React 19 + Vite 6 + Tailwind CSS v4) và Backend (Node.js + Express + PostgreSQL Drizzle ORM + Socket.IO + Firebase + Google Gemini AI).

---

## 🚀 Hướng Dẫn Chạy Trên VS Code / Antigravity / Máy Cục Bộ

### 1. Yêu cầu môi trường (Prerequisites)
- **Node.js**: Phiên bản 18 trở lên (Khuyến nghị **Node.js 20 LTS** hoặc 22).
- **npm** (đi kèm Node.js) hoặc **pnpm** / **yarn**.
- **Docker** (Tùy chọn, dùng để bật nhanh database PostgreSQL cục bộ).

---

### 2. Các bước cài đặt và khởi chạy

#### Bước 1: Cài đặt thư viện dependencies
```bash
npm install
```

#### Bước 2: Thiết lập file môi trường `.env`
Sao chép từ file mẫu:
```bash
cp .env.example .env
```
*(Tùy chọn)*: Điền thêm `GEMINI_API_KEY` nếu bạn muốn sử dụng trợ lý AI Lubpy Assistant hoặc bot tư vấn.

#### Bước 3: Khởi chạy cơ sở dữ liệu PostgreSQL (Khuyến nghị)
Bạn có 3 lựa chọn cực kỳ đơn giản:

- **Cách 1 (Dễ nhất với Docker)**:
  ```bash
  docker compose up -d
  ```
  *(Lệnh này sẽ tự động khởi chạy PostgreSQL 16 container với đúng database `lubpy_studio` trên cổng 5432).*

- **Cách 2 (Sử dụng Cloud Database miễn phí)**:
  Tạo database PostgreSQL miễn phí trên [Neon.tech](https://neon.tech) hoặc [Supabase](https://supabase.com), sau đó dán chuỗi kết nối vào file `.env`:
  ```env
  DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require
  ```

- **Cách 3 (Chạy kiểm tra Frontend trước)**:
  Nếu máy bạn chưa cài đặt PostgreSQL hoặc Docker, lệnh `npm run dev` vẫn **chạy bình thường 100%** để bạn duyệt qua toàn bộ giao diện Landing Page, chuyển đổi Theme Sáng/Tối, xem demo các chức năng Workspace!

#### Bước 4: Khởi động máy chủ Development
```bash
npm run dev
```
Mở trình duyệt truy cập: **`http://localhost:3000`**

---

### 3. Đóng gói & Chạy môi trường Production
```bash
# Build frontend bundle và compile server
npm run build

# Khởi chạy server production
npm start
```

---

### 4. Cấu trúc thư mục dự án
- `/server.ts` - Entry point của Backend Express kết nối Vite Middleware và Socket.IO.
- `/server/` - Các API routes (auth, projects, tickets, chat, wallet, users).
- `/src/` - Toàn bộ mã nguồn React 19 Frontend:
  - `/src/components/` - Các thành phần giao diện (Header, Hero, WorkspaceDashboard, ThemeToggle,...).
  - `/src/context/` - Global Theme Context (hỗ trợ Light / Dark mode và tự động nhận diện hệ điều hành).
  - `/src/db/` - Schemas Drizzle ORM và cấu hình kết nối PostgreSQL.
  - `/src/lib/` - Cấu hình Firebase SDK (Firestore real-time chat).
- `/docker-compose.yml` - File cấu hình Docker PostgreSQL sẵn sàng cho môi trường nội bộ.
- `/package.json` - Danh sách dependencies và scripts thực thi.
