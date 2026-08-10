package com.project.app.ai.tool;

import com.project.app.ai.tool.dto.ToolResultDto;
import com.project.app.user.entity.User;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class WalletTool implements AiTool {

    private final WalletRepository walletRepository;

    @Override
    public String getName() {
        return "get_wallets_and_balance";
    }

    @Override
    public String getDescription() {
        return "Lấy danh sách tất cả ví cá nhân, tổng số dư khả dụng, ví có số dư nhiều nhất và ví có số dư thấp nhất hiện tại của người dùng.";
    }

    @Override
    public Map<String, Object> getFunctionDeclaration() {
        Map<String, Object> decl = new HashMap<>();
        decl.put("name", getName());
        decl.put("description", getDescription());

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("type", "OBJECT");
        parameters.put("properties", Collections.emptyMap());
        decl.put("parameters", parameters);

        return decl;
    }

    @Override
    public ToolResultDto execute(User user, Map<String, Object> arguments) {
        if (user == null) {
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Người dùng chưa đăng nhập")
                    .data(Map.of("totalBalance", 0, "wallets", Collections.emptyList()))
                    .build();
        }

        try {
            List<Wallet> wallets = walletRepository.findByUserId(user.getId());
            BigDecimal totalBalance = BigDecimal.ZERO;
            List<Map<String, Object>> walletList = new ArrayList<>();

            for (Wallet w : wallets) {
                BigDecimal bal = w.getBalance() != null ? w.getBalance() : BigDecimal.ZERO;
                totalBalance = totalBalance.add(bal);

                String displayName = w.getName() != null && !w.getName().trim().isEmpty() ? w.getName().trim() : "Ví chính";

                Map<String, Object> wMap = new HashMap<>();
                wMap.put("name", displayName);
                wMap.put("walletName", displayName);
                wMap.put("balance", bal);
                wMap.put("type", w.getWalletType() != null ? w.getWalletType().name() : "GENERAL");
                wMap.put("isDefault", w.isDefault());
                walletList.add(wMap);
            }

            Map<String, Object> resData = new HashMap<>();
            resData.put("totalBalance", totalBalance);
            resData.put("walletCount", walletList.size());
            resData.put("wallets", walletList);

            if (!walletList.isEmpty()) {
                Map<String, Object> highest = walletList.stream()
                        .max(Comparator.comparingLong(w -> ((Number) w.getOrDefault("balance", 0L)).longValue()))
                        .orElse(walletList.get(0));

                Map<String, Object> lowest = walletList.stream()
                        .min(Comparator.comparingLong(w -> ((Number) w.getOrDefault("balance", 0L)).longValue()))
                        .orElse(walletList.get(0));

                resData.put("highestWallet", highest);
                resData.put("lowestWallet", lowest);
            }

            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(true)
                    .message("Lấy thông tin ví thành công")
                    .data(resData)
                    .build();
        } catch (Exception e) {
            log.error("Error executing WalletTool", e);
            return ToolResultDto.builder()
                    .toolName(getName())
                    .success(false)
                    .message("Lỗi khi truy vấn thông tin ví: " + e.getMessage())
                    .data(Collections.emptyMap())
                    .build();
        }
    }
}
