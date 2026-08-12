package com.project.app.transaction.service.impl;

import com.project.app.budget.entity.BudgetPeriod;
import com.project.app.budget.repository.BudgetPeriodRepository;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.dto.request.SePayWebhookRequest;
import com.project.app.transaction.dto.request.TopUpRequest;
import com.project.app.transaction.dto.response.TopUpResponse;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.transaction.service.TransactionService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.budget.entity.Budget;
import com.project.app.budget.repository.BudgetRepository;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.service.NotificationService;
import com.project.app.transaction.dto.request.WithdrawRequest;
import com.project.app.transaction.dto.request.TransferRequest;
import com.project.app.transaction.dto.response.TransferResponse;
import com.project.app.transaction.dto.request.ManualTransactionRequest;
import com.project.app.transaction.dto.response.WithdrawResponse;
import com.project.app.transaction.dto.response.ManualTransactionResponse;
import com.project.app.transaction.service.PayOsPayoutService;
import com.project.app.transaction.service.SePayService;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.service.WalletService;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.transaction.repository.SePayTransactionRepository;
import com.project.app.transaction.entity.SePayTransaction;
import com.project.app.transaction.enums.SePayMatchStatus;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    @Value("${sepay.api-key}")
    private String sepayApiKey;


    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PayOsPayoutService payOsPayoutService;
    private final SePayService sePayService;
    private final PasswordEncoder passwordEncoder;
    private final SePayTransactionRepository sePayTransactionRepository;
    private final UserRepository userRepository;
    private final CategoryItemRepository categoryItemRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetPeriodRepository budgetPeriodRepository;
    private final NotificationService notificationService;

    public TransactionServiceImpl(TransactionRepository transactionRepository, WalletService walletService,
                                  WalletRepository walletRepository,
                                  BankAccountRepository bankAccountRepository, PayOsPayoutService payOsPayoutService,
                                  SePayService sePayService, PasswordEncoder passwordEncoder,
                                  SePayTransactionRepository sePayTransactionRepository, UserRepository userRepository,
                                  CategoryItemRepository categoryItemRepository,
                                  BudgetRepository budgetRepository,
                                  BudgetPeriodRepository budgetPeriodRepository,
                                  NotificationService notificationService) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.walletRepository = walletRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.payOsPayoutService = payOsPayoutService;
        this.sePayService = sePayService;
        this.passwordEncoder = passwordEncoder;
        this.sePayTransactionRepository = sePayTransactionRepository;
        this.userRepository = userRepository;
        this.categoryItemRepository = categoryItemRepository;
        this.budgetRepository = budgetRepository;
        this.budgetPeriodRepository = budgetPeriodRepository;
        this.notificationService = notificationService;
    }

    // ====================== NẠP TIỀN ======================
    @Override
    @Transactional
    public TopUpResponse initiateTopUp(User user, TopUpRequest request) {
        Wallet wallet = getWalletForTopUp(user, request.walletId());

        if (wallet.getAccountNumber() == null || wallet.getAccountNumber().isEmpty()) {
            throw new AppException(ErrorCode.ACCOUNT_NUMBER_NOT_FOUND);
        }

        // Mô hình QR tĩnh: nội dung chuyển khoản cố định theo số tài khoản của ví.
        String transferContent = "NAP " + wallet.getAccountNumber();
        String qrUrl = sePayService.generateVietQrUrl(request.amount(), transferContent);
        LocalDateTime expiresAt = LocalDateTime.now().plusYears(100);

        return new TopUpResponse(
                transferContent,
                qrUrl,
                expiresAt,
                request.amount(),
                LocalDateTime.now()
        );
    }

    // ====================== WEBHOOK SEPAY ======================
    @Override
    @Transactional
    public void processSePayWebhook(String apikey, SePayWebhookRequest request) {
        // Validation key
        String actualKey = apikey;
        if (actualKey != null && actualKey.startsWith("Apikey ")) {
            actualKey = actualKey.substring(7);
        } else if (actualKey != null && actualKey.startsWith("Bearer ")) {
            actualKey = actualKey.substring(7);
        }

        if (sepayApiKey == null || !sepayApiKey.equals(actualKey)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        if (request.getId() == null) {
            return;
        }

        // Kiểm tra trùng lặp SePay Webhook (tránh cộng đúp do lag mạng)
        if (sePayTransactionRepository.existsBySepayId(request.getId())) {
            throw new AppException(ErrorCode.DUPLICATE_WEBHOOK);
        }

        SePayTransaction sePayLog = buildSePayLog(request);

        String content = request.getContent();
        if (content == null || content.isBlank()) {
            sePayLog.setMatchStatus(SePayMatchStatus.UNMATCHED);
            sePayLog.setMatchNote("Webhook thiếu nội dung chuyển khoản");
            sePayTransactionRepository.save(sePayLog);
            return;
        }

        // Nội dung chuyển khoản theo cú pháp "NAP [STK]" -> tìm ví theo số tài khoản
        String accountNumber = null;
        String[] words = content.split("[\\s_\\-]+");
        for (int i = 0; i < words.length; i++) {
            if (words[i].toUpperCase().equals("NAP") && i + 1 < words.length) {
                accountNumber = words[i + 1].toUpperCase();
                break;
            }
        }

        sePayLog.setParsedWalletAccount(accountNumber);

        if (accountNumber == null) {
            sePayLog.setMatchStatus(SePayMatchStatus.UNMATCHED);
            sePayLog.setMatchNote("Không parse được cú pháp NAP [STK] từ nội dung");
            sePayTransactionRepository.save(sePayLog);
            return;
        }

        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            sePayLog.setMatchStatus(SePayMatchStatus.IGNORED);
            sePayLog.setMatchNote("Bỏ qua vì không phải giao dịch nhận tiền (transferType != in)");
            sePayTransactionRepository.save(sePayLog);
            return;
        }

        Wallet wallet = walletRepository.findByAccountNumber(accountNumber).orElse(null);
        if (wallet == null) {
            // Tiền vào ngân hàng nhưng hệ thống chưa cộng ví — ghi UNMATCHED để Admin đối soát
            sePayLog.setMatchStatus(SePayMatchStatus.UNMATCHED);
            sePayLog.setMatchNote("Không tìm thấy ví với STK: " + accountNumber);
            sePayTransactionRepository.save(sePayLog);
            return;
        }

        if (request.getTransferAmount() == null || request.getTransferAmount().compareTo(BigDecimal.ZERO) <= 0) {
            sePayLog.setMatchStatus(SePayMatchStatus.IGNORED);
            sePayLog.setMatchNote("Số tiền không hợp lệ");
            sePayTransactionRepository.save(sePayLog);
            return;
        }

        // 1. Tạo mới một giao dịch SUCCESS để lưu lịch sử
        String transactionCode = "TX" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Transaction transaction = new Transaction();
        transaction.setUser(wallet.getUser());
        transaction.setWallet(wallet);
        transaction.setAmount(request.getTransferAmount());
        transaction.setType(TransactionType.TOP_UP);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setTransactionCode(transactionCode);
        transaction.setNote("Nạp tiền vào ví qua SePay");

        transactionRepository.save(transaction);

        // 2. Cộng đúng số tiền thực tế khách đã chuyển vào ví
        wallet.addBalance(request.getTransferAmount());
        walletRepository.save(wallet);

        // 3. Lưu log SePay đã khớp với Transaction nội bộ
        sePayLog.setTransaction(transaction);
        sePayLog.setMatchStatus(SePayMatchStatus.MATCHED);
        sePayLog.setMatchNote("Đã cộng tiền vào ví và tạo Transaction nội bộ");
        sePayTransactionRepository.save(sePayLog);
    }

    private SePayTransaction buildSePayLog(SePayWebhookRequest request) {
        SePayTransaction log = new SePayTransaction();
        log.setSepayId(request.getId());
        log.setGateway(request.getGateway());
        log.setTransactionDate(request.getTransactionDate());
        log.setAccountNumber(request.getAccountNumber());
        log.setContent(request.getContent());
        log.setTransferType(request.getTransferType());
        log.setTransferAmount(request.getTransferAmount());
        log.setReferenceCode(request.getReferenceCode());
        log.setMatchStatus(SePayMatchStatus.UNMATCHED);
        return log;
    }

    // ====================== TRA CỨU GIAO DỊCH ======================
    @Override
    public Transaction getTransactionByCode(String transactionCode, User user) {
        Transaction transaction = transactionRepository.findByTransactionCode(transactionCode)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TRANSACTION));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        return transaction;
    }

    // ====================== CẬP NHẬT GIAO DỊCH (GHI CHÚ, DANH MỤC) ======================
    @Override
    @Transactional
    public Transaction updateTransaction(String transactionCode, User user, com.project.app.transaction.dto.request.UpdateTransactionRequest request) {
        Transaction transaction = getTransactionByCode(transactionCode, user);

        Long oldCategoryId = transaction.getCategoryId();

        if (request.getNote() != null) {
            transaction.setNote(request.getNote());
        }
        if (request.getCategoryId() != null && !request.getCategoryId().equals(oldCategoryId)) {
            transaction.setCategoryId(request.getCategoryId());

            if (transaction.getType() == TransactionType.EXPENSE) {
                Long walletId = transaction.getWallet() != null ? transaction.getWallet().getId() : null;
                LocalDate date = transaction.getCreatedAt() != null ? transaction.getCreatedAt().toLocalDate() : LocalDate.now();

                // Trừ tiền khỏi ngân sách danh mục cũ
                if (oldCategoryId != null) {
                    adjustBudgetForExpense(user, oldCategoryId, walletId, transaction.getAmount().negate(), date);
                }
                // Cộng tiền vào ngân sách danh mục mới
                adjustBudgetForExpense(user, request.getCategoryId(), walletId, transaction.getAmount(), date);
            }
        }

        return transactionRepository.save(transaction);
    }

    
    // ====================== CHUYỂN TIỀN NỘI BỘ ======================
    @Override
    @Transactional
    public TransferResponse processTransfer(User user, TransferRequest request) {
        if (user.isLocked()) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }

        if (user.getPinCode() == null || user.getPinCode().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        if (!passwordEncoder.matches(request.getPinCode(), user.getPinCode())) {
            user.incrementFailedPin();
            if (user.getFailedPinAttempts() >= 5) {
                user.setLockoutTime(LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);

            if (user.isLocked()) {
                throw new AppException(ErrorCode.ACCOUNT_LOCKED);
            }
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        user.resetFailedPin();
        userRepository.save(user);

        Wallet senderWallet = walletService.getDefaultWallet(user.getId());

        Wallet receiverWallet = walletRepository.findByAccountNumber(request.getReceiverAccountNumber())
                .orElseThrow(() -> new AppException(ErrorCode.RECEIVER_NOT_FOUND));

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new AppException(ErrorCode.CANNOT_TRANSFER_SELF);
        }

        if (senderWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        String senderTxCode = "TF_OUT_" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String receiverTxCode = "TF_IN_" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        // 1. Trừ tiền người gửi
        senderWallet.setBalance(senderWallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(senderWallet);

        Transaction senderTx = new Transaction();
        senderTx.setUser(user);
        senderTx.setWallet(senderWallet);
        senderTx.setAmount(request.getAmount());
        senderTx.setType(TransactionType.TRANSFER);
        senderTx.setStatus(TransactionStatus.SUCCESS);
        senderTx.setTransactionCode(senderTxCode);
        senderTx.setNote(request.getNote() != null && !request.getNote().trim().isEmpty() 
            ? request.getNote().trim() 
            : "Chuyển tiền đến " + receiverWallet.getUser().getUsername());
        if (request.getCategoryId() != null) {
            senderTx.setCategoryId(request.getCategoryId());
            // Adjust budget for transfer if category is selected
            adjustBudgetForExpense(user, request.getCategoryId(), senderWallet.getId(), request.getAmount(), LocalDate.now());
        }
        transactionRepository.save(senderTx);

        // 2. Cộng tiền người nhận
        receiverWallet.setBalance(receiverWallet.getBalance().add(request.getAmount()));
        walletRepository.save(receiverWallet);

        Transaction receiverTx = new Transaction();
        receiverTx.setUser(receiverWallet.getUser());
        receiverTx.setWallet(receiverWallet);
        receiverTx.setAmount(request.getAmount());
        receiverTx.setType(TransactionType.RECEIVE_TRANSFER);
        receiverTx.setStatus(TransactionStatus.SUCCESS);
        receiverTx.setTransactionCode(receiverTxCode);
        receiverTx.setNote(request.getNote() != null && !request.getNote().trim().isEmpty() 
            ? request.getNote().trim() 
            : "Nhận tiền từ " + user.getUsername());
        transactionRepository.save(receiverTx);

        return new TransferResponse(
                senderTxCode,
                senderTx.getStatus(),
                senderTx.getAmount(),
                receiverWallet.getUser().getUsername(),
                senderTx.getCreatedAt()
        );
    }

    // ====================== RÚT TIỀN ======================
    @Override
    @Transactional
    public WithdrawResponse processWithdrawal(User user, WithdrawRequest request) {
        if (user.isLocked()) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }

        if (user.getPinCode() == null || user.getPinCode().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        if (!passwordEncoder.matches(request.getPinCode(), user.getPinCode())) {
            user.incrementFailedPin();
            if (user.getFailedPinAttempts() >= 5) {
                user.setLockoutTime(LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);

            if (user.isLocked()) {
                throw new AppException(ErrorCode.ACCOUNT_LOCKED);
            }
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        user.resetFailedPin();
        userRepository.save(user);

        BankAccount bankAccount = bankAccountRepository.findByIdAndUserId(request.getBankAccountId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));

        Wallet wallet = walletService.getDefaultWallet(user.getId());

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        String transactionCode = "WD" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.WITHDRAW);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setTransactionCode(transactionCode);

        String defaultNote = "Rút tiền về " + bankAccount.getBankName() + " - " + bankAccount.getAccountNumber();
        if (request.getNote() != null && !request.getNote().trim().isEmpty()) {
            transaction.setNote(request.getNote().trim());
        } else {
            transaction.setNote(defaultNote);
        }
        if (request.getCategoryId() != null) {
            transaction.setCategoryId(request.getCategoryId());
        }

        transaction = transactionRepository.save(transaction);

        try {
            payOsPayoutService.createPayout(
                    bankAccount.getBankCode(),
                    bankAccount.getAccountNumber(),
                    bankAccount.getAccountName(),
                    request.getAmount().intValue(),
                    "Rut tien SmartSpend",
                    transactionCode
            );

            wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
            walletRepository.save(wallet);

            transaction.setStatus(TransactionStatus.SUCCESS);
            transactionRepository.save(transaction);

        } catch (Exception e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setNote(transaction.getNote() + " (Lỗi: " + e.getMessage() + ")");
            transactionRepository.save(transaction);
            throw new AppException(ErrorCode.WITHDRAW_FAILED);
        }

        return new WithdrawResponse(
                transactionCode,
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getCreatedAt()
        );
    }

    // ====================== GIAO DỊCH THỦ CÔNG TIỀN MẶT / NGÂN HÀNG (SỔ TAY) ======================
    @Override
    @Transactional
    public ManualTransactionResponse createManualTransaction(User user, ManualTransactionRequest request) {
        TransactionType type = request.type();
        if (type != TransactionType.EXPENSE && type != TransactionType.INCOME) {
            throw new AppException(ErrorCode.INVALID_MANUAL_TRANSACTION_TYPE);
        }

        CategoryItem category = categoryItemRepository.findById(request.categoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));

        // Chỉ chấp nhận danh mục của user (không dùng danh mục hệ thống quỹ)
        if (category.getUser() == null || !category.getUser().getId().equals(user.getId()) || category.isDeleted()) {
            throw new AppException(ErrorCode.CATEGORY_INVALID_FOR_CASH);
        }

        Wallet targetWallet;
        if (request.walletId() != null) {
            targetWallet = walletService.getWalletById(request.walletId(), user.getId());
        } else {
            targetWallet = walletService.getOrCreateCashWallet(user.getId());
        }

        BigDecimal amount = request.amount();

        if (type == TransactionType.EXPENSE) {
            if (targetWallet.getBalance().compareTo(amount) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
            }
            targetWallet.setBalance(targetWallet.getBalance().subtract(amount));
        } else {
            targetWallet.setBalance(targetWallet.getBalance().add(amount));
        }
        walletRepository.save(targetWallet);

        String transactionCode = "MANUAL" + System.currentTimeMillis()
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(targetWallet);
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setTransactionCode(transactionCode);
        transaction.setNote(request.note());
        transaction.setCategoryId(category.getId());
        if (request.createdAt() != null) {
            transaction.setCreatedAt(request.createdAt());
        }
        transaction = transactionRepository.save(transaction);

        if (type == TransactionType.EXPENSE) {
            LocalDate expenseDate = request.createdAt() != null ? request.createdAt().toLocalDate() : LocalDate.now();
            adjustBudgetForExpense(user, category.getId(), targetWallet.getId(), amount, expenseDate);
        }

        return new ManualTransactionResponse(
                transaction.getTransactionCode(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getCategoryId(),
                transaction.getNote(),
                targetWallet.getBalance(),
                transaction.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public ManualTransactionResponse updateManualTransaction(String transactionCode, User user, ManualTransactionRequest request) {
        Transaction transaction = getTransactionByCode(transactionCode, user);

        if (transaction.getType() != TransactionType.EXPENSE && transaction.getType() != TransactionType.INCOME) {
            throw new AppException(ErrorCode.INVALID_TRANSACTION);
        }
        
        Wallet wallet = transaction.getWallet();
        
        // Reverse old transaction impact
        if (transaction.getType() == TransactionType.EXPENSE) {
            wallet.setBalance(wallet.getBalance().add(transaction.getAmount()));
            adjustBudgetForExpense(user, transaction.getCategoryId(), wallet.getId(), transaction.getAmount().negate(), transaction.getCreatedAt().toLocalDate());
        } else {
            wallet.setBalance(wallet.getBalance().subtract(transaction.getAmount()));
        }

        TransactionType newType = request.type();
        if (newType != TransactionType.EXPENSE && newType != TransactionType.INCOME) {
            throw new AppException(ErrorCode.INVALID_MANUAL_TRANSACTION_TYPE);
        }

        CategoryItem category = categoryItemRepository.findById(request.categoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));

        boolean isSameCategory = category.getId().equals(transaction.getCategoryId());
        if (category.getUser() == null || !category.getUser().getId().equals(user.getId()) || (category.isDeleted() && !isSameCategory)) {
            throw new AppException(ErrorCode.CATEGORY_INVALID_FOR_CASH);
        }

        BigDecimal newAmount = request.amount();

        // Apply new transaction impact
        if (newType == TransactionType.EXPENSE) {
            if (wallet.getBalance().compareTo(newAmount) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
            }
            wallet.setBalance(wallet.getBalance().subtract(newAmount));
            adjustBudgetForExpense(user, category.getId(), wallet.getId(), newAmount, transaction.getCreatedAt().toLocalDate());
        } else {
            wallet.setBalance(wallet.getBalance().add(newAmount));
        }

        walletRepository.save(wallet);

        transaction.setAmount(newAmount);
        transaction.setType(newType);
        transaction.setCategoryId(category.getId());
        transaction.setNote(request.note());
        if (request.createdAt() != null) {
            transaction.setCreatedAt(request.createdAt());
        }
        
        transaction = transactionRepository.save(transaction);

        return new ManualTransactionResponse(
                transaction.getTransactionCode(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getCategoryId(),
                transaction.getNote(),
                wallet.getBalance(),
                transaction.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void deleteManualTransaction(String transactionCode, User user) {
        Transaction transaction = getTransactionByCode(transactionCode, user);

        if (transaction.getType() != TransactionType.EXPENSE && transaction.getType() != TransactionType.INCOME) {
            throw new AppException(ErrorCode.INVALID_TRANSACTION);
        }

        Wallet wallet = transaction.getWallet();
        if (transaction.getType() == TransactionType.EXPENSE) {
            wallet.setBalance(wallet.getBalance().add(transaction.getAmount()));
            adjustBudgetForExpense(user, transaction.getCategoryId(), wallet.getId(), transaction.getAmount().negate(), transaction.getCreatedAt().toLocalDate());
        } else {
            wallet.setBalance(wallet.getBalance().subtract(transaction.getAmount()));
        }
        
        walletRepository.save(wallet);
        transactionRepository.delete(transaction);
    }

    private Wallet getWalletForTopUp(User user, Long walletId) {
        if (walletId == null) {
            return walletService.getDefaultWallet(user.getId());
        }
        return walletService.getWalletById(walletId, user.getId());
    }

    private void adjustBudgetForExpense(User user, Long categoryId, Long walletId, BigDecimal amountDelta, LocalDate date) {
        if (categoryId == null || amountDelta.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }

        java.util.List<BudgetPeriod> activePeriods = budgetPeriodRepository.findActivePeriodsForTransaction(
                user.getId(), categoryId, walletId, date != null ? date : LocalDate.now());

        for (BudgetPeriod period : activePeriods) {
            BigDecimal newSpent = period.getSpentAmount().add(amountDelta);
            if (newSpent.compareTo(BigDecimal.ZERO) < 0) {
                newSpent = BigDecimal.ZERO;
            }
            period.setSpentAmount(newSpent);

            Budget budget = period.getBudget();
            BigDecimal eightyPercent = budget.getAmount().multiply(new BigDecimal("0.8"));

            if (period.getSpentAmount().compareTo(budget.getAmount()) >= 0 && !period.isNotified100()) {
                period.setNotified100(true);
                notificationService.createNotification(
                        user,
                        "Vượt hạn mức ngân sách!",
                        "Bạn đã vượt 100% hạn mức ngân sách cho danh mục " + budget.getCategory().getLabel(),
                        NotificationType.BUDGET_EXCEEDED,
                        budget.getId()
                );
            } else if (period.getSpentAmount().compareTo(eightyPercent) >= 0 && !period.isNotified80()) {
                period.setNotified80(true);
                notificationService.createNotification(
                        user,
                        "Sắp vượt hạn mức ngân sách!",
                        "Bạn đã sử dụng " + (period.getSpentAmount().multiply(new BigDecimal("100")).divide(budget.getAmount(), java.math.RoundingMode.HALF_UP)) + "% ngân sách cho danh mục " + budget.getCategory().getLabel(),
                        NotificationType.BUDGET_WARNING,
                        budget.getId()
                );
            }
        }
        if (!activePeriods.isEmpty()) {
            budgetPeriodRepository.saveAll(activePeriods);
        }
    }
}
