package com.project.app.transaction.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.dto.request.SePayWebhookRequest;
import com.project.app.transaction.dto.request.TopUpRequest;
import com.project.app.transaction.dto.response.TopUpResponse;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.entity.TransactionStatus;
import com.project.app.transaction.entity.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.transaction.service.TransactionService;
import com.project.app.user.entity.User;
import com.project.app.transaction.dto.request.WithdrawRequest;
import com.project.app.transaction.dto.response.WithdrawResponse;
import com.project.app.transaction.service.PayOsPayoutService;
import com.project.app.transaction.service.SePayService;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final BankAccountRepository bankAccountRepository;
    private final PayOsPayoutService payOsPayoutService;
    private final SePayService sePayService;
    private final PasswordEncoder passwordEncoder;

    public TransactionServiceImpl(TransactionRepository transactionRepository, WalletService walletService,
                                  BankAccountRepository bankAccountRepository, PayOsPayoutService payOsPayoutService,
                                  SePayService sePayService, PasswordEncoder passwordEncoder) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.bankAccountRepository = bankAccountRepository;
        this.payOsPayoutService = payOsPayoutService;
        this.sePayService = sePayService;
        this.passwordEncoder = passwordEncoder;
    }

    // ====================== NẠP TIỀN ======================
    @Override
    @Transactional
    public TopUpResponse initiateTopUp(User user, TopUpRequest request) {
        Wallet wallet;
        if (request.getWalletId() != null) {
            wallet = walletService.getWalletById(request.getWalletId(), user.getId());
        } else {
            wallet = walletService.getDefaultWallet(user.getId());
        }

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.TOP_UP);
        transaction.setStatus(TransactionStatus.PENDING);
        
        // Tạo mã giao dịch duy nhất
        String transactionCode = "TX" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        transaction.setTransactionCode(transactionCode);
        
        transaction.setNote(request.getNote());
        transaction.setCategoryId(request.getCategoryId());

        transaction = transactionRepository.save(transaction);

        // Tạo link VietQR nạp tiền qua SePay
        String qrUrl = sePayService.generateVietQrUrl(transaction.getAmount(), transactionCode);
        
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        return new TopUpResponse(
                transactionCode,
                qrUrl,
                expiresAt,
                transaction.getAmount(),
                transaction.getCreatedAt()
        );
    }

    // ====================== WEBHOOK SEPAY ======================
    @Override
    @Transactional
    public void processSePayWebhook(SePayWebhookRequest request) {
        String content = request.getContent();
        if (content == null || content.isEmpty()) {
            return;
        }

        // Trích xuất mã giao dịch (bắt đầu bằng TX) từ nội dung
        String transactionCode = null;
        String[] words = content.split("[\\s_\\-]+"); // Tách chuỗi theo khoảng trắng, dấu gạch dưới hoặc gạch ngang
        for (String word : words) {
            if (word.toUpperCase().startsWith("TX")) {
                transactionCode = word.toUpperCase();
                break;
            }
        }

        if (transactionCode == null) {
            return;
        }

        Transaction transaction = transactionRepository.findByTransactionCode(transactionCode)
                .orElse(null);

        if (transaction == null || transaction.getStatus() != TransactionStatus.PENDING || transaction.getType() != TransactionType.TOP_UP) {
            return; // Bỏ qua nếu không tìm thấy giao dịch hoặc không ở trạng thái PENDING
        }

        // Xác minh số tiền
        if (request.getTransferAmount() != null && request.getTransferAmount().compareTo(transaction.getAmount()) >= 0) {
            // Thành công
            transaction.setStatus(TransactionStatus.SUCCESS);
            transactionRepository.save(transaction);

            // Cộng tiền vào số dư
            walletService.addBalance(transaction.getWallet().getId(), transaction.getAmount());
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

    // ====================== RÚT TIỀN ======================
    @Override
    @Transactional
    public WithdrawResponse processWithdrawal(User user, WithdrawRequest request) {
        // Kiểm tra mã PIN
        if (user.getPinCode() == null || user.getPinCode().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PIN); // Cần thiết lập PIN trước
        }
        if (!passwordEncoder.matches(request.getPinCode(), user.getPinCode())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        // Tìm thông tin tài khoản ngân hàng
        BankAccount bankAccount = bankAccountRepository.findByIdAndUserId(request.getBankAccountId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));

        // Lấy ví mặc định
        Wallet wallet = walletService.getDefaultWallet(user.getId());

        // Kiểm tra số dư ví
        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // Tạo mã giao dịch duy nhất
        String transactionCode = "WD" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        // Tạo giao dịch mới với trạng thái PENDING
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(wallet);
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.WITHDRAW);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setTransactionCode(transactionCode);
        transaction.setNote("Rút tiền về thẻ " + bankAccount.getBankName() + " - " + bankAccount.getAccountNumber());
        
        transaction = transactionRepository.save(transaction);

        try {
            // Gọi API Chi Hộ (Rút tiền) của PayOS
            payOsPayoutService.createPayout(
                    bankAccount.getBankCode(),
                    bankAccount.getAccountNumber(),
                    bankAccount.getAccountName(),
                    request.getAmount().intValue(),
                    "Rut tien SmartSpend",
                    transactionCode
            );

            // Trừ số dư và cập nhật trạng thái giao dịch
            walletService.addBalance(wallet.getId(), request.getAmount().negate());
            transaction.setStatus(TransactionStatus.SUCCESS);
            transactionRepository.save(transaction);

        } catch (Exception e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setNote(transaction.getNote() + " (Lỗi: " + e.getMessage() + ")");
            transactionRepository.save(transaction);
            throw new RuntimeException("Rút tiền thất bại: " + e.getMessage(), e);
        }

        return new WithdrawResponse(
                transactionCode,
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getCreatedAt()
        );
    }
}
