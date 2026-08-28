# Deploy Club Day lên Vercel + Neon

Hướng dẫn từng bước để đưa app lên HTTPS (cần cho camera staff trên điện thoại).

## Kiến trúc

```
GitHub repo  →  Vercel (Next.js, HTTPS)  →  Neon Postgres
                      ↑
              Staff / SV phones
```

- **Vercel**: hosting Next.js, free HTTPS
- **Neon**: Postgres managed (free tier đủ cho 1 ngày sự kiện ~20 clubs)

## 0. Chuẩn bị

- Tài khoản [GitHub](https://github.com)
- Tài khoản [Neon](https://neon.tech)
- Tài khoản [Vercel](https://vercel.com) (đăng nhập bằng GitHub)

## 1. Đẩy code lên GitHub

```bash
cd Club-project
git init   # nếu chưa có
git add .
git commit -m "Prepare Club Day for Vercel + Neon"
# Tạo repo trống trên GitHub, rồi:
git remote add origin https://github.com/<USER>/<REPO>.git
git branch -M main
git push -u origin main
```

> Đừng commit file `.env` (đã nằm trong `.gitignore`).

## 2. Tạo database Neon

1. Vào [console.neon.tech](https://console.neon.tech) → **New Project**.
2. Region gần VN nếu có (vd Singapore).
3. **Dashboard → Connect** → chọn connection string **Pooled** (có `-pooler` trong host).
4. Copy URL dạng:
   `postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

## 3. Seed database (một lần từ máy local)

Trên máy bạn, trỏ `.env` sang Neon rồi migrate + seed:

```bash
cp .env.example .env
# Sửa DATABASE_URL = connection string Neon (Pooled)
# Sửa AUTH_SECRET / QR_SECRET:
#   openssl rand -base64 32

npm install
npm run db:setup
```

`db:setup` = `prisma migrate deploy` + seed admin/clubs/staff/demo students.

Tài khoản sau seed:

| Role | Login | Password |
|------|--------|----------|
| Admin | `admin` | `password123` |
| Staff | `staff1` … `staff6` | `password123` |
| Student | `SV202601` … | `password123` |

**Đổi mật khẩu admin/staff trước giờ sự kiện.**

## 4. Deploy trên Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import** repo GitHub vừa push.
2. Framework: Next.js (auto).
3. **Environment Variables** (Production + Preview nếu muốn):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon **Pooled** connection string |
| `AUTH_SECRET` | cùng giá trị local (openssl) |
| `QR_SECRET` | cùng giá trị local |
| `NEXTAUTH_URL` | tạm `https://placeholder.vercel.app` — sửa sau lần deploy đầu |
| `AUTH_URL` | cùng URL production |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL ([console](https://console.upstash.com)) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

Rate limit: login 10/phút/IP (+ theo username), register 5/phút/IP. Thiếu env Upstash thì auth vẫn chạy (không limit).

4. Deploy. Build command trong [`vercel.json`](./vercel.json):
   `prisma generate && prisma migrate deploy && next build`
5. Sau khi có URL thật (vd `https://club-checkin-xxx.vercel.app`):
   - Vercel → Settings → Environment Variables
   - Cập nhật `NEXTAUTH_URL` và `AUTH_URL` = URL đó
   - **Redeploy** (Deployments → … → Redeploy)
6. Nếu Free hết **data transfer quota**, nâng plan rồi **Redeploy** (hoặc push 1 commit) để site nhận traffic lại.

## 5. Kiểm tra trên điện thoại (quan trọng)

1. Mở `https://<app>.vercel.app` trên điện thoại (phải là **https**).
2. Login staff (`staff1` / `password123`).
3. Vào `/scan` → bấm **Bật camera** → cho phép quyền camera.
4. Login sinh viên khác máy → mở `/qr` → staff quét thử.

Nếu camera bị chặn: kiểm tra đang mở HTTPS, không phải HTTP IP LAN.

## 6. Local dev sau khi đã có Neon

```bash
# .env trỏ DATABASE_URL Neon
npm run dev
```

Không còn SQLite — mọi môi trường dùng Postgres Neon.

## 7. Seed lại production (cẩn thận)

Chỉ khi muốn **xoá hết data** và tạo lại demo:

```bash
# .env DATABASE_URL = Neon
npm run db:seed
```

Không chạy giữa sự kiện nếu chưa backup.

## Sự cố thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Build fail `migrate deploy` | Kiểm tra `DATABASE_URL` trên Vercel; dùng Pooled URL |
| Login redirect lỗi | `NEXTAUTH_URL` / `AUTH_URL` phải khớp domain HTTPS |
| Camera không mở trên phone | Phải HTTPS; bấm nút Bật camera; cấp quyền |
| `Too many connections` | Dùng connection string **Pooled** của Neon |
| Prisma client missing | `postinstall` chạy `prisma generate` — xem log build |

## Checklist trước ngày sự kiện

- [ ] App mở được trên HTTPS
- [ ] Admin login OK
- [ ] Staff login + camera quét OK trên 2–3 điện thoại thật
- [ ] Sinh viên đăng ký / QR / vote OK
- [ ] Đã đổi mật khẩu demo
- [ ] Admin biết export CSV (`/admin`)
