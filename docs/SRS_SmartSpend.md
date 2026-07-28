# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
# HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN — SMARTSPEND

| Mục | Nội dung |
|-----|----------|
| Tên dự án | SmartSpend — Ứng dụng Quản lý Chi tiêu Cá nhân |
| Loại tài liệu | Software Requirements Specification (SRS) |
| Chuẩn tham chiếu | IEEE Std 830-1998 |
| Phiên bản | 1.0 |
| Ngày cập nhật | 16/07/2026 |
| Trạng thái | Draft phục vụ đồ án tốt nghiệp |

---

## MỤC LỤC

1. Giới thiệu
2. Mô tả tổng quan
3. Yêu cầu chức năng
4. Yêu cầu phi chức năng
5. Yêu cầu giao diện bên ngoài
6. Mô hình dữ liệu
7. Ma trận truy vết yêu cầu
8. Phụ lục

---

## 1. GIỚI THIỆU

### 1.1. Mục đích
Tài liệu này đặc tả đầy đủ các yêu cầu chức năng và phi chức năng của hệ thống **SmartSpend** — ứng dụng quản lý chi tiêu cá nhân trên thiết bị di động, kèm cổng quản trị (Admin) trên web. Tài liệu là cơ sở thống nhất giữa các nhóm Backend (BE), Frontend (FE), Kiểm thử (QA) và giảng viên hướng dẫn trong quá trình phát triển, nghiệm thu và bảo vệ đồ án.

### 1.2. Phạm vi sản phẩm
SmartSpend cho phép người dùng:
- Tạo tài khoản, bảo mật bằng mật khẩu, OTP email và mã PIN 6 số.
- Quản lý ví điện tử nội bộ (số dư, hạn mức giao dịch).
- Liên kết tài khoản ngân hàng, **nạp tiền** qua chuyển khoản VietQR (đối soát tự động bằng webhook SePay) và **rút tiền** về ngân hàng (qua PayOS).
- Ghi nhận, phân loại và tra cứu lịch sử giao dịch.
- Quản lý danh mục thu/chi, xem báo cáo trực quan (biểu đồ tròn, biểu đồ xu hướng).
- Quản lý hóa đơn nhắc thanh toán, thông báo trong ứng dụng.
- Kết bạn và tạo **quỹ nhóm** để nhiều người cùng góp/nạp tiền (tham khảo mô hình "Quỹ nhóm" của MoMo).

Cổng Admin cho phép quản trị viên quản lý người dùng, banner/bài đăng và xem báo cáo tổng quan.

Ngoài phạm vi (Out of scope): thanh toán quốc tế, đầu tư/chứng khoán, cho vay, tính năng mạng xã hội đầy đủ.

### 1.3. Định nghĩa, thuật ngữ và từ viết tắt
| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| Ví (Wallet) | Ví điện tử nội bộ của người dùng, lưu số dư trong hệ thống |
| STK | Số tài khoản định danh ví trong hệ thống |
| PIN | Mã bảo mật 6 chữ số xác thực giao dịch |
| OTP | One-Time Password gửi qua email |
| Top-up | Nạp tiền vào ví |
| Withdraw | Rút tiền từ ví về ngân hàng |
| SePay | Dịch vụ đối soát biến động số dư ngân hàng qua webhook |
| PayOS | Cổng chi hộ (payout) để rút tiền về ngân hàng |
| VietQR | Chuẩn mã QR chuyển khoản ngân hàng Việt Nam |
| Quỹ nhóm (Fund) | Túi tiền chung nhiều người cùng góp |
| JWT | JSON Web Token dùng xác thực phiên đăng nhập |
| FR / NFR | Functional / Non-Functional Requirement |
| Actor | Tác nhân tương tác với hệ thống |

### 1.4. Tài liệu tham khảo
- `docs/Sprint_Backlog_SmartSpend.md` — Sprint Backlog & Sub-task.
- `docs/SmartSpend_API_Collection.postman_collection.json` — Bộ sưu tập API.
- `docs/specs/BM4. PHIẾU GIAO ĐỀ TÀI ĐỒ ÁN TỐT NGHIỆP-2.docx` — Phiếu giao đề tài.
- IEEE Std 830-1998 — Recommended Practice for Software Requirements Specifications.

### 1.5. Tổng quan tài liệu
Phần 2 mô tả bối cảnh, tác nhân và kiến trúc tổng thể. Phần 3 liệt kê chi tiết yêu cầu chức năng theo module. Phần 4 nêu yêu cầu phi chức năng. Phần 5–6 mô tả giao diện ngoài và mô hình dữ liệu. Phần 7 là ma trận truy vết, phần 8 là phụ lục.

---

## 2. MÔ TẢ TỔNG QUAN

### 2.1. Bối cảnh sản phẩm
SmartSpend là hệ thống độc lập gồm ba thành phần triển khai riêng biệt, giao tiếp qua REST API (JSON):

```
+---------------------------+        +---------------------------+
|  App Customer (Mobile)    |        |  Web Admin (Quản trị)     |
|  Expo / React Native      |        |  React + Vite + Ant Design|
+-------------+-------------+        +-------------+-------------+
              |  HTTPS/REST                        |  HTTPS/REST
              |  /api/v1/auth/**                   |  /api/v1/admin/auth/login
              v                                    |  /api/v1/admin/**
        +------------------------------------------+-------------+
        |            Backend (Spring Boot 3.2)                   |
        | api-app-customer | api-web-admin | core (Auth+JWT+JPA) |
        +-----------------------+--------------------------------+
                                |
              +-----------------+------------------+
              |          |            |            |
              v          v            v            v
         MySQL DB    SMTP Email   SePay Webhook  PayOS Payout
```

- **Backend**: Maven đa module.
  - **`core`**: entity/repository, **Auth dùng chung** (`AuthService`, DTO, JWT, `SecurityConfig`).
  - **`api-app-customer`**: API cho App Customer (Mobile) — auth đầy đủ `/api/v1/auth/**` (login, đăng ký OTP, PIN…); `AppCustomerApplication`.
  - **`api-web-admin`**: API cho Web Admin — login quản trị `POST /api/v1/admin/auth/login` (bắt buộc `role=ADMIN`) + API quản trị; `WebAdminApplication`; dùng chung `AuthService` từ core.
- **App Customer** (`Graduation_Project_AppCustomer`): Expo SDK 54, React Native 0.81, React 19, Expo Router, Axios; biểu đồ dùng `react-native-gifted-charts` / `react-native-chart-kit`.
- **Web Admin** (`Graduation_Project_WebAdmin`): React 19 + Vite + Ant Design + Recharts + Zustand. Login gọi `api-web-admin` (không phụ thuộc `api-app-customer` chỉ để đăng nhập).
- **CSDL**: MySQL.
- **Tích hợp ngoài**: SMTP (gửi OTP), SePay (đối soát nạp tiền), PayOS (chi hộ rút tiền), VietQR (sinh mã QR chuyển khoản).

### 2.2. Chức năng chính của sản phẩm
1. Xác thực & bảo mật (đăng ký OTP, đăng nhập JWT, quên mật khẩu, mã PIN, khóa PIN).
2. Ví điện tử & liên kết ngân hàng.
3. Nạp tiền (VietQR + SePay) và rút tiền (PayOS).
4. Giao dịch & lịch sử.
5. Danh mục thu/chi & báo cáo.
6. Ngân sách (kế hoạch) & Quỹ nhóm.
7. Thông báo & Hóa đơn nhắc hạn.
8. Kết bạn.
9. Quản trị (Admin).

### 2.3. Đặc điểm & tác nhân người dùng (Actors)
| Actor | Mô tả | Quyền chính |
|-------|-------|-------------|
| Khách (Guest) | Chưa đăng nhập | Xem onboarding, đăng ký, đăng nhập, quên mật khẩu |
| Người dùng (User) | Đã xác thực (Role = USER) | Toàn bộ chức năng ví, giao dịch, danh mục, báo cáo, hóa đơn, quỹ, kết bạn |
| Quản trị viên (Admin) | Role = ADMIN | Quản lý người dùng, banner/bài đăng, báo cáo tổng quan |
| Hệ thống ngoài | SePay / PayOS / SMTP | Gọi webhook, xử lý chi hộ, gửi email |

### 2.4. Ràng buộc thiết kế
- RB-01: Backend theo kiến trúc đa module Maven; phản hồi thống nhất qua `ApiResponse<T>` (success, message, data).
- RB-02: Xác thực JWT Bearer; public: `/api/v1/auth/**` (customer), `/api/v1/admin/auth/**` (login Admin), webhook SePay, một số endpoint public (vd. posts/uploads) theo `SecurityConfig`.
- RB-03: Mật khẩu và mã PIN phải được băm (BCrypt), không lưu dạng thô.
- RB-04: Mã PIN cố định 6 chữ số; STK dài 8–15 chữ số và duy nhất.
- RB-05: Số tiền lưu dạng `BigDecimal`; hiển thị định dạng tiền tệ Việt Nam (₫).
- RB-06: Ngôn ngữ giao diện: tiếng Việt.

### 2.5. Giả định và phụ thuộc
- GĐ-01: Người dùng có email hợp lệ để nhận OTP.
- GĐ-02: Dịch vụ SePay, PayOS, SMTP hoạt động và cấu hình đúng khóa API.
- GĐ-03: Thiết bị di động có kết nối Internet.
- GĐ-04: Việc nạp tiền phụ thuộc thời gian đối soát webhook của SePay.

---

## 3. YÊU CẦU CHỨC NĂNG

> Quy ước trạng thái: **[Đã có]** đã hiện diện trong code; **[Đang làm]** đang phát triển; **[Kế hoạch]** dự kiến theo backlog.
> Độ ưu tiên: Cao / Trung bình / Thấp.

### 3.1. Module Xác thực & Bảo mật (EPIC-01)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-AUTH-01 | Hệ thống gửi mã OTP về email khi người dùng yêu cầu đăng ký (`POST /auth/register/send-otp`). | Cao | [Đã có] |
| FR-AUTH-02 | Người dùng đăng ký tài khoản (username, email, mật khẩu) sau khi xác thực OTP (`POST /auth/register`), trả về JWT. | Cao | [Đã có] |
| FR-AUTH-03 | Người dùng đăng nhập bằng email + mật khẩu (`POST /auth/login`), nhận JWT. | Cao | [Đã có] |
| FR-AUTH-04 | Người dùng quên mật khẩu: gửi OTP (`/auth/forgot-password`), xác thực (`/auth/verify-otp`), đặt lại (`/auth/reset-password`). | Cao | [Đã có] |
| FR-AUTH-05 | Thiết lập mã PIN 6 số (`/auth/setup-pin`); kiểm tra trạng thái PIN (`/auth/pin-status`). | Cao | [Đã có] |
| FR-AUTH-06 | Xác thực mã PIN trước giao dịch nhạy cảm (`/auth/verify-pin`). | Cao | [Đã có] |
| FR-AUTH-07 | Quên mã PIN: gửi OTP (`/auth/forgot-pin`) và đặt lại (`/auth/reset-pin`). | Trung bình | [Đã có] |
| FR-AUTH-08 | Đếm số lần nhập PIN sai; khóa tạm thời tài khoản sau N lần sai (trường `failedPinAttempts`, `lockoutTime`). | Cao | [Đã có] |
| FR-AUTH-09 | OTP có thời hạn và trạng thái đã dùng; phân loại theo mục đích (REGISTER, RESET_PASSWORD, RESET_PIN). | Cao | [Đã có] |

**Acceptance tiêu biểu (FR-AUTH-02):** Email chưa tồn tại + OTP đúng và còn hạn → tạo tài khoản, trả JWT. Email trùng → báo lỗi. OTP sai/hết hạn → từ chối.

### 3.2. Module Người dùng (User Profile)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-USER-01 | Lấy thông tin người dùng đang đăng nhập (`GET /user/me`). | Cao | [Đã có] |
| FR-USER-02 | Tìm kiếm người dùng theo email/STK (`GET /user/search`) phục vụ kết bạn & mời quỹ. | Trung bình | [Đã có] |

### 3.3. Module Ví & Ngân hàng (EPIC-02)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-WALLET-01 | Mỗi người dùng có một ví mặc định được tạo tự động, số dư khởi tạo = 0. | Cao | [Đã có] |
| FR-WALLET-02 | Xem thông tin ví: số dư, STK, hạn mức, tổng giao dịch trong ngày (`GET /wallets/me`). | Cao | [Đã có] |
| FR-WALLET-03 | Thiết lập số tài khoản (STK) cho ví, đảm bảo duy nhất (`POST /wallets/setup-account`). | Cao | [Đã có] |
| FR-WALLET-04 | Cập nhật thiết lập ví: bật/tắt hạn mức, hạn mức/giao dịch, hạn mức/ngày (`PUT /wallets/{id}/settings`), yêu cầu PIN. | Trung bình | [Đã có] |
| FR-BANK-01 | Liên kết tài khoản ngân hàng (mã NH, tên NH, STK, tên chủ) (`POST /bank-accounts`). | Cao | [Đã có] |
| FR-BANK-02 | Xem danh sách tài khoản ngân hàng đã liên kết (`GET /bank-accounts`). | Cao | [Đã có] |
| FR-BANK-03 | Xóa tài khoản ngân hàng đã liên kết. | Trung bình | [Đã có] |
| FR-BANK-04 | Giới hạn tối đa 3 tài khoản ngân hàng/người dùng. | Trung bình | [Kế hoạch] |

### 3.4. Module Nạp tiền (EPIC-03)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-TOPUP-01 | Khởi tạo giao dịch nạp tiền, sinh nội dung chuyển khoản và mã QR VietQR (`POST /transactions/top-up`). | Cao | [Đã có] |
| FR-TOPUP-02 | Nhận webhook SePay khi có tiền vào (`POST /transactions/sepay-webhook`), đối soát nội dung → cộng số dư ví, tạo giao dịch TOP_UP trạng thái SUCCESS. | Cao | [Đã có] |
| FR-TOPUP-03 | Chống xử lý trùng webhook (kiểm tra `transactionId` SePay duy nhất). | Cao | [Đã có] |
| FR-TOPUP-04 | FE tự động làm mới số dư sau khi nạp và điều hướng lịch sử. | Trung bình | [Đã có] |

### 3.5. Module Rút tiền (EPIC-03)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-WD-01 | Rút tiền về tài khoản ngân hàng đã liên kết qua PayOS (`POST /transactions/withdraw`), yêu cầu PIN. | Cao | [Đã có] |
| FR-WD-02 | Kiểm tra số dư đủ; số tiền tối thiểu/tối đa mỗi giao dịch. | Cao | [Đã có] |
| FR-WD-03 | Kiểm tra hạn mức theo ngày (đã dùng + số rút ≤ hạn mức). | Cao | [Đã có] |
| FR-WD-04 | Trừ số dư và tạo giao dịch WITHDRAW; hoàn tác (rollback) nếu PayOS thất bại. | Cao | [Đã có] |
| FR-WD-05 | Hiển thị biên lai rút tiền (mã GD, thời gian, số tiền, ngân hàng nhận). | Trung bình | [Đã có] |

### 3.6. Module Giao dịch & Lịch sử (EPIC-04)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-TXN-01 | Xem lịch sử giao dịch, sắp xếp mới nhất trước (`GET /history/transactions`). | Cao | [Đã có] |
| FR-TXN-02 | Cập nhật ghi chú và danh mục của một giao dịch (`PUT /transactions/{code}`), kiểm tra quyền sở hữu. | Cao | [Đã có] |
| FR-TXN-03 | Lịch sử hiển thị nhãn/icon danh mục, kể cả danh mục đã xóa (gắn cờ "đã xóa"). | Trung bình | [Đã có] |
| FR-TXN-04 | Tạo giao dịch thủ công (EXPENSE/INCOME) không qua cổng thanh toán (`POST /transactions/manual`). | Trung bình | [Kế hoạch] |
| FR-TXN-05 | Lọc lịch sử theo khoảng ngày, loại giao dịch, từ khóa; phân trang. | Trung bình | [Kế hoạch] |

### 3.7. Module Danh mục & Báo cáo (EPIC-05)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-CAT-01 | Tạo/xem nhóm danh mục (title, icon, color) theo người dùng (`/categories/groups`). | Cao | [Đã có] |
| FR-CAT-02 | Tạo/xóa danh mục con trong nhóm (`/categories/items`). | Cao | [Đã có] |
| FR-CAT-03 | Giới hạn tối đa 5 nhóm và 4 danh mục/nhóm. | Trung bình | [Đã có] |
| FR-CAT-04 | Xóa mềm (soft delete) nhóm và danh mục; giao dịch cũ vẫn tham chiếu được. | Cao | [Đã có] |
| FR-CAT-05 | Không cho chỉnh sửa danh mục đã tạo (chỉ xóa & tạo lại) — trả lỗi NOT_EDITABLE. | Trung bình | [Đã có] |
| FR-RPT-01 | Báo cáo phân bổ chi tiêu/thu nhập theo danh mục — biểu đồ tròn (`GET /reports/distribution`). | Cao | [Đã có] |
| FR-RPT-02 | Báo cáo xu hướng theo thời gian — biểu đồ cột (`GET /reports/trend`). | Cao | [Đã có] |
| FR-RPT-03 | Lọc báo cáo theo TUẦN/THÁNG/NĂM; gộp theo nhóm hoặc danh mục. | Cao | [Đã có] |
| FR-RPT-04 | Hiển thị mục "Chưa phân loại" và "Danh mục đã xóa" trong báo cáo. | Trung bình | [Đã có] |

### 3.8. Module Ngân sách (EPIC-06)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-BGT-01 | Thiết lập ngân sách theo danh mục cho từng tháng. | Trung bình | [Kế hoạch] |
| FR-BGT-02 | Tính tiến độ chi tiêu (spent, percent, remaining) so với ngân sách. | Trung bình | [Kế hoạch] |
| FR-BGT-03 | Cảnh báo khi vượt 80% / 100% ngân sách (thông báo trong ứng dụng). | Trung bình | [Kế hoạch] |

### 3.9. Module Quỹ nhóm (EPIC-06)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-FUND-01 | Người dùng tạo quỹ nhóm (tên, mục tiêu số tiền, màu sắc); người tạo là Chủ quỹ. | Cao | [Đang làm] |
| FR-FUND-02 | Xem danh sách quỹ đang tham gia và tổng số dư các quỹ. | Cao | [Đang làm] |
| FR-FUND-03 | Xem chi tiết quỹ: số dư, tiến độ mục tiêu, thành viên và mức đóng góp từng người, lịch sử giao dịch. | Cao | [Đang làm] |
| FR-FUND-04 | Chủ quỹ mời thành viên (từ danh sách bạn bè); thành viên chấp nhận tham gia. | Cao | [Kế hoạch] |
| FR-FUND-05 | Mọi thành viên nạp tiền vào quỹ (trừ ví cá nhân → cộng số dư quỹ), xác thực PIN. | Cao | [Đang làm - UI] |
| FR-FUND-06 | Ghi nhận đóng góp lũy kế của từng thành viên. | Cao | [Kế hoạch] |
| FR-FUND-07 | Chủ quỹ rút tiền từ quỹ về ví, quản lý/xóa thành viên, đóng quỹ. | Trung bình | [Kế hoạch] |
| FR-FUND-08 | Lịch sử giao dịch của quỹ (nạp/rút/chi). | Trung bình | [Kế hoạch] |

> Ghi chú: Toàn bộ màn hình FE của Quỹ nhóm (danh sách, chi tiết, tạo quỹ, nạp tiền) đã được dựng và chạy trên dữ liệu mẫu; phần Backend + nối API là công việc tiếp theo.

### 3.10. Module Thông báo (EPIC-07)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-NOTI-01 | Xem danh sách thông báo (`GET /notifications`). | Cao | [Đã có] |
| FR-NOTI-02 | Đếm số thông báo chưa đọc (`GET /notifications/unread-count`). | Trung bình | [Đã có] |
| FR-NOTI-03 | Đánh dấu đã đọc tất cả (`POST /notifications/read-all`). | Trung bình | [Đã có] |
| FR-NOTI-04 | Xóa một thông báo (`DELETE /notifications/{id}`). | Thấp | [Đã có] |
| FR-NOTI-05 | Push notification (Expo push token) khi nạp thành công / tới hạn hóa đơn. | Trung bình | [Kế hoạch] |

### 3.11. Module Hóa đơn nhắc hạn (EPIC-07)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-INV-01 | Tạo hóa đơn (tên, số tiền, ngày đến hạn, tùy chọn nhắc, giờ nhắc) (`POST /invoices`). | Cao | [Đã có] |
| FR-INV-02 | Xem danh sách và chi tiết hóa đơn (`GET /invoices`, `/invoices/{id}`). | Cao | [Đã có] |
| FR-INV-03 | Cập nhật trạng thái đã thanh toán (`PUT /invoices/{id}/status`). | Trung bình | [Đã có] |
| FR-INV-04 | Sinh thông báo/nhắc khi hóa đơn tới hạn. | Trung bình | [Đã có] |

### 3.12. Module Kết bạn

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-FRND-01 | Gửi lời mời kết bạn theo email (`POST /friends/request`). | Trung bình | [Đã có] |
| FR-FRND-02 | Chấp nhận/từ chối/hủy/xóa kết bạn (`/friends/accept|reject|cancel|remove`). | Trung bình | [Đã có] |
| FR-FRND-03 | Xem danh sách bạn bè, lời mời nhận/đã gửi (`/friends`, `/friends/requests`, `/friends/sent-requests`). | Trung bình | [Đã có] |

### 3.13. Module Bài đăng/Banner (khách hàng)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-POST-01 | Hiển thị banner/bài đăng công khai đang hoạt động trên Trang chủ (`GET /public/posts`). | Thấp | [Đã có] |

### 3.14. Module Quản trị — Admin (EPIC-08)

| Mã | Yêu cầu | Ưu tiên | Trạng thái |
|----|---------|---------|-----------|
| FR-ADM-01 | Đăng nhập cổng Admin (`POST /api/v1/admin/auth/login`); BE bắt buộc Role = ADMIN (dùng `AuthService` chung trong core). | Cao | [Đã có] |
| FR-ADM-02 | Xem danh sách người dùng (`GET /admin/users`). | Cao | [Đã có] |
| FR-ADM-03 | Xem chi tiết người dùng (`GET /admin/users/{id}/details`). | Trung bình | [Đã có] |
| FR-ADM-04 | Kích hoạt/khóa tài khoản người dùng (`PUT /admin/users/{id}/toggle-status`). | Cao | [Đã có] |
| FR-ADM-05 | Quản lý banner/bài đăng (tạo, sửa, bật/tắt) — Admin Post. | Trung bình | [Đã có] |
| FR-ADM-06 | Bảng điều khiển & báo cáo tổng quan (Dashboard, Report). | Trung bình | [Đã có] |

---

## 4. YÊU CẦU PHI CHỨC NĂNG (NFR)

### 4.1. Bảo mật
- NFR-SEC-01: Mật khẩu và mã PIN băm bằng BCrypt; không lưu/không log dạng thô.
- NFR-SEC-02: Mọi API nghiệp vụ yêu cầu JWT Bearer hợp lệ; token hết hạn phải đăng nhập lại.
- NFR-SEC-03: Giao dịch tài chính (rút tiền, đổi thiết lập ví, nạp quỹ) bắt buộc xác thực PIN.
- NFR-SEC-04: Khóa tạm thời tài khoản khi nhập PIN sai quá số lần cho phép.
- NFR-SEC-05: Webhook SePay phải kiểm tra khóa xác thực và chống trùng lặp giao dịch.
- NFR-SEC-06: Cấu hình CORS cho phép nguồn hợp lệ (FE Expo, Admin).

### 4.2. Hiệu năng
- NFR-PERF-01: Thời gian phản hồi API thông thường < 1s trong điều kiện mạng bình thường.
- NFR-PERF-02: Lịch sử giao dịch và báo cáo hỗ trợ phân trang để tránh tải nặng.

### 4.3. Độ tin cậy & toàn vẹn dữ liệu
- NFR-REL-01: Cộng/trừ số dư và tạo giao dịch phải thực hiện trong một transaction (nguyên tử).
- NFR-REL-02: Rút tiền thất bại phía PayOS phải rollback số dư.
- NFR-REL-03: Số tiền dùng `BigDecimal`, không dùng số thực dấu phẩy động.

### 4.4. Khả dụng & trải nghiệm
- NFR-USA-01: Giao diện tiếng Việt, nhất quán tông màu thương hiệu; thao tác chính ≤ 3 bước.
- NFR-USA-02: Có trạng thái tải (loading), rỗng (empty) và thông báo lỗi rõ ràng.
- NFR-USA-03: Định dạng số tiền theo chuẩn Việt Nam (dấu chấm phân tách nghìn, ký hiệu ₫).

### 4.5. Khả năng bảo trì & mở rộng
- NFR-MNT-01: Backend đa module tách biệt core/customer/admin; FE tổ chức theo `features/`, `shared/`.
- NFR-MNT-02: Phản hồi API chuẩn hóa `ApiResponse<T>`; mã lỗi tập trung ở `ErrorCode`.
- NFR-MNT-03: Đường dẫn API tập trung một nơi ở FE (`shared/api/endpoints.ts`).

### 4.6. Tính khả chuyển & tương thích
- NFR-PORT-01: Mobile chạy trên Android và iOS qua Expo.
- NFR-PORT-02: Admin chạy trên trình duyệt hiện đại (Chrome, Edge, Firefox).

---

## 5. YÊU CẦU GIAO DIỆN BÊN NGOÀI

### 5.1. Giao diện người dùng
- Ứng dụng di động: điều hướng bằng tab (Trang chủ, Ví, Quỹ, Sổ tay, Tài khoản) + các luồng phụ (nạp/rút, danh mục, báo cáo, hóa đơn, cài đặt).
- Web Admin: bố cục sidebar + trang Dashboard, Users, Posts, Report, Login.

### 5.2. Giao diện phần cứng
- Không yêu cầu phần cứng đặc biệt; sử dụng smartphone thông thường.

### 5.3. Giao diện phần mềm / API bên ngoài
| Dịch vụ | Mục đích | Kiểu tích hợp |
|---------|----------|---------------|
| SMTP Email | Gửi OTP đăng ký/quên mật khẩu/PIN | Gửi email server-side |
| SePay | Đối soát nạp tiền qua chuyển khoản | Nhận webhook `POST /transactions/sepay-webhook` |
| PayOS | Chi hộ rút tiền về ngân hàng | Gọi API payout server-side |
| VietQR | Sinh mã QR/logo ngân hàng | URL ảnh QR |

### 5.4. Giao diện truyền thông
- Toàn bộ giao tiếp qua HTTP(S), dữ liệu JSON; xác thực bằng header `Authorization: Bearer <JWT>`.

---

## 6. MÔ HÌNH DỮ LIỆU

### 6.1. Các thực thể chính
| Thực thể | Bảng | Mô tả & trường tiêu biểu |
|----------|------|--------------------------|
| User | users | id, username, email(unique), password(hash), pinCode(hash), failedPinAttempts, lockoutTime, role(USER/ADMIN), isActive, createdAt |
| Wallet | wallets | id, user(FK), name, balance(BigDecimal), accountNumber(unique), isDefault, isLimitEnabled, transactionLimit, dailyLimit, createdAt |
| BankAccount | bank_accounts | id, user(FK), bankCode, bankName, accountNumber, accountName, isDefault, createdAt |
| Transaction | transactions | id, user(FK), wallet(FK), amount, type(TransactionType), status(TransactionStatus), transactionCode(unique), note, categoryId, createdAt, updatedAt |
| SePayTransaction | (đối soát) | Lưu giao dịch webhook SePay, chống trùng |
| CategoryGroup | category_groups | id, title, icon, color, bgColor, user(FK, null=mặc định), isDeleted, items[] |
| CategoryItem | category_items | id, label, icon, color, bgColor, group(FK), user(FK), isDeleted |
| Invoice | invoices | id, invoiceName, amount, dueDate, reminderOption, reminderTime, isPaid, isNotified, user(FK), createdAt, updatedAt |
| Notification | notifications | id, user(FK), title, message, isRead, createdAt |
| Friendship | friendships | id, requester(FK), receiver(FK), status(PENDING/ACCEPTED/REJECTED), createdAt; unique(requester,receiver) |
| OtpToken | otp_tokens | code, purpose(REGISTER/RESET_PASSWORD/RESET_PIN), thời hạn, đã dùng |
| PasswordResetToken | password_reset_tokens | token đặt lại mật khẩu |
| Post | posts | id, title, imageUrl, targetLink, active, createdAt |
| **Fund** (đề xuất) | funds | id, owner(FK), name, balance, targetAmount, coverImage/color, status, createdAt |
| **FundMember** (đề xuất) | fund_members | id, fund(FK), user(FK), role(OWNER/MEMBER), status(INVITED/ACTIVE/LEFT), contributedAmount, joinedAt |
| **FundTransaction** (đề xuất) | fund_transactions | id, fund(FK), user(FK), amount, type(DEPOSIT/WITHDRAW/EXPENSE), note, createdAt |

### 6.2. Bảng liệt kê giá trị (Enums)
- **Role**: USER, ADMIN.
- **TransactionType**: TOP_UP, WITHDRAW, TRANSFER, PAYMENT, EXPENSE, INCOME, BANK_LINK_FEE _(đề xuất bổ sung: FUND_DEPOSIT, FUND_WITHDRAW)_.
- **TransactionStatus**: PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED.
- **FriendshipStatus**: PENDING, ACCEPTED, REJECTED.
- **OtpPurpose**: REGISTER, RESET_PASSWORD, RESET_PIN.

### 6.3. Quan hệ tiêu biểu
- User 1—N Wallet, BankAccount, Transaction, Invoice, Notification, CategoryGroup/Item.
- CategoryGroup 1—N CategoryItem.
- Friendship: User (requester) — User (receiver).
- Fund 1—N FundMember, Fund 1—N FundTransaction (đề xuất).

---

## 7. MA TRẬN TRUY VẾT YÊU CẦU (trích)

| Epic | Nhóm FR | Sprint (backlog) | Trạng thái tổng |
|------|---------|------------------|-----------------|
| EPIC-01 Auth & Security | FR-AUTH-01..09 | S1–S3 | Hoàn thành |
| EPIC-02 Wallet & Bank | FR-WALLET, FR-BANK | S3–S4 | Hoàn thành (trừ FR-BANK-04) |
| EPIC-03 Payment | FR-TOPUP, FR-WD | S4–S5 | Hoàn thành |
| EPIC-04 Transaction & History | FR-TXN-01..03 | S5, S7 | Hoàn thành; FR-TXN-04/05 kế hoạch S8 |
| EPIC-05 Category & Report | FR-CAT, FR-RPT | S6–S7 | Hoàn thành |
| EPIC-06 Budget & Funds | FR-BGT, FR-FUND | S9–S10 | Budget kế hoạch; Funds đang làm (UI xong) |
| EPIC-07 Notifications & Invoice | FR-NOTI, FR-INV | các sprint | Hoàn thành; Push kế hoạch |
| EPIC-08 Admin Panel | FR-ADM | xuyên suốt | Hoàn thành |
| EPIC-09 QA & Release | — | S1–S10 | Theo DoD |

---

## 8. PHỤ LỤC

### 8.1. Tổng hợp đường dẫn API chính
| Nhóm | Endpoint tiêu biểu |
|------|--------------------|
| Auth (customer) | `/api/v1/auth/login`, `/register`, `/register/send-otp`, `/forgot-password`, `/reset-password`, `/verify-otp`, `/setup-pin`, `/verify-pin`, `/forgot-pin`, `/reset-pin`, `/pin-status`, `/change-password`, `/change-pin` |
| Auth (admin) | `POST /api/v1/admin/auth/login` (chỉ ADMIN; service chung từ core) |
| User | `/api/v1/user/me`, `/api/v1/user/search` |
| Wallet | `/api/v1/wallets/me`, `/wallets/setup-account`, `/wallets/{id}/settings` |
| Bank | `/api/v1/bank-accounts` |
| Transaction | `/api/v1/transactions/top-up`, `/withdraw`, `/sepay-webhook`, `/{code}` |
| History | `/api/v1/history/transactions` |
| Category | `/api/v1/categories/groups`, `/categories/items` |
| Report | `/api/v1/reports/distribution`, `/reports/trend` |
| Invoice | `/api/v1/invoices`, `/invoices/{id}`, `/invoices/{id}/status` |
| Notification | `/api/v1/notifications`, `/unread-count`, `/read-all`, `/{id}` |
| Friendship | `/api/v1/friends`, `/friends/request`, `/accept/{id}`, `/reject/{id}`, `/cancel/{id}`, `/remove/{id}` |
| Post | `/api/v1/public/posts` |
| Admin | `/api/v1/admin/users`, `/admin/users/{id}/details`, `/admin/users/{id}/toggle-status`, admin posts |
| Fund (đề xuất) | `/api/v1/funds`, `/funds/{id}`, `/funds/{id}/members`, `/funds/{id}/deposit`, `/funds/{id}/withdraw`, `/funds/{id}/transactions` |

### 8.2. Công nghệ sử dụng
| Thành phần | Công nghệ |
|-----------|-----------|
| Backend | Java 17, Spring Boot 3.2.5, Spring Security + JWT (jjwt 0.12.5), Spring Data JPA, Maven đa module, MySQL |
| Mobile | Expo SDK 54, React Native 0.81, React 19, Expo Router, Axios, react-native-gifted-charts, Reanimated |
| Web Admin | React 19, Vite, Ant Design, Recharts, Zustand, React Router |
| Tích hợp | SMTP, SePay (webhook), PayOS (payout), VietQR |

### 8.3. Lịch sử thay đổi tài liệu
| Phiên bản | Ngày | Nội dung |
|-----------|------|----------|
| 1.0 | 16/07/2026 | Khởi tạo SRS dựa trên khảo sát mã nguồn và Sprint Backlog |

---
*Tài liệu SRS — Dự án tốt nghiệp SmartSpend.*
