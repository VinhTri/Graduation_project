package com.project.app.transaction.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.auth.service.AuthService;
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
import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.service.WalletLimitHelper;
import com.project.app.wallet.service.WalletService;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.repository.WalletTransactionRepository;
import com.project.app.transaction.repository.SePayTransactionRepository;
import com.project.app.transaction.entity.SePayTransaction;
import com.project.app.transaction.enums.SePayMatchStatus;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TransactionServiceImpl implements TransactionService {

    private static final Pattern TOP_UP_CONTENT_PATTERN =
            Pattern.compile("(?i)\\bNAP[\\s_-]+([A-Z0-9]+)\\b");

    @Value("${sepay.api-key}")
    private String sepayApiKey;

    @Value("${sepay.account-no:}")
    private String sepayAccountNo;


    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final PayOsPayoutService payOsPayoutService;
    private final SePayService sePayService;
    private final AuthService authService;
    private final SePayTransactionRepository sePayTransactionRepository;
    private final UserRepository userRepository;
    private final CategoryItemRepository categoryItemRepository;
    private final WalletLimitHelper walletLimitHelper;
    private final NotificationService notificationService;

    public TransactionServiceImpl(TransactionRepository transactionRepository, WalletService walletService,
                                  WalletRepository walletRepository,
                                  WalletTransactionRepository walletTransactionRepository,
                                  BankAccountRepository bankAccountRepository, PayOsPayoutService payOsPayoutService,
                                  SePayService sePayService, AuthService authService,
                                  SePayTransactionRepository sePayTransactionRepository, UserRepository userRepository,
                                  CategoryItemRepository categoryItemRepository,
                                  WalletLimitHelper walletLimitHelper,
                                  NotificationService notificationService) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.walletRepository = walletRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.payOsPayoutService = payOsPayoutService;
        this.sePayService = sePayService;
        this.authService = authService;
        this.sePayTransactionRepository = sePayTransactionRepository;
        this.userRepository = userRepository;
        this.categoryItemRepository = categoryItemRepository;
        this.walletLimitHelper = walletLimitHelper;
        this.notificationService = notificationService;
    }

    // ====================== NẠP TIỀN ======================
    @Override
    @Transactional
    public TopUpResponse initiateTopUp(User user, TopUpRequest request) {
        Wallet wallet = getWalletForTopUp(user, request.walletId());
        if (wallet.getAccountNumber() == null || wallet.getAccountNumber().isBlank()) {
            throw new AppException(ErrorCode.ACCOUNT_NUMBER_NOT_FOUND);
        }
        BigDecimal amount = request.amount();
        if (amount != null && amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        String transactionCode = "TX" + System.currentTimeMillis()
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String transferContent = "NAP " + wallet.getAccountNumber();
        LocalDateTime createdAt = LocalDateTime.now();
        String qrUrl = sePayService.generateVietQrUrl(amount, transferContent);

        return new TopUpResponse(
                transactionCode,
                transferContent,
                qrUrl,
                null,
                amount,
                createdAt
        );
    }

    // ====================== WEBHOOK SEPAY ======================
    @Override
    @Transactional
    public void processSePayWebhook(String apikey, SePayWebhookRequest request) {
        // Validation key
        String actualKey = extractWebhookApiKey(apikey);
        if (!isValidWebhookApiKey(actualKey)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        if (request.getId() == null) {
            return;
        }

        // Kiểm tra trùng lặp SePay Webhook (tránh cộng đúp do lag mạng)
        if (sePayTransactionRepository.existsBySepayId(request.getId())) {
            return;
        }

        SePayTransaction sePayLog = buildSePayLog(request);

        if (sepayAccountNo == null || sepayAccountNo.isBlank()
                || request.getAccountNumber() == null
                || !sepayAccountNo.trim().equals(request.getAccountNumber().trim())) {
            sePayLog.setMatchStatus(SePayMatchStatus.IGNORED);
            sePayLog.setMatchNote("Tài khoản nhận tiền không khớp cấu hình SePay");
            sePayTransactionRepository.save(sePayLog);
            return;
        }

        String content = request.getContent();
        if (content == null || content.isBlank()) {
            sePayLog.setMatchStatus(SePayMatchStatus.UNMATCHED);
            sePayLog.setMatchNote("Webhook thiếu nội dung chuyển khoản");
            sePayTransactionRepository.save(sePayLog);
            return;
        }

        // Nội dung chuyển khoản theo cú pháp "NAP [STK]" -> tìm ví theo số tài khoản
        Matcher contentMatcher = TOP_UP_CONTENT_PATTERN.matcher(content);
        String accountNumber = contentMatcher.find()
                ? contentMatcher.group(1).toUpperCase()
                : null;

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

        // Màn lịch sử ví đọc từ wallet_transactions, vì vậy phải ghi đồng bộ
        // cùng mã giao dịch để người dùng thấy khoản nạp và có thể gắn danh mục sau.
        saveWalletTransaction(
                wallet.getUser(),
                wallet,
                request.getTransferAmount(),
                WalletTransactionType.TOP_UP,
                null,
                transactionCode,
                transaction.getNote());

        // 2. Cộng đúng số tiền thực tế khách đã chuyển vào ví
        wallet.addBalance(request.getTransferAmount());
        walletRepository.save(wallet);

        notificationService.createNotification(
                wallet.getUser(),
                "Nạp tiền thành công",
                "Đã nạp " + request.getTransferAmount().toPlainString() + "đ vào ví qua SePay.",
                NotificationType.TOP_UP_SUCCESS,
                null);

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

    private String extractWebhookApiKey(String authorization) {
        if (authorization == null) return null;
        String trimmed = authorization.trim();
        if (trimmed.regionMatches(true, 0, "Apikey ", 0, 7)
                || trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return trimmed.substring(7).trim();
        }
        return trimmed;
    }

    private boolean isValidWebhookApiKey(String actualKey) {
        if (sepayApiKey == null || sepayApiKey.isBlank() || actualKey == null || actualKey.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                sepayApiKey.getBytes(StandardCharsets.UTF_8),
                actualKey.getBytes(StandardCharsets.UTF_8));
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
        Transaction transaction = transactionRepository.findByTransactionCode(transactionCode).orElse(null);
        WalletTransaction walletTx = walletTransactionRepository
                .findByTransactionCodeAndUser_Id(transactionCode, user.getId())
                .orElse(null);

        if (transaction == null && walletTx == null) {
            throw new AppException(ErrorCode.INVALID_TRANSACTION);
        }
        if (transaction != null && !transaction.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        CategoryItem category = null;
        if (request.getCategoryId() != null) {
            category = categoryItemRepository.findByIdAndIsDeletedFalse(request.getCategoryId())
                    .filter(item -> item.getUser() != null && item.getUser().getId().equals(user.getId()))
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));
        }

        if (transaction != null) {
            if (request.getNote() != null) {
                transaction.setNote(request.getNote());
            }
            if (category != null) {
                transaction.setCategoryId(category.getId());
            }
            transaction = transactionRepository.save(transaction);
        }

        if (walletTx != null) {
            if (request.getNote() != null) {
                walletTx.setNote(request.getNote());
            }
            if (category != null) {
                walletTx.setCategoryId(category.getId());
                walletTx.setCategoryName(category.getLabel());
            }
            walletTransactionRepository.save(walletTx);
        }

        if (transaction != null) {
            return transaction;
        }

        // Wallet-only (vd. rút về ngân hàng): trả Transaction ảo để controller giữ contract
        Transaction shadow = new Transaction();
        shadow.setTransactionCode(walletTx.getTransactionCode());
        shadow.setStatus(TransactionStatus.SUCCESS);
        shadow.setType(walletTx.getType() == WalletTransactionType.TOP_UP
                ? TransactionType.TOP_UP
                : TransactionType.WITHDRAW);
        shadow.setAmount(walletTx.getAmount());
        shadow.setCreatedAt(walletTx.getCreatedAt());
        shadow.setUser(user);
        return shadow;
    }

    
    // ====================== CHUYỂN TIỀN NỘI BỘ ======================
    @Override
    @Transactional
    public TransferResponse processTransfer(User user, TransferRequest request) {
        if (user.getPinCode() == null || user.getPinCode().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        if (!authService.verifyPinCode(user.getId(), request.getPinCode())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        // Khóa ví người gửi để kiểm tra số dư và hạn mức ngày trên cùng một trạng thái.
        // Việc này ngăn hai lệnh chuyển/rút đồng thời cùng vượt qua hạn mức.
        Wallet senderWallet = walletRepository.findDefaultWalletForUpdate(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        Wallet receiverWallet = walletRepository.findByAccountNumber(request.getReceiverAccountNumber())
                .orElseThrow(() -> new AppException(ErrorCode.RECEIVER_NOT_FOUND));

        if (senderWallet.getId().equals(receiverWallet.getId())) {
            throw new AppException(ErrorCode.CANNOT_TRANSFER_SELF);
        }

        if (senderWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
        
        walletLimitHelper.enforceOutgoingLimits(user.getId(), senderWallet, request.getAmount());

        String senderTxCode = "TF_OUT_" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String receiverTxCode = "TF_IN_" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        String senderNote = buildWalletNote(
                "Chuyển tiền đến \"" + receiverWallet.getUser().getUsername() + "\"",
                request.getNote());
        String receiverNote = "Nhận chuyển tiền từ \"" + user.getUsername() + "\"";

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
        senderTx.setNote(senderNote);
        senderTx.setCategoryId(null);
        transactionRepository.save(senderTx);
        saveWalletTransaction(
                user, senderWallet, request.getAmount(), WalletTransactionType.WITHDRAW,
                null, senderTxCode, senderNote);

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
        receiverTx.setNote(receiverNote);
        receiverTx.setCategoryId(null);
        transactionRepository.save(receiverTx);
        saveWalletTransaction(
                receiverWallet.getUser(), receiverWallet, request.getAmount(), WalletTransactionType.TOP_UP,
                null, receiverTxCode, receiverNote);

        notificationService.createNotification(
                receiverWallet.getUser(),
                "Bạn vừa nhận được tiền",
                user.getUsername() + " đã chuyển cho bạn " + request.getAmount().toPlainString() + "đ.",
                NotificationType.TRANSFER_RECEIVED,
                null);

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
        if (user.getPinCode() == null || user.getPinCode().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        if (!authService.verifyPinCode(user.getId(), request.getPinCode())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        BankAccount bankAccount = bankAccountRepository.findByIdAndUserId(request.getBankAccountId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));

        Wallet wallet = walletRepository.findDefaultWalletForUpdate(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
        
        checkTransactionLimits(wallet, request.getAmount());

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
                    request.getAmount().longValueExact(),
                    "Rut tien SmartSpend",
                    transactionCode
            );

            wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
            walletRepository.save(wallet);

            transaction.setStatus(TransactionStatus.SUCCESS);
            transactionRepository.save(transaction);

            notificationService.createNotification(
                    user,
                    "Rút tiền thành công",
                    "Đã rút " + request.getAmount().toPlainString() + "đ về " + bankAccount.getBankName() + ".",
                    NotificationType.WITHDRAW_SUCCESS,
                    null);

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

    // ====================== GIAO DỊCH THỦ CÔNG SỔ TAY NGÂN HÀNG ======================
    @Override
    @Transactional
    public ManualTransactionResponse createManualTransaction(User user, ManualTransactionRequest request) {
        TransactionType type = request.type();
        if (type != TransactionType.EXPENSE && type != TransactionType.INCOME) {
            throw new AppException(ErrorCode.INVALID_MANUAL_TRANSACTION_TYPE);
        }

        if (request.walletId() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Vui lòng chọn sổ tay ngân hàng");
        }

        CategoryItem category = categoryItemRepository.findById(request.categoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));

        if (category.getUser() == null || !category.getUser().getId().equals(user.getId()) || category.isDeleted()) {
            throw new AppException(ErrorCode.CATEGORY_INVALID_FOR_NOTEBOOK);
        }

        Wallet targetWallet = walletService.getWalletById(request.walletId(), user.getId());
        if (targetWallet.getWalletType() != WalletType.MANUAL && targetWallet.getWalletType() != WalletType.LINKED) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Chỉ ghi chép trên sổ tay ngân hàng");
        }

        BigDecimal amount = request.amount();

        if (type == TransactionType.EXPENSE) {
            if (targetWallet.getBalance().compareTo(amount) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
            }
            checkTransactionLimits(targetWallet, amount);
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
            throw new AppException(ErrorCode.CATEGORY_INVALID_FOR_NOTEBOOK);
        }

        BigDecimal newAmount = request.amount();

        // Apply new transaction impact
        if (newType == TransactionType.EXPENSE) {
            if (wallet.getBalance().compareTo(newAmount) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
            }
            checkTransactionLimits(wallet, newAmount);
            wallet.setBalance(wallet.getBalance().subtract(newAmount));
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

    private void checkTransactionLimits(Wallet wallet, BigDecimal amount) {
        walletLimitHelper.enforceOutgoingLimits(wallet.getUser().getId(), wallet, amount);
    }

    private String trimNote(String note) {
        if (note == null) return null;
        String trimmed = note.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildWalletNote(String prefix, String userNote) {
        String trimmed = trimNote(userNote);
        return trimmed == null ? prefix : prefix + " — " + trimmed;
    }

    private void saveWalletTransaction(
            User user,
            Wallet wallet,
            BigDecimal amount,
            WalletTransactionType type,
            CategoryItem category,
            String transactionCode,
            String note
    ) {
        walletTransactionRepository.save(WalletTransaction.builder()
                .user(user)
                .wallet(wallet)
                .amount(amount)
                .type(type)
                .note(note)
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getLabel() : null)
                .transactionCode(transactionCode)
                .build());
    }
}
