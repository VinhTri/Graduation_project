package com.project.app.ai.tool;

import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.notebook.dto.request.NotebookTransactionRequest;
import com.project.app.notebook.enums.NotebookTransactionType;
import com.project.app.notebook.service.NotebookTransactionService;
import com.project.app.transaction.dto.request.ManualTransactionRequest;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.service.TransactionService;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class CreateTransactionTool implements AiTool {

    private final TransactionService transactionService;
    private final NotebookTransactionService notebookTransactionService;
    private final WalletRepository walletRepository;
    private final CategoryItemRepository categoryItemRepository;

    @Override
    public String getName() {
        return "create_transaction";
    }

    @Override
    public String getDescription() {
        return "Ghi nhận/tạo giao dịch thu nhập hoặc chi tiêu thủ công mới vào cơ sở dữ liệu cho người dùng. BẮT BUỘC có số tiền (amount), loại giao dịch (type: 'INCOME' hoặc 'EXPENSE') và danh mục (categoryName).";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        Map<String, Object> props = new HashMap<>();

        Map<String, Object> amountProp = new HashMap<>();
        amountProp.put("type", "NUMBER");
        amountProp.put("description", "Số tiền giao dịch (VNĐ), ví dụ: 50000, 200000, 5000000");
        props.put("amount", amountProp);

        Map<String, Object> typeProp = new HashMap<>();
        typeProp.put("type", "STRING");
        typeProp.put("description", "Loại giao dịch bắt buộc: 'EXPENSE' (chi tiêu) hoặc 'INCOME' (thu nhập)");
        props.put("type", typeProp);

        Map<String, Object> categoryNameProp = new HashMap<>();
        categoryNameProp.put("type", "STRING");
        categoryNameProp.put("description", "Tên danh mục bắt buộc, ví dụ: 'Ăn uống', 'Di chuyển', 'Giải trí', 'Lương'");
        props.put("categoryName", categoryNameProp);

        Map<String, Object> walletNameProp = new HashMap<>();
        walletNameProp.put("type", "STRING");
        walletNameProp.put("description", "Tên sổ tay ngân hàng (nếu có). Bỏ trống = ghi vào sổ tay tiền mặt.");
        props.put("walletName", walletNameProp);

        Map<String, Object> descriptionProp = new HashMap<>();
        descriptionProp.put("type", "STRING");
        descriptionProp.put("description", "Ghi chú/Mô tả giao dịch, ví dụ: 'Ăn trưa', 'Uống bia'");
        props.put("description", descriptionProp);

        Map<String, Object> dateProp = new HashMap<>();
        dateProp.put("type", "STRING");
        dateProp.put("description", "Thời gian giao dịch, ví dụ: 'today' (hôm nay), 'yesterday' (hôm qua)");
        props.put("date", dateProp);

        parameters.put("properties", props);
        parameters.put("required", List.of("amount", "type", "categoryName"));
        decl.put("parameters", parameters);

        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        if (user == null) {
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Người dùng chưa đăng nhập. Vui lòng đăng nhập để lưu giao dịch vào DB.")
                    .data(Collections.emptyMap())
                    .build();
        }

        try {
            // 1. Strict Validation: Amount > 0
            long amountVal = parseLong(arguments != null ? arguments.get("amount") : null, 0L);
            if (amountVal <= 0) {
                return ToolResultDto.builder()
                        .toolName(getName())
                        .success(false)
                        .message("Thiếu số tiền giao dịch hợp lệ")
                        .data(Map.of("promptUser", "Bạn muốn ghi nhận giao dịch với số tiền bao nhiêu VNĐ?"))
                        .build();
            }

            // 2. Strict Validation: Type (INCOME / EXPENSE) - NEVER DEFAULT TO EXPENSE!
            String typeStr = arguments != null ? (String) arguments.get("type") : null;
            if (typeStr == null || typeStr.trim().isEmpty()) {
                return ToolResultDto.builder()
                        .toolName(getName())
                        .success(false)
                        .message("Thiếu loại giao dịch (THU NHẬP hay CHI TIÊU)")
                        .data(Map.of("missingType", true, "promptUser", String.format("Khoản %s VNĐ này là THU NHẬP hay CHI TIÊU?", new DecimalFormat("#,###").format(amountVal))))
                        .build();
            }
            TransactionType type = "INCOME".equalsIgnoreCase(typeStr) ? TransactionType.INCOME : TransactionType.EXPENSE;

            // 3. Strict Validation: Category (Strict lookup - NO arbitrary fallback to index 0!)
            String categoryNameArg = arguments.get("categoryName") != null ? ((String) arguments.get("categoryName")).trim() : "";
            if (categoryNameArg.isEmpty()) {
                return ToolResultDto.builder()
                        .toolName(getName())
                        .success(false)
                        .message("Thiếu danh mục giao dịch")
                        .data(Map.of("missingCategory", true, "promptUser", "Bạn muốn ghi nhận giao dịch này vào danh mục nào (ví dụ: Ăn uống, Di chuyển, Mua sắm, Lương)?"))
                        .build();
            }

            Long categoryId = null;
            String matchedCategoryName = categoryNameArg;
            List<CategoryItem> categories = categoryItemRepository.findAll();

            if (categories != null && !categories.isEmpty()) {
                for (CategoryItem cat : categories) {
                    if (cat.getLabel() != null && cat.getLabel().toLowerCase().contains(categoryNameArg.toLowerCase())) {
                        categoryId = cat.getId();
                        matchedCategoryName = cat.getLabel();
                        break;
                    }
                }
            }

            if (categoryId == null) {
                return ToolResultDto.builder()
                        .toolName(getName())
                        .success(false)
                        .message("Không tìm thấy danh mục '" + categoryNameArg + "'")
                        .data(Map.of("categoryNotFound", true, "promptUser", String.format("SmartSpend chưa tìm thấy danh mục '%s'. Bạn muốn chọn danh mục nào trong các danh mục hiện có?", categoryNameArg)))
                        .build();
            }

            // 4. Wallet: bank notebook nếu khớp tên; còn lại → sổ tay tiền mặt (notebook)
            String walletNameArg = arguments.get("walletName") != null ? ((String) arguments.get("walletName")).trim() : "";
            Long bankWalletId = null;
            boolean useCashNotebook = true;

            if (!walletNameArg.isEmpty()) {
                String lower = walletNameArg.toLowerCase();
                if (lower.contains("tiền mặt") || lower.contains("tien mat") || lower.contains("cash")) {
                    useCashNotebook = true;
                } else {
                    List<Wallet> userWallets = walletRepository.findByUserId(user.getId());
                    if (userWallets != null) {
                        for (Wallet w : userWallets) {
                            if (w.getWalletType() != WalletType.MANUAL && w.getWalletType() != WalletType.LINKED) {
                                continue;
                            }
                            if (w.getName() != null && w.getName().toLowerCase().contains(lower)) {
                                bankWalletId = w.getId();
                                useCashNotebook = false;
                                break;
                            }
                        }
                    }
                    if (useCashNotebook && bankWalletId == null) {
                        return ToolResultDto.builder()
                                .toolName(getName())
                                .success(false)
                                .message("Không tìm thấy sổ tay ngân hàng '" + walletNameArg + "'")
                                .data(Map.of("walletNotFound", true, "promptUser",
                                        String.format("Không tìm thấy sổ tay '%s'. Ghi vào sổ tay tiền mặt hoặc chọn sổ ngân hàng khác?", walletNameArg)))
                                .build();
                    }
                }
            }

            String rawDesc = arguments.get("description") != null ? ((String) arguments.get("description")).trim() : "";
            String description = !rawDesc.isEmpty() ? rawDesc : matchedCategoryName;

            String dateStr = arguments.get("date") != null ? (String) arguments.get("date") : "today";
            LocalDateTime createdAt = LocalDateTime.now();
            LocalDate entryDate = null;
            if ("yesterday".equalsIgnoreCase(dateStr) || dateStr.toLowerCase().contains("hom qua")) {
                createdAt = LocalDateTime.now().minusDays(1);
                entryDate = LocalDate.now().minusDays(1);
            }

            DecimalFormat df = new DecimalFormat("#,###");

            if (useCashNotebook) {
                NotebookTransactionRequest nbReq = new NotebookTransactionRequest();
                nbReq.setAmount(BigDecimal.valueOf(amountVal));
                nbReq.setType(type == TransactionType.EXPENSE
                        ? NotebookTransactionType.EXPENSE
                        : NotebookTransactionType.INCOME);
                nbReq.setCategoryId(categoryId);
                nbReq.setNote(description);
                nbReq.setEntryDate(entryDate);
                notebookTransactionService.createTransaction(user.getId(), nbReq);
            } else {
                ManualTransactionRequest req = new ManualTransactionRequest(
                        BigDecimal.valueOf(amountVal),
                        type,
                        categoryId,
                        description,
                        bankWalletId,
                        createdAt
                );
                transactionService.createManualTransaction(user, req);
            }

            String msg = String.format("Ghi nhận giao dịch thành công: %s %s VNĐ cho danh mục %s (%s).",
                    type == TransactionType.EXPENSE ? "Chi tiêu" : "Thu nhập",
                    df.format(amountVal),
                    matchedCategoryName,
                    description
            );

            Map<String, Object> resData = new HashMap<>();
            resData.put("amount", amountVal);
            resData.put("type", type.name());
            resData.put("categoryName", matchedCategoryName);
            resData.put("description", description);
            resData.put("date", dateStr);
            resData.put("confirmationMessage", msg);

            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(true)
                    .message(msg)
                    .data(resData)
                    .build();

        } catch (Exception e) {
            log.error("Error creating manual transaction", e);
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Lỗi khi lưu giao dịch vào cơ sở dữ liệu: " + e.getMessage())
                    .data(Collections.emptyMap())
                    .build();
        }
    }

    private long parseLong(Object obj, long defaultVal) {
        if (obj == null) return defaultVal;
        if (obj instanceof Number) return ((Number) obj).longValue();
        try {
            return Long.parseLong(obj.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }
}
