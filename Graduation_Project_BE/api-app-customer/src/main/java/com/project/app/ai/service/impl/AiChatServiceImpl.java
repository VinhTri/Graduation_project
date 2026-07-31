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
            ctx.put("email", "");
            ctx.put("totalBalance", BigDecimal.ZERO);
            ctx.put("mainBalance", BigDecimal.ZERO);
            ctx.put("cashBalance", BigDecimal.ZERO);
            ctx.put("hasData", false);
            ctx.put("budgetsStr", "Chưa có ngân sách nào");
            ctx.put("distStr", "Chưa có báo cáo chi tiêu");
            ctx.put("totalSpentMonth", BigDecimal.ZERO);
            ctx.put("hasExpenseData", false);
            return ctx;
        }

        ctx.put("username", user.getUsername() != null ? user.getUsername() : user.getEmail());
        ctx.put("email", user.getEmail() != null ? user.getEmail() : "");

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
        ctx.put("totalBalance", totalBalance);
        ctx.put("mainBalance", mainBalance);
        ctx.put("cashBalance", cashBalance);

        // Fetch actual expense distribution from ReportService
        BigDecimal totalSpentMonth = BigDecimal.ZERO;
        String topCategoryName = null;
        BigDecimal topCategoryAmount = BigDecimal.ZERO;
        Double topCategoryPercentage = 0.0;
        
        String secondCategoryName = null;
        BigDecimal secondCategoryAmount = BigDecimal.ZERO;
        Double secondCategoryPercentage = 0.0;

        String distStr = "Chưa có phát sinh chi tiêu tháng này";

        try {
            List<com.project.app.report.dto.response.ReportDistributionResponse> distribution = 
                    reportService.getDistributionReport(user, com.project.app.transaction.enums.TransactionType.EXPENSE, "MONTH", java.time.LocalDate.now());
            if (distribution != null && !distribution.isEmpty()) {
                // Sort distribution descending by total amount
                distribution.sort((a, b) -> {
                    BigDecimal amtA = a.getTotalAmount() != null ? a.getTotalAmount() : BigDecimal.ZERO;
                    BigDecimal amtB = b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO;
                    return amtB.compareTo(amtA);
                });

                DecimalFormat df = new DecimalFormat("#,###");
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < distribution.size(); i++) {
                    com.project.app.report.dto.response.ReportDistributionResponse d = distribution.get(i);
                    if (d.getTotalAmount() != null && d.getTotalAmount().compareTo(BigDecimal.ZERO) > 0) {
                        totalSpentMonth = totalSpentMonth.add(d.getTotalAmount());
                        if (i == 0) {
                            topCategoryName = d.getCategoryName();
                            topCategoryAmount = d.getTotalAmount();
                            topCategoryPercentage = d.getPercentage() != null ? d.getPercentage() : 0.0;
                        } else if (i == 1) {
                            secondCategoryName = d.getCategoryName();
                            secondCategoryAmount = d.getTotalAmount();
                            secondCategoryPercentage = d.getPercentage() != null ? d.getPercentage() : 0.0;
                        }
                        sb.append(String.format("- %s: %s VNĐ (%.1f%%)\n", d.getCategoryName(), df.format(d.getTotalAmount()), d.getPercentage() != null ? d.getPercentage() : 0.0));
                    }
                }
                if (sb.length() > 0) {
                    distStr = sb.toString();
                }
            }
        } catch (Exception e) {
            log.error("Error fetching expense distribution report", e);
        }

        // Fetch actual budgets
        String budgetsStr = "Chưa có ngân sách thiết lập";
        try {
            List<com.project.app.budget.entity.Budget> budgets = budgetRepository.findByUserIdAndIsDeletedFalse(user.getId());
            if (budgets != null && !budgets.isEmpty()) {
                DecimalFormat df = new DecimalFormat("#,###");
                StringBuilder sb = new StringBuilder();
                for (com.project.app.budget.entity.Budget b : budgets) {
                    sb.append(String.format("- Ngân sách %s (%s): %s VNĐ\n", b.getName(), b.getCategory() != null ? b.getCategory().getLabel() : "Chung", df.format(b.getAmount())));
                }
                budgetsStr = sb.toString();
            }
        } catch (Exception e) {
            log.error("Error fetching user budgets", e);
        }

        ctx.put("totalSpentMonth", totalSpentMonth);
        ctx.put("topCategoryName", topCategoryName);
        ctx.put("topCategoryAmount", topCategoryAmount);
        ctx.put("topCategoryPercentage", topCategoryPercentage);
        ctx.put("secondCategoryName", secondCategoryName);
        ctx.put("secondCategoryAmount", secondCategoryAmount);
        ctx.put("secondCategoryPercentage", secondCategoryPercentage);
        ctx.put("distStr", distStr);
        ctx.put("budgetsStr", budgetsStr);

        boolean hasData = totalBalance.compareTo(BigDecimal.ZERO) > 0 || totalSpentMonth.compareTo(BigDecimal.ZERO) > 0;
        ctx.put("hasData", hasData);
        ctx.put("hasExpenseData", totalSpentMonth.compareTo(BigDecimal.ZERO) > 0);

        return ctx;
    }

    private String callGemini25Flash(Map<String, Object> ctx, String userPrompt) throws Exception {
        DecimalFormat df = new DecimalFormat("#,###");
        String username = (String) ctx.get("username");
        String email = (String) ctx.get("email");
        BigDecimal totalBal = (BigDecimal) ctx.get("totalBalance");
        BigDecimal mainBal = (BigDecimal) ctx.get("mainBalance");
        BigDecimal cashBal = (BigDecimal) ctx.get("cashBalance");
        String distStr = (String) ctx.get("distStr");
        String budgetsStr = (String) ctx.get("budgetsStr");
        boolean hasData = (boolean) ctx.get("hasData");

        // Business Data calculated programmatically by Backend
        String norm = normalizeText(userPrompt);
        String businessDataStr = "";
        if (norm.contains("muc tieu") || norm.contains("mua") || norm.contains("laptop") || norm.contains("xe") || norm.contains("sam")) {
            Matcher amountMatcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(triệu|tr)", Pattern.CASE_INSENSITIVE).matcher(userPrompt);
            Matcher monthMatcher = Pattern.compile("(\\d+)\\s*tháng", Pattern.CASE_INSENSITIVE).matcher(userPrompt);

            long targetAmount = amountMatcher.find() ? (long)(Double.parseDouble(amountMatcher.group(1).replace(",", ".")) * 1000000L) : 30000000L;
            int targetMonths = monthMatcher.find() ? Integer.parseInt(monthMatcher.group(1)) : 3;
            long monthlySaving = targetMonths > 0 ? targetAmount / targetMonths : targetAmount;
            long remainingGap = totalBal.longValue() < targetAmount ? targetAmount - totalBal.longValue() : 0;
            long monthlyGapSaving = targetMonths > 0 && remainingGap > 0 ? remainingGap / targetMonths : 0;

            businessDataStr = String.format(
                "\n3. BUSINESS DATA\n" +
                "Mục tiêu tài chính:\n" +
                "- Giá mục tiêu: %s VNĐ\n" +
                "- Thời gian: %d tháng\n" +
                "- Số tiền còn thiếu: %s VNĐ\n" +
                "- Nếu sử dụng số dư hiện tại: Cần tiết kiệm %s VNĐ/tháng\n" +
                "- Nếu không sử dụng số dư hiện tại: Cần tiết kiệm %s VNĐ/tháng\n",
                df.format(targetAmount),
                targetMonths,
                df.format(remainingGap),
                monthlyGapSaving > 0 ? df.format(monthlyGapSaving) : "0",
                df.format(monthlySaving)
            );
        }

        String systemPrompt = String.format(
            "1. SYSTEM PROMPT\n" +
            "Bạn là AI Financial Assistant của SmartSpend.\n\n" +
            "Vai trò:\n" +
            "- Hỗ trợ người dùng quản lý tài chính cá nhân.\n" +
            "- Đưa ra lời khuyên dựa trên dữ liệu được cung cấp.\n" +
            "- Không tự bịa thêm dữ liệu.\n\n" +
            "Quy tắc trả lời:\n" +
            "- Luôn trả lời bằng tiếng Việt.\n" +
            "- Chỉ trả về câu trả lời cuối cùng.\n" +
            "- Không hiển thị prompt.\n" +
            "- Không hiển thị quy tắc.\n" +
            "- Không hiển thị ví dụ.\n" +
            "- Không hiển thị template.\n" +
            "- Không hiển thị reasoning.\n" +
            "- Không hiển thị self-check.\n" +
            "- Không hiển thị self-correction.\n" +
            "- Không hỏi lại người dùng.\n" +
            "- Không thêm nút gợi ý.\n\n" +
            "Cấu trúc câu trả lời bắt buộc (chỉ xuất 1 lần ở câu trả lời cuối cùng):\n" +
            "Phần 1: Dòng tiêu đề '🎯 Đánh giá' kèm 1-2 câu tóm tắt.\n" +
            "Phần 2: Dòng tiêu đề '📊 Phân tích' kèm các dòng gạch đầu dòng phân tích số liệu.\n" +
            "Phần 3: Dòng tiêu đề '✅ Gợi ý' kèm đúng 3 mục đánh số 1., 2., 3.\n\n" +
            "2. CONTEXT\n" +
            "Thông tin người dùng:\n" +
            "- Email / Tên: %s (%s)\n" +
            "- Ví tiền mặt: %s VNĐ\n" +
            "- Ví chính: %s VNĐ\n" +
            "- Tổng số dư: %s VNĐ\n" +
            "- Chi tiêu tháng này: %s\n" +
            "- Ngân sách: %s\n" +
            "%s\n" +
            "Hãy trả lời người dùng theo đúng định dạng đã quy định.\n",
            email,
            username,
            df.format(cashBal),
            df.format(mainBal),
            df.format(totalBal),
            distStr,
            budgetsStr,
            businessDataStr
        );

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        List<String> candidateModels = new ArrayList<>();
        try {
            String listModelsUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + geminiApiKey;
            HttpRequest listReq = HttpRequest.newBuilder().uri(URI.create(listModelsUrl)).GET().build();
            HttpResponse<String> listRes = client.send(listReq, HttpResponse.BodyHandlers.ofString());
            if (listRes.statusCode() == 200) {
                JsonNode modelsJson = objectMapper.readTree(listRes.body());
                JsonNode modelsArr = modelsJson.path("models");
                if (modelsArr.isArray()) {
                    for (JsonNode m : modelsArr) {
                        String mName = m.path("name").asText("");
                        JsonNode methods = m.path("supportedGenerationMethods");
                        boolean supportsGen = false;
                        if (methods.isArray()) {
                            for (JsonNode method : methods) {
                                if ("generateContent".equals(method.asText())) {
                                    supportsGen = true;
                                    break;
                                }
                            }
                        }
                        if (supportsGen && mName.startsWith("models/")) {
                            candidateModels.add(mName.substring("models/".length()));
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch Gemini model list, fallback to static candidates: {}", e.getMessage());
        }

        if (candidateModels.isEmpty()) {
            candidateModels.addAll(Arrays.asList("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro"));
        }

        Exception lastException = null;

        for (String modelName : candidateModels) {
            try {
                String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + geminiApiKey;

                ObjectNode reqJson = objectMapper.createObjectNode();

                // System Instruction (Google Gemini Native System Field)
                ObjectNode sysInst = reqJson.putObject("system_instruction");
                ArrayNode sysParts = sysInst.putArray("parts");
                sysParts.addObject().put("text", systemPrompt);

                // User Content
                ArrayNode contents = reqJson.putArray("contents");
                ObjectNode userObj = contents.addObject();
                userObj.put("role", "user");
                ArrayNode parts = userObj.putArray("parts");
                parts.addObject().put("text", userPrompt);

                ObjectNode genConfig = reqJson.putObject("generationConfig");
                genConfig.put("temperature", 0.1);
                genConfig.put("maxOutputTokens", 1200);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(reqJson)))
                        .build();

                HttpResponse<String> httpResponse = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

                if (httpResponse.statusCode() == 200) {
                    JsonNode resJson = objectMapper.readTree(httpResponse.body());
                    JsonNode candidate = resJson.path("candidates").get(0);
                    if (candidate != null && candidate.has("content")) {
                        JsonNode partNode = candidate.path("content").path("parts").get(0);
                        if (partNode != null && partNode.has("text")) {
                            String resultText = partNode.path("text").asText().trim();
                            return sanitizeAiText(resultText);
                        }
                    }
                } else {
                    log.warn("Gemini model {} returned status {}: {}", modelName, httpResponse.statusCode(), httpResponse.body());
                }
            } catch (Exception e) {
                lastException = e;
            }
        }

        throw new RuntimeException("All Gemini model endpoints failed. Last error: " + (lastException != null ? lastException.getMessage() : "Unknown"));
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

        // 1. Goal plan queries should return empty cards so ONLY clean 3-part text advice is rendered
        if (norm.contains("muc tieu") || norm.contains("mua") || norm.contains("laptop") || norm.contains("xe") || norm.contains("sam")) {
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
        return null;
    }

    private AiChatResponse fallbackLocalEngine(Map<String, Object> ctx, String raw, String norm, String moduleType) {
        DecimalFormat df = new DecimalFormat("#,###");
        String username = (String) ctx.get("username");
        String email = (String) ctx.get("email");
        BigDecimal totalBal = (BigDecimal) ctx.get("totalBalance");
        boolean hasData = (boolean) ctx.get("hasData");

        String text;
        if (norm.contains("tao vi") || norm.contains("xoa vi") || norm.contains("quan ly vi") || norm.contains("vi moi") || norm.contains("vi")) {
            text = "Hướng dẫn tạo và quản lý ví trong SmartSpend:\n\n" +
                   "1. Tại Trang chủ hoặc mục Ví cá nhân, nhấn vào nút '+ Ví mới' (hoặc chọn Thêm ví).\n" +
                   "2. Nhập Tên ví (ví dụ: Ví tiền mặt, Ví MoMo, Ví Techcombank), chọn Loại ví và nhập Số dư ban đầu.\n" +
                   "3. Nhấn 'Lưu ví' để hoàn tất. Bạn có thể chọn ví này làm Ví mặc định để thực hiện các giao dịch.";
        } else if (norm.contains("pin") || norm.contains("quen pin") || norm.contains("ma pin") || norm.contains("doi pin") || norm.contains("reset pin")) {
            String targetEmail = email != null && !email.isEmpty() ? email : "Email đăng ký";
            text = "Hướng dẫn xử lý khi quên mã PIN bảo mật trong SmartSpend:\n\n" +
                   "1. Tại màn hình nhập PIN khi Nạp/Rút tiền hoặc trong Cài đặt, nhấn chọn 'Quên mã PIN?'.\n" +
                   "2. Kiểm tra Email đăng ký tài khoản (" + targetEmail + ") để nhận mã xác minh OTP gửi về.\n" +
                   "3. Nhập mã OTP chính xác, sau đó tiến hành tạo Mã PIN 6 số mới và xác nhận lại để hoàn tất.";
        } else if (norm.contains("cat giam") || norm.contains("khoan nao") || norm.contains("cat giam chi tieu") || norm.contains("giam chi tieu")) {
            String topCat = (String) ctx.get("topCategoryName");
            BigDecimal topAmt = (BigDecimal) ctx.get("topCategoryAmount");
            Double topPct = (Double) ctx.get("topCategoryPercentage");

            String secondCat = (String) ctx.get("secondCategoryName");
            BigDecimal secondAmt = (BigDecimal) ctx.get("secondCategoryAmount");
            Double secondPct = (Double) ctx.get("secondCategoryPercentage");

            boolean hasExpense = ctx.get("hasExpenseData") != null && (boolean) ctx.get("hasExpenseData");

            if (hasExpense && topCat != null) {
                String secondText = secondCat != null ? String.format(", đồng thời rà soát thêm danh mục '%s' (%s VNĐ, chiếm %.1f%%)", secondCat, df.format(secondAmt), secondPct) : "";
                text = String.format(
                    "Dựa trên thói quen chi tiêu thực tế của %s trong tháng này:\n\n" +
                    "1. Phân tích danh mục lớn nhất: Bạn đang chi nhiều tiền nhất cho '%s' với %s VNĐ (chiếm %.1f%% tổng chi tiêu tháng).\n" +
                    "2. Gợi ý cắt giảm cụ thể: Hãy ưu tiên cắt giảm 15 - 20%% chi phí ở danh mục '%s' để tiết kiệm khoảng %s VNĐ/tháng%s.\n" +
                    "3. Khuyến nghị hành động: Mở mục Ngân sách để thiết lập hạn mức kiểm soát cho '%s', AI sẽ gửi cảnh báo tự động khi bạn chi tiêu gần vượt ngưỡng.",
                    username,
                    topCat,
                    df.format(topAmt),
                    topPct,
                    topCat,
                    df.format(topAmt.multiply(new BigDecimal("0.2"))),
                    secondText,
                    topCat
                );
            } else {
                text = "Phân tích & Gợi ý cắt giảm chi tiêu cho " + username + ":\n\n" +
                       "1. Tài khoản của bạn hiện chưa ghi nhận phát sinh giao dịch chi tiêu trong tháng này.\n" +
                       "2. Để AI phân tích chính xác thói quen tiêu dùng cá nhân và chỉ ra khoản lãng phí cần cắt giảm, hãy Nạp tiền vào ví hoặc Ghi chép các giao dịch thu chi hàng ngày.\n" +
                       "3. Theo quy tắc quản lý tài chính 50/30/20, các khoản chi dễ cắt giảm nhất gồm: Mua sắm ngẫu hứng, Ăn uống ngoài không kế hoạch, Trà sữa/Cà phê hàng ngày và các Dịch vụ đăng ký không sử dụng.";
            }
        } else if (norm.contains("muc tieu") || norm.contains("mua") || norm.contains("laptop") || norm.contains("xe")) {
            Matcher amountMatcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(triệu|tr)", Pattern.CASE_INSENSITIVE).matcher(raw);
            Matcher monthMatcher = Pattern.compile("(\\d+)\\s*tháng", Pattern.CASE_INSENSITIVE).matcher(raw);

            long targetAmount = amountMatcher.find() ? (long)(Double.parseDouble(amountMatcher.group(1).replace(",", ".")) * 1000000L) : 30000000L;
            int targetMonths = monthMatcher.find() ? Integer.parseInt(monthMatcher.group(1)) : 3;
            long monthlySaving = targetMonths > 0 ? targetAmount / targetMonths : targetAmount;

            text = String.format(
                "Lộ trình tiết kiệm mục tiêu mua sắm cho %s:\n\n" +
                "1. Để đạt mục tiêu %s VNĐ trong %d tháng, bạn cần trích cố định %s VNĐ mỗi tháng.\n" +
                "2. Số dư khả dụng tài khoản hiện tại của bạn là %s VNĐ. Bạn nên mở Ví tích lũy riêng và đặt lịch tự động trích tiền khi nhận lương.\n" +
                "3. Rà soát và cắt giảm 10-15%% chi tiêu không cố định để duy trì tiến độ hoàn thành mục tiêu đúng hạn.",
                username,
                df.format(targetAmount),
                targetMonths,
                df.format(monthlySaving),
                df.format(totalBal)
            );
        } else if (norm.contains("luong") || norm.contains("thue") || norm.contains("chia") || norm.contains("phan bo")) {
            text = "Gợi ý phân bổ ngân sách cho " + username + " (Lương 12tr, Tiền thuê 3tr):\n\n" +
                   "1. Tiền thuê & Cố định (25%): 3.000.000đ.\n" +
                   "2. Ăn uống & Sinh hoạt (29%): 3.500.000đ.\n" +
                   "3. Tiết kiệm & Đầu tư (21%): 2.500.000đ.\n" +
                   "4. Giải trí & Cá nhân (25%): 3.000.000đ.";
        } else if (norm.contains("tu van") || norm.contains("tai chinh")) {
            if (hasData) {
                text = "Tư vấn tài chính cho " + username + ":\n\n" +
                       "1. Tổng số dư khả dụng hiện tại là " + df.format(totalBal) + "đ.\n" +
                       "2. Nên trích tối thiểu 20% tích lũy vào Quỹ khẩn cấp trước khi chi tiêu.\n" +
                       "3. Thiết lập hạn mức Ngân sách cho danh mục Ăn uống và Mua sắm để kiểm soát dòng tiền.";
            } else {
                text = "Tài khoản của bạn hiện chưa có dữ liệu giao dịch hoặc số dư đang là 0đ.\n\n" +
                       "1. Vui lòng Nạp tiền vào ví hoặc Ghi chép giao dịch mới để SmartSpend có dữ liệu phân tích thu chi thực tế cho bạn.\n" +
                       "2. Trong thời gian chờ, bạn có thể tham khảo Mô hình 50/30/20 (50% Thiết yếu, 30% Sở thích, 20% Tiết kiệm) để chuẩn bị quản lý dòng tiền.\n" +
                       "3. Hãy thực hiện Nạp tiền vào Ví chính ngay để bắt đầu trải nghiệm phân tích & tư vấn tài chính cá nhân hóa!";
            }
        } else if (norm.contains("ngan sach")) {
            text = "Hướng dẫn tạo ngân sách trong SmartSpend:\n\n" +
                   "1. Mở mục Ngân sách -> Nhấn '+ Tạo ngân sách'.\n" +
                   "2. Chọn danh mục, nhập hạn mức và chu kỳ (tuần/tháng).\n" +
                   "3. Nhấn 'Lưu'. Hệ thống tự cảnh báo khi chi tiêu tới 80% & 100%.";
        } else if (norm.contains("nap") || norm.contains("rut")) {
            text = "Hướng dẫn nạp và rút tiền:\n\n" +
                   "1. Nạp tiền: Ví cá nhân -> Nạp tiền -> Quét QR SePay/Chuyển khoản -> Nhập PIN.\n" +
                   "2. Rút tiền: Ví cá nhân -> Rút tiền -> Nhập số tiền -> Nhập PIN.\n" +
                   "3. Ví nhóm: Mở Ví nhóm -> Nạp/Rút quỹ.";
        } else if (norm.contains("danh muc")) {
            text = "Hướng dẫn tạo danh mục thu chi:\n\n" +
                   "1. Vào Cài đặt -> Quản lý danh mục.\n" +
                   "2. Chọn tab Chi tiêu hoặc Thu nhập -> '+ Tạo danh mục mới'.\n" +
                   "3. Nhập tên, icon & màu đại diện -> Nhấn 'Lưu'.";
        } else if (norm.contains("tieu nhieu") || norm.contains("tieu o dau") || norm.contains("bao cao") || norm.contains("phan tich") || norm.contains("thu chi")) {
            text = "Hướng dẫn xem phân tích & báo cáo chi tiêu:\n\n" +
                   "1. Vào mục 'Báo cáo' từ thanh điều hướng bên dưới.\n" +
                   "2. Xem biểu đồ tròn phân bổ chi tiêu theo danh mục để biết bạn đang tiêu nhiều tiền nhất ở đâu.\n" +
                   "3. So sánh biến động thu chi hàng tuần/hàng tháng để điều chỉnh thói quen tài chính kịp thời.";
        } else {
            text = "Trợ lý AI SmartSpend đồng hành cùng " + username + ":\n\n" +
                   "1. Áp dụng mô hình 50/30/20 để quản lý tài chính hiệu quả.\n" +
                   "2. Thiết lập ngân sách và theo dõi báo cáo chi tiêu hàng tuần.\n" +
                   "3. Bạn có thể hỏi: 'tạo ví', 'quên PIN', 'cắt giảm chi tiêu', 'nạp rút', 'ngân sách', 'tư vấn tài chính'.";
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
        String[] keywords = {"tu van", "recommend", "advisor", "cho toi", "tai chinh", "luong", "thue", "chia ngan sach", "tiet kiem", "laptop", "muc tieu", "vuot", "chia", "hien tai", "mua", "xe", "sam", "trieu", "tr"};
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    private boolean isAnalyticsQuery(String norm) {
        String[] keywords = {"tieu nhieu o dau", "tieu o dau", "bao cao", "phan tich", "xu huong", "cat giam", "chi tieu", "thang nay tieu", "tai khoan"};
        return Arrays.stream(keywords).anyMatch(norm::contains);
    }

    private String sanitizeAiText(String text) {
        if (text == null) return "";
        String result = text.trim();

        // 1. ALWAYS slice from the LAST occurrence of "🎯" to strip all preceding template drafts & English reasoning
        int lastTargetIdx = result.lastIndexOf("🎯");
        if (lastTargetIdx != -1) {
            result = result.substring(lastTargetIdx).trim();
        } else {
            int lastNumIdx = result.lastIndexOf("1. ");
            if (lastNumIdx != -1 && (result.contains("User Goal") || result.contains("User Identity") || result.contains("Drafting") || result.contains("Step 1") || result.contains("Rule 1") || result.contains("Self-"))) {
                result = result.substring(lastNumIdx).trim();
            } else if (result.contains("User Goal") || result.contains("User Identity") || result.contains("Drafting") || result.contains("Step 1") || result.contains("Rule 1") || result.contains("Self-")) {
                Pattern p = Pattern.compile("(?m)^(1\\.|[1-9]\\.|Để|Lộ trình|Hướng dẫn|Tài khoản|Dựa trên|Gợi ý)");
                Matcher m = p.matcher(result);
                if (m.find()) {
                    result = result.substring(m.start()).trim();
                }
            }
        }

        // 2. Remove trailing self-correction / self-check / constraint evaluation blocks if present
        String[] trailingMarkers = {"*Self-", "Self-Correction", "Check structure", "Check language", "Check constraints", "Check math", "Ensure tone", "Vietnamese only"};
        for (String marker : trailingMarkers) {
            int idx = result.indexOf(marker);
            if (idx != -1) {
                result = result.substring(0, idx).trim();
            }
        }

        return result;
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
