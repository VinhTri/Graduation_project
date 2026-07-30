package com.project.app.ai.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.project.app.ai.dto.request.AiChatRequest;
import com.project.app.ai.dto.response.*;
import com.project.app.ai.service.AiChatService;
import com.project.app.budget.repository.BudgetRepository;
import com.project.app.report.service.ReportService;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.DecimalFormat;
import java.time.Duration;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private final WalletRepository walletRepository;
    private final BudgetRepository budgetRepository;
    private final ReportService reportService;
    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:AIzaSyBEVNPlgMS8gro2LmgHB_SzsgRi4q1752I}")
    private String geminiApiKey;

    @Override
    public AiChatResponse processChat(User user, AiChatRequest request) {
        String userPrompt = request != null && request.getMessage() != null ? request.getMessage().trim() : "";
        String normalized = normalizeText(userPrompt);

        // Handle numeric shortcut selections (1, 2, 3) from welcome menu
        if ("1".equals(normalized)) {
            userPrompt = "Hướng dẫn sử dụng ứng dụng (Ngân sách, Nạp/Rút tiền, Danh mục, Tạo ví, Quên PIN)";
            normalized = normalizeText(userPrompt);
        } else if ("2".equals(normalized)) {
            userPrompt = "Phân tích chi tiết thu chi cá nhân hiện tại";
            normalized = normalizeText(userPrompt);
        } else if ("3".equals(normalized)) {
            userPrompt = "Tư vấn lập ngân sách & lộ trình tiết kiệm mục tiêu";
            normalized = normalizeText(userPrompt);
        }

        // Identify module category
        String moduleType = "RAG";
        if (isRecommendationQuery(normalized)) {
            moduleType = "RECOMMENDATION";
        } else if (isAnalyticsQuery(normalized)) {
            moduleType = "ANALYTICS";
        }

        // Aggregate User Account Context from Database
        Map<String, Object> userContext = fetchUserAccountContext(user);

        try {
            // Call Gemini 2.5 Flash API directly from Spring Boot Backend
            String aiText = callGemini25Flash(userContext, userPrompt);
            List<AiCardDto> cards = generateCards(moduleType, normalized, userPrompt, userContext);
            AiActionPromptDto actionPrompt = generateActionPrompt(moduleType, normalized, userPrompt);

            return AiChatResponse.builder()
                    .id(UUID.randomUUID().toString())
                    .text(aiText)
                    .moduleType(moduleType)
                    .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                    .cards(cards)
                    .actionPrompt(actionPrompt)
                    .build();

        } catch (Exception e) {
            log.warn("Error calling Gemini API from Spring Boot, executing fallback local engine: {}", e.getMessage());
            return fallbackLocalEngine(userContext, userPrompt, normalized, moduleType);
        }
    }

    private Map<String, Object> fetchUserAccountContext(User user) {
        Map<String, Object> ctx = new HashMap<>();
        if (user == null) {
            ctx.put("username", "Người dùng SmartSpend");
            ctx.put("totalBalance", BigDecimal.ZERO);
            ctx.put("mainBalance", BigDecimal.ZERO);
            ctx.put("cashBalance", BigDecimal.ZERO);
            ctx.put("hasData", false);
            ctx.put("budgetsStr", "Chưa có ngân sách nào");
            ctx.put("distStr", "Chưa có báo cáo chi tiêu");
            return ctx;
        }

        ctx.put("username", user.getUsername() != null ? user.getUsername() : user.getEmail());
        ctx.put("email", user.getEmail());

        BigDecimal mainBalance = BigDecimal.ZERO;
        BigDecimal cashBalance = BigDecimal.ZERO;

        try {
            List<Wallet> wallets = walletRepository.findByUserId(user.getId());
            for (Wallet w : wallets) {
                if (w.isDefault()) {
                    mainBalance = w.getBalance() != null ? w.getBalance() : BigDecimal.ZERO;
                } else if ("CASH".equalsIgnoreCase(w.getWalletType() != null ? w.getWalletType().name() : "")) {
                    cashBalance = w.getBalance() != null ? w.getBalance() : BigDecimal.ZERO;
                }
            }
        } catch (Exception e) {
            log.error("Error fetching user wallets", e);
        }

        BigDecimal totalBalance = mainBalance.add(cashBalance);
        ctx.put("mainBalance", mainBalance);
        ctx.put("cashBalance", cashBalance);
        ctx.put("totalBalance", totalBalance);
        ctx.put("hasData", totalBalance.compareTo(BigDecimal.ZERO) > 0);
        ctx.put("budgetsStr", "Chưa có ngân sách thiết lập");
        ctx.put("distStr", "Chưa có báo cáo chi tiêu tháng này");

        return ctx;
    }

    private String callGemini25Flash(Map<String, Object> ctx, String userPrompt) throws Exception {
        DecimalFormat df = new DecimalFormat("#,###");
        String username = (String) ctx.get("username");
        BigDecimal totalBal = (BigDecimal) ctx.get("totalBalance");
        BigDecimal mainBal = (BigDecimal) ctx.get("mainBalance");
        BigDecimal cashBal = (BigDecimal) ctx.get("cashBalance");
        boolean hasData = (boolean) ctx.get("hasData");

        String systemPrompt = String.format(
            "Bạn là Trợ lý AI SmartSpend - Trợ lý phân tích & tư vấn tài chính cá nhân chuyên nghiệp.\n\n" +
            "DỮ LIỆU THỰC TẾ TÀI KHOẢN NGƯỜI DÙNG BẮT ĐƯỢC TỪ BACKEND:\n" +
            "- Tên người dùng: %s\n" +
            "- Tổng số dư khả dụng: %s VNĐ (Ví chính: %s VNĐ, Ví tiền mặt: %s VNĐ)\n" +
            "- Trạng thái chi tiêu: %s\n\n" +
            "QUY TẮC BẮT BUỘC KHI PHẢN HỒI:\n" +
            "1. ĐÁNH SỐ THỨ TỰ RÕ RÀNG (1., 2., 3.): Mọi tư vấn, phân bổ ngân sách hoặc hướng dẫn BẮT BUỘC phải đánh số thứ tự 1., 2., 3. ở đầu dòng.\n" +
            "2. BẮT BUỘC HOÀN THÀNH ĐẦY ĐỦ CÂU: Viết trọn vẹn câu trả lời, tuyệt đối KHÔNG được ngắt dở dang giữa câu.\n" +
            "3. NẾU TÀI KHOẢN CHƯA CÓ SỐ DƯ (0đ) HOẶC CHƯA PHÁT SINH CHI TIÊU/GIAO DỊCH:\n" +
            "   - BẮT BUỘC thông báo rõ tài khoản hiện chưa có dữ liệu giao dịch hoặc số dư đang là 0đ.\n" +
            "   - YÊU CẦU NGƯỜI DÙNG NẠP TIỀN VÀO VÍ HOẶC TẠO GIAO DỊCH MỚI để AI có dữ liệu thu chi thực tế nhằm phân tích và đưa ra tư vấn cá nhân hóa chính xác nhất.\n" +
            "   - KHÔNG tự ý đưa vào Mô hình phân bổ 50/30/20 trừ khi người dùng hỏi về phân bổ lương/ngân sách.\n" +
            "4. NẾU NGƯỜI DÙNG HỎI PHÂN BỔ NGÂN SÁCH/LƯƠNG (VD: Lương 12tr, thuê 3tr):\n" +
            "   - Đưa ra con số cụ thể bằng VNĐ (Cố định/Thuê 25%% = 3tr; Ăn uống 29%% = 3.5tr; Tiết kiệm 21%% = 2.5tr; Giải trí 13%% = 1.5tr; Dự phòng 12%% = 1.5tr).\n" +
            "5. NẾU NGƯỜI DÙNG HỎI MỤC TIÊU TIẾT KIỆM (VD: Mua laptop 25tr sau 8 tháng):\n" +
            "   - Bạn BẮT BUỘC tính số tiền cụ thể: 25.000.000 / 8 = 3.125.000 VNĐ/tháng và đưa ra 3 bước thực hiện.\n" +
            "6. CÂU HỎI TƯƠNG TÁC CUỐI CÙNG:\n" +
            "   - Cuối mỗi câu trả lời, hãy đính kèm 1 câu hỏi gợi ý hành động thân thiện (VD: 'Bạn có muốn Nạp tiền vào ví ngay để AI bắt đầu phân tích không?').\n" +
            "7. TRI THỨC HƯỚNG DẪN ỨNG DỤNG:\n" +
            "   - Tạo ngân sách: 1. Vào Ngân sách -> + Tạo ngân sách -> 2. Chọn danh mục, hạn mức, chu kỳ -> 3. Nhấn Lưu.\n" +
            "   - Nạp/Rút tiền: 1. Nạp: Ví cá nhân -> Nạp tiền -> Quét QR SePay/Chuyển khoản -> Nhập PIN. 2. Rút: Ví cá nhân -> Rút tiền -> Nhập số tiền -> Nhập PIN.\n" +
            "   - Tạo danh mục: 1. Cài đặt -> Quản lý danh mục -> 2. + Tạo danh mục mới -> 3. Nhập tên, icon, màu -> Nhấn Lưu.\n" +
            "   - Tạo ví: 1. Trang chủ -> + Ví mới -> 2. Nhập tên, loại ví, số dư -> 3. Nhấn Lưu ví.\n" +
            "   - Quên PIN: 1. Nhấn Quên mã PIN? -> 2. Nhập OTP -> 3. Tạo PIN 6 số mới.\n",
            username,
            df.format(totalBal),
            df.format(mainBal),
            df.format(cashBal),
            hasData ? "Đã có dữ liệu phát sinh" : "Chưa có phát sinh chi tiêu (Tài khoản mới)"
        );

        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        ObjectNode reqJson = objectMapper.createObjectNode();
        ArrayNode contents = reqJson.putArray("contents");
        ObjectNode userObj = contents.addObject();
        userObj.put("role", "user");
        ArrayNode parts = userObj.putArray("parts");
        parts.addObject().put("text", systemPrompt + "\n\nCâu hỏi người dùng: \"" + userPrompt + "\"");

        ObjectNode genConfig = reqJson.putObject("generationConfig");
        genConfig.put("temperature", 0.2);
        genConfig.put("maxOutputTokens", 1200);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(reqJson)))
                .build();

        HttpResponse<String> httpResponse = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (httpResponse.statusCode() != 200) {
            throw new RuntimeException("Gemini HTTP " + httpResponse.statusCode() + ": " + httpResponse.body());
        }

        JsonNode resJson = objectMapper.readTree(httpResponse.body());
        JsonNode candidate = resJson.path("candidates").get(0);
        if (candidate != null && candidate.has("content")) {
            JsonNode partNode = candidate.path("content").path("parts").get(0);
            if (partNode != null && partNode.has("text")) {
                return partNode.path("text").asText().trim();
            }
        }

        throw new RuntimeException("Empty response from Gemini");
    }

    private List<AiCardDto> generateCards(String moduleType, String norm, String rawPrompt, Map<String, Object> ctx) {
        DecimalFormat df = new DecimalFormat("#,###");
        BigDecimal totalBal = (BigDecimal) ctx.get("totalBalance");
        BigDecimal mainBal = (BigDecimal) ctx.get("mainBalance");
        BigDecimal cashBal = (BigDecimal) ctx.get("cashBalance");
        boolean hasData = (boolean) ctx.get("hasData");

        List<AiCardDto> cards = new ArrayList<>();

        // RAG / How-to questions should not display financial cards
        if ("RAG".equalsIgnoreCase(moduleType) && !norm.contains("tu van") && !norm.contains("luong") && !norm.contains("laptop") && !norm.contains("chia")) {
            return cards;
        }

        // 1. Goal plan (laptop / target savings)
        if (norm.contains("laptop") || norm.contains("muc tieu") || norm.contains("mua")) {
            Matcher amountMatcher = Pattern.compile("(\\d+)\\s*(triệu|tr)", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);
            Matcher monthMatcher = Pattern.compile("(\\d+)\\s*tháng", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);

            long targetAmount = amountMatcher.find() ? Long.parseLong(amountMatcher.group(1)) * 1000000L : 25000000L;
            int targetMonths = monthMatcher.find() ? Integer.parseInt(monthMatcher.group(1)) : 8;
            long monthlySaving = targetAmount / targetMonths;

            cards.add(AiCardDto.builder()
                    .type("GOAL_PLAN")
                    .title("Kế hoạch tiết kiệm tích lũy mục tiêu")
                    .items(Arrays.asList(
                            AiCardItemDto.builder().label("Mục tiêu tài chính").value((targetAmount / 1000000.0) + " triệu đ").color("#2563EB").build(),
                            AiCardItemDto.builder().label("Thời gian").value(targetMonths + " tháng").color("#4B5563").build(),
                            AiCardItemDto.builder().label("Cần tiết kiệm/tháng").value(df.format(monthlySaving) + " đ").color("#10B981").build()
                    ))
                    .build());
            return cards;
        }

        // 2. Budget allocation / Salary
        if (norm.contains("luong") || norm.contains("thue") || norm.contains("chia") || norm.contains("phan bo")) {
            Matcher incomeMatcher = Pattern.compile("(?:lương|thu nhập)\\s*(?:tôi)?\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);
            Matcher fallbackIncome = Pattern.compile("(\\d+)\\s*(triệu|tr)", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);
            Matcher rentMatcher = Pattern.compile("thuê\\s*(\\d+)", Pattern.CASE_INSENSITIVE).matcher(rawPrompt);

            long income = incomeMatcher.find() ? Long.parseLong(incomeMatcher.group(1)) * 1000000L :
                    (fallbackIncome.find() ? Long.parseLong(fallbackIncome.group(1)) * 1000000L : 12000000L);
            long rent = rentMatcher.find() ? Long.parseLong(rentMatcher.group(1)) * 1000000L : 3000000L;

            long food = Math.round(income * 0.29);
            long saving = Math.round(income * 0.21);
            long entertainment = Math.round(income * 0.25);

            cards.add(AiCardDto.builder()
                    .type("BUDGET_SPLIT")
                    .title("Tỷ lệ phân bổ ngân sách khuyến nghị")
                    .items(Arrays.asList(
                            AiCardItemDto.builder().label("Tiền thuê & Cố định (25%)").value(df.format(rent) + " đ").color("#EF4444").build(),
                            AiCardItemDto.builder().label("Ăn uống & Sinh hoạt (29%)").value(df.format(food) + " đ").color("#F59E0B").build(),
                            AiCardItemDto.builder().label("Tiết kiệm & Đầu tư (21%)").value(df.format(saving) + " đ").color("#10B981").build(),
                            AiCardItemDto.builder().label("Giải trí & Khác (25%)").value(df.format(entertainment) + " đ").color("#6366F1").build()
                    ))
                    .build());
            return cards;
        }

        // 3. General Recommendation / Account metrics
        if ("RECOMMENDATION".equalsIgnoreCase(moduleType) || norm.contains("tu van") || norm.contains("tai chinh")) {
            if (hasData) {
                cards.add(AiCardDto.builder()
                        .type("METRICS")
                        .title("Sức khỏe tài chính tài khoản")
                        .items(Arrays.asList(
                                AiCardItemDto.builder().label("Tổng số dư khả dụng").value(df.format(totalBal) + " đ").color("#10B981").build(),
                                AiCardItemDto.builder().label("Ví chính").value(df.format(mainBal) + " đ").color("#4F46E5").build(),
                                AiCardItemDto.builder().label("Ví tiền mặt").value(df.format(cashBal) + " đ").color("#F59E0B").build()
                        ))
                        .build());
            }
            return cards;
        }

        return cards;
    }

    private AiActionPromptDto generateActionPrompt(String moduleType, String norm, String rawPrompt) {
        if (norm.contains("laptop") || norm.contains("muc tieu") || norm.contains("mua")) {
            return AiActionPromptDto.builder()
                    .question("Bạn có muốn tạo ngay Ngân sách tiết kiệm 3.125.000đ/tháng cho mục tiêu này không?")
                    .actions(Arrays.asList(
                            AiActionItemDto.builder().label("Tạo ngân sách ngay").route("/budget/create").build(),
                            AiActionItemDto.builder().label("Quản lý Ngân sách").route("/budget").build()
                    ))
                    .build();
        }

        if (norm.contains("tu van") || norm.contains("tai chinh")) {
            return AiActionPromptDto.builder()
                    .question("Tài khoản chưa có dữ liệu. Bạn có muốn Nạp tiền vào ví ngay không?")
                    .actions(Arrays.asList(
                            AiActionItemDto.builder().label("Nạp tiền ngay").route("/transfer").build(),
                            AiActionItemDto.builder().label("Quản lý Ví").route("/wallet").build()
                    ))
                    .build();
        }

        if (norm.contains("luong") || norm.contains("thue") || norm.contains("chia") || norm.contains("ngan sach")) {
            return AiActionPromptDto.builder()
                    .question("Bạn có muốn thiết lập các hạn mức Ngân sách chi tiêu ngay bây giờ không?")
                    .actions(Arrays.asList(
                            AiActionItemDto.builder().label("Tạo ngân sách ngay").route("/budget/create").build(),
                            AiActionItemDto.builder().label("Quản lý Danh mục").route("/categories").build()
                    ))
                    .build();
        }

        if (norm.contains("nap") || norm.contains("rut")) {
            return AiActionPromptDto.builder()
                    .question("Bạn có muốn chuyển sang màn hình Nạp/Rút tiền ngay bây giờ không?")
                    .actions(Arrays.asList(
                            AiActionItemDto.builder().label("Tới màn hình Nạp/Rút").route("/transfer").build(),
                            AiActionItemDto.builder().label("Quản lý Ví").route("/wallet").build()
                    ))
                    .build();
        }

        if (norm.contains("danh muc")) {
            return AiActionPromptDto.builder()
                    .question("Bạn có muốn mở màn hình Quản lý danh mục để tạo danh mục mới ngay không?")
                    .actions(Arrays.asList(
                            AiActionItemDto.builder().label("Mở Quản lý danh mục").route("/categories").build()
                    ))
                    .build();
        }

        if (norm.contains("tao vi") || norm.contains("xoa vi") || norm.contains("quan ly vi")) {
            return AiActionPromptDto.builder()
                    .question("Bạn có muốn mở màn hình Quản lý ví để xem hoặc tạo ví mới không?")
                    .actions(Arrays.asList(
                            AiActionItemDto.builder().label("Mở Quản lý ví").route("/wallet").build()
                    ))
                    .build();
        }

        // Return null for general questions/menu selections so no unneeded action box appears
        return null;
    }

    private AiChatResponse fallbackLocalEngine(Map<String, Object> ctx, String raw, String norm, String moduleType) {
        DecimalFormat df = new DecimalFormat("#,###");
        String username = (String) ctx.get("username");
        BigDecimal totalBal = (BigDecimal) ctx.get("totalBalance");
        boolean hasData = (boolean) ctx.get("hasData");

        String text;
        if (norm.contains("laptop") || norm.contains("muc tieu") || norm.contains("mua")) {
            text = "Lộ trình tiết kiệm mục tiêu mua sắm cho " + username + ":\n\n" +
                   "1. Để đạt mục tiêu 25 triệu sau 8 tháng, bạn cần trích cố định 3.125.000đ mỗi tháng.\n" +
                   "2. Mở một Ví tích lũy riêng và cài đặt tính năng tự động trích tiền khi nhận lương.\n" +
                   "3. Cắt giảm 10-15% chi tiêu phát sinh không kế hoạch để duy trì tiến độ.\n\n" +
                   "👉 Bạn có muốn tôi hướng dẫn tạo Ngân sách tiết kiệm cho mục tiêu này không?";
        } else if (norm.contains("luong") || norm.contains("thue") || norm.contains("chia")) {
            text = "Gợi ý phân bổ ngân sách cho " + username + " (Lương 12tr, Tiền thuê 3tr):\n\n" +
                   "1. Tiền thuê & Cố định (25%): 3.000.000đ.\n" +
                   "2. Ăn uống & Sinh hoạt (29%): 3.500.000đ.\n" +
                   "3. Tiết kiệm & Đầu tư (21%): 2.500.000đ.\n" +
                   "4. Giải trí & Cá nhân (25%): 3.000.000đ.\n\n" +
                   "👉 Bạn có muốn tạo các hạn mức Ngân sách chi tiêu này ngay không?";
        } else if (norm.contains("tu van") || norm.contains("tai chinh")) {
            if (hasData) {
                text = "Tư vấn tài chính cho " + username + ":\n\n" +
                       "1. Tổng số dư khả dụng hiện tại là " + df.format(totalBal) + "đ.\n" +
                       "2. Nên trích tối thiểu 20% tích lũy vào Quỹ khẩn cấp trước khi chi tiêu.\n" +
                       "3. Thiết lập hạn mức Ngân sách cho danh mục Ăn uống và Mua sắm để kiểm soát dòng tiền.\n\n" +
                       "👉 Bạn có muốn tôi hỗ trợ tạo Ngân sách ngay không?";
            } else {
                text = "Tài khoản của bạn hiện chưa có dữ liệu giao dịch hoặc số dư đang là 0đ.\n\n" +
                       "1. Vui lòng Nạp tiền vào ví hoặc Ghi chép giao dịch mới để SmartSpend có dữ liệu phân tích thu chi thực tế cho bạn.\n" +
                       "2. Trong thời gian chờ, bạn có thể tham khảo Mô hình 50/30/20 (50% Thiết yếu, 30% Sở thích, 20% Tiết kiệm) để chuẩn bị quản lý dòng tiền.\n" +
                       "3. Hãy thực hiện Nạp tiền vào Ví chính ngay để bắt đầu trải nghiệm phân tích & tư vấn tài chính cá nhân hóa!\n\n" +
                       "👉 Bạn có muốn chuyển sang màn hình Nạp tiền ngay bây giờ không?";
            }
        } else if (norm.contains("ngan sach")) {
            text = "Hướng dẫn tạo ngân sách trong SmartSpend:\n\n" +
                   "1. Mở mục Ngân sách -> Nhấn '+ Tạo ngân sách'.\n" +
                   "2. Chọn danh mục, nhập hạn mức và chu kỳ (tuần/tháng).\n" +
                   "3. Nhấn 'Lưu'. Hệ thống tự cảnh báo khi chi tiêu tới 80% & 100%.\n\n" +
                   "👉 Bạn có muốn mở màn hình Tạo ngân sách ngay bây giờ không?";
        } else if (norm.contains("nap") || norm.contains("rut")) {
            text = "Hướng dẫn nạp và rút tiền:\n\n" +
                   "1. Nạp tiền: Ví cá nhân -> Nạp tiền -> Quét QR SePay/Chuyển khoản -> Nhập PIN.\n" +
                   "2. Rút tiền: Ví cá nhân -> Rút tiền -> Nhập số tiền -> Nhập PIN.\n" +
                   "3. Ví nhóm: Mở Ví nhóm -> Nạp/Rút quỹ.\n\n" +
                   "👉 Bạn có muốn chuyển sang màn hình Nạp/Rút tiền ngay không?";
        } else if (norm.contains("danh muc")) {
            text = "Hướng dẫn tạo danh mục thu chi:\n\n" +
                   "1. Vào Cài đặt -> Quản lý danh mục.\n" +
                   "2. Chọn tab Chi tiêu hoặc Thu nhập -> '+ Tạo danh mục mới'.\n" +
                   "3. Nhập tên, icon & màu đại diện -> Nhấn 'Lưu'.\n\n" +
                   "👉 Bạn có muốn mở màn hình Quản lý danh mục ngay không?";
        } else {
            text = "Trợ lý AI SmartSpend đồng hành cùng " + username + ":\n\n" +
                   "1. Áp dụng mô hình 50/30/20 để quản lý tài chính hiệu quả.\n" +
                   "2. Thiết lập ngân sách và theo dõi báo cáo chi tiêu hàng tuần.\n" +
                   "3. Bạn có thể hỏi: 'tư vấn tài chính', 'lương 12tr', 'mua laptop 25tr', 'nạp rút', 'ngân sách'.\n\n" +
                   "👉 Bạn có muốn tôi hướng dẫn tạo Ngân sách đầu tiên không?";
        }

        return AiChatResponse.builder()
                .id(UUID.randomUUID().toString())
                .text(text)
                .moduleType(moduleType)
                .timestamp(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")))
                .cards(generateCards(moduleType, norm, raw, ctx))
                .actionPrompt(generateActionPrompt(moduleType, norm, raw))
                .build();
    }

    private boolean isRecommendationQuery(String norm) {
        String[] keywords = {"tu van", "recommend", "advisor", "cho toi", "tai chinh", "luong", "thue", "chia ngan sach", "tiet kiem", "laptop", "muc tieu", "vuot", "chia", "hien tai"};
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    private boolean isAnalyticsQuery(String norm) {
        String[] keywords = {"tieu nhieu o dau", "tieu o dau", "bao cao", "phan tich", "xu huong", "cat giam", "chi tieu", "thang nay tieu", "tai khoan"};
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .trim();
    }
}
