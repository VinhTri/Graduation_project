package com.project.app.ai.rag;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DocumentLoader {

    public List<DocumentChunk> loadDocumentChunks() {
        return List.of(
                DocumentChunk.builder()
                        .topic("WALLET_DEPOSIT")
                        .type("APP_GUIDE")
                        .keywords(List.of("nap", "nap tien", "topup", "deposit", "sepay", "payos", "qr"))
                        .content("HƯỚNG DẪN NẠP TIỀN VÀO VÍ:\n" +
                                "1. Tại màn hình Trang chủ -> Chọn mục 'Ví' -> Chọn ví cần nạp -> Nhấn nút 'Nạp tiền'.\n" +
                                "2. Quét mã QR Code hiển thị qua kênh SePay hoặc PayOS -> Nhập số tiền và hoàn tất giao dịch.")
                        .build(),

                DocumentChunk.builder()
                        .topic("WALLET_WITHDRAW")
                        .type("APP_GUIDE")
                        .keywords(List.of("rut", "rut tien", "withdraw", "lay tien", "stk", "ngan hang"))
                        .content("HƯỚNG DẪN RÚT TIỀN TỪ VÍ:\n" +
                                "1. Tại màn hình 'Ví' -> Chọn ví -> Nhấn nút 'Rút tiền'.\n" +
                                "2. Nhập số tài khoản ngân hàng thụ hưởng, tên ngân hàng và số tiền cần rút.\n" +
                                "3. Nhập mã PIN bảo mật 6 chữ số để xác nhận giao dịch rút tiền.")
                        .build(),

                DocumentChunk.builder()
                        .topic("WALLET_CREATE")
                        .type("APP_GUIDE")
                        .keywords(List.of("tao vi", "them vi", "mo vi", "lam sao tao vi", "cach tao vi", "create wallet"))
                        .content("HƯỚNG DẪN TẠO VÍ CÁ NHÂN:\n" +
                                "1. Vào thẻ 'Ví' từ giao diện chính -> Nhấn nút '+' ở góc trên bên phải màn hình.\n" +
                                "2. Nhập Tên ví (ví dụ: Ví ATM, Ví Tiền mặt, Ví Mua sắm), chọn loại ví và nhập Số dư ban đầu.\n" +
                                "3. Nhấn 'Tạo ví' để hoàn tất.")
                        .build(),

                DocumentChunk.builder()
                        .topic("BUDGET_CREATE")
                        .type("APP_GUIDE")
                        .keywords(List.of("tao ngan sach", "ngan sach", "lap ngan sach", "han muc", "budget"))
                        .content("HƯỚNG DẪN TẠO VÀ QUẢN LÝ NGÂN SÁCH CHI TIÊU:\n" +
                                "1. Vào mục 'Ngân sách' -> Nhấn nút '+' ở góc trên.\n" +
                                "2. Chọn danh mục chi tiêu cần giới hạn (ví dụ: Ăn uống, Mua sắm, Giải trí).\n" +
                                "3. Nhập hạn mức tiền (ví dụ: 3.000.000 VNĐ) và chu kỳ (Hàng tháng/Hàng tuần).\n" +
                                "4. Hệ thống SmartSpend sẽ tự động phát cảnh báo khi chi tiêu chạm mốc 80% và 100% hạn mức.")
                        .build(),

                DocumentChunk.builder()
                        .topic("CATEGORY_CREATE")
                        .type("APP_GUIDE")
                        .keywords(List.of("tao danh muc", "danh muc", "category", "thu chi"))
                        .content("HƯỚNG DẪN QUẢN LÝ DANH MỤC THU CHI:\n" +
                                "1. Vào 'Cài đặt' -> Chọn 'Quản lý danh mục' -> Nhấn nút '+' ở góc trên.\n" +
                                "2. Chọn loại danh mục (Thu nhập hoặc Chi tiêu), chọn biểu tượng icon và màu sắc nhận diện.\n" +
                                "3. Nhấn 'Lưu'. Vuốt sang trái để sửa hoặc xóa danh mục.")
                        .build(),

                DocumentChunk.builder()
                        .topic("PIN_FORGOT")
                        .type("APP_GUIDE")
                        .keywords(List.of("quen pin", "quen ma pin", "fogot pin", "mat pin", "otp"))
                        .content("HƯỚNG DẪN XỬ LÝ QUÊN MÃ PIN BẢO MẬT:\n" +
                                "1. Tại màn hình nhập PIN -> Nhấn nút 'Quên mã PIN'.\n" +
                                "2. Hệ thống sẽ tự động gửi mã OTP xác thực 6 chữ số về Email đăng ký tài khoản của bạn.\n" +
                                "3. Nhập mã OTP chính xác để xác minh và tiến hành thiết lập lại mã PIN mới.")
                        .build(),

                DocumentChunk.builder()
                        .topic("PIN_CHANGE")
                        .type("APP_GUIDE")
                        .keywords(List.of("doi pin", "doi ma pin", "change pin"))
                        .content("HƯỚNG DẪN ĐỔI MÃ PIN BẢO MẬT:\n" +
                                "1. Vào 'Cài đặt' -> Chọn 'Bảo mật' -> Nhấn 'Đổi mã PIN'.\n" +
                                "2. Nhập mã PIN hiện tại -> Nhập mã PIN mới gồm 6 chữ số -> Nhập lại mã PIN mới để xác nhận.")
                        .build()
        );
    }
}
