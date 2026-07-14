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
import com.project.app.transaction.dto.response.WithdrawResponse;
import com.project.app.transaction.service.PayOsPayoutService;
import com.project.app.transaction.service.SePayService;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.service.WalletService;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.transaction.repository.SePayTransactionRepository;
import com.project.app.transaction.entity.SePayTransaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    @Value("${sepay.api-key:}")
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

    public TransactionServiceImpl(TransactionRepository transactionRepository, WalletService walletService,
                                  WalletRepository walletRepository,
                                  BankAccountRepository bankAccountRepository, PayOsPayoutService payOsPayoutService,
                                  SePayService sePayService, PasswordEncoder passwordEncoder,
                                  SePayTransactionRepository sePayTransactionRepository, UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.walletRepository = walletRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.payOsPayoutService = payOsPayoutService;
        this.sePayService = sePayService;
        this.passwordEncoder = passwordEncoder;
        this.sePayTransactionRepository = sePayTransactionRepository;
        this.userRepository = userRepository;
    }

    // ====================== NẠP TIỀN ======================
    @Override
    @Transactional
    public TopUpResponse initiateTopUp(User user, TopUpRequest request) {
        Wallet wallet = getWalletForTopUp(user, request.walletId());
        
        // 1. Tạo mới một giao dịch TOP_UP trạng thái PENDING
        String transactionCode = "TX" + System.currentTimeMillis() + java.util.UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setAmount(request.amount());
        transaction.setType(TransactionType.TOP_UP);
        transaction.setStatus(TransactionStatus.PENDING); // Bắt đầu ở trạng thái PENDING
        transaction.setTransactionCode(transactionCode);
        transaction.setNote(request.note() != null && !request.note().isEmpty() ? request.note() : "Nạp tiền vào ví");
        
        // Gán danh mục chi tiêu/thu nhập
        if (request.categoryId() != null) {
            transaction.setCategoryId(request.categoryId());
        }
        
        transactionRepository.save(transaction);

        // 2. Tạo nội dung chuyển khoản và mã QR SePay thực tế
        String transferContent = transactionCode; // Sử dụng mã giao dịch làm nội dung quét QR
        String qrUrl = sePayService.generateVietQrUrl(request.amount(), transactionCode);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15); // Hạn quét QR 15 phút

        return new TopUpResponse(
                transferContent,
                qrUrl,
                expiresAt,
                request.amount(),
                LocalDateTime.now(),
                transactionCode
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

        // Kiểm tra trùng lặp SePay Webhook
        if (sePayTransactionRepository.existsBySepayId(request.getId())) {
            throw new AppException(ErrorCode.DUPLICATE_WEBHOOK);
        }

        String content = request.getContent();
        if (content == null || content.isEmpty()) {
            return;
        }

        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            return; // Chỉ xử lý giao dịch nhận tiền
        }

        // Trường hợp 1: Nội dung chuyển khoản là mã giao dịch (Bắt đầu bằng TX)
        String txCodeMatch = null;
        String[] wordsForTx = content.split("[\\s_\\-]+");
        for (String word : wordsForTx) {
            if (word.toUpperCase().startsWith("TX") && word.length() >= 10) {
                txCodeMatch = word.toUpperCase();
                break;
            }
        }

        if (txCodeMatch != null) {
            Transaction pendingTx = transactionRepository.findByTransactionCode(txCodeMatch).orElse(null);
            if (pendingTx != null && pendingTx.getStatus() == TransactionStatus.PENDING) {
                if (request.getTransferAmount() != null && request.getTransferAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                    // 1. Cập nhật trạng thái PENDING -> SUCCESS
                    pendingTx.setStatus(TransactionStatus.SUCCESS);
                    pendingTx.setAmount(request.getTransferAmount()); // Cập nhật số tiền thực tế nhận được
                    transactionRepository.save(pendingTx);

                    // 2. Cộng tiền vào ví
                    Wallet wallet = pendingTx.getWallet();
                    wallet.setBalance(wallet.getBalance().add(request.getTransferAmount()));
                    walletRepository.save(wallet);

                    // 3. Lưu lại sepay_id
                    SePayTransaction sePayTransaction = new SePayTransaction(request.getId(), pendingTx);
                    sePayTransactionRepository.save(sePayTransaction);
                    return; // Xử lý xong thành công
                }
            }
        }

        // Trường hợp 2: Nội dung chuyển khoản theo cú pháp thủ công "NAP [STK]"
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
            return; // Tiền vào nhưng nội dung ghi sai STK
        }

        if (request.getTransferAmount() != null && request.getTransferAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            
            // 1. Tạo mới một Hóa đơn SUCCESS
            String transactionCode = "TX" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            Transaction transaction = new Transaction();
            transaction.setUser(wallet.getUser());
            transaction.setWallet(wallet);
            transaction.setAmount(request.getTransferAmount());
            transaction.setType(TransactionType.TOP_UP);
            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setTransactionCode(transactionCode);
            transaction.setNote("Nạp tiền vào ví qua SePay (Thủ công)");
            
            transactionRepository.save(transaction);

            // 2. Cộng đúng số tiền thực tế
            wallet.setBalance(wallet.getBalance().add(request.getTransferAmount()));
            walletRepository.save(wallet);

            // 3. Lưu lại sepay_id
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
        transaction.setNote("Rút ti�?n v�? thẻ " + bankAccount.getBankName() + " - " + bankAccount.getAccountNumber());
        
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

    // ====================== HỦY GIAO DỊCH ======================
    @Override
    public void cancelTransaction(String transactionCode, User user) {
        Transaction transaction = getTransactionByCode(transactionCode, user);
        if (transaction.getStatus() == TransactionStatus.PENDING) {
            transaction.setStatus(TransactionStatus.CANCELLED);
            transactionRepository.save(transaction);
        }
    }

    private Wallet getWalletForTopUp(User user, Long walletId) {
        if (walletId == null) {
            return walletService.getDefaultWallet(user.getId());
        }
        return walletService.getWalletById(walletId, user.getId());
    }
}
