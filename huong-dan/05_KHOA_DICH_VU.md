# Lấy và gắn khóa dịch vụ thật

Cập nhật 17/11/2026. Hướng dẫn từng bước để chuyển 5 dịch vụ từ bản mô phỏng (`fake`) sang dịch vụ thật, kèm cách kiểm tra và cách xử lý lỗi.

> Giao diện trang quản trị của nhà cung cấp và bảng giá có thể thay đổi. Tên menu ở đây đúng tại thời điểm viết. Nếu khác, tìm theo từ khóa trong ngoặc.

## 0. Tổng quan

| # | Dịch vụ | Dùng cho (bước, màn hình) | Biến bật | Biến khóa | Tốn phí |
|---|---|---|---|---|---|
| 1 | OpenAI Chat | B3.2, B3.3: tạo thẻ từ đoạn văn (UI29), giải thích ngữ cảnh (UI30), sửa câu (UI31) | `AI_PROVIDER=openai` | `OPENAI_API_KEY` | Có, nạp trước |
| 2 | OpenAI TTS | B3.4a: phát âm thẻ, bài nghe (UI19, UI24) | `TTS_PROVIDER=openai` | `OPENAI_API_KEY` (dùng chung) | Có |
| 3 | Azure Speech | B3.4b: chấm phát âm (luyện nói) | `SPEECH_PROVIDER=azure` | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | Có gói miễn phí F0 |
| 4 | Google Imagen | B3.3: ảnh minh họa thẻ (UI29) | `IMAGE_PROVIDER=imagen` | `GOOGLE_AI_API_KEY` | Có, cần bật thanh toán |
| 5 | VNPay sandbox | B3.12a: thanh toán gói (UI55) | `PAYMENT_PROVIDER=vnpay` | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | Không (sandbox) |
| 6 | Google OAuth | B1.x: đăng nhập bằng Google | luôn bật | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Không |

Mỗi dịch vụ bật độc lập. Có thể bật OpenAI mà vẫn để Azure, Imagen, VNPay ở `fake`.

### Quy tắc chung

1. **Nơi ghi khóa:**
   - Dev: `backend/k28/.env`, tạo từ `.env.example`.
   - Production: `backend/k28/.env.prod`, tạo từ `.env.prod.example`.
   - Cả hai đều đã nằm trong `.gitignore`. **Không** ghi khóa vào `application*.yaml`, mã nguồn, Postman, ảnh chụp hay báo cáo.
2. **Bật mà thiếu khóa thì server không khởi động.** Log báo rõ, ví dụ `OPENAI_API_KEY is required when app.ai.provider=openai`. Đây là chủ ý để không chạy nhầm bản mô phỏng.
3. **Đổi biến xong phải khởi động lại BE:**
   - Dev: dừng rồi chạy lại `spring-boot:run`.
   - Prod: `docker compose --env-file .env.prod -f docker-compose.prod.yml up -d api`.
4. **Kết quả từ dịch vụ thật có `moPhong: false`.** FE sẽ bỏ nhãn "Mô phỏng". Đây là dấu hiệu nhanh nhất để biết đã bật đúng.
5. **Lộ khóa thì làm ngay:**
   - Thu hồi khóa trên trang nhà cung cấp và tạo khóa mới.
   - Nếu khóa đã lọt vào git, đổi khóa là bắt buộc; xóa lịch sử git là không đủ.
6. **Mỗi người dùng có hạn mức AI theo ngày và theo gói** (`PRO`/`PREMIUM`, bảng `han_muc_dich_vu`). Hạn mức này giới hạn chi phí khi dùng khóa thật. Ngoài ra nên đặt thêm giới hạn chi tiêu ở phía nhà cung cấp (xem từng mục).

Dev không cần nạp biến thủ công. `application.yaml` tự đọc `.env` qua `spring.config.import: optional:file:.env[.properties]`. Chỉ cần sửa `.env` rồi chạy lại:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## 1. OpenAI (Chat + TTS)

Một khóa dùng cho cả tạo thẻ, giải thích, sửa câu và đọc âm thanh.

### 1.1 Lấy khóa

1. Vào <https://platform.openai.com> và đăng nhập (tạo tài khoản nếu chưa có).
2. **Nạp tiền:**
   - Vào **Settings → Billing** và thêm thẻ.
   - Nạp trước (prepaid), mức tối thiểu hiện là khoảng 5 USD.
   - Chưa có số dư thì mọi lệnh gọi trả `429 insufficient_quota`.
3. **Giới hạn chi tiêu:**
   - Ở **Settings → Limits**, đặt *monthly budget*, ví dụ 10 USD.
   - Bật email cảnh báo.
4. **Tạo khóa:**
   - Vào **Settings → API keys → Create new secret key**.
   - Owned by: *You*. Project: *Default project*, hoặc tạo project `vocab-learning` riêng để tách chi phí.
   - Permissions: *All*. Muốn chặt hơn thì chọn *Restricted*, bật *Model capabilities* (Write), còn lại để *None*.
5. Sao chép khóa dạng `sk-proj-...` ngay. Trang chỉ hiện khóa **một lần**.

### 1.2 Gắn vào hệ thống

```dotenv
AI_PROVIDER=openai
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=alloy
```

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `OPENAI_MODEL` | `gpt-4o-mini` | Model phải hỗ trợ `response_format: json_schema` (strict). Các model `gpt-4o*`, `gpt-4.1*` đều được |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Chỉ đổi khi dùng proxy tương thích OpenAI |
| `TTS_MODEL` | `gpt-4o-mini-tts` | Có thể dùng `tts-1` cho rẻ hơn |
| `TTS_VOICE` | `alloy` | Đổi giọng thì âm thanh đã cache vẫn giữ giọng cũ, vì khóa cache có phiên bản `tts-v1` |

Cấu hình cố định trong `application.yaml`: `temperature 0.2`, `max-output-tokens 6000`, connect timeout 5s, read timeout 60s (TTS 20s).

Có thể bật riêng: `AI_PROVIDER=openai` và `TTS_PROVIDER=fake`, hoặc ngược lại.

### 1.3 Kiểm tra

1. **Kiểm khóa trước, không qua BE.** Lệnh này trả danh sách model nếu khóa đúng:
   ```bash
   curl -s https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" | head -c 300
   ```
2. **Khởi động BE.** Log không có `IllegalStateException`.
3. **Thử tạo thẻ (Chat):**
   - Đăng nhập `an@vocab.local` và vào UI29 `/ai-xuong-the`.
   - Hoặc gọi thẳng `POST /api/v1/ai/card-drafts` với một đoạn văn ngắn.
   - Hỏi `GET /api/v1/ai/requests/{id}` đến khi `trangThai = THANH_CONG`.
   - Kết quả phải có `moPhong: false` và `nhaCungCap: "openai"`.
4. **Thử TTS:**
   - Mở một thẻ chưa có âm thanh và bấm nút loa, tương đương `GET /api/v1/cards/{id}/audio`.
   - Phải nghe được giọng thật (không phải âm "bíp" mô phỏng).
   - Gọi lần 2 phải lấy từ cache, không tốn phí.
5. **Ghi kết quả:** tick B3.2, B3.3 (phần chữ) và B3.4a trong `roadmap/TienDoDuKien_backend.md`, có ngày và model đã dùng.

### 1.4 Lỗi thường gặp

| Hiện tượng | Mã lỗi trong `yeu_cau_ai.ma_loi` | Nguyên nhân | Cách xử lý |
|---|---|---|---|
| Yêu cầu lỗi ngay | `NCC_XAC_THUC` | Khóa sai, bị thu hồi hoặc thiếu quyền (401/403) | Tạo khóa mới; nếu dùng *Restricted* thì bật quyền *Model capabilities* |
| Thử lại nhiều lần rồi lỗi | `NCC_GIOI_HAN` | 429: hết số dư, chạm budget hoặc vượt giới hạn tốc độ | Nạp thêm tiền hoặc tăng budget; tài khoản mới có giới hạn tốc độ thấp |
| Lỗi ngay | `NCC_TU_CHOI` | 400: model không tồn tại hoặc không hỗ trợ `json_schema` | Đổi `OPENAI_MODEL` về `gpt-4o-mini` |
| Lỗi ngay | `SAI_SCHEMA` | Model trả JSON sai cấu trúc | Hiếm; thử lại hoặc dùng model mạnh hơn |
| Lỗi ngay | `NCC_TU_CHOI_ND` | Nội dung bị bộ lọc an toàn từ chối | Đổi đoạn văn đầu vào |
| Thử lại | `NCC_LOI_5XX`, `KET_NOI` | OpenAI lỗi hoặc mạng | Tự thử lại tối đa 3 lần, giãn cách 5s→5 phút |

Xem lỗi: Admin → UI51 "Dịch vụ", hoặc `GET /api/v1/ai/history` của người dùng.

---

## 2. Azure Speech (chấm phát âm)

### 2.1 Lấy khóa

1. Vào <https://portal.azure.com> và đăng nhập.
   - Sinh viên có thể dùng **Azure for Students** (<https://azure.microsoft.com/free/students>), có tín dụng miễn phí và không cần thẻ.
2. **Tạo tài nguyên:**
   - Chọn **Create a resource**, tìm **Speech** (thuộc *Azure AI services*), rồi **Create**.
3. **Điền thông tin:**

   | Trường | Giá trị |
   |---|---|
   | Subscription | Gói của bạn (ví dụ *Azure for Students*) |
   | Resource group | Tạo mới `vocab-rg` |
   | Region | **Southeast Asia** (giá trị biến: `southeastasia`) |
   | Name | `vocab-speech` (tên duy nhất toàn cầu) |
   | Pricing tier | **Free F0**: giới hạn giờ âm thanh mỗi tháng, đủ cho demo. **Standard S0** khi cần nhiều hơn |

4. Bấm **Review + create**, rồi **Create**, rồi **Go to resource**.
5. Vào **Resource Management → Keys and Endpoint**:
   - Sao chép **KEY 1**.
   - Ghi lại **Location/Region**, ví dụ `southeastasia`.
   - Có 2 khóa để đổi khóa không gián đoạn: dùng KEY 2 trong lúc tạo lại KEY 1.

Mỗi subscription chỉ được một tài nguyên F0 cho Speech. Nếu nút F0 bị mờ thì đã có một tài nguyên F0 khác.

### 2.2 Gắn vào hệ thống

```dotenv
SPEECH_PROVIDER=azure
AZURE_SPEECH_KEY=<KEY 1>
AZURE_SPEECH_REGION=southeastasia
```

- **Vùng:** chỉ chữ thường và số, đúng tên vùng của tài nguyên (`southeastasia`, `eastasia`, `japaneast`...). Sai định dạng thì BE không khởi động; sai vùng thì lỗi 401.
- **Endpoint BE gọi:** `https://<region>.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`.
- **Header:** `Ocp-Apim-Subscription-Key` và `Pronunciation-Assessment`.
- **Âm thanh gửi đi:** WAV PCM, ngôn ngữ `en-US`, dài 0,3–15 giây, tối đa 512 KB. FE đã ghi âm đúng định dạng này.

### 2.3 Kiểm tra

1. **Kiểm khóa trước, không qua BE.** Kết quả `200` và một chuỗi token dài là khóa đúng:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST "https://southeastasia.api.cognitive.microsoft.com/sts/v1.0/issueToken" -H "Ocp-Apim-Subscription-Key: $AZURE_SPEECH_KEY" -H "Content-Length: 0"
   ```
2. **Khởi động BE**, rồi vào màn luyện nói và đọc một từ, tương đương `POST /api/v1/pronunciation/assessments` (multipart).
3. **Xem kết quả:**
   - Gọi `GET /api/v1/pronunciation/assessments/{id}`.
   - Phải có điểm thật (độ chính xác, trôi chảy, hoàn chỉnh) và `moPhong: false`.
   - Nói sai rõ ràng thì điểm phải thấp. Bản mô phỏng luôn trả điểm cố định.
4. **Ghi kết quả:** tick B3.4b trong roadmap.

### 2.4 Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `NCC_XAC_THUC` / 401 | Khóa sai, hoặc khóa đúng nhưng sai `AZURE_SPEECH_REGION` | So vùng ở trang *Keys and Endpoint* |
| `NCC_GIOI_HAN` / 429 | F0 hết giờ âm thanh trong tháng, hoặc vượt số request đồng thời | Chờ tháng sau hoặc nâng lên S0 |
| "Không nghe thấy giọng nói" | `RecognitionStatus` là `NoMatch` / `InitialSilenceTimeout` | Thu lại gần micro hơn; kiểm tra file không rỗng |
| `SAI_DINH_DANG` | Âm thanh không phải WAV PCM | Kiểm tra bộ ghi âm FE |

---

## 3. Google Imagen (ảnh minh họa thẻ)

Dùng **Gemini API** (Google AI Studio), không phải Vertex AI, nên chỉ cần một API key.

### 3.1 Lấy khóa

1. Vào <https://aistudio.google.com> và đăng nhập tài khoản Google.
2. **Tạo khóa:**
   - Chọn **Get API key → Create API key**.
   - Chọn một Google Cloud project có sẵn, hoặc để AI Studio tạo project mới.
3. Sao chép khóa dạng `AIza...`.
4. **Bật thanh toán (bắt buộc với Imagen).** Imagen không có trong gói miễn phí của Gemini API; khóa gói miễn phí gọi Imagen sẽ trả lỗi 400 hoặc 403.
   - Trong AI Studio, vào **Get API key** và bấm **Set up billing** cạnh project.
   - Hoặc vào <https://console.cloud.google.com/billing> và gắn tài khoản thanh toán cho đúng project đó.
   - Tài khoản Google Cloud mới thường có tín dụng dùng thử.
5. **Giới hạn chi phí:**
   - Vào Cloud Console → **Billing → Budgets & alerts → Create budget** và đặt ngưỡng, ví dụ 5 USD.
   - Budget chỉ gửi cảnh báo, không tự chặn. Chặn thật dựa vào hạn mức theo gói của hệ thống.
6. **Hạn chế khóa (nên làm):**
   - Vào Cloud Console → **APIs & Services → Credentials**, mở khóa vừa tạo.
   - Ở **API restrictions**, chọn *Restrict key* → **Generative Language API**.
   - Ở **Application restrictions**, chọn *IP addresses* và nhập IP máy chủ production (dev thì bỏ trống).

### 3.2 Gắn vào hệ thống

```dotenv
IMAGE_PROVIDER=imagen
GOOGLE_AI_API_KEY=AIza...
IMAGEN_MODEL=imagen-4.0-generate-001
```

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `IMAGEN_MODEL` | `imagen-4.0-generate-001` | `imagen-4.0-fast-generate-001` rẻ và nhanh hơn; `imagen-4.0-ultra-generate-001` đẹp hơn và đắt hơn |
| `IMAGEN_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta` | Không cần đổi |

BE gọi `POST {base}/models/{model}:predict` với header `x-goog-api-key`. Tham số gửi đi:

- `sampleCount: 1`
- `aspectRatio: "1:1"`
- `personGeneration: "dont_allow"`, không vẽ người, để tránh bị lọc

Ảnh nhận về được thu thành **PNG 512×512**, nên luôn nhỏ hơn giới hạn 2 MB. Read timeout là 60 giây.

### 3.3 Kiểm tra

1. **Kiểm khóa và model trước, không qua BE.** Tìm `imagen-4.0` trong kết quả:
   ```bash
   curl -s "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200" -H "x-goog-api-key: $GOOGLE_AI_API_KEY" | grep -o '"models/imagen[^"]*"'
   ```
2. **Khởi động BE**, rồi ở UI29 bấm "Tạo ảnh" cho một thẻ, tương đương `POST /api/v1/ai/card-images`.
3. **Xem kết quả:**
   - Gọi `GET /api/v1/ai/requests/{id}` đến khi `THANH_CONG`.
   - Phải có `nhaCungCap: "google"` và `moPhong: false`.
   - Ảnh trên thẻ là ảnh thật, không phải hình học mô phỏng.
4. **Ghi kết quả:** tick phần ảnh của B3.3 trong roadmap, có ngày và model.

### 3.4 Lỗi thường gặp

| Hiện tượng | Mã lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|---|
| Lỗi ngay | `NCC_XAC_THUC` | 401/403: khóa sai, hạn chế API/IP chặn, hoặc project chưa bật thanh toán | Kiểm tra billing và phần hạn chế khóa |
| Lỗi ngay | `NCC_TU_CHOI` | 400: tên model sai, hoặc Imagen chưa mở cho khóa này | Chạy lệnh kiểm tra 3.3 bước 1 và chọn model có trong danh sách |
| Lỗi ngay | `NCC_TU_CHOI_ND` | Ảnh bị bộ lọc an toàn chặn (`raiFilteredReason`) hoặc không trả ảnh | Đổi từ hoặc nghĩa của thẻ; chuyện này bình thường với một số từ |
| Thử lại | `NCC_GIOI_HAN` | 429: vượt hạn mức số ảnh/phút của project | Chờ; xem *Quotas* trong AI Studio |
| Lỗi ngay | `ANH_KHONG_HOP_LE` | Dữ liệu ảnh hỏng | Hiếm; thử lại |

---

## 4. VNPay sandbox (thanh toán)

Sandbox dùng tiền ảo và thẻ test, không mất phí. Production cần hợp đồng với VNPay và **không** nằm trong phạm vi đồ án.

### 4.1 Lấy khóa

1. **Đăng ký merchant test:**
   - Vào <https://sandbox.vnpayment.vn/devreg/> và điền form.
   - Website nhập URL dự kiến (dev có thể ghi `http://localhost:3000`). Email phải là email thật để nhận thông tin.
2. **Đọc email VNPay gửi về** (thường trong vài phút; kiểm tra cả thư rác). Email có:

   | Thông tin | Gắn vào |
   |---|---|
   | Mã website `vnp_TmnCode` (8 ký tự) | `VNPAY_TMN_CODE` |
   | Chuỗi bí mật `vnp_HashSecret` (32 ký tự) | `VNPAY_HASH_SECRET` |
   | URL thanh toán `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` | `VNPAY_PAY_URL` (đã là mặc định) |
   | Tài khoản trang quản trị merchant `https://sandbox.vnpayment.vn/merchantv2/` | Để xem giao dịch |

3. **Đăng ký URL IPN.** Đây là URL VNPay gọi máy chủ BE để báo kết quả và là bước dễ quên nhất.
   - Trên trang merchant sandbox, tìm mục cấu hình IPN (nếu có), hoặc gửi email cho hỗ trợ kỹ thuật VNPay kèm `TmnCode` và URL IPN.
   - URL: `https://<domain công khai>/api/v1/billing/vnpay/ipn`.
   - URL phải truy cập được từ Internet. `localhost` **không** dùng được.

### 4.2 URL công khai khi chạy dev

IPN cần đi từ Internet vào máy dev. Dùng Cloudflare Tunnel (miễn phí, không cần tài khoản):

```bash
cloudflared tunnel --url http://localhost:8080
```

- Lệnh in ra địa chỉ dạng `https://abc-xyz.trycloudflare.com`.
- Đăng ký URL IPN là `https://abc-xyz.trycloudflare.com/api/v1/billing/vnpay/ipn`.
- Địa chỉ đổi mỗi lần chạy lại, nên phải đăng ký lại IPN. Dùng named tunnel nếu cần địa chỉ cố định.

Return URL **không** cần công khai, vì trình duyệt của người dùng tự chuyển hướng về đó. Dev giữ mặc định `http://localhost:8080/api/v1/billing/vnpay/return`.

### 4.3 Gắn vào hệ thống

Dev (`.env`):

```dotenv
PAYMENT_PROVIDER=vnpay
VNPAY_TMN_CODE=XXXXXXXX
VNPAY_HASH_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VNPAY_PAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8080/api/v1/billing/vnpay/return
APP_FRONTEND_URL=http://localhost:3000
```

Production (`.env.prod`):

- Chỉ cần `PAYMENT_PROVIDER`, `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET`.
- `VNPAY_RETURN_URL` và `APP_FRONTEND_URL` được `docker-compose.prod.yml` tự đặt theo `DOMAIN`.
- URL IPN đăng ký với VNPay: `https://<DOMAIN>/api/v1/billing/vnpay/ipn`. Nginx đã chuyển `/api/` vào BE, và endpoint này mở công khai trong `SecurityConfig`.

Cách hệ thống làm việc với VNPay:

- BE ký tham số bằng **HMAC-SHA512** với `vnp_Version 2.1.0`. Số tiền gửi đi = giá gói × 100.
- Đơn hết hạn sau 15 phút.
- IPN trả `{"RspCode":"00","Message":"Confirm Success"}` theo chuẩn VNPay. Các mã khác:
  - `01`: không thấy đơn.
  - `02`: đơn đã xác nhận trước đó. VNPay gọi lại thì không cộng gói hai lần.
  - `04`: sai số tiền.
  - `97`: sai chữ ký.
  - `99`: lỗi khác.
- Return URL kiểm chữ ký rồi chuyển về FE: `/thanh-toan-ket-qua?maDon=...`, hoặc `?loi=...` nếu sai.
- Khi chuyển sang `vnpay`, nên tắt công cụ demo: `BILLING_DEMO_TOOLS=false`.

### 4.4 Kiểm tra

1. Khởi động BE (và tunnel nếu chạy dev).
2. Đăng nhập một tài khoản `FREE` và chọn gói ở UI55, tương đương `POST /api/v1/billing/checkouts`. Kết quả `paymentUrl` phải trỏ tới `sandbox.vnpayment.vn`.
3. **Trên trang VNPay:**
   - Chọn **Thẻ nội địa và tài khoản ngân hàng**, rồi ngân hàng **NCB**.
   - Nhập thẻ test VNPay công bố:

     | Trường | Giá trị |
     |---|---|
     | Số thẻ | `9704198526191432198` |
     | Tên chủ thẻ | `NGUYEN VAN A` |
     | Ngày phát hành | `07/15` |
     | OTP | `123456` |

4. **Sau khi thanh toán:**
   - Trình duyệt về trang kết quả FE, và `GET /api/v1/billing/transactions/{maDon}` trả trạng thái thành công.
   - Gói người dùng chuyển thành gói vừa mua.
5. **Kiểm IPN:** trên trang merchant sandbox, mở giao dịch, phần IPN phải ghi nhận phản hồi `00`. Nếu IPN không tới thì đơn vẫn có thể thành công nhờ Return URL, nhưng đó **chưa** đạt yêu cầu.
6. **Thử nhánh hủy:** bấm "Hủy giao dịch" trên trang VNPay. Đơn phải chuyển thất bại và gói giữ nguyên.
7. **Ghi kết quả:** tick B3.12a trong roadmap, có mã đơn test (không ghi `HashSecret`).

### 4.5 Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| VNPay báo "Sai chữ ký" (code 70) | `VNPAY_HASH_SECRET` sai hoặc thừa khoảng trắng | Sao chép lại từ email và bỏ dấu cách ở cuối |
| VNPay báo "Website chưa được phê duyệt" (code 03/71) | `VNPAY_TMN_CODE` sai | Kiểm tra email đăng ký |
| Trang FE báo `?loi=SAI_CHU_KY` | Return URL bị sửa tham số, hoặc BE dùng secret khác lúc tạo đơn | Khởi động lại BE sau khi đổi secret và tạo đơn mới |
| Thanh toán xong nhưng gói không đổi | IPN không tới và người dùng đóng tab trước Return URL | Kiểm tra tunnel hoặc domain, URL IPN đã đăng ký; xem log `Payment confirmation failed` |
| Báo "Giao dịch đã quá thời gian chờ" | Quá 15 phút | Tạo đơn mới |

---

## 5. Google OAuth (đăng nhập bằng Google)

Khác với khóa Imagen ở mục 3. Đây là OAuth client cho nút "Đăng nhập với Google".

### 5.1 Lấy khóa

1. Vào <https://console.cloud.google.com> và chọn hoặc tạo project `vocab-learning`. Có thể dùng chung project với Imagen.
2. **Cấu hình màn hình đồng ý:**
   - Vào **APIs & Services → OAuth consent screen** (giao diện mới: **Google Auth Platform → Branding/Audience**).
   - User type: **External**.
   - App name `VocabLearning`, support email và developer email của bạn.
   - Scopes: chỉ cần `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. Đây là scope cơ bản nên không cần Google duyệt.
   - Publishing status *Testing*: thêm email tester ở **Test users** (tối đa 100). Chỉ những email này đăng nhập được.
   - Muốn ai cũng đăng nhập được thì bấm **Publish app**.
3. **Tạo client:**
   - Vào **Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**, Name: `vocab-web`.
   - **Authorized redirect URIs**, phải khớp từng ký tự:
     - `http://localhost:8080/api/v1/auth/google/callback` (dev)
     - `https://<DOMAIN>/api/v1/auth/google/callback` (production)
   - Authorized JavaScript origins: không cần, vì luồng chạy ở BE.
4. Sao chép **Client ID** (`....apps.googleusercontent.com`) và **Client secret** (`GOCSPX-...`).

### 5.2 Gắn vào hệ thống

```dotenv
GOOGLE_CLIENT_ID=1234567890-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/auth/google/callback
```

- Production: `GOOGLE_REDIRECT_URI` được compose tự đặt `https://${DOMAIN}/api/v1/auth/google/callback`.
- Dev đang có giá trị giả `dev-google-client-id` để BE khởi động được. Nút Google chỉ chạy khi thay bằng khóa thật.

### 5.3 Kiểm tra

1. Mở FE `/dang-nhap` và bấm **Đăng nhập với Google**. Luồng đi: `/api/v1/auth/google/start` → trang Google → callback.
2. **Đăng nhập bằng email tester chưa có tài khoản.** Sau đó:
   - Hệ thống tạo tài khoản mới và người dùng về FE ở trạng thái đã đăng nhập.
   - `GET /api/v1/me` trả đúng email.
3. **Thử với email đã có tài khoản mật khẩu.** BE không tự gộp: nó báo cần liên kết, người dùng đăng nhập bằng mật khẩu rồi xác nhận liên kết (hạn 10 phút). Lần sau đăng nhập Google vào đúng tài khoản cũ.
4. **Email Google chưa xác minh** thì BE báo `EMAIL_NOT_VERIFIED`.
5. **Ghi kết quả:** ghi vào mục B1 tương ứng trong roadmap.

### 5.4 Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Google báo `redirect_uri_mismatch` | URI đăng ký khác `GOOGLE_REDIRECT_URI` (http/https, cổng, dấu `/` cuối) | Sửa cho khớp tuyệt đối |
| `Access blocked: app has not completed verification` / `403 access_denied` | App đang *Testing* và email không nằm trong Test users | Thêm email tester hoặc Publish app |
| `invalid_client` | Client secret sai hoặc đã bị đặt lại | Tạo secret mới |
| Callback xong nhưng không đăng nhập | Truy cập FE và BE khác host (`127.0.0.1` vs `localhost`), cookie không theo | Dùng thống nhất `localhost` |

---

## 6. Danh sách kiểm tra khi có khóa

| Việc | Lệnh hoặc nơi xem | Đạt khi |
|---|---|---|
| Khóa nằm ngoài git | `git status` không thấy `.env`, `.env.prod` | ✅ |
| BE khởi động | Log không có `IllegalStateException ... is required` | ✅ |
| OpenAI Chat | UI29 tạo bản nháp | `moPhong: false`, `nhaCungCap: openai` |
| OpenAI TTS | Nút loa trên thẻ mới | Giọng thật, lần 2 lấy cache |
| Azure Speech | Luyện nói một từ | Điểm thay đổi theo cách đọc, `moPhong: false` |
| Imagen | UI29 tạo ảnh | Ảnh thật 512×512, `nhaCungCap: google` |
| VNPay | Mua gói bằng thẻ NCB test | Gói đổi, IPN `00` trên trang merchant |
| Google OAuth | Đăng nhập bằng email tester | Vào được; email đã có tài khoản thì phải liên kết, không tạo trùng |
| Giới hạn chi phí | OpenAI *Limits*, Google *Budgets*, Azure F0 | Đã đặt |
| Roadmap | `roadmap/TienDoDuKien_backend.md` | Tick B3.2, B3.3, B3.4a, B3.4b, B3.12a có ngày |

Khi demo trước hội đồng mà mạng yếu hoặc hết hạn mức, có thể đặt lại các `*_PROVIDER=fake` và khởi động lại. Giao diện vẫn chạy đủ, kết quả gắn nhãn "Mô phỏng".
