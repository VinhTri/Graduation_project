# SMARTSPEND — SPRINT BACKLOG & SUB-TASK
## Dự án tốt nghiệp | Bắt đầu: 01/06/2026 | 1 Sprint = 1 tuần

---

**Quy ước**
- Label: BE (Backend), FE (Frontend), QA (Testing)
- Story Points: 1=nhỏ, 2=trung bình, 3=lớn, 5=rất lớn
- Sub-task ≈ 0.5–1 ngày/người
- ✅ = Đã hoàn thành trong code (Sprint 7)

**Epic map**
- EPIC-01: Authentication & Security
- EPIC-02: Wallet & Bank
- EPIC-03: Payment (Top-up / Withdraw)
- EPIC-04: Transaction & History
- EPIC-05: Categories & Reports
- EPIC-06: Budget & Funds
- EPIC-07: Notifications & Invoice
- EPIC-08: Admin Panel
- EPIC-09: QA & Release

**Phân công gợi ý**
| Thành viên | Sprint 1–4 | Sprint 5–7 | Sprint 8–10 |
|------------|------------|------------|-------------|
| BE-1 | Auth, JWT | Withdraw, PayOS | Budget, Funds |
| BE-2 | Wallet, STK | Category, Report | Manual tx, Push |
| FE-1 | Auth UI, tabs | Wallet, History | Budget UI |
| FE-2 | Onboarding, bank | Category, Report | Funds, polish |
| QA | Test plan, auth | Payment critical | Regression + demo |

---

# LỊCH SPRINT

| Sprint | Tuần | Mục tiêu |
|--------|------|----------|
| S1 | 01–07/06 | Khởi tạo dự án + Auth cơ bản |
| S2 | 08–14/06 | OTP + Quên mật khẩu |
| S3 | 15–21/06 | Ví + STK + PIN |
| S4 | 22–28/06 | Liên kết ngân hàng + Nạp tiền |
| S5 | 29/06–05/07 | Rút tiền + Lịch sử giao dịch |
| S6 | 06–12/07 | Danh mục + Báo cáo |
| S7 | 13–19/07 | Hoàn thiện DM + Xóa nhóm |
| S8 | 20–26/07 | Giao dịch thủ công + Lọc lịch sử |
| S9 | 27/07–02/08 | Ngân sách (Budget) MVP |
| S10 | 03–09/08 | Quỹ nhóm + Push + Demo |

---

# SPRINT 1 (01/06 – 07/06)
**Goal:** Dựng khung project, DB, đăng ký/đăng nhập cơ bản

## BE-S1-01: Khởi tạo Spring Boot multi-module (3 SP)
- BE-S1-01-01: Tạo repo Git + README + .gitignore
- BE-S1-01-02: Tạo module core (entity, repo, security)
- BE-S1-01-03: Tạo module api-customer + CustomerApplication
- BE-S1-01-04: Cấu hình MySQL + application.properties
- BE-S1-01-05: Cấu hình CORS cho FE Expo

## BE-S1-02: Thiết kế ERD v1 (2 SP)
- BE-S1-02-01: Vẽ ERD User, Wallet, Transaction
- BE-S1-02-02: Review ERD với team FE/QA
- BE-S1-02-03: Export PNG/PDF vào docs/

## BE-S1-03: Entity User + Wallet (2 SP)
- BE-S1-03-01: Entity User (email, password, status)
- BE-S1-03-02: Entity Wallet (balance, accountNumber, userId)
- BE-S1-03-03: Repository + quan hệ User 1-N Wallet

## BE-S1-04: API Register + Login (3 SP)
- BE-S1-04-01: DTO RegisterRequest / LoginRequest
- BE-S1-04-02: Hash password BCrypt
- BE-S1-04-03: POST /api/v1/auth/register
- BE-S1-04-04: POST /api/v1/auth/login trả JWT
- BE-S1-04-05: Test Postman collection v1

## BE-S1-05: JWT Security (3 SP)
- BE-S1-05-01: JwtTokenProvider generate/validate
- BE-S1-05-02: JwtAuthFilter
- BE-S1-05-03: SecurityConfig permit /auth/**
- BE-S1-05-04: CustomUserDetails load user

## BE-S1-06: Exception handler (2 SP)
- BE-S1-06-01: Enum ErrorCode
- BE-S1-06-02: AppException + GlobalExceptionHandler
- BE-S1-06-03: Wrapper ApiResponse thống nhất

## FE-S1-01: Khởi tạo Expo (2 SP)
- FE-S1-01-01: npx create-expo-app + TypeScript
- FE-S1-01-02: Cấu trúc features/, shared/
- FE-S1-01-03: Cài Expo Router + tab layout rỗng
- FE-S1-01-04: Colors.ts, theme cơ bản

## FE-S1-02: Axios client (2 SP)
- FE-S1-02-01: axiosClient.ts + base URL dev
- FE-S1-02-02: Request interceptor gắn token
- FE-S1-02-03: Response interceptor bắt lỗi 401
- FE-S1-02-04: endpoints.ts skeleton

## FE-S1-03: Login + Register UI (3 SP)
- FE-S1-03-01: Layout màn Login (email, password)
- FE-S1-03-02: Layout màn Register
- FE-S1-03-03: Validate form client-side
- FE-S1-03-04: Gọi API login/register
- FE-S1-03-05: Hiển thị lỗi từ BE

## FE-S1-04: Lưu token (2 SP)
- FE-S1-04-01: Lưu/đọc token AsyncStorage
- FE-S1-04-02: Redirect (tabs) sau login
- FE-S1-04-03: Logout xóa token

## FE-S1-05: Onboarding (2 SP)
- FE-S1-05-01: 3 slide giới thiệu app
- FE-S1-05-02: Nút Skip / Bắt đầu
- FE-S1-05-03: Flag hasSeenOnboarding AsyncStorage

## QA-S1-01: Test Plan v1 (2 SP)
- QA-S1-01-01: Mục tiêu, phạm vi, out-of-scope
- QA-S1-01-02: Môi trường test (API port, thiết bị)
- QA-S1-01-03: Ma trận trách nhiệm BE/FE/QA

## QA-S1-02: Test case Auth (2 SP)
- QA-S1-02-01: TC register thành công
- QA-S1-02-02: TC email trùng
- QA-S1-02-03: TC login sai password
- QA-S1-02-04: TC login thành công + vào app

## QA-S1-03: Smoke checklist (1 SP)
- QA-S1-03-01: Checklist 10 bước mỗi lần build
- QA-S1-03-02: Template bug report

---

# SPRINT 2 (08/06 – 14/06)
**Goal:** OTP email, quên mật khẩu, luồng vào app

## BE-S2-01: OTP email (3 SP)
- BE-S2-01-01: Entity OtpToken (code, expiry, used)
- BE-S2-01-02: Service gửi email SMTP
- BE-S2-01-03: API gửi OTP khi register
- BE-S2-01-04: Rate limit gửi OTP (optional)

## BE-S2-02: Verify OTP + Reset password (3 SP)
- BE-S2-02-01: POST /auth/verify-otp
- BE-S2-02-02: POST /auth/forgot-password
- BE-S2-02-03: POST /auth/reset-password
- BE-S2-02-04: Error OTP hết hạn / đã dùng

## BE-S2-03: GET /users/me (1 SP)
- BE-S2-03-01: DTO UserProfileResponse
- BE-S2-03-02: Controller + auth required

## FE-S2-01: Màn OTP (2 SP)
- FE-S2-01-01: UI nhập OTP 6 số
- FE-S2-01-02: Countdown resend OTP
- FE-S2-01-03: Gọi verify API

## FE-S2-02: Forgot password (3 SP)
- FE-S2-02-01: Màn nhập email
- FE-S2-02-02: Màn OTP reset
- FE-S2-02-03: Màn đặt mật khẩu mới

## FE-S2-03: Auth guard (2 SP)
- FE-S2-03-01: Redirect login nếu chưa token
- FE-S2-03-02: Redirect onboarding lần đầu

## FE-S2-04: Tab skeleton (2 SP)
- FE-S2-04-01: Tab Home placeholder
- FE-S2-04-02: Tab Wallet placeholder
- FE-S2-04-03: Tab More/Settings placeholder

## QA-S2-01: Test OTP (2 SP)
- QA-S2-01-01: OTP đúng → register OK
- QA-S2-01-02: OTP sai
- QA-S2-01-03: OTP hết hạn

## QA-S2-02: Test forgot password (2 SP)
- QA-S2-02-01: Forgot password E2E
- QA-S2-02-02: Reset password thành công

## QA-S2-03: Bug template (1 SP)
- QA-S2-03-01: Chuẩn hóa bug report cho team

---

# SPRINT 3 (15/06 – 21/06)
**Goal:** Thiết lập ví, STK, PIN bảo mật

## BE-S3-01: Wallet mặc định (2 SP)
- BE-S3-01-01: Tạo wallet khi user mới
- BE-S3-01-02: GET /wallet/me trả balance
- BE-S3-01-03: Field limits daily withdraw, per tx

## BE-S3-02: Setup STK (3 SP)
- BE-S3-02-01: Validate STK 8–15 số, unique
- BE-S3-02-02: POST /wallet/setup-account
- BE-S3-02-03: Error STK đã tồn tại

## BE-S3-03: PIN (3 SP)
- BE-S3-03-01: Hash PIN lưu User
- BE-S3-03-02: POST /auth/setup-pin
- BE-S3-03-03: POST /auth/verify-pin
- BE-S3-03-04: POST /auth/reset-pin

## BE-S3-04: Khóa PIN (2 SP)
- BE-S3-04-01: Đếm failed attempts
- BE-S3-04-02: Lock sau N lần sai
- BE-S3-04-03: ErrorCode ACCOUNT_LOCKED

## FE-S3-01: Verify STK (3 SP)
- FE-S3-01-01: UI nhập STK + validate realtime
- FE-S3-01-02: Gọi setup-account API
- FE-S3-01-03: Redirect setup-pin

## FE-S3-02: Setup PIN (3 SP)
- FE-S3-02-01: Component 6 ô PIN
- FE-S3-02-02: Nhập lại PIN confirm
- FE-S3-02-03: Báo lỗi PIN không khớp

## FE-S3-03: Verify PIN modal (2 SP)
- FE-S3-03-01: Modal tái sử dụng
- FE-S3-03-02: Callback onSuccess/onCancel

## FE-S3-04: WalletCard (2 SP)
- FE-S3-04-01: Hiển thị số dư format VND
- FE-S3-04-02: Toggle ẩn/hiện số dư
- FE-S3-04-03: Pull refresh balance

## QA-S3-01: Test STK (2 SP)
- QA-S3-01-01: STK hợp lệ / không hợp lệ
- QA-S3-01-02: STK trùng user khác

## QA-S3-02: Test PIN (2 SP)
- QA-S3-02-01: PIN đúng / sai
- QA-S3-02-02: Khóa tài khoản sau N lần

## QA-S3-03: Regression (1 SP)
- QA-S3-03-01: Regression auth sau sprint 3

---

# SPRINT 4 (22/06 – 28/06)
**Goal:** Liên kết ngân hàng + Nạp tiền (Top-up)

## BE-S4-01: BankAccount CRUD (3 SP)
- BE-S4-01-01: Entity BankAccount
- BE-S4-01-02: GET/POST/DELETE /bank-accounts
- BE-S4-01-03: Giới hạn 3 TK / user
- BE-S4-01-04: Verify tên chủ TK

## BE-S4-02: Top-up QR (3 SP)
- BE-S4-02-01: POST /transactions/top-up
- BE-S4-02-02: Sinh nội dung CK NAP [STK]
- BE-S4-02-03: Trả QR VietQR / thông tin CK
- BE-S4-02-04: TopUpResponse DTO

## BE-S4-03: SePay webhook (5 SP)
- BE-S4-03-01: Entity SePayTransaction
- BE-S4-03-02: POST /transactions/sepay-webhook
- BE-S4-03-03: Parse content → match STK
- BE-S4-03-04: Cộng balance + tạo Transaction TOP_UP
- BE-S4-03-05: Ghi log webhook raw

## BE-S4-04: Chống trùng webhook (2 SP)
- BE-S4-04-01: Check transactionId SePay unique
- BE-S4-04-02: Error DUPLICATE_WEBHOOK

## FE-S4-01: Add Bank (3 SP)
- FE-S4-01-01: Form bank, STK, tên chủ
- FE-S4-01-02: Danh sách TK đã liên kết
- FE-S4-01-03: Xóa TK confirm modal

## FE-S4-02: TopUp Checkout (3 SP)
- FE-S4-02-01: Hiển thị QR image
- FE-S4-02-02: Copy STK / nội dung CK
- FE-S4-02-03: Optional nhập số tiền gợi ý
- FE-S4-02-04: Hướng dẫn chuyển khoản

## FE-S4-03: Refresh sau nạp (2 SP)
- FE-S4-03-01: Poll GET /wallet/me
- FE-S4-03-02: Toast Nạp thành công
- FE-S4-03-03: Navigate history

## FE-S4-04: Home carousel (2 SP)
- FE-S4-04-01: Card giao dịch chờ phân loại
- FE-S4-04-02: Link sang history/report

## QA-S4-01: Test nạp SePay (3 SP) — CRITICAL
- QA-S4-01-01: Nạp đúng nội dung CK → cộng tiền
- QA-S4-01-02: Nạp sai nội dung → không cộng
- QA-S4-01-03: Webhook gửi 2 lần → không cộng đúp

## QA-S4-02: Test bank (2 SP)
- QA-S4-02-01: Liên kết tối đa 3 TK
- QA-S4-02-02: Xóa TK ngân hàng

---

# SPRINT 5 (29/06 – 05/07)
**Goal:** Rút tiền + Lịch sử giao dịch

## BE-S5-01: Withdraw PayOS (5 SP)
- BE-S5-01-01: DTO WithdrawRequest
- BE-S5-01-02: PayOsPayoutService integration
- BE-S5-01-03: POST /transactions/withdraw
- BE-S5-01-04: Trừ balance + tạo WITHDRAW
- BE-S5-01-05: Rollback nếu PayOS fail

## BE-S5-02: Giới hạn rút (3 SP)
- BE-S5-02-01: Check min/max per transaction
- BE-S5-02-02: Check daily limit + used today
- BE-S5-02-03: Trả limit info API cho FE

## BE-S5-03: History API (2 SP)
- BE-S5-03-01: GET /history/transactions
- BE-S5-03-02: Sort desc createdAt
- BE-S5-03-03: Map type, status, amount

## BE-S5-04: Update transaction (2 SP)
- BE-S5-04-01: PUT /transactions/{code}
- BE-S5-04-02: Update note + categoryId
- BE-S5-04-03: Validate ownership user

## FE-S5-01: WithdrawScreen (3 SP)
- FE-S5-01-01: Chọn TK ngân hàng
- FE-S5-01-02: Nhập số tiền + quick amount
- FE-S5-01-03: Progress bar daily limit
- FE-S5-01-04: Verify PIN trước submit
- FE-S5-01-05: Chọn danh mục optional

## FE-S5-02: WithdrawBill (2 SP)
- FE-S5-02-01: UI biên lai thành công
- FE-S5-02-02: Hiển thị mã GD, thời gian, số tiền
- FE-S5-02-03: Nút về Home / History

## FE-S5-03: HistoryScreen (3 SP)
- FE-S5-03-01: List giao dịch + icon theo type
- FE-S5-03-02: Filter all / today
- FE-S5-03-03: Loading + empty state

## FE-S5-04: TransactionDetailModal (3 SP)
- FE-S5-04-01: Chi tiết GD + note editable
- FE-S5-04-02: Gán danh mục
- FE-S5-04-03: Badge Chưa phân loại

## QA-S5-01: Test rút PayOS (3 SP) — CRITICAL
- QA-S5-01-01: Rút thành công sandbox
- QA-S5-01-02: Rút vượt số dư
- QA-S5-01-03: Rút vượt limit ngày

## QA-S5-02: Test history (2 SP)
- QA-S5-02-01: History hiển thị đủ nạp/rút
- QA-S5-02-02: Sửa note + category lưu BE

---

# SPRINT 6 (06/07 – 12/07)
**Goal:** Danh mục + Báo cáo cơ bản

## BE-S6-01: Category CRUD (3 SP)
- BE-S6-01-01: Entity CategoryGroup + CategoryItem
- BE-S6-01-02: GET/POST /categories/groups
- BE-S6-01-03: POST/DELETE /categories/items
- BE-S6-01-04: Giới hạn 5 nhóm, 4 DM/nhóm
- BE-S6-01-05: User-scoped, không seed mặc định

## BE-S6-02: Soft delete DM (2 SP)
- BE-S6-02-01: Field isDeleted CategoryItem
- BE-S6-02-02: Filter DM active khi GET
- BE-S6-02-03: Không hard delete

## BE-S6-03: Report API (3 SP)
- BE-S6-03-01: GET /reports/distribution
- BE-S6-03-02: GET /reports/trend
- BE-S6-03-03: Filter WEEK/MONTH/YEAR
- BE-S6-03-04: Query param groupBy=GROUP

## BE-S6-04: Map EXPENSE/INCOME (2 SP)
- BE-S6-04-01: EXPENSE → WITHDRAW
- BE-S6-04-02: INCOME → TOP_UP
- BE-S6-04-03: Unclassified list riêng

## FE-S6-01: CategoriesScreen (3 SP)
- FE-S6-01-01: Header Tạo nhóm
- FE-S6-01-02: Nút Tạo danh mục trên từng nhóm
- FE-S6-01-03: Empty state hướng dẫn 3 bước
- FE-S6-01-04: AddGroupModal + AddCategoryModal
- FE-S6-01-05: CategoryContext load API

## FE-S6-02: CategorySelectModal (2 SP)
- FE-S6-02-01: Chọn DM theo nhóm
- FE-S6-02-02: Tạo DM nhanh từ modal
- FE-S6-02-03: Dùng ở Withdraw + History

## FE-S6-03: ReportScreen (5 SP)
- FE-S6-03-01: Tab Chi tiêu / Thu nhập
- FE-S6-03-02: Pie chart danh mục
- FE-S6-03-03: Swipe pie Danh mục ↔ Nhóm
- FE-S6-03-04: Bar chart xu hướng
- FE-S6-03-05: Filter tuần/tháng/năm
- FE-S6-03-06: List Chưa phân loại

## QA-S6-01: Test category (2 SP)
- QA-S6-01-01: Tạo 5 nhóm → chặn nhóm thứ 6
- QA-S6-01-02: Tạo 4 DM/nhóm → chặn DM thứ 5

## QA-S6-02: Test report (3 SP)
- QA-S6-02-01: Gán DM → pie chart cập nhật
- QA-S6-02-02: Báo cáo nhóm = tổng DM con

---

# SPRINT 7 (13/07 – 19/07)
**Goal:** Hoàn thiện danh mục + xóa nhóm + ổn định thanh toán

## BE-S7-01: Soft delete nhóm ✅
- BE-S7-01-01: Field isDeleted CategoryGroup ✅
- BE-S7-01-02: DELETE /categories/groups/{id} ✅
- BE-S7-01-03: Soft delete toàn bộ DM con ✅
- BE-S7-01-04: Filter nhóm deleted khi GET ✅

## BE-S7-02: History enrich ✅
- BE-S7-02-01: Trả categoryLabel, categoryIcon ✅
- BE-S7-02-02: Trả categoryDeleted flag ✅
- BE-S7-02-03: Join CategoryItem kể cả deleted ✅

## BE-S7-03: Chặn sửa DM ✅
- BE-S7-03-01: PUT item → Error NOT_EDITABLE ✅
- BE-S7-03-02: ErrorCode CAT_5005 ✅

## BE-S7-04: Report deleted ✅
- BE-S7-04-01: Pie hiện Tên (đã xóa) ✅
- BE-S7-04-02: Bucket Danh mục đã xóa ✅

## FE-S7-01: Bỏ sửa DM ✅
- FE-S7-01-01: Bỏ nút Chỉnh sửa ✅
- FE-S7-01-02: Long press → chỉ Xóa ✅
- FE-S7-01-03: Hint xóa và tạo lại ✅

## FE-S7-02: Swipe xóa nhóm ✅
- FE-S7-02-01: Swipeable + nút Xóa ✅
- FE-S7-02-02: Modal xóa nhóm + cảnh báo DM ✅

## FE-S7-03: Report polish ✅
- FE-S7-03-01: Report swipe tabs ✅
- FE-S7-03-02: Empty state + coachmark ✅

## QA-S7-01: Test xóa DM
- QA-S7-01-01: Xóa DM → history hiện (đã xóa)
- QA-S7-01-02: Tạo lại cùng tên → id mới

## QA-S7-02: Test xóa nhóm
- QA-S7-02-01: Swipe xóa nhóm → DM biến mất
- QA-S7-02-02: GD cũ vẫn trong báo cáo

## QA-S7-03: Regression
- QA-S7-03-01: Full flow nạp/rút/báo cáo
- QA-S7-03-02: Ghi video demo 5 phút

---

# SPRINT 8 (20/07 – 26/07)
**Goal:** Giao dịch thủ công + Lọc lịch sử

## BE-S8-01: Manual transaction (3 SP)
- BE-S8-01-01: POST /transactions/manual
- BE-S8-01-02: Type EXPENSE/INCOME nội bộ
- BE-S8-01-03: Không qua PayOS/SePay
- BE-S8-01-04: Gắn categoryId + note

## BE-S8-02: Filter history (3 SP)
- BE-S8-02-01: Query fromDate, toDate
- BE-S8-02-02: Query type TOP_UP/WITHDRAW
- BE-S8-02-03: Query keyword note
- BE-S8-02-04: Repository custom query

## BE-S8-03: Pagination (2 SP)
- BE-S8-03-01: Page + size params
- BE-S8-03-02: Trả totalElements, totalPages

## FE-S8-01: TransactionActionScreen (3 SP)
- FE-S8-01-01: Form số tiền + note
- FE-S8-01-02: Chọn loại chi/thu
- FE-S8-01-03: Chọn danh mục
- FE-S8-01-04: Submit + toast

## FE-S8-02: Filter history (2 SP)
- FE-S8-02-01: Chip Hôm nay / Tuần / Tháng
- FE-S8-02-02: Date picker optional
- FE-S8-02-03: Gọi API có params

## FE-S8-03: Search (2 SP)
- FE-S8-03-01: Search bar ghi chú
- FE-S8-03-02: Debounce 300ms

## QA-S8-01: Test manual tx (2 SP)
- QA-S8-01-01: Tạo GD thủ công → history
- QA-S8-01-02: GD thủ công → báo cáo

## QA-S8-02: Test filter (2 SP)
- QA-S8-02-01: Filter theo ngày đúng
- QA-S8-02-02: Pagination load more

---

# SPRINT 9 (27/07 – 02/08)
**Goal:** Ngân sách (Budget) MVP

## BE-S9-01: Budget entity (3 SP)
- BE-S9-01-01: Entity Budget (user, categoryId, month, amount)
- BE-S9-01-02: Unique user+category+month
- BE-S9-01-03: POST/GET /budgets

## BE-S9-02: Progress (3 SP)
- BE-S9-02-01: Tính spent = sum WITHDRAW tháng
- BE-S9-02-02: Trả percent, remaining
- BE-S9-02-03: API GET /budgets/progress

## BE-S9-03: Alert (2 SP)
- BE-S9-03-01: Flag vượt 80%, 100%
- BE-S9-03-02: Tạo in-app notification

## FE-S9-01: Set budget UI (3 SP)
- FE-S9-01-01: List DM + input ngân sách
- FE-S9-01-02: Lưu theo tháng hiện tại

## FE-S9-02: Progress UI (2 SP)
- FE-S9-02-01: Progress bar trên Report
- FE-S9-02-02: Màu vàng/đỏ khi gần/vượt

## QA-S9-01: Test budget (3 SP)
- QA-S9-01-01: Set budget 1tr, chi 800k → 80%
- QA-S9-01-02: Vượt 100% → cảnh báo

---

# SPRINT 10 (03/08 – 09/08)
**Goal:** Quỹ nhóm + Push notification + Demo bảo vệ

## BE-S10-01: Funds (5 SP)
- BE-S10-01-01: Entity Fund + FundMember
- BE-S10-01-02: Create fund + invite
- BE-S10-01-03: Contribute API

## BE-S10-02: Push notification (3 SP)
- BE-S10-02-01: Lưu Expo push token
- BE-S10-02-02: Service gửi push
- BE-S10-02-03: Trigger nạp OK, hóa đơn

## FE-S10-01: Funds wire-up (3 SP)
- FE-S10-01-01: Bỏ mock data
- FE-S10-01-02: Create fund flow
- FE-S10-01-03: Contribute UI

## FE-S10-02: Push FE (2 SP)
- FE-S10-02-01: Request permission
- FE-S10-02-02: Register token gửi BE
- FE-S10-02-03: Handle notification tap

## FE-S10-03: Polish demo (2 SP)
- FE-S10-03-01: Fix UI lỗi nhỏ
- FE-S10-03-02: Splash + icon app

## QA-S10-01: Release (5 SP)
- QA-S10-01-01: Full regression 50 test case
- QA-S10-01-02: Script demo bảo vệ 10 phút
- QA-S10-01-03: Bug bash + sign-off

---

# DEFINITION OF DONE (DoD)

1. Code merge vào branch chính, không lỗi build
2. API/FE khớp acceptance criteria
3. QA pass test case của sprint
4. Không có bug Critical/Major mở
5. Demo được flow chính của sprint

---

*Tài liệu: SmartSpend Graduation Project | Cập nhật: 15/07/2026*
