# Hướng dẫn sử dụng Club Day

Tài liệu này mô tả cách cài đặt, vận hành ngày sự kiện, và dùng từng vai trò trong hệ thống **Club Day** (check-in club + vote Best Club).

---

## 1. Hệ thống làm gì?

Trong một buổi tổ chức hoạt động:

1. Sinh viên đăng ký tài khoản bằng **mã số sinh viên (MSSV)**.
2. Sinh viên đi lần lượt các booth/club, đưa **QR** cho staff.
3. Staff club **check-in** → hệ thống ghi nhận “đã đến club đó”.
4. Khi sinh viên có **ít nhất 3 check-in** (3 club khác nhau) → được **vote Best Club** (1 lần, không đổi).
5. Admin theo dõi danh sách sinh viên, check-in theo club, và bảng xếp hạng vote.

### Quy tắc nghiệp vụ

| Quy tắc | Chi tiết |
|--------|----------|
| Check-in trùng | Mỗi cặp (sinh viên, club) chỉ check-in **1 lần** |
| Điều kiện vote | Cần **≥ 3** check-in ở các club khác nhau |
| Đối tượng vote | Chỉ vote club **đã từng check-in** |
| Số lần vote | Mỗi sinh viên **1 phiếu**, không sửa sau khi gửi |
| Số club tối đa | Soft cap **20** clubs (admin tạo thêm trong dashboard) |
| Staff | Mỗi staff chỉ check-in cho **club của mình** |

---

## 2. Cài đặt & chạy lần đầu

### Yêu cầu

- Node.js 20+
- npm
- Project Postgres free trên [Neon](https://neon.tech) (local và production đều dùng Neon)

### Các bước

```bash
# 1. Vào thư mục project
cd Club-project

# 2. Tạo file môi trường
cp .env.example .env
# Điền DATABASE_URL = Neon connection string (Pooled, có sslmode=require)
# AUTH_SECRET / QR_SECRET: openssl rand -base64 32

# 3. Cài dependency
npm install

# 4. Migrate + seed (admin, 6 clubs, staff, 3 SV)
npm run db:setup

# 5. Chạy server
npm run dev
```

Deploy production (Vercel + HTTPS cho camera mobile): xem **[DEPLOY.md](./DEPLOY.md)**.

Mở trình duyệt:

- Thường là [http://localhost:3000](http://localhost:3000)
- Nếu cổng 3000 đang bị chiếm, Next.js sẽ chuyển sang **3001**, **3002**,… — xem terminal để biết đúng URL.

### Tài khoản demo (sau `npm run db:seed` / `db:setup`)

| Vai trò | Đăng nhập bằng | Mật khẩu |
|--------|----------------|----------|
| Admin | `admin` | `password123` |
| Staff Music Club | `staff1` | `password123` |
| Staff Dance Club | `staff2` | `password123` |
| Staff Tech Club | `staff3` | `password123` |
| Staff Photo Club | `staff4` | `password123` |
| Staff Debate Club | `staff5` | `password123` |
| Staff Sports Club | `staff6` | `password123` |
| Sinh viên demo | `SV202601`, `SV202602`, `SV202603` | `password123` |

> Nên đổi mật khẩu admin/staff trước ngày sự kiện thật.

### Biến môi trường (`.env`)

| Biến | Ý nghĩa |
|------|---------|
| `DATABASE_URL` | Neon Postgres **Pooled** (`…-pooler…?sslmode=require`) |
| `AUTH_SECRET` | Secret phiên đăng nhập (đổi bằng `openssl rand -base64 32`) |
| `QR_SECRET` | Secret ký token trong QR sinh viên |
| `NEXTAUTH_URL` | URL app, vd `http://localhost:3000` hoặc `https://….vercel.app` |
| `AUTH_URL` | Cùng URL production trên Vercel |

---

## 3. Sơ đồ luồng ngày sự kiện

```
Sinh viên đăng ký/đăng nhập
        │
        ▼
   Hiện QR cá nhân ──────────────► Staff quét QR (hoặc nhập MSSV)
        │                                    │
        │                                    ▼
        │                          Ghi check-in cho club đó
        │                                    │
        ▼                                    ▼
  Xem lịch sử check-in ◄──────────── Admin xem dashboard
        │
        │  (≥ 3 club)
        ▼
   Vote Best Club (1 lần)
        │
        ▼
   Admin xem BXH vote / Export CSV
```

---

## 4. Hướng dẫn theo vai trò

### 4.1. Sinh viên

#### Đăng ký tài khoản mới

1. Vào trang chủ → **Đăng ký sinh viên** (hoặc `/register`).
2. Điền:
   - **MSSV**: 6–12 ký tự chữ/số (vd `SV202601`)
   - **Họ và tên**
   - **Mật khẩu** (≥ 6 ký tự)
3. Bấm **Tạo tài khoản** → hệ thống đăng nhập và chuyển tới trang QR (`/qr`).

#### Đăng nhập lại

1. Vào `/login`.
2. Nhập MSSV + mật khẩu → vào `/qr`.

#### Check-in tại booth

1. Mở trang **QR** (`/qr`) trên điện thoại (độ sáng màn hình cao giúp quét dễ hơn).
2. Đưa QR cho staff của club.
3. Khi staff quét thành công → bạn đã được đánh dấu check-in tại club đó.
4. Vào **Lịch sử** (`/history`) để xem đã đến những club nào.

> QR có token ký số, hiệu lực khoảng **18 giờ** (phù hợp cả ngày sự kiện). Nếu QR lỗi, nhờ staff nhập MSSV thủ công.

#### Vote Best Club

1. Cần đủ **ít nhất 3 check-in**.
2. Vào `/vote`.
3. Chọn **một** club trong danh sách club bạn đã check-in.
4. Bấm **Gửi vote**.
5. Sau khi gửi: không đổi được phiếu.

Nếu chưa đủ 3 check-in, trang vote sẽ báo còn thiếu bao nhiêu.

---

### 4.2. Club staff

Staff account do **admin tạo sẵn** (seed đã có `staff1`…`staff6`).

#### Đăng nhập

1. Vào `/login`.
2. Username: `staff1` (hoặc username admin cấp) + mật khẩu.
3. Hệ thống đưa thẳng vào **Scanner** (`/scan`).

#### Check-in bằng quét QR (cách chính)

1. Trên `/scan`, cho phép trình duyệt dùng **camera**.
2. Sinh viên đưa QR → camera quét tự động.
3. Kết quả hiện ngay:
   - **Check-in thành công: &lt;tên SV&gt;**
   - **Đã check-in tại club này rồi** (trùng)
   - **QR không hợp lệ / hết hạn**
   - **Không tìm thấy sinh viên**

#### Check-in bằng MSSV (fallback)

Dùng khi camera lỗi, QR mờ, hoặc điện thoại không mở camera được:

1. Ở phần **Fallback: nhập MSSV**.
2. Gõ MSSV (vd `SV202601`).
3. Bấm **Check-in**.

#### Theo dõi nhanh tại booth

Trên đầu trang `/scan` có **Tổng check-in tại booth** — số lượt đã ghi nhận cho club của bạn.

> Staff chỉ check-in được cho **club mình**, không check-in hộ club khác.

---

### 4.3. Admin

#### Đăng nhập

- Username: `admin` / mật khẩu seed hoặc mật khẩu bạn đã đặt.
- Vào `/admin`.

#### Dashboard gồm những gì?

1. **Thống kê nhanh**: số sinh viên, tổng check-in, tổng vote.
2. **BXH Best Club**: xếp hạng theo số vote.
3. **Clubs**: danh sách club, số check-in, số vote, staff gắn với club, bật/ẩn club.
4. **Tạo club mới** (tối đa 20).
5. **Tạo staff** cho club chưa có staff.
6. **Reset mật khẩu staff**.
7. **Danh sách sinh viên**: MSSV, họ tên, các club đã đến, club đã vote.
8. **Export CSV**: tải báo cáo (`/api/admin/export`).

#### Thêm club trước/trong sự kiện

1. Ở mục Clubs → nhập tên club → **Thêm club**.
2. Nếu club chưa có staff → dùng form **Tạo staff cho club**:
   - Chọn club
   - Username (vd `staff7`)
   - Tên hiển thị
   - Mật khẩu
3. Phát username/mật khẩu cho tình nguyện viên booth đó.

#### Ẩn / hiện club

- Nút **Ẩn** / **Bật** bên cạnh trạng thái club.
- Club ẩn không nên dùng cho vote mới (club inactive).

#### Xuất dữ liệu

- Bấm **Export CSV** trên dashboard.
- File gồm dòng student / checkin / vote / club_summary — mở bằng Excel hoặc Google Sheets.

---

## 5. Checklist ngày sự kiện

### Trước giờ mở cửa (30–60 phút)

- [ ] App production mở được qua **HTTPS** (Vercel) — xem [DEPLOY.md](./DEPLOY.md)
- [ ] Đăng nhập thử admin, 1 staff, 1 sinh viên trên URL production
- [ ] Staff thử **camera trên điện thoại thật** (Chrome/Safari), bấm **Bật camera**, cấp quyền
- [ ] Kiểm tra danh sách club trên `/admin`
- [ ] Phát tài khoản staff cho từng booth (username + mật khẩu)
- [ ] In hoặc dán hướng dẫn ngắn tại booth: “Đưa QR trong app / nếu lỗi đọc MSSV”

### Trong sự kiện

- [ ] Sinh viên ưu tiên dùng QR; staff chỉ nhập MSSV khi cần
- [ ] Nếu báo “đã check-in rồi” → giải thích đã ghi nhận, không cần quét lại
- [ ] Nhắc sinh viên: đủ 3 club mới vote được
- [ ] Admin thỉnh thoảng F5 `/admin` để theo dõi BXH và số check-in

### Sau sự kiện

- [ ] Export CSV lưu báo cáo
- [ ] Chụp / lưu BXH Best Club từ dashboard
- [ ] (Tuỳ chọn) đổi mật khẩu admin, tắt server

---

## 6. Các trang / URL quan trọng

| URL | Ai dùng | Mục đích |
|-----|---------|----------|
| `/` | Tất cả | Trang chủ |
| `/register` | Sinh viên | Đăng ký |
| `/login` | Tất cả | Đăng nhập |
| `/qr` | Sinh viên | Hiện QR check-in |
| `/history` | Sinh viên | Club đã check-in |
| `/vote` | Sinh viên | Vote Best Club |
| `/scan` | Staff | Quét QR / nhập MSSV |
| `/admin` | Admin | Dashboard quản trị |
| `/api/admin/export` | Admin | Tải CSV |

Route được bảo vệ theo role: vào sai role sẽ bị chuyển về khu vực phù hợp.

---

## 7. Xử lý sự cố thường gặp

| Hiện tượng | Cách xử lý |
|------------|------------|
| Không mở được camera staff | **Phải dùng HTTPS** (Vercel). Cấp quyền camera; bấm nút Bật camera (iOS). Hoặc nhập MSSV |
| QR không quét được | Tăng độ sáng màn hình SV; làm sạch camera; thử nhập MSSV |
| “QR không hợp lệ hoặc đã hết hạn” | Sinh viên refresh trang `/qr` để lấy token mới |
| “Đã check-in tại club này rồi” | Đúng hành vi — không check-in trùng |
| “Không tìm thấy sinh viên” | SV chưa đăng ký, hoặc gõ sai MSSV |
| Chưa vote được | Kiểm tra `/history` đã đủ ≥ 3 club chưa |
| Port 3000 bị chiếm (local) | Dùng port Next.js báo trong terminal (vd 3001) |
| Muốn reset data demo | Chạy lại `npm run db:seed` với `DATABASE_URL` Neon (xoá & tạo lại — cẩn thận) |

---

## 8. Seed lại / reset dữ liệu demo

```bash
npm run db:seed
```

Lệnh này **xoá** vote, check-in, staff, club, user hiện có rồi tạo lại bộ demo.  
**Không chạy** trên dữ liệu sự kiện thật nếu chưa backup.

---

## 9. Gợi ý vận hành booth (ngắn cho tình nguyện viên)

1. Đăng nhập `staffX` → mở `/scan` → bật camera.
2. Sinh viên mở app → trang QR.
3. Quét → nghe/ nhìn thông báo thành công.
4. Nếu lỗi camera → hỏi MSSV → nhập tay → Check-in.
5. Không check-in hộ club khác; mỗi booth chỉ dùng account của booth đó.

---

## 10. Liên quan kỹ thuật (ngắn)

Chi tiết cài đặt/deploy xem [`README.md`](./README.md) và [`DEPLOY.md`](./DEPLOY.md).

- DB: PostgreSQL (Neon) qua Prisma + `@prisma/adapter-pg`
- Auth: NextAuth credentials, 3 role
- QR: JWT ký bằng `QR_SECRET`
- Check-in API: `POST /api/checkin` với `{ token }` hoặc `{ studentId }`
- Hosting: Vercel (`vercel.json` chạy `migrate deploy` lúc build)
