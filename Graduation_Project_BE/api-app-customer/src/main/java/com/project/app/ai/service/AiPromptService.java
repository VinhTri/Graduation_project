package com.project.app.ai.service;

import com.project.app.ai.dto.internal.GoalContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiPromptService {

    private final AiGoalCalculatorService aiGoalCalculatorService;

    public String buildSystemPrompt(Map<String, Object> ctx, String userPrompt, GoalContext goalContext, boolean isFollowUp) {
        DecimalFormat df = new DecimalFormat("#,###");
        String username = (String) ctx.get("username");
        String email = (String) ctx.get("email");
        BigDecimal totalBal = (BigDecimal) ctx.get("totalBalance");
        BigDecimal mainBal = (BigDecimal) ctx.get("mainBalance");
        BigDecimal cashBal = (BigDecimal) ctx.get("cashBalance");
        String distStr = (String) ctx.get("distStr");
        String budgetsStr = (String) ctx.get("budgetsStr");

        String businessDataStr = aiGoalCalculatorService.buildBusinessDataPrompt(goalContext, df);

        if (isFollowUp) {
            return String.format(
                "1. SYSTEM PROMPT & QUY TẮC BẮT BUỘC CHO CÂU HỎI FOLLOW-UP TRỰC TIẾP\n" +
                "Bạn là Trợ lý AI SmartSpend.\n\n" +
                "QUY TẮC BẮT BUỘC KHI PHẢN HỎI CÂU HỎI NỐI TIẾP (FOLLOW-UP):\n" +
                "1. MẶC ĐỊNH trả lời duy nhất 1 câu ngắn gọn tập trung vào phương án sử dụng số dư hiện tại (%s VNĐ).\n" +
                "2. CHỈ đưa phương án thứ hai (không dùng số dư) nếu người dùng hỏi cụ thể 'nếu không dùng số dư', 'nếu giữ nguyên số dư' hoặc yêu cầu 'so sánh các phương án'.\n" +
                "3. TUYỆT ĐỐI KHÔNG xuất các phần tiêu đề '🎯 Đánh giá', '📊 Phân tích', '✅ Gợi ý'.\n" +
                "4. TUYỆT ĐỐI KHÔNG lặp lại bài phân tích dài hay các phương án trùng lặp.\n" +
                "5. CHỈ ĐƯỢC phép sử dụng con số do Backend tính toán sẵn trong 3. BUSINESS DATA.\n\n" +
                "Ví dụ câu trả lời mẫu chuẩn (đúng 1 câu):\n" +
                "\"Nếu sử dụng số dư hiện tại %s VNĐ, bạn cần tiết kiệm khoảng 1.739.570 VNĐ/tháng trong 8 tháng.\"\n\n" +
                "2. CONTEXT TÀI KHOẢN NGƯỜI DÙNG\n" +
                "- Tên / Email: %s (%s)\n" +
                "- Tổng số dư hiện tại: %s VNĐ\n" +
                "%s\n" +
                "Hãy xuất đúng 1 câu trả lời trực tiếp ngắn gọn.\n",
                df.format(totalBal),
                df.format(totalBal),
                email,
                username,
                df.format(totalBal),
                businessDataStr
            );
        } else {
            return String.format(
                "1. SYSTEM PROMPT & QUY TẮC MỤC TIÊU TÀI CHÍNH BẮT BUỘC\n" +
                "Bạn là AI Financial Assistant của ứng dụng quản lý tài chính SmartSpend.\n\n" +
                "QUY TẮC TRẢ LỜI CÂU HỎI MỤC TIÊU MỚI / TỔNG QUAN:\n" +
                "- Luôn trả lời bằng tiếng Việt.\n" +
                "- BẮT BUỘC giữ nguyên tên mục tiêu từ phần 3. BUSINESS DATA (TUYỆT ĐỐI KHÔNG tự đổi tên mục tiêu thành 'mục tiêu mua sắm' hay 'ô tô').\n" +
                "- BẮT BUỘC trong phần 📊 Phân tích phải trình bày ĐẦY ĐỦ CẢ 2 PHƯƠNG ÁN tính toán từ 3. BUSINESS DATA:\n" +
                "  + Phương án 1 (Sử dụng toàn bộ số dư hiện tại): Tiết kiệm số tiền còn thiếu chia cho số tháng.\n" +
                "  + Phương án 2 (Giữ nguyên số dư hiện tại cho mục đích khác): Tiết kiệm giá mục tiêu chia cho số tháng.\n" +
                "- TUYỆT ĐỐI KHÔNG bỏ qua số dư hiện có hoặc chỉ xuất 1 con số tiết kiệm trung bình mà không nhắc tới số dư hiện có.\n" +
                "- BẮT BUỘC trình bày chuẩn 3 phần:\n\n" +
                "🎯 Đánh giá\n" +
                "Mục tiêu của bạn hoàn toàn khả thi nếu thiết lập kế hoạch tiết kiệm kỷ luật từ hôm nay.\n\n" +
                "📊 Phân tích\n" +
                "- Tổng số tiền cần có: ... VNĐ.\n" +
                "- Số dư hiện có: ... VNĐ.\n" +
                "- Số tiền còn thiếu: ... VNĐ.\n" +
                "- Phương án 1 (Sử dụng toàn bộ số dư hiện tại ... VNĐ): Bạn cần tiết kiệm khoảng ... VNĐ/tháng trong ... tháng.\n" +
                "- Phương án 2 (Giữ nguyên số dư hiện tại cho mục đích khác): Bạn cần tiết kiệm khoảng ... VNĐ/tháng trong ... tháng.\n\n" +
                "✅ Gợi ý\n" +
                "1. Ưu tiên trích lập khoản tiết kiệm cố định hàng tháng vào một ví riêng để bảo toàn nguồn vốn.\n" +
                "2. Thiết lập mục tiêu tài chính trên ứng dụng SmartSpend để dễ dàng theo dõi tiến độ.\n" +
                "3. Kiểm soát chặt chẽ chi tiêu hàng ngày để đảm bảo duy trì hạn mức tiết kiệm đúng kế hoạch.\n\n" +
                "2. CONTEXT TÀI KHOẢN NGƯỜI DÙNG\n" +
                "- Email / Tên: %s (%s)\n" +
                "- Ví tiền mặt: %s VNĐ\n" +
                "- Ví chính: %s VNĐ\n" +
                "- Tổng số dư hiện tại: %s VNĐ\n" +
                "- Chi tiêu tháng này: %s\n" +
                "- Ngân sách: %s\n" +
                "%s\n" +
                "Hãy trả lời người dùng theo đúng định dạng 3 phần quy định trên.\n",
                email,
                username,
                df.format(cashBal),
                df.format(mainBal),
                df.format(totalBal),
                distStr,
                budgetsStr,
                businessDataStr
            );
        }
    }
}
