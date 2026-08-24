package com.project.app.control.service;

import com.project.app.audit.service.AdminAuditService;
import com.project.app.control.dto.FinanceCaseRequest;
import com.project.app.control.entity.FinanceCase;
import com.project.app.control.repository.FinanceCaseRepository;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminControlCenterService {
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final FinanceCaseRepository caseRepository;
    private final AdminAuditService auditService;

    @Transactional(readOnly = true)
    public Map<String, Object> transactions() {
        List<Transaction> all = financialTransactions();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", all.size());
        result.put("pending", all.stream().filter(t -> t.getStatus() == TransactionStatus.PENDING).count());
        result.put("failed", all.stream().filter(t -> t.getStatus() == TransactionStatus.FAILED).count());
        result.put("successAmount", sum(all.stream().filter(t -> t.getStatus() == TransactionStatus.SUCCESS).toList()));
        result.put("items", all.stream().limit(1000).map(this::transactionRow).toList());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> report() {
        List<Transaction> all = financialTransactions();
        Map<String, BigDecimal> byType = new LinkedHashMap<>();
        Map<String, BigDecimal> byDay = new TreeMap<>();
        all.stream().filter(t -> t.getStatus() == TransactionStatus.SUCCESS).forEach(t -> {
            byType.merge(t.getType().name(), t.getAmount(), BigDecimal::add);
            byDay.merge(t.getCreatedAt().toLocalDate().toString(), t.getAmount(), BigDecimal::add);
        });
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("generatedAt", java.time.LocalDateTime.now());
        result.put("walletBalance", walletRepository.findAll().stream().map(w -> w.getBalance()).reduce(BigDecimal.ZERO, BigDecimal::add));
        result.put("transactionCount", all.size());
        result.put("successCount", all.stream().filter(t -> t.getStatus() == TransactionStatus.SUCCESS).count());
        result.put("failedCount", all.stream().filter(t -> t.getStatus() == TransactionStatus.FAILED).count());
        result.put("volumeByType", byType);
        result.put("dailyVolume", byDay.entrySet().stream().skip(Math.max(0, byDay.size() - 30)).map(e -> Map.of("date", e.getKey(), "amount", e.getValue())).toList());
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> alerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        walletRepository.findAll().stream().filter(w -> w.getBalance().signum() < 0).forEach(w -> alerts.add(alert("CRITICAL", "NEGATIVE_BALANCE", "Ví có số dư âm", w.getAccountNumber(), w.getBalance())));
        List<Transaction> all = financialTransactions();
        all.stream().filter(t -> t.getStatus() == TransactionStatus.PENDING && t.getCreatedAt().isBefore(java.time.LocalDateTime.now().minusHours(24)))
                .forEach(t -> alerts.add(alert("HIGH", "STALE_TRANSACTION", "Giao dịch chờ quá 24 giờ", t.getTransactionCode(), t.getAmount())));
        all.stream().filter(t -> t.getStatus() == TransactionStatus.FAILED && t.getCreatedAt().toLocalDate().equals(LocalDate.now()))
                .forEach(t -> alerts.add(alert("MEDIUM", "FAILED_TODAY", "Giao dịch thất bại hôm nay", t.getTransactionCode(), t.getAmount())));
        return alerts;
    }

    @Transactional(readOnly = true)
    public List<FinanceCase> cases() { return caseRepository.findTop500ByOrderByCreatedAtDesc(); }

    @Transactional
    public FinanceCase createCase(FinanceCaseRequest request, User admin) {
        FinanceCase item = new FinanceCase(); item.setTransactionCode(clean(request.transactionCode())); item.setSeverity(request.severity()); item.setStatus("OPEN"); item.setTitle(request.title().trim()); item.setDescription(request.description().trim()); item.setCreatedBy(admin.getEmail());
        item = caseRepository.save(item); auditService.record(admin, "FINANCE_CASE_CREATE", "FINANCE_CASE", item.getId(), item.getTitle()); return item;
    }

    @Transactional
    public FinanceCase resolveCase(Long id, String note, User admin) {
        FinanceCase item = caseRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ sự cố"));
        if ("RESOLVED".equals(item.getStatus())) throw new IllegalStateException("Hồ sơ đã được xử lý");
        item.setStatus("RESOLVED"); item.setResolutionNote(note.trim()); item.setResolvedBy(admin.getEmail());
        auditService.record(admin, "FINANCE_CASE_RESOLVE", "FINANCE_CASE", id, note.trim()); return item;
    }

    private Map<String,Object> transactionRow(Transaction t) { Map<String,Object> row = new LinkedHashMap<>(); row.put("id",t.getId()); row.put("transactionCode",t.getTransactionCode()); row.put("username",t.getUser().getUsername()); row.put("email",t.getUser().getEmail()); row.put("walletId",t.getWallet().getId()); row.put("accountNumber",t.getWallet().getAccountNumber()); row.put("amount",t.getAmount()); row.put("type",t.getType()); row.put("status",t.getStatus()); row.put("note",t.getNote()); row.put("createdAt",t.getCreatedAt()); return row; }
    private BigDecimal sum(List<Transaction> rows) { return rows.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add); }
    private Map<String,Object> alert(String severity,String type,String title,String ref,BigDecimal amount) { Map<String,Object> row = new LinkedHashMap<>(); row.put("severity",severity); row.put("type",type); row.put("title",title); row.put("reference",ref); row.put("amount",amount); return row; }
    private List<Transaction> financialTransactions() { return transactionRepository.findAllWithUserAndWalletOrderByCreatedAtDesc().stream().filter(t -> t.getType() == TransactionType.TOP_UP || t.getType() == TransactionType.WITHDRAW).toList(); }
    private String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
