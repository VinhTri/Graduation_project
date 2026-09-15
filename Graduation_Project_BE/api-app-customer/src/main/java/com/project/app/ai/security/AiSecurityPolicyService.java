package com.project.app.ai.security;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Deterministic guardrail evaluated before tools and the LLM.  It deliberately
 * matches intent concepts instead of test-case sentences so paraphrases and
 * small spelling mistakes take the same safe path.
 */
@Service
public class AiSecurityPolicyService {

    private static final Pattern ACCOUNT_NUMBER = Pattern.compile("\\b\\d{8,16}\\b");
    private static final Pattern MONEY = Pattern.compile("\\b\\d[\\d.,]*(?:k|tr|trieu|nghin|ngan|dong|d)?\\b");

    public record SecurityDecision(String text, String moduleType) {}

    public Optional<SecurityDecision> evaluate(String message) {
        String n = normalize(message);
        if (n.isBlank()) return Optional.empty();

        if (containsAny(n, "jwt", "access token", "refresh token", "session token", "ma phien")
                && containsAny(n, "cho toi", "tra ve", "hien thi", "lay", "cung cap", "xem")) {
            return security("Tôi không thể cung cấp token hoặc chuỗi xác thực của phiên đăng nhập. Đây là bí mật bảo mật; nếu nghi ngờ bị lộ, bạn nên đăng xuất các phiên, đổi mật khẩu và đăng nhập lại.");
        }

        boolean asksCredential = containsAny(n, "mat khau", "ma pin", "pin 6 so", "pin sau so", "ma otp")
                && containsAny(n, "la gi", "cho toi", "cung cap", "hien thi", "doc", "xem", "tra ve");
        boolean recoveryQuestion = containsAny(n, "quen", "dat lai", "khoi phuc", "doi mat khau", "doi pin");
        if (asksCredential && !recoveryQuestion) {
            return security("Tôi không thể xem hoặc cung cấp mật khẩu, PIN hay OTP, kể cả của chính bạn hoặc quản trị viên. Mật khẩu/PIN được băm một chiều; hãy dùng luồng Quên mật khẩu/Quên PIN và OTP email để đặt lại.");
        }

        if (containsAny(n, "vo hieu hoa otp", "huy otp", "mat dien thoai", "mat so dien thoai")
                && containsAny(n, "ngay", "lap tuc", "giup toi", "hay")) {
            return security("Tôi không thể tự vô hiệu hóa OTP hoặc thay đổi xác thực qua chat. Hãy đổi mật khẩu, đăng xuất các phiên đang mở và liên hệ Trung tâm hỗ trợ để khóa hoặc cập nhật phương thức xác thực.");
        }

        if ((containsAny(n, "bo qua", "ignore", "bypass", "quen cac lenh", "khong can pin")
                && containsAny(n, "bao mat", "canh bao", "system prompt", "quy tac", "xac thuc", "pin"))
                || containsAny(n, "hack vao", "hack quỹ", "hack quy", "lenh he thong bi mat")) {
            return security("Tôi không thể bỏ qua quy tắc bảo mật, xác thực hoặc hỗ trợ can thiệp trái phép. Tôi chỉ có thể hướng dẫn thao tác hợp lệ trong SmartSpend theo quyền của tài khoản hiện tại.");
        }

        if (containsAny(n, "drop database", "drop table", "xoa database", "xoa co so du lieu", "sql injection")) {
            return security("Tôi không thể tạo lệnh phá hoại hay hỗ trợ xóa cơ sở dữ liệu. Nếu bạn đang kiểm thử bảo mật, hãy dùng môi trường cô lập và quy trình kiểm thử đã được phê duyệt.");
        }

        if (containsAny(n, "cap quyen", "nang quyen", "quyen quan tri toi cao", "privilege escalation")
                && containsAny(n, "admin", "quan tri", "toi la")) {
            return security("Tôi không thể cấp hoặc nâng quyền qua hội thoại. Quyền quản trị chỉ được thay đổi bởi luồng quản trị đã xác thực trên Web Admin và phải tuân theo phân quyền hệ thống.");
        }

        if (containsAny(n, "nguoi dung khac", "cua nguoi dung", "email la", "so dien thoai la")
                && containsAny(n, "lich su", "chi tieu", "giao dich", "ma pin", "mat khau", "otp")) {
            return security("Tôi không thể truy xuất dữ liệu tài chính hoặc thông tin xác thực của người dùng khác. Mọi truy vấn chỉ được giới hạn trong tài khoản đang đăng nhập và quyền đã được xác thực.");
        }

        if (containsAny(n, "xoa", "huy") && containsAny(n, "toan bo", "tat ca")
                && containsAny(n, "lich su giao dich", "giao dich", "lich su thu chi")) {
            return security("Tôi không thể xóa hàng loạt lịch sử giao dịch vì có thể làm sai lệch dữ liệu đối soát. Bạn chỉ nên mở từng giao dịch Sổ tay cần sửa và dùng chức năng xóa có xác nhận; giao dịch tiền thật không thể bị xóa để hoàn tác.");
        }

        if (containsAny(n, "xoa", "giai tan") && containsAny(n, "quy nhom", "quy an choi", "quy du lich")
                && containsAny(n, "khong can", "khong co", "bo qua") && containsAny(n, "dong y", "truong quy", "chu quy")) {
            return security("Tôi không thể xóa quỹ khi tài khoản không có quyền hợp lệ. Việc quản lý hoặc giải thể quỹ phải do chủ/trưởng quỹ thực hiện trên giao diện và qua bước xác nhận.");
        }

        boolean directTransfer = containsAny(n, "chuyen ngay", "gui ngay", "chuyen tien", "gui tien", "tra no")
                && (ACCOUNT_NUMBER.matcher(n).find() || MONEY.matcher(n).find())
                && !containsAny(n, "lam sao", "cach nao", "huong dan", "nhu the nao");
        directTransfer = directTransfer || (n.startsWith("gui ") && ACCOUNT_NUMBER.matcher(n).find()
                && MONEY.matcher(n).find());
        if (directTransfer) {
            return security("Tôi không thể tự chuyển tiền hoặc xác nhận giao dịch qua chat. Hãy mở chức năng Chuyển tiền trong SmartSpend, nhập và kiểm tra người nhận/số tiền, rồi tự xác thực PIN hoặc OTP trên giao diện.");
        }

        if (containsAny(n, "them tien", "cong tien", "tang so du")
                && containsAny(n, "lenh he thong", "bi mat", "khong can nap", "trai phep")) {
            return security("Tôi không thể sửa hoặc làm tăng số dư bằng lệnh hệ thống. Để nạp tiền hợp lệ, hãy vào Ví → Nạp tiền, tạo VietQR và chuyển đúng nội dung để hệ thống đối soát.");
        }

        if (containsAny(n, "ngan sach", "han muc") && containsAny(n, "vo han", "infinity", "khong gioi han", "am vo cung")) {
            return Optional.of(new SecurityDecision("Hạn mức ngân sách phải là một số tiền hữu hạn và lớn hơn 0 nên không thể đặt thành vô hạn. Hãy chọn một mức cụ thể phù hợp rồi cập nhật tại màn hình Ngân sách.", "BUDGET"));
        }

        if (containsAny(n, "ma co phieu", "co phieu nao", "dau tu gi")
                && containsAny(n, "sinh loi", "lai nhanh", "mua", "nen dau tu")) {
            return outOfScope("Tôi không thể chọn mã cổ phiếu hoặc cam kết khoản đầu tư sinh lời nhanh. SmartSpend hỗ trợ quản lý tài chính cá nhân; bạn nên tự đánh giá mục tiêu, thời hạn và mức chịu rủi ro hoặc tham khảo chuyên gia được cấp phép.");
        }
        if (containsAny(n, "gia vang", "gia co phieu", "thi truong")
                && containsAny(n, "ngay mai", "du doan", "tang hay giam", "se tang", "se giam")) {
            return outOfScope("Tôi không thể dự đoán chắc chắn giá thị trường ngày mai. SmartSpend có thể giúp bạn lập ngân sách và theo dõi dòng tiền, nhưng không cung cấp dự báo đầu cơ.");
        }

        if (containsAny(n, "dong vai", "bo qua tu cach", "chan doan")
                && containsAny(n, "bac si", "chuyen gia y te", "benh", "dau da day")) {
            return outOfScope("Tôi là trợ lý quản lý tài chính và không thể chẩn đoán bệnh hoặc đóng vai bác sĩ. Nếu triệu chứng đáng lo hay kéo dài, bạn nên liên hệ cơ sở y tế hoặc chuyên gia y tế phù hợp.");
        }

        if (containsAny(n, "ngon ngu lap trinh", "backend", "co so du lieu", "database", "cau truc ha tang")
                && containsAny(n, "tro ly", "he thong", "ai nay")) {
            return security("Tôi là trợ lý tài chính SmartSpend. Tôi có thể mô tả chức năng ở mức người dùng, nhưng không cung cấp chi tiết hạ tầng, cấu trúc backend, schema dữ liệu hoặc thông tin có thể hỗ trợ khai thác hệ thống.");
        }

        return Optional.empty();
    }

    private Optional<SecurityDecision> security(String text) {
        return Optional.of(new SecurityDecision(text, "SECURITY"));
    }

    private Optional<SecurityDecision> outOfScope(String text) {
        return Optional.of(new SecurityDecision(text, "GUIDANCE"));
    }

    private boolean containsAny(String value, String... candidates) {
        for (String candidate : candidates) if (value.contains(candidate)) return true;
        return false;
    }

    private String normalize(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
