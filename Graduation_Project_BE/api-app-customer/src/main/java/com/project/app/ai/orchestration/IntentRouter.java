package com.project.app.ai.orchestration;

import com.project.app.ai.dto.internal.ConversationState;
import com.project.app.ai.util.TextNormalizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class IntentRouter {

    public enum AiIntent {
        SPENDING_REDUCTION,
        QUERY_BUDGET,
        QUERY_SPENDING,
        QUERY_WALLET,
        CREATE_TRANSACTION,
        FINANCIAL_GOAL,
        APP_HELP,
        GENERAL
    }

    /**
     * Strict ordered intent detection with ConversationState Context Inheritance.
     * Order:
     * 1. SPENDING_REDUCTION
     * 2. QUERY_BUDGET
     * 3. FINANCIAL_GOAL (Must win over QUERY_WALLET when goal keywords/context exist!)
     * 4. QUERY_SPENDING (No dangerous contains("chi")!)
     * 5. QUERY_WALLET
     * 6. CREATE_TRANSACTION
     * 7. APP_HELP
     * 8. GENERAL
     */
    public AiIntent detectIntent(String userPrompt, ConversationState state) {
        if (userPrompt == null || userPrompt.trim().isEmpty()) {
            return AiIntent.GENERAL;
        }

        String norm = TextNormalizer.normalize(userPrompt);

        // 1. SPENDING_REDUCTION Check
        if (isSpendingReductionQuery(norm)) {
            return AiIntent.SPENDING_REDUCTION;
        }

        // 2. QUERY_BUDGET Check
        if (isBudgetQuery(norm)) {
            return AiIntent.QUERY_BUDGET;
        }

        // 3. FINANCIAL_GOAL Check (Direct or Inherited Context - Wins over QUERY_WALLET!)
        if (isFinancialGoal(norm) || isFinancialGoalFollowUp(norm, state)) {
            return AiIntent.FINANCIAL_GOAL;
        }

        // 4. QUERY_SPENDING Check (Strict phrase check, NO contains("chi")!)
        if (isSpendingQuery(norm)) {
            return AiIntent.QUERY_SPENDING;
        }

        // 5. QUERY_WALLET Check
        if (isWalletQuery(norm)) {
            return AiIntent.QUERY_WALLET;
        }

        // 6. CREATE_TRANSACTION Check
        if (isCreateTransaction(norm)) {
            return AiIntent.CREATE_TRANSACTION;
        }

        // 7. APP_HELP Check
        if (isAppHelp(norm)) {
            return AiIntent.APP_HELP;
        }

        return AiIntent.GENERAL;
    }

    public AiIntent detectIntent(String userPrompt) {
        return detectIntent(userPrompt, null);
    }

    private boolean isSpendingReductionQuery(String norm) {
        return norm.contains("cat giam")
                || norm.contains("giam chi tieu")
                || norm.contains("nen giam")
                || norm.contains("khoan nao co the cat giam")
                || norm.contains("khoan nao nen giam");
    }

    private boolean isBudgetQuery(String norm) {
        return norm.contains("luong")
                || norm.contains("thu nhap")
                || norm.contains("chia ngan sach")
                || norm.contains("phan bo")
                || norm.contains("tien thue")
                || norm.contains("tien tro")
                || norm.contains("tien nha")
                || norm.contains("50/30/20")
                || norm.contains("chia luong");
    }

    private boolean isSpendingQuery(String norm) {
        return norm.contains("tieu bao nhieu")
                || norm.contains("da tieu")
                || norm.contains("thang nay tieu")
                || norm.contains("hom nay tieu")
                || norm.contains("hom qua tieu")
                || norm.contains("chi bao nhieu")
                || norm.contains("da chi")
                || norm.contains("tong chi")
                || norm.contains("chi phi thuc te")
                || norm.contains("bao cao chi tieu");
    }

    private boolean isWalletQuery(String norm) {
        return norm.contains("so du")
                || norm.contains("vi nao")
                || norm.contains("tat ca vi")
                || norm.contains("vi tien mat")
                || norm.contains("bao nhieu vi")
                || norm.contains("danh sach vi")
                || norm.contains("cac vi")
                || norm.equals("vi");
    }

    private boolean isCreateTransaction(String norm) {
        if (norm.contains("ghi nhan giao dich")
                || norm.contains("tao giao dich")
                || norm.contains("vua chi")
                || norm.contains("vua thu")
                || norm.contains("vua nap")) {
            return true;
        }

        // Match short transaction patterns like "an sang 50k", "ca phe 35k", "do xang 50k", "mua sach 100k", "nhan luong 10 triệu", "nap 500k"
        java.util.regex.Pattern pTx = java.util.regex.Pattern.compile("^[a-z0-9\\s]{1,30}\\s+(\\d+(?:[.,]\\d+)?\\s*(k|nghin|ngan|trieu|tr|m|ty)?)$", java.util.regex.Pattern.CASE_INSENSITIVE);
        if (pTx.matcher(norm).find() && !norm.contains("trong") && !norm.contains("sau") && !norm.contains("muon co") && !norm.contains("can co")) {
            return true;
        }

        return false;
    }

    private boolean isFinancialGoal(String norm) {
        boolean hasGoalKeyword = norm.contains("muc tieu")
                || norm.contains("tiet kiem")
                || norm.contains("tich luy")
                || norm.contains("dat duoc")
                || norm.contains("can co")
                || norm.contains("muon co")
                || norm.contains("mua")
                || norm.contains("mua oto")
                || norm.contains("mua o to")
                || norm.contains("mua xe")
                || norm.contains("mua nha")
                || norm.contains("mua laptop")
                || norm.contains("mua iphone");

        if (hasGoalKeyword) return true;

        return (norm.contains("du phong") && (norm.contains("hien tai") || norm.contains("toi co") || norm.contains("giu lai")))
                || (norm.contains("tiet kiem") && norm.contains("giu lai"));
    }

    private boolean isFinancialGoalFollowUp(String norm, ConversationState state) {
        if (state != null) {
            boolean isGoalActive = state.getLastIntent() == AiIntent.FINANCIAL_GOAL
                    || (state.getTargetAmount() != null && state.getTargetAmount() > 0)
                    || state.getGoalName() != null;
            
            // Follow-up inheritance ONLY applies if user prompt does NOT match an explicit different intent!
            if (isGoalActive && !isWalletQuery(norm) && !isSpendingQuery(norm) && !isCreateTransaction(norm) && !isBudgetQuery(norm) && !isSpendingReductionQuery(norm) && !isAppHelp(norm)) {
                return true;
            }
        }
        return false;
    }

    private boolean isAppHelp(String norm) {
        return norm.contains("huong dan")
                || norm.contains("cach tao vi")
                || norm.contains("cach nap tien")
                || norm.contains("cach rut tien")
                || norm.contains("quen pin");
    }
}
