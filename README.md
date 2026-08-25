# Club Day — Check-in & Best Club Vote

Web app cho sự kiện club sinh viên: đăng ký bằng MSSV, staff check-in bằng QR (fallback MSSV), đủ 5 check-in thì vote Best Club, kèm admin dashboard.

**Hướng dẫn sử dụng:** [HUONG-DAN-SU-DUNG.md](./HUONG-DAN-SU-DUNG.md)  
**Deploy Vercel + Neon:** [DEPLOY.md](./DEPLOY.md)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Auth.js (next-auth) credentials — roles: `STUDENT`, `CLUB_STAFF`, `ADMIN`
- Prisma 7 + **PostgreSQL (Neon)** + `@prisma/adapter-pg`
- Hosting: **Vercel** (HTTPS — cần cho camera mobile)

## Quick start (local với Neon)

1. Tạo project free trên [Neon](https://neon.tech), copy connection string **Pooled**.
2. Cấu hình env:

```bash
cp .env.example .env
# Điền DATABASE_URL, AUTH_SECRET, QR_SECRET
```

3. Cài & seed:

```bash
npm install
npm run db:setup
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) (hoặc port Next.js báo nếu 3000 bận).

### Tài khoản demo (sau seed)

| Role   | Username / MSSV     | Password    |
|--------|---------------------|-------------|
| Admin  | `admin`             | password123 |
| Staff  | `staff1` … `staff6` | password123 |
| Student| `SV202601` … `603`  | password123 |

## Luồng sử dụng

1. **Sinh viên** đăng ký/đăng nhập → trang QR → đưa QR cho staff.
2. **Staff** đăng nhập → `/scan` → quét QR hoặc nhập MSSV.
3. Sinh viên đủ **5 check-in** → `/vote` (chỉ vote club đã check-in, 1 lần).
4. **Admin** → `/admin`: clubs, staff, danh sách SV, BXH vote, export CSV.

## Biến môi trường

Xem [`.env.example`](.env.example):

- `DATABASE_URL` — Neon Postgres (Pooled, `?sslmode=require`)
- `AUTH_SECRET` — `openssl rand -base64 32`
- `QR_SECRET` — secret ký JWT trong QR
- `NEXTAUTH_URL` / `AUTH_URL` — URL app (`http://localhost:3000` local, `https://….vercel.app` prod)

## Deploy

Chi tiết từng bước: **[DEPLOY.md](./DEPLOY.md)**

Tóm tắt: GitHub → Neon DB → Vercel env → deploy → cập nhật `NEXTAUTH_URL` → test camera trên điện thoại (HTTPS).

## Scripts

- `npm run dev` — dev server
- `npm run db:setup` — migrate deploy + seed
- `npm run db:seed` — seed (xoá & tạo lại data demo)
- `npm run db:migrate:deploy` — áp migration (CI/Vercel)
- `npm run build` — `prisma generate && migrate deploy && next build`
