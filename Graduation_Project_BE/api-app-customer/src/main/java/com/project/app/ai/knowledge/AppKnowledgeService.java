package com.project.app.ai.knowledge;

import com.project.app.auth.service.AccountSecurityService;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lightweight, deterministic knowledge retrieval for stable SmartSpend guidance.
 * It complements Gemini: app-specific facts are answered here, while open-ended
 * finance questions still go through the model and its tools.
 */
@Service
public class AppKnowledgeService {

    private static final Pattern ATTEMPT_COUNT = Pattern.compile("(?:nhap\\s+sai[^0-9]{0,20})?(\\d+)\\s*lan");

    public record KnowledgeAnswer(String id, String moduleType, String text) {
    }

    private record Article(String id, String moduleType, List<List<String>> concepts, String answer) {
    }

    private static final List<String> QUESTION_MARKERS = List.of(
            "la gi", "lam sao", "lam the nao", "cach nao", "cach ", "huong dan",
            "o dau", "mat bao lau", "co duoc", "co the", "hoat dong", "khac gi",
            "co bi", "co quyen", "co khoa", "bi khoa", "co sao", "muon ",
            "nhu the nao", "bao gom", "chuc nang");

    private static final List<Article> ARTICLES = List.of(
            article("APP_OVERVIEW", "RAG", groups("smartspend|ung dung|app", "chuc nang|tinh nang|lam duoc gi|co gi"), """
                    SmartSpend gồm các nhóm chức năng chính: ví và liên kết ngân hàng; nạp tiền VietQR/SePay, rút tiền PayOS; sổ tay thu chi; danh mục và báo cáo; ngân sách; quỹ nhóm; chia tiền; hóa đơn nhắc hạn; thông báo, kết bạn, bảo mật và hỗ trợ khách hàng. Bạn cũng có thể dùng Trung tâm tài chính và trợ lý AI để xem, phân tích dữ liệu cá nhân."""),
            article("BANK_LINK", "RAG", groups("ngan hang|tai khoan bank", "lien ket|ket noi|them"), """
                    Vào Tài khoản → Liên kết ngân hàng → Thêm liên kết tài khoản ngân hàng. Chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản rồi xác nhận. Liên kết này được dùng để chọn tài khoản nhận khi rút tiền; ứng dụng hiện ghi rõ đây là liên kết ảo, chưa kết nối trực tiếp để đọc số dư ngân hàng."""),
            article("WALLET_TOP_UP", "RAG", groups("nap tien|nap vi|top up", "vietqr|ma qr|quet qr|sepay|cach|lam sao"), """
                    Mở Ví → Nạp tiền, nhập số tiền để SmartSpend tạo mã VietQR và nội dung chuyển khoản. Dùng ứng dụng ngân hàng quét mã, kiểm tra đúng số tiền/nội dung rồi thanh toán. SePay sẽ đối soát giao dịch và SmartSpend tự cập nhật số dư; không sửa nội dung chuyển khoản được tạo sẵn."""),
            article("WALLET_WITHDRAW", "RAG", groups("rut tien|rut vi|withdraw", "mat bao lau|bao lau|quy trinh|cach|lam sao|payos"), """
                    Mở Ví → Rút tiền, chọn tài khoản ngân hàng đã liên kết, nhập số tiền, kiểm tra hạn mức rồi xác nhận bằng PIN 6 số. Backend gửi yêu cầu chi hộ qua PayOS; khi thành công ứng dụng hiển thị biên lai. Luồng được thiết kế xử lý gần như tức thời, nhưng thời gian thực tế còn phụ thuộc PayOS/ngân hàng; nếu chi hộ thất bại, số dư được hoàn tác."""),
            article("BUDGET_CREATE", "BUDGET", groups("ngan sach|han muc", "tao|thiet lap|lap moi|bat dau", "cach|lam sao|huong dan|muon"), """
                    Vào Ngân sách → Tạo ngân sách, chọn danh mục, nguồn áp dụng (Sổ tay, Ví SmartSpend hoặc cả hai), nhập hạn mức và khoảng thời gian rồi lưu. SmartSpend sẽ tính số đã chi, phần còn lại và tỷ lệ sử dụng theo danh mục."""),
            article("FUND_DEFINITION", "RAG", groups("quy nhom|group fund|quy chung", "la gi|hoat dong|dung de|nghia la"), """
                    Quỹ nhóm là túi tiền chung để nhiều thành viên cùng đóng góp cho một mục tiêu. Quỹ hiển thị số dư, tiến độ mục tiêu, thành viên, mức đóng góp và lịch sử; tiền quỹ được theo dõi riêng, không tự cộng vào số dư ví cá nhân."""),
            article("FUND_INVITE", "RAG", groups("quy nhom|quy chung|fund", "moi|them thanh vien|ru ban|tham gia"), """
                    Mở Quỹ nhóm, chọn quỹ bạn quản lý rồi vào mục thành viên/mời bạn. Chọn người từ danh sách bạn bè SmartSpend để gửi lời mời; nếu chưa có, hãy tìm bằng email hoặc số tài khoản SmartSpend và kết bạn trước. Người nhận cần chấp nhận lời mời để tham gia quỹ."""),
            article("SPLIT_BILL", "RAG", groups("chia tien|split bill|chia hoa don", "hoat dong|cach|lam sao|tao|chia deu|tuy chinh"), """
                    Vào Chia tiền → tạo khoản chia, nhập nội dung và tổng tiền, chọn bạn bè rồi chọn chia đều hoặc chỉnh số tiền từng người. Sau khi tạo, các thành viên nhận thông báo; trạng thái và tiến độ được cập nhật khi họ thanh toán, và chủ khoản chia có thể gửi nhắc theo giới hạn của ứng dụng."""),
            article("PIN_LOCKOUT", "SECURITY", groups("pin|ma pin", "sai|nhap sai", "lan|nhieu lan|khoa|lockout"), """
                    SmartSpend tạm khóa tài khoản từ lần nhập PIN sai thứ 5. Trước ngưỡng này tài khoản chưa bị khóa chỉ vì số lần nhập sai, nhưng người dùng không nên thử tiếp nếu không chắc PIN. Khi bị khóa, dùng luồng mở khóa/Quên PIN và OTP email; tuyệt đối không cung cấp PIN hoặc OTP cho người khác."""),
            article("RESET_PASSWORD", "SECURITY", groups("mat khau|password", "quen|khoi phuc|dat lai|reset"), """
                    Ở màn hình Đăng nhập, chọn Quên mật khẩu, nhập email đăng ký và yêu cầu OTP. Nhập OTP còn hiệu lực, sau đó đặt mật khẩu mới và đăng nhập lại. Không chia sẻ OTP; SmartSpend không yêu cầu bạn gửi OTP qua chat."""),
            article("INVOICE_REMINDER", "RAG", groups("hoa don", "nhac han|nhac no|den han|tu dong tru|nhac thanh toan"), """
                    Hóa đơn nhắc hạn là bản ghi tên hóa đơn, số tiền, ngày đến hạn và thời gian nhắc để SmartSpend gửi thông báo. Đây là tính năng nhắc và theo dõi trạng thái; hệ thống không tự trừ tiền chỉ vì đến hạn. Sau khi thanh toán bên ngoài, bạn chủ động đánh dấu hóa đơn là đã thanh toán."""),
            article("CUSTOM_CATEGORY", "CATEGORY", groups("danh muc|nhom chi", "tu chon|tu tao|tao them|them moi|ca nhan"), """
                    Có. Vào Tài khoản/Quản lý danh mục, tạo nhóm trước (tên, biểu tượng, màu), sau đó thêm danh mục con vào nhóm để dùng khi ghi sổ và lập ngân sách. Hiện hệ thống giới hạn tối đa 5 nhóm và 4 danh mục trong mỗi nhóm; danh mục đã tạo không sửa trực tiếp, bạn có thể xóa và tạo lại."""),
            article("NOTEBOOK_VS_WALLET", "RAG", groups("so tay", "vi smartspend|vi", "khac|phan biet|giong"), """
                    Ví SmartSpend là số dư thật trong hệ thống, thay đổi bởi các luồng nạp/rút và giao dịch ví. Sổ tay là số liệu do bạn tự ghi để theo dõi tiền mặt hoặc tài khoản bên ngoài; nó không giữ hay chuyển tiền thật. Hai nguồn được lưu độc lập nhưng có thể được tổng hợp trong Trung tâm tài chính."""),
            article("BUDGET_LOCATION", "BUDGET", groups("ngan sach|han muc", "theo doi|phan bo|tien do|bieu do|hien thi", "o dau|xem"), """
                    Mở Ngân sách để xem từng hạn mức, số đã chi, phần còn lại và thanh tiến độ theo danh mục. Muốn xem biểu đồ phân bổ và tổng quan rộng hơn, mở Trung tâm tài chính/Báo cáo và chọn phần chi tiêu hoặc ngân sách."""),
            article("SUPPORT_TICKET", "SUPPORT", groups("ho tro|ticket|quan tri", "gui|tao|lien he", "cach|lam sao|huong dan|muon"), """
                    Vào Tài khoản → Trung tâm hỗ trợ → tab Yêu cầu, chọn tạo yêu cầu mới. Chọn chủ đề, nhập tiêu đề và mô tả đủ chi tiết rồi gửi; bạn có thể quay lại tab này để theo dõi trạng thái và phản hồi của quản trị viên."""),
            article("DELETE_NOTEBOOK_TRANSACTION", "RAG", groups("giao dich|khoan thu|khoan chi", "xoa|nhap sai|ghi sai", "so tay|thu chi"), """
                    Trong Sổ tay, mở giao dịch đã nhập sai và chọn Xóa, sau đó xác nhận. Số dư sổ tay được hoàn lại tự động: xóa khoản chi thì cộng lại, xóa khoản thu thì trừ lại. Thao tác này chỉ ảnh hưởng dữ liệu sổ tay, không hoàn tác giao dịch tiền thật trong Ví SmartSpend."""),
            article("NOTEBOOK_BALANCE", "RAG", groups("so tay", "so du vi|vi smartspend", "tu dong|cong vao|chuyen sang|dong bo"), """
                    Không. Tiền trong sổ tay và số dư Ví SmartSpend là hai nguồn dữ liệu độc lập. Ghi khoản thu trong sổ tay chỉ cập nhật số dư sổ tay; muốn tăng số dư ví, bạn phải dùng luồng Nạp tiền của Ví."""),
            article("BUDGET_EDIT", "BUDGET", groups("ngan sach|han muc", "thay doi|cap nhat|chinh sua|sua", "thang nay|hien tai|cach|lam sao|muon"), """
                    Mở Ngân sách, chọn hạn mức cần thay đổi rồi bấm Chỉnh sửa. Cập nhật số tiền, nguồn áp dụng hoặc thời gian và lưu; tiến độ sẽ được tính lại theo cấu hình mới và các giao dịch phù hợp."""),
            article("CREDENTIAL_PRIVACY", "SECURITY", groups("admin|quan tri vien|quan tri", "mat khau|pin|ma pin", "xem|biet|quyen|doc"), """
                    Không. Mật khẩu và PIN được băm một chiều bằng BCrypt, nên quản trị viên không thể xem lại giá trị gốc. Admin chỉ quản lý trạng thái/tài khoản theo quyền được cấp; khi bạn quên thông tin xác thực, hệ thống dùng quy trình OTP để đặt lại chứ không đọc lại mật khẩu hay PIN cũ."""),
            article("INVOICE_PAID", "RAG", groups("hoa don", "da thanh toan|da tra|hoan thanh", "danh dau|cap nhat|chuyen trang thai|cach|lam sao"), """
                    Mở Hóa đơn, chọn hóa đơn cần cập nhật và bấm Đánh dấu đã thanh toán, rồi xác nhận. Thao tác này chỉ đổi trạng thái theo dõi hóa đơn, không tự trừ tiền trong Ví SmartSpend.""")
    );

    public Optional<KnowledgeAnswer> findAnswer(String message) {
        String normalized = normalize(message);
        if (normalized.isBlank() || !containsAny(normalized, QUESTION_MARKERS)) {
            return Optional.empty();
        }
        return ARTICLES.stream()
                .filter(article -> article.concepts().stream()
                        .allMatch(group -> containsAny(normalized, group)))
                .findFirst()
                .map(article -> new KnowledgeAnswer(article.id(), article.moduleType(),
                        "PIN_LOCKOUT".equals(article.id())
                                ? pinLockoutAnswer(normalized, article.answer())
                                : article.answer()));
    }

    private String pinLockoutAnswer(String normalized, String fallback) {
        Matcher matcher = ATTEMPT_COUNT.matcher(normalized);
        if (!matcher.find()) {
            return fallback;
        }
        int attempts = Integer.parseInt(matcher.group(1));
        int threshold = AccountSecurityService.MAX_FAILED_ATTEMPTS;
        if (attempts < threshold) {
            int remaining = threshold - attempts;
            return "Chưa. Với " + attempts + " lần nhập PIN sai, tài khoản chưa bị khóa theo ngưỡng hiện tại. "
                    + "SmartSpend khóa tài khoản từ lần sai thứ " + threshold + "; bạn còn " + remaining
                    + " lần thử trước khi chạm ngưỡng. Nếu không chắc PIN, hãy dừng thử và dùng Quên PIN/OTP email để đặt lại.";
        }
        return "Có. Từ lần nhập PIN sai thứ " + threshold + ", SmartSpend sẽ khóa tài khoản; "
                + attempts + " lần đã chạm hoặc vượt ngưỡng này. Hãy dùng luồng mở khóa/Quên PIN với OTP email, "
                + "và không cung cấp PIN hoặc OTP cho bất kỳ ai.";
    }

    private static Article article(String id, String moduleType, List<List<String>> concepts, String answer) {
        return new Article(id, moduleType, concepts, answer.strip());
    }

    private static List<List<String>> groups(String... groups) {
        return Arrays.stream(groups)
                .map(group -> Arrays.stream(group.split("\\|"))
                        .map(AppKnowledgeService::normalize)
                        .toList())
                .toList();
    }

    private static boolean containsAny(String text, List<String> alternatives) {
        return alternatives.stream().anyMatch(text::contains);
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
