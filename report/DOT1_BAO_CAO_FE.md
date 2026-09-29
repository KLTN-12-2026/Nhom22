# Báo cáo bàn giao BE → FE — DOT1 Tài khoản & nội dung

| Mục | Giá trị |
|---|---|
| Giai đoạn | Đợt 1 — Tài khoản & nội dung (12/10 – 25/10/2026) |
| Ngày bàn giao | 29/09/2026 (bản 2 — B1.1 + B1.2; cập nhật tiếp theo từng bước) |
| Trạng thái BE | 🟡 B1.1, B1.2 xong · 42 test xanh (`FR01RegisterTest` 8, `FR01LoginTest` 9) · B1.3–B1.12 chưa làm |
| FE làm tương ứng | F1.1, F1.2 (`roadmap/ROADMAP_FE.md` §Đợt 1); F1.3 trở đi dùng MSW theo mục 9 |
| Báo cáo trước | [GĐ0](GD0_BAO_CAO_FE.md) — hợp đồng chung (lỗi, CSRF, phân trang, `api-client.js`) xem ở đó |

> **Đọc nhanh:**
> - Dùng được thật ngay: `POST /auth/register`, `/auth/verify-email`, `/auth/resend-verification`. Thư xác thực xem ở Mailpit http://localhost:8025.
> - **Tên trường JSON = tên field entity** (tiếng Việt không dấu): `tenHienThi`, `trangThai`, `muiGio`, `vaiTro`, `daHoanTatKhoiDau`. FE dùng nguyên tên, không đổi sang tiếng Anh.
> - Đăng nhập thật đã có: `POST /auth/login`, `POST /auth/logout`, `GET /me` (cookie `SESSION`). Tài khoản seed: `an@vocab.local` / `Vocab@12345`.
> - **Sửa `api-client.js` trước khi nối đăng nhập:** chỉ thử lại 403 khi `code === 'FORBIDDEN'` (mục 3).

---

## 1. BE đã giao gì (đối chiếu 2 roadmap)

| BE bước | Kết quả | FE bước / UI | FE cần làm |
|---|---|---|---|
| B1.1 Đăng ký & xác thực email | ✅ `POST /auth/register`, `/auth/verify-email`, `/auth/resend-verification`; token một lần, hết hạn 24 giờ, chỉ lưu SHA-256; mật khẩu BCrypt | F1.1 UI06 `/dang-ky`, UI07 `/xac-thuc-email` | Form đăng ký; trang xác thực tự gọi API từ `?token=`; nút gửi lại thư; khóa nút khi 429 |
| B1.2 Đăng nhập/đăng xuất/phiên | ✅ `POST /auth/login`, `POST /auth/logout`, `GET /me`; phiên Redis, đổi session id khi đăng nhập, logout xóa phiên; lỗi riêng chưa xác thực/bị khóa; 429 khi sai nhiều | F1.2 UI08 `/dang-nhap`, menu người dùng | Form đăng nhập; `useMe()` làm nguồn người dùng; route guard; nút đăng xuất; điều hướng theo `daHoanTatKhoiDau` |
| B1.3 – B1.12 | ⏳ chưa làm | F1.3 – F1.12 | Mock theo mockup `mockups/dot1/` |

**Chưa có** (dùng MSW): mật khẩu (B1.3), Google (B1.4), hồ sơ/thiết lập (B1.5), tệp (B1.6), nội dung (B1.7–B1.12). Lịch: Đợt 1, 12/10–25/10.

## 2. Chạy BE

Không đổi so với GĐ0: `docker compose --profile app up -d --build` trong `backend/k28`.

| Mới | Giá trị |
|---|---|
| Link trong thư xác thực | `${APP_FRONTEND_URL}/xac-thuc-email?token=<token>` (mặc định `http://localhost:3000`) → FE phải có route `/xac-thuc-email` đọc `token` |
| Mailpit | http://localhost:8025 — mọi thư BE gửi nằm ở đây, không ra ngoài |

## 3. Thay đổi hợp đồng chung

| Thay đổi | Chi tiết |
|---|---|
| **Tên trường JSON** | = tên field entity, camelCase tiếng Việt không dấu (`tenHienThi`, `trangThai`, `muiGio`, `emailXacThucAt`, `vaiTro`, `daHoanTatKhoiDau`). Trường không có trong entity: tên gần nhất (`password`, `token`, `acceptTerms`). Áp dụng cho mọi API từ Đợt 1 |
| Mã lỗi mới | `TOKEN_INVALID` (400) — token xác thực sai, hết hạn hoặc đã dùng |
| Enum `trangThai` người dùng | `CHUA_XAC_THUC`, `HOAT_DONG`, `BI_KHOA`, `DANG_XOA` |
| Enum `vaiTro` | `USER`, `ADMIN` |
| Hạn mức mới (429 `RATE_LIMITED`) | Đăng ký: 5 lần/giờ/IP. Gửi lại thư: 3 lần/15 phút theo IP **và** 3 lần/15 phút theo email. Đăng nhập: 5 lần/15 phút theo email (lần 6 bị 429 kể cả khi đúng mật khẩu; đăng nhập đúng trước đó thì bộ đếm về 0) |
| Mã lỗi mới (B1.2) | `INVALID_CREDENTIALS` 401 · `EMAIL_NOT_VERIFIED` 403 · `ACCOUNT_LOCKED` 403 |
| **`api-client.js` (GĐ0 §6) phải sửa** | Hiện đang thử lại **mọi** 403 của request ghi. Từ B1.2 có 403 nghiệp vụ → chỉ thử lại khi `code === 'FORBIDDEN'` (code mẫu ở mục 6) |
| Cookie phiên | `SESSION` (HttpOnly, SameSite=Lax) chỉ được tạo khi **đăng nhập thành công**; request khách bị 401 không tạo phiên. Logout trả `SESSION=; Max-Age=0` |
| Hết phiên | Không hoạt động 7 ngày thì phiên hết hạn. Cookie là cookie phiên trình duyệt (không có `Max-Age`) |

## 4. Luồng chính

```mermaid
sequenceDiagram
  participant U as Người dùng
  participant FE
  participant BE
  participant M as Mailpit
  FE->>BE: GET /auth/csrf
  U->>FE: Điền form /dang-ky
  FE->>BE: POST /auth/register
  BE-->>FE: 201 {trangThai: CHUA_XAC_THUC}
  BE-)M: Thư "Xác thực email VocabLearning" (sau commit)
  FE->>U: Màn "Kiểm tra hộp thư" + nút Gửi lại
  U->>M: Mở link /xac-thuc-email?token=...
  M->>FE: /xac-thuc-email?token=...
  FE->>BE: POST /auth/verify-email {token}
  alt hợp lệ
    BE-->>FE: 204
    FE->>U: "Đã xác thực" → /dang-nhap
  else sai/hết hạn/đã dùng
    BE-->>FE: 400 TOKEN_INVALID
    FE->>U: Form nhập email → POST /auth/resend-verification
  end
```

**Đăng nhập / đăng xuất (B1.2):**

```mermaid
sequenceDiagram
  participant FE
  participant BE
  participant R as Redis
  FE->>BE: GET /auth/csrf
  FE->>BE: POST /auth/login {email, password}
  alt đúng + HOAT_DONG
    BE->>R: tạo phiên (session id mới)
    BE-->>FE: 200 user + Set-Cookie SESSION
    FE->>BE: GET /auth/csrf (lấy token mới cho phiên)
    FE->>BE: GET /me (useMe)
    FE->>FE: daHoanTatKhoiDau ? next ?? /bo-the : /bat-dau
  else sai
    BE-->>FE: 401 INVALID_CREDENTIALS / 403 EMAIL_NOT_VERIFIED / 403 ACCOUNT_LOCKED / 429
  end
  FE->>BE: POST /auth/logout
  BE->>R: xóa phiên
  BE-->>FE: 204 + SESSION=; Max-Age=0
  FE->>BE: GET /me (cookie cũ)
  BE-->>FE: 401 UNAUTHENTICATED
```

## 5. API chi tiết (đã kiểm chứng trên BE thật)

Mọi request ghi (POST) cần cookie `XSRF-TOKEN` + header `X-XSRF-TOKEN` (GĐ0 §3). Thiếu → 403 `FORBIDDEN`.

### 5.1 `POST /api/v1/auth/register` — đăng ký

| Quyền | FE bước | UI | Trang |
|---|---|---|---|
| G | F1.1 | UI06 | `/dang-ky` |

**Gửi**

| Trường | Kiểu | Bắt buộc | Giới hạn (khớp BE) | Ví dụ |
|---|---|---|---|---|
| `tenHienThi` | string | ✔ | không rỗng, ≤ 100 ký tự | `"Minh Anh"` |
| `email` | string | ✔ | email hợp lệ, ≤ 255; BE tự trim + chữ thường | `"minhanh@vocab.local"` |
| `password` | string | ✔ | 8–72 ký tự, có ít nhất 1 chữ cái và 1 chữ số | `"matkhau123"` |
| `muiGio` | string | – | IANA, ≤ 50; bỏ trống → `Asia/Ho_Chi_Minh` | `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| `acceptTerms` | boolean | ✔ | phải `true` | `true` |

**Nhận** (thật)

```http
HTTP/1.1 201
```
```json
{"id":"6","email":"minhanh.1790618975@vocab.local","tenHienThi":"Minh Anh","trangThai":"CHUA_XAC_THUC","muiGio":"Asia/Ho_Chi_Minh","emailXacThucAt":null,"vaiTro":["USER"],"daHoanTatKhoiDau":false}
```

Chưa tạo phiên: đăng ký xong **không** đăng nhập; phải xác thực email rồi đăng nhập (B1.2).

**Lỗi** (thật)

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|
| 400 | `VALIDATION_FAILED` + `fieldErrors` | Sai giới hạn trường | `applyServerErrors` → lỗi dưới ô (`field` = tên input) |
| 400 | `VALIDATION_FAILED`, `fieldErrors: []`, message `"Múi giờ không hợp lệ"` | `muiGio` không phải IANA | Hiện lỗi chung của form (hoặc không gửi `muiGio`) |
| 409 | `CONFLICT` "Email đã được sử dụng" | Email đã có (không phân biệt hoa/thường) | `setError('email', …)` + link `/dang-nhap` |
| 429 | `RATE_LIMITED` | > 5 lần/giờ cùng IP | Khóa nút, toast |
| 403 | `FORBIDDEN` | Thiếu CSRF | `api-client` tự lấy token và thử lại 1 lần |

```json
{"code":"VALIDATION_FAILED","message":"Dữ liệu không hợp lệ","fieldErrors":[{"field":"password","message":"Mật khẩu 8–72 ký tự, có chữ cái và chữ số"},{"field":"email","message":"Email không hợp lệ"},{"field":"acceptTerms","message":"Bạn cần đồng ý với điều khoản sử dụng"},{"field":"tenHienThi","message":"Vui lòng nhập tên hiển thị"}],"requestId":"cbf0c5d5-fa82-45a8-ad78-67fa0dbb90e4"}
```
```json
{"code":"CONFLICT","message":"Email đã được sử dụng","fieldErrors":[],"requestId":"73d7fa4a-115f-4477-b9d0-8c36aebdd8e5"}
```

**Tác dụng phụ:** tạo `ho_so_hoc_tap` + `cai_dat_thong_bao` mặc định; gửi thư tiêu đề **"Xác thực email VocabLearning"** chứa link `http://localhost:3000/xac-thuc-email?token=…` (hiệu lực 24 giờ). Thư gửi bất đồng bộ sau commit, thường tới Mailpit trong 1–2 giây.

### 5.2 `POST /api/v1/auth/verify-email` — xác thực email

| Quyền | FE bước | UI | Trang |
|---|---|---|---|
| G | F1.1 | UI07 | `/xac-thuc-email?token=` |

**Gửi**

| Trường | Kiểu | Bắt buộc | Giới hạn | Ví dụ |
|---|---|---|---|---|
| `token` | string | ✔ | không rỗng, ≤ 100 | lấy nguyên từ query `token` |

**Nhận** (thật)

```http
HTTP/1.1 204
```

`trangThai` chuyển `CHUA_XAC_THUC` → `HOAT_DONG`, ghi `emailXacThucAt`. Token bị đánh dấu đã dùng.

**Lỗi** (thật)

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|
| 400 | `TOKEN_INVALID` | Token sai, hết hạn, **đã dùng** (gọi lần 2), hoặc đã bị thay bằng token mới do gửi lại | Hiện "Liên kết không hợp lệ hoặc đã hết hạn" + form gửi lại thư |
| 400 | `VALIDATION_FAILED` (`field: token`) | Thiếu token | Như trên |

```json
{"code":"TOKEN_INVALID","message":"Liên kết xác thực không hợp lệ hoặc đã hết hạn","fieldErrors":[],"requestId":"2feb89a0-2dd1-4406-bb1d-04fa42bb9a6f"}
```

> React Strict Mode gọi effect 2 lần ở dev → lần 2 nhận `TOKEN_INVALID`. Dùng `useMutation` + cờ `useRef` để chỉ gọi 1 lần.

### 5.3 `POST /api/v1/auth/resend-verification` — gửi lại thư xác thực

| Quyền | FE bước | UI | Trang |
|---|---|---|---|
| G | F1.1 | UI06 (sau đăng ký), UI07 | `/dang-ky`, `/xac-thuc-email` |

**Gửi**

| Trường | Kiểu | Bắt buộc | Giới hạn | Ví dụ |
|---|---|---|---|---|
| `email` | string | ✔ | email hợp lệ, ≤ 255 | `"minhanh@vocab.local"` |

**Nhận** (thật): luôn `204`, kể cả email không tồn tại hoặc đã xác thực (không lộ tài khoản).

```http
HTTP/1.1 204
```

**Lỗi** (thật)

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|
| 400 | `VALIDATION_FAILED` | Email sai định dạng | Lỗi dưới ô email |
| 429 | `RATE_LIMITED` | > 3 lần/15 phút cùng IP hoặc cùng email | `VL.countdown`/khóa nút ~60 giây, toast message |

**Tác dụng phụ:** chỉ khi tài khoản tồn tại và `CHUA_XAC_THUC`: vô hiệu token cũ, gửi thư mới. Link trong thư cũ sẽ trả `TOKEN_INVALID`.

### 5.4 `POST /api/v1/auth/login` — đăng nhập

| Quyền | FE bước | UI | Trang |
|---|---|---|---|
| G | F1.2 | UI08 | `/dang-nhap?next=` |

**Gửi**

| Trường | Kiểu | Bắt buộc | Giới hạn (khớp BE) | Ví dụ |
|---|---|---|---|---|
| `email` | string | ✔ | email hợp lệ, ≤ 255; BE tự trim + chữ thường | `"an@vocab.local"` |
| `password` | string | ✔ | không rỗng, ≤ 72 | `"Vocab@12345"` |

Trường lạ (ví dụ `remember` của mockup) bị bỏ qua.

**Nhận** (thật)

```http
HTTP/1.1 200
Set-Cookie: SESSION=<id>; Path=/; HttpOnly; SameSite=Lax
```
```json
{"id":"2","email":"an@vocab.local","tenHienThi":"Nguyễn Văn An","trangThai":"HOAT_DONG","muiGio":"Asia/Ho_Chi_Minh","emailXacThucAt":"2026-09-27T14:47:04.939Z","vaiTro":["USER"],"daHoanTatKhoiDau":true}
```

**Lỗi** (thật)

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|
| 400 | `VALIDATION_FAILED` + `fieldErrors` (`email`, `password`) | Thiếu/sai định dạng | Lỗi dưới ô |
| 401 | `INVALID_CREDENTIALS` "Sai email hoặc mật khẩu" | Sai mật khẩu **hoặc** email không tồn tại (cùng thông điệp) | Notice đầu form; **không** chuyển trang, không gọi `/dang-nhap?next` |
| 403 | `EMAIL_NOT_VERIFIED` "Tài khoản chưa xác thực email" | Mật khẩu đúng nhưng `CHUA_XAC_THUC` | Notice cảnh báo + nút "Gửi lại thư xác thực" → `/xac-thuc-email?email=` |
| 403 | `ACCOUNT_LOCKED` "Tài khoản đã bị khóa. Liên hệ với quản trị viên để được hỗ trợ" | `BI_KHOA` hoặc `DANG_XOA` | Notice lỗi |
| 429 | `RATE_LIMITED` | > 5 lần/15 phút cùng email | Khóa nút, đếm ngược |

```json
{"code":"INVALID_CREDENTIALS","message":"Sai email hoặc mật khẩu","fieldErrors":[],"requestId":"941e54c9-09c4-4360-839b-670aac768583"}
```
```json
{"code":"EMAIL_NOT_VERIFIED","message":"Tài khoản chưa xác thực email","fieldErrors":[],"requestId":"668119c0-0a4b-45d5-8d70-8e949f969159"}
```

**Tác dụng phụ:** đổi session id (chống session fixation), ghi `dang_nhap_cuoi_at`. Sau đăng nhập gọi lại `GET /auth/csrf` (ROADMAP_FE F1.2) rồi `invalidateQueries(['me'])`.

### 5.5 `GET /api/v1/me` — người dùng hiện tại

| Quyền | FE bước | UI | Trang |
|---|---|---|---|
| L | F1.2 | Header, menu người dùng, route guard | mọi trang cần đăng nhập |

**Nhận** (thật): cùng dạng 5.4.

```http
HTTP/1.1 200
```
```json
{"id":"6","email":"minhanh.1790618975@vocab.local","tenHienThi":"Minh Anh","trangThai":"HOAT_DONG","muiGio":"Asia/Ho_Chi_Minh","emailXacThucAt":"2026-09-28T18:09:40.227Z","vaiTro":["USER"],"daHoanTatKhoiDau":false}
```

**Lỗi** (thật)

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập, phiên hết hạn hoặc đã đăng xuất | `useMe()` trả `null` (không redirect ở trang khách); trang cần đăng nhập → `/dang-nhap?next=` |

```json
{"code":"UNAUTHENTICATED","message":"Bạn cần đăng nhập để tiếp tục","fieldErrors":[],"requestId":"726dfa70-c2da-49ef-b3b2-78da860aa4b4"}
```

### 5.6 `POST /api/v1/auth/logout` — đăng xuất

| Quyền | FE bước | UI | Trang |
|---|---|---|---|
| G/L | F1.2 | Menu người dùng | mọi trang |

**Nhận** (thật)

```http
HTTP/1.1 204
Set-Cookie: SESSION=; Max-Age=0; Expires=Thu, 1 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax
```

Gọi khi chưa đăng nhập vẫn 204. Cần CSRF như mọi POST. Sau logout: `queryClient.clear()` rồi chuyển `/dang-nhap?loggedOut=1`. Cookie cũ gọi `/me` → 401 (đã kiểm thật).

## 6. Mã FE mẫu

**Zod** (giới hạn = BE):

```js
import { z } from 'zod';

export const registerSchema = z.object({
  tenHienThi: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị').max(100, 'Tên hiển thị tối đa 100 ký tự'),
  email: z.string().trim().email('Email không hợp lệ').max(255),
  password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/, 'Mật khẩu 8–72 ký tự, có chữ cái và chữ số'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Bạn cần đồng ý với điều khoản sử dụng' }) }),
});

export const resendSchema = z.object({ email: z.string().trim().email('Email không hợp lệ').max(255) });
```

**Hook**:

```js
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useRegister = () =>
  useMutation({ mutationFn: (v) => api('/auth/register', { method: 'POST', body: { ...v, muiGio: tz() } }) });

export const useVerifyEmail = () =>
  useMutation({ mutationFn: (token) => api('/auth/verify-email', { method: 'POST', body: { token } }) });

export const useResendVerification = () =>
  useMutation({ mutationFn: (email) => api('/auth/resend-verification', { method: 'POST', body: { email } }) });
```

**Xử lý lỗi đăng ký**:

```js
onError: (e) => {
  if (applyServerErrors(e, setError)) return;
  if (e.code === 'CONFLICT') return setError('email', { message: e.message });
  if (e.code === 'RATE_LIMITED') return lockSubmit(60);
  setError('root', { message: e.message });
}
```

**MSW** (dữ liệu thật mục 5):

```js
import { http, HttpResponse } from 'msw';
const API = 'http://localhost:8080/api/v1';
const err = (status, code, message, fieldErrors = []) =>
  HttpResponse.json({ code, message, fieldErrors, requestId: 'mock' }, { status });

export const authHandlers = [
  http.post(`${API}/auth/register`, async ({ request }) => {
    const b = await request.json();
    if (b.email?.trim().toLowerCase() === 'an@vocab.local') return err(409, 'CONFLICT', 'Email đã được sử dụng');
    return HttpResponse.json({
      id: '6', email: b.email.trim().toLowerCase(), tenHienThi: b.tenHienThi.trim(), trangThai: 'CHUA_XAC_THUC',
      muiGio: b.muiGio ?? 'Asia/Ho_Chi_Minh', emailXacThucAt: null, vaiTro: ['USER'], daHoanTatKhoiDau: false,
    }, { status: 201 });
  }),
  http.post(`${API}/auth/verify-email`, async ({ request }) => {
    const { token } = await request.json();
    return token === 'mock-ok' ? new HttpResponse(null, { status: 204 })
      : err(400, 'TOKEN_INVALID', 'Liên kết xác thực không hợp lệ hoặc đã hết hạn');
  }),
  http.post(`${API}/auth/resend-verification`, () => new HttpResponse(null, { status: 204 })),
];
```

**Đăng nhập / phiên (B1.2)**

Sửa `api-client.js` (GĐ0 §6), chỉ thử lại khi lỗi CSRF:

```js
if (res.status === 403 && data?.code === 'FORBIDDEN' && WRITE.has(method) && !retried) {
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  return api(path, { method, body, headers, retried: true });
}
```

```js
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ').max(255),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(72, 'Mật khẩu tối đa 72 ký tự'),
});

export const useMe = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: () => api('/me').catch((e) => (e instanceof ApiError && e.status === 401 ? null : Promise.reject(e))),
    staleTime: 60_000,
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v) => api('/auth/login', { method: 'POST', body: v }),
    onSuccess: async (user) => {
      document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
      await ensureCsrf();
      qc.setQueryData(['me'], user);
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSettled: () => { qc.clear(); window.location.href = '/dang-nhap?loggedOut=1'; },
  });
};

export const afterLogin = (user, next) => (user.daHoanTatKhoiDau ? next ?? '/bo-the' : '/bat-dau');
```

Xử lý lỗi form đăng nhập:

```js
onError: (e) => {
  if (applyServerErrors(e, setError)) return;
  if (e.code === 'EMAIL_NOT_VERIFIED') return setNotice({ kind: 'warning', text: e.message, resendFor: getValues('email') });
  if (e.code === 'RATE_LIMITED') return lockSubmit(60);
  setNotice({ kind: 'danger', text: e.message, requestId: e.requestId });
}
```

MSW:

```js
let loggedIn = null;
const an = { id: '2', email: 'an@vocab.local', tenHienThi: 'Nguyễn Văn An', trangThai: 'HOAT_DONG', muiGio: 'Asia/Ho_Chi_Minh',
  emailXacThucAt: '2026-09-27T14:47:04.939Z', vaiTro: ['USER'], daHoanTatKhoiDau: true };

export const sessionHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const b = await request.json();
    if (b.email?.trim().toLowerCase() !== an.email || b.password !== 'Vocab@12345')
      return err(401, 'INVALID_CREDENTIALS', 'Sai email hoặc mật khẩu');
    loggedIn = an;
    return HttpResponse.json(an);
  }),
  http.get(`${API}/me`, () => (loggedIn ? HttpResponse.json(loggedIn) : err(401, 'UNAUTHENTICATED', 'Bạn cần đăng nhập để tiếp tục'))),
  http.post(`${API}/auth/logout`, () => { loggedIn = null; return new HttpResponse(null, { status: 204 }); }),
];
```

## 7. Dữ liệu mẫu / tài khoản demo

| Việc | Cách làm |
|---|---|
| Tài khoản seed (profile `dev`) | `admin@vocab.local` (ADMIN, USER), `an@vocab.local`, `binh@vocab.local`, `chi@vocab.local` — mật khẩu chung `Vocab@12345` (README). `an@` có `daHoanTatKhoiDau = true` |
| Thử 403 `EMAIL_NOT_VERIFIED` | Đăng ký tài khoản mới, **không** bấm link trong Mailpit, rồi đăng nhập |
| Thử 403 `ACCOUNT_LOCKED` | Chưa có API khóa (phần quản trị); nhờ BE đổi `trang_thai = 'BI_KHOA'` trong DB dev |
| Tạo tài khoản test mới | Đăng ký với email bất kỳ `*@vocab.local` → mở http://localhost:8025 → bấm link trong thư |
| Email trùng để thử 409 | `an@vocab.local` |
| Bị 429 khi dev | Chờ hết cửa sổ (1 giờ / 15 phút) hoặc nhờ BE xóa khóa Redis `rl:*` |

## 8. Checklist FE hoàn thành F1.1, F1.2

- [ ] `/dang-ky`: 4 trường + checkbox điều khoản; Zod khớp mục 6; gửi `muiGio` từ trình duyệt
- [ ] Lỗi server hiện dưới đúng ô theo `fieldErrors[].field` (`tenHienThi`, `email`, `password`, `acceptTerms`)
- [ ] 409 → lỗi dưới ô email + link đăng nhập; 429 → khóa nút có đếm ngược
- [ ] Đăng ký xong → màn "Kiểm tra hộp thư" hiện email vừa nhập + nút "Gửi lại thư"
- [ ] `/xac-thuc-email?token=` tự gọi xác thực **đúng 1 lần**; 204 → thông báo thành công + nút `/dang-nhap`
- [ ] `TOKEN_INVALID` → thông báo + form email gửi lại thư; gửi lại luôn hiện cùng một thông báo thành công
- [ ] Không có `token` trên URL → hiện form gửi lại thư
- [ ] Kiểm thử thật: đăng ký → mở link trong Mailpit → xác thực OK; mở lại link lần 2 → `TOKEN_INVALID`
- [ ] F1.2 `api-client.js` chỉ thử lại 403 khi `code === 'FORBIDDEN'`
- [ ] F1.2 `/dang-nhap`: Zod khớp mục 6; 401 → notice chung (không chỉ ra sai email hay mật khẩu); 403 `EMAIL_NOT_VERIFIED` → notice + nút gửi lại thư; 403 `ACCOUNT_LOCKED` → notice lỗi; 429 → khóa nút đếm ngược
- [ ] F1.2 Đăng nhập xong: lấy lại CSRF, đặt cache `['me']`, chuyển `/bat-dau` nếu `daHoanTatKhoiDau = false`, ngược lại `next` hoặc `/bo-the`
- [ ] F1.2 `useMe()` là nguồn duy nhất cho header/menu; route guard trang cần đăng nhập → `/dang-nhap?next=`
- [ ] F1.2 Đăng xuất: `POST /auth/logout` → xóa cache → `/dang-nhap?loggedOut=1`; bấm Back không xem lại được dữ liệu cũ
- [ ] F1.2 Kiểm thử thật: đăng nhập `an@vocab.local` → header có tên; đăng xuất → mở `/ca-nhan` bị đẩy về `/dang-nhap`

## 9. Sắp có ở Đợt 1 — hợp đồng dự kiến

| BE bước | Dự kiến có | API | FE bước | UI |
|---|---|---|---|---|
| B1.3 | Đợt 1 | `POST /auth/forgot-password`, `/auth/reset-password`, `PUT /me/password` | F1.3 | UI09, UI10, UI42 |
| B1.4 | Đợt 1 | `GET /auth/google/start`, `/auth/google/callback` | F1.4 | Nút Google UI06/UI08 |
| B1.5 | Đợt 1 | `PATCH /me`, `GET/PUT /me/learning-settings`, `GET/PUT /me/notification-settings` | F1.5 | UI11, UI40, UI41, UI43 |
| B1.6 – B1.12 | Đợt 1 | tệp, chủ đề, bộ thẻ, thẻ, thư viện, sao chép, CSV (TK §13.2) | F1.6 – F1.12 | xem `mockups/dot1/` |

**B1.3 — dự kiến** (ROADMAP_BE B1.3): `POST /auth/forgot-password {email}` luôn 200 (không lộ email); `POST /auth/reset-password {token, password}` → 204 hoặc 400 `TOKEN_INVALID`; `PUT /me/password {currentPassword, newPassword}` → 204. Đặt lại/đổi mật khẩu sẽ **đăng xuất mọi phiên khác**.

## 10. Lưu ý / giới hạn / chưa kiểm chứng

| Mục | Chi tiết |
|---|---|
| `api-client` retry 403 | Đã có 403 nghiệp vụ (`EMAIL_NOT_VERIFIED`, `ACCOUNT_LOCKED`) → bắt buộc sửa như mục 6, nếu không form đăng nhập sẽ gửi 2 lần |
| "Ghi nhớ đăng nhập (7 ngày)" | Mockup có ô này nhưng BE **chưa hỗ trợ**: `remember` bị bỏ qua, cookie `SESSION` luôn là cookie phiên trình duyệt. FE ẩn ô này hoặc để nguyên nhưng không hứa 7 ngày; cần thì báo BE bổ sung |
| Tên seed mockup ≠ BE | Mockup: `an@` tên "Nguyễn An", `chi@` chưa xác thực. BE seed: "Nguyễn Văn An", `chi@` đã xác thực. Dữ liệu thật lấy theo BE |
| Hạn mức theo IP | Gửi lại thư đếm chung theo IP (3/15 phút) cho mọi email → nhiều người cùng mạng/NAT có thể bị 429 sớm. Dev trên localhost cũng chung 1 IP |
| `muiGio` sai | Trả 400 không có `fieldErrors` (lỗi chung form), khác các trường khác |
| Mockup | `mockups/dot1/dang-ky.html`, `xac-thuc-email.html`, `dang-nhap.html` đã khớp BE (tên trường, thông điệp lỗi, mật khẩu demo `Vocab@12345`) (`tenHienThi`, `muiGio`…). Mockup dùng API giả `shared/demo.js`, trả thêm `demoToken` chỉ để demo — **BE thật không trả trường này** |
| Chưa kiểm chứng | Token hết hạn 24 giờ: kiểm bằng test tự động (`tc01_expiredTokenRejected`), không chờ thật. Hạn mức đăng ký 5/giờ: kiểm bằng code, không bấm thật 6 lần. `ACCOUNT_LOCKED`: kiểm bằng test (`tc01_lockedReturns403`), chưa có API khóa để gọi thật |
| Mockups còn tên cũ | Phần thiết lập học tập/thông báo trong mockup (`goal`, `minutesPerDay`, `inApp`…) sẽ đổi theo entity khi xong B1.5 |

## 11. Báo lỗi cho BE

Gửi đường dẫn API + body + `requestId`; BE tra: `docker compose logs api | grep <requestId>`.
