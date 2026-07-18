package com.project.app.transaction.service.impl;

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
import com.project.app.transaction.dto.request.WithdrawRequest;
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
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    public TransactionServiceImpl(TransactionRepository transactionRepository, WalletService walletService,
                                  WalletRepository walletRepository,
                                  BankAccountRepository bankAccountRepository, PayOsPayoutService payOsPayoutService,
                                  SePayService sePayService, PasswordEncoder passwordEncoder,
                                  SePayTransactionRepository sePayTransactionRepository, UserRepository userRepository,
                                  CategoryItemRepository categoryItemRepository) {
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

        // Kiểm tra trùng lặp SePay Webhook (tránh cộng đúp do lag mạng)
        if (sePayTransactionRepository.existsBySepayId(request.getId())) {
            throw new AppException(ErrorCode.DUPLICATE_WEBHOOK);
        }

        String content = request.getContent();
        if (content == null || content.isEmpty()) {
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

        if (accountNumber == null) {
            return;
        }

        Wallet wallet = walletRepository.findByAccountNumber(accountNumber).orElse(null);
        if (wallet == null) {
            return; // Tiền vào nhưng nội dung ghi sai STK, không tìm thấy ví
        }

        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            return; // Chỉ xử lý giao dịch nhận tiền (cộng tiền vào ví)
        }

        if (request.getTransferAmount() != null && request.getTransferAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {

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

            // 3. Lưu lại sepay_id để đánh dấu là đã xử lý
            SePayTransaction sePayTransaction = new SePayTransaction(request.getId(), transaction);
            sePayTransactionRepository.save(sePayTransaction);
        }
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

    // ====================== C?P NH?T GIAO D?CH (GHI CH�, DANH M?C) ======================
    @Override
    @Transactional
    public Transaction updateTransaction(String transactionCode, User user, com.project.app.transaction.dto.request.UpdateTransactionRequest request) {
        Transaction transaction = getTransactionByCode(transactionCode, user);
        
        if (request.getNote() != null) {
            transaction.setNote(request.getNote());
        }
        if (request.getCategoryId() != null) {
            transaction.setCategoryId(request.getCategoryId());
        }
        
        return transactionRepository.save(transaction);
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

    // ====================== GIAO DỊCH THỦ CÔNG TIỀN MẶT (SỔ TAY) ======================
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

        Wallet cashWallet = walletService.getOrCreateCashWallet(user.getId());
        BigDecimal amount = request.amount();

        if (type == TransactionType.EXPENSE) {
            if (cashWallet.getBalance().compareTo(amount) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
            }
            cashWallet.setBalance(cashWallet.getBalance().subtract(amount));
        } else {
            cashWallet.setBalance(cashWallet.getBalance().add(amount));
        }
        walletRepository.save(cashWallet);

        String transactionCode = "CASH" + System.currentTimeMillis()
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(cashWallet);
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setTransactionCode(transactionCode);
        transaction.setNote(request.note());
        transaction.setCategoryId(category.getId());
        transaction = transactionRepository.save(transaction);

        return new ManualTransactionResponse(
                transaction.getTransactionCode(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getCategoryId(),
                transaction.getNote(),
                cashWallet.getBalance(),
                transaction.getCreatedAt()
        );
    }

    private Wallet getWalletForTopUp(User user, Long walletId) {
        if (walletId == null) {
            return walletService.getDefaultWallet(user.getId());
        }
        return walletService.getWalletById(walletId, user.getId());
    }
}
