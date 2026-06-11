# Danh sách User Story (Hệ thống Quản lý Chi tiêu Cá nhân)

Tài liệu này định nghĩa các User Story (Yêu cầu người dùng) cho ứng dụng Quản lý chi tiêu cá nhân (Frontend React, Backend Spring Boot).

## Epic 1: Quản lý Tài khoản & Xác thực (Authentication & Authorization)
*   **US1.1:** Là khách (Guest), tôi muốn đăng ký tài khoản bằng Email và Mật khẩu, để có thể bắt đầu sử dụng ứng dụng.
    *   *Acceptance Criteria (Tiêu chí chấp nhận):*
        *   Nhập Email hợp lệ và Mật khẩu (ít nhất 8 ký tự).
        *   Mật khẩu phải được mã hóa trước khi lưu vào cơ sở dữ liệu.
        *   Hiển thị thông báo lỗi nếu Email đã tồn tại.
*   **US1.2:** Là khách, tôi muốn đăng nhập vào hệ thống bằng Email và Mật khẩu, để truy cập vào dữ liệu chi tiêu của tôi.
*   **US1.3:** Là khách, tôi muốn đăng nhập bằng tài khoản Google (OAuth2), để tiết kiệm thời gian đăng ký và đăng nhập nhanh chóng.
*   **US1.4:** Là người dùng, tôi muốn đăng xuất khỏi hệ thống, để bảo mật thông tin trên các thiết bị dùng chung.
*   **US1.5:** Là người dùng, tôi muốn yêu cầu đặt lại mật khẩu qua Email (Quên mật khẩu), để có thể lấy lại quyền truy cập khi quên.
*   **US1.6:** Là người dùng, tôi muốn xem và cập nhật hồ sơ cá nhân (Tên hiển thị, Ảnh đại diện - Avatar), để cá nhân hóa tài khoản.

## Epic 2: Quản lý Ví & Liên kết Ngân hàng (Wallet & Bank Link)
*   **US2.1:** Là người dùng, tôi muốn được cấp sẵn một **Ví Hệ Thống** mặc định (đóng vai trò như một ví điện tử độc lập), để nạp/rút và chuyển tiền nội bộ trong app.
*   **US2.2:** Là người dùng, tôi muốn xem số dư khả dụng của Ví Hệ Thống.
*   **US2.3:** Là người dùng, tôi muốn tạo thêm các **Ví Theo Dõi** (ví dụ: Ví Ngân hàng MB, Techcombank, Tiền mặt) và nhập số dư ban đầu, để app bắt đầu theo dõi chi tiêu từ các nguồn này.
*   **US2.4:** Là người dùng, tôi muốn **thiết lập liên kết tài khoản ngân hàng** thật với ứng dụng để phục vụ 2 mục đích: (1) Nạp/rút tiền vào Ví Hệ Thống, và (2) Nhận dữ liệu biến động số dư tự động qua Webhook (SePay).
*   **US2.5:** Là người dùng, tôi muốn xóa hoặc hủy liên kết các ví khi không còn sử dụng.

## Epic 3: Giao dịch & Thanh toán Trực tiếp (Direct E-Wallet Transactions)
*   **US3.1:** Là người dùng, tôi muốn **Nạp tiền (Deposit)** vào Ví Hệ Thống từ tài khoản ngân hàng đã liên kết.
*   **US3.2:** Là người dùng, tôi muốn **Rút tiền (Withdraw)** từ Ví Hệ Thống về tài khoản ngân hàng đã liên kết.
*   **US3.3:** Là người dùng, tôi muốn **Quét mã QR** để thực hiện chuyển khoản/thanh toán trực tiếp bằng số dư của Ví Hệ Thống.
*   **US3.4:** Là người dùng, tôi muốn hệ thống tạo **Mã QR nhận tiền** cho riêng tôi, để người khác có thể quét và chuyển tiền vào Ví Hệ Thống của tôi.
*   **US3.5:** Là người dùng, tôi muốn xem danh sách lịch sử giao dịch nạp, rút, chuyển khoản của Ví Hệ Thống.

## Epic 4: Đồng bộ Giao dịch Tự động (Auto-Sync) & Nhập thủ công
*   **US4.1 (Hệ thống):** Khi có biến động số dư ở ngân hàng thực (MB Bank...), hệ thống tự động nhận Webhook từ SePay và tạo một giao dịch **"Chưa phân loại"** trên app, đồng thời cập nhật số dư của Ví Theo Dõi tương ứng.
*   **US4.2:** Là người dùng, tôi muốn nhận được **thông báo (Push Notification)** khi app vừa tự động ghi nhận một biến động số dư từ ngân hàng.
*   **US4.3:** Là người dùng, tôi muốn bấm vào các giao dịch "Chưa phân loại" để **chọn Danh mục (Category)** tương ứng (vd: Ăn uống, Mua sắm), giúp thống kê chi tiêu chính xác.
*   **US4.4:** Là người dùng, tôi muốn thêm một giao dịch Chi tiêu hoặc Thu nhập **thủ công**, để ghi nhận các khoản thu chi bằng tiền mặt (không qua ngân hàng).
*   **US4.5:** Là người dùng, tôi muốn đính kèm hình ảnh (hóa đơn, biên lai) vào giao dịch để dễ dàng đối soát sau này.

## Epic 5: Quản lý Danh mục (Category Management)
*   **US5.1:** Là người dùng, tôi muốn xem danh sách các Danh mục Thu/Chi mặc định của hệ thống (Ăn uống, Lương, Mua sắm...).
*   **US5.2:** Là người dùng, tôi muốn tạo Danh mục tùy chỉnh (Custom Category) với icon và màu sắc riêng.
*   **US5.3:** Là người dùng, tôi muốn chỉnh sửa hoặc xóa các Danh mục tùy chỉnh do tôi tạo ra.

## Epic 6: Quản lý Ngân sách (Budgeting)
*   **US6.1:** Là người dùng, tôi muốn tạo Ngân sách (Budget) cho một Danh mục cụ thể trong một tháng, để giới hạn mức chi.
*   **US6.2:** Là người dùng, tôi muốn xem thanh tiến độ (Progress bar) của từng ngân sách, để biết mình đã tiêu bao nhiêu % và còn lại bao nhiêu tiền.
*   **US6.3:** Là người dùng, tôi muốn hệ thống hiển thị cảnh báo (UI highlight hoặc notification) khi giao dịch mới làm vượt quá ngân sách đã đặt.

## Epic 7: Báo cáo & Thống kê (Reports & Analytics)
*   **US7.1:** Là người dùng, tôi muốn xem biểu đồ tròn (Pie chart) cơ cấu chi tiêu theo Danh mục trong tháng.
*   **US7.2:** Là người dùng, tôi muốn xem biểu đồ cột (Bar chart) so sánh Thu - Chi theo thời gian (Tuần/Tháng/Năm).
*   **US7.3:** Là người dùng, tôi muốn xuất dữ liệu giao dịch ra file Excel/CSV.

## Epic 8: Quản lý Quỹ nhóm & Tiết kiệm tự động (Fund Management & Auto-Saving)
*   **US8.1:** Là người dùng, tôi muốn tạo một Quỹ (Fund) với mục tiêu cụ thể (ví dụ: Quỹ du lịch, Quỹ kết hôn).
*   **US8.2:** Là người dùng, tôi muốn thiết lập lịch nạp tiền tự động định kỳ (Hàng ngày/Tuần/Tháng) vào Quỹ, để hệ thống tự động trích tiền đóng góp.
*   **US8.3:** Là người dùng, tôi muốn chia sẻ Quỹ với những người dùng khác (qua Email, SĐT hoặc Mã mời), để cùng nhau góp tiền xây dựng Quỹ chung.
*   **US8.4:** Là thành viên tham gia Quỹ, tôi muốn đóng góp tiền vào Quỹ chung và xem tiến độ đạt được mục tiêu.
*   **US8.5:** Là Chủ Quỹ, tôi muốn quản lý thành viên và xem báo cáo minh bạch về số tiền mỗi người đã đóng góp.

## Epic 9: Tìm kiếm & Lọc (Search & Filter)
*   **US9.1:** Là người dùng, tôi muốn lọc giao dịch theo các khoảng thời gian (Hôm nay, Tuần này, Tháng này, Tùy chỉnh).
*   **US9.2:** Là người dùng, tôi muốn lọc giao dịch theo loại hoặc theo Ví.
*   **US9.3:** Là người dùng, tôi muốn tìm kiếm giao dịch bằng từ khóa (Tên giao dịch, ghi chú).

## Epic 10: Cài đặt hệ thống (Settings)
*   **US10.1:** Là người dùng, tôi muốn thay đổi Ngôn ngữ và Đơn vị tiền tệ.
*   **US10.2:** Là người dùng, tôi muốn chuyển đổi giao diện Sáng/Tối (Light/Dark mode).

## Epic 11: Bảo mật & Quyền riêng tư (Security & Privacy)
*   **US11.1:** Là người dùng, tôi muốn thiết lập mã PIN hoặc xác thực sinh trắc học (Vân tay/Face ID) để mở ứng dụng, đảm bảo người khác không tự ý xem được.
*   **US11.2:** Là người dùng, tôi muốn có tính năng "Ẩn số dư" (nhấn vào icon con mắt) trên màn hình chính, để tránh người xung quanh nhìn trộm tài sản.
*   **US11.3:** Là người dùng, tôi muốn hệ thống yêu cầu xác thực bổ sung (OTP hoặc Mã PIN) khi tôi thực hiện rút tiền hoặc chuyển khoản vượt hạn mức.
*   **US11.4:** Là người dùng, tôi muốn có thể yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu cá nhân của tôi khỏi hệ thống.

## Epic 12: Thông báo & Nhắc nhở (Notifications & Reminders)
*   **US12.1:** Là người dùng, tôi muốn nhận được thông báo nhắc nhở nhập giao dịch mỗi tối, để không bị quên ghi chép chi tiêu.
*   **US12.2:** Là người dùng, tôi muốn hệ thống nhắc nhở khi sắp đến hạn thanh toán các hóa đơn định kỳ (điện, nước, internet).
*   **US12.3:** Là người dùng, tôi muốn xem lại danh sách các thông báo cũ trong trung tâm thông báo (Notification Center) của ứng dụng.

## Epic 13: Trợ lý Thông minh (AI Assistant)
*   **US13.1:** Là người dùng, tôi muốn hệ thống AI tự động phân loại và gợi ý Danh mục (Category) dựa trên nội dung giao dịch (tên người nhận, nội dung chuyển khoản).
*   **US13.2:** Là người dùng, tôi muốn sử dụng AI để quét và trích xuất thông tin tự động từ hóa đơn dạng ảnh (OCR hóa đơn), giúp nhập liệu nhanh chóng.
*   **US13.3:** Là người dùng, tôi muốn nhận được lời khuyên và đánh giá sức khỏe tài chính định kỳ từ AI dựa trên thói quen chi tiêu của tôi.

## Epic 14: Quản trị hệ thống (Admin - Optional)
*   **US14.1:** Là Quản trị viên (Admin), tôi muốn xem danh sách người dùng đã đăng ký vào hệ thống.
*   **US14.2:** Là Quản trị viên, tôi muốn khóa tài khoản (Ban) những người dùng vi phạm quy định.
