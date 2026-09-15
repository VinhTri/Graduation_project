package com.project.app.wallet.service.impl;

import com.project.app.auth.service.AuthService;
import com.project.app.bankaccount.entity.BankAccount;
import com.project.app.bankaccount.repository.BankAccountRepository;
import com.project.app.category.entity.CategoryItem;
import com.project.app.category.service.CategoryService;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.transaction.service.PayOsPayoutService;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.dto.WalletTransactionResponse;
import com.project.app.wallet.dto.request.WalletWithdrawRequest;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.repository.WalletTransactionRepository;
import com.project.app.wallet.service.WalletLimitHelper;
import com.project.app.wallet.service.WalletTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletTransactionServiceImpl implements WalletTransactionService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final BankAccountRepository bankAccountRepository;
    private final WalletLimitHelper walletLimitHelper;
    private final AuthService authService;
    private final PayOsPayoutService payOsPayoutService;

    /**
     * LUỒNG RÚT TIỀN ĐANG ĐƯỢC WALLETCONTROLLER SỬ DỤNG.
     * 1. Đọc User; khóa ví mặc định bằng PESSIMISTIC_WRITE; tìm ngân hàng theo
     *    accountId + userId. Khóa ví được lấy trước kiểm tra PIN trong code hiện tại.
     * 2. PIN không được rỗng và phải đúng; số dư phải đủ; số tiền tối thiểu 2.000.
     *    Null/định dạng đầu vào còn dựa vào @Valid ở controller; gọi nội bộ không
     *    tự được áp validation DTO. Không nhận amount phân số cho payout longValueExact.
     * 3. Kiểm tra hạn mức mỗi lần/ngày; tạo mã WD làm reference gọi payOS.
     * 4. Nếu createPayout ném lỗi -> WITHDRAW_FAILED, rollback DB.
     * 5. Nếu gọi trả bình thường -> trừ balance, ghi WalletTransaction WITHDRAW,
     *    snapshot ngân hàng nhận; category để null; trả DTO cùng số dư sau trừ.
     * Hàm chỉ ghi wallet_transactions, KHÔNG tạo Transaction PENDING/SUCCESS,
     * KHÔNG tạo Notification tại đây. Khác processWithdrawal ở TransactionServiceImpl.
     * Transaction bảo vệ cập nhật DB, không hoàn tác lệnh chi ngoài hệ thống.
     * createPayout chưa kiểm tra trạng thái chi tiền cuối; nếu payout đã được nhận
     * nhưng response timeout hoặc save DB lỗi, chưa có cơ chế đối soát tự động
     * trong hàm. Chưa có requestId ổn định để chống payout lặp khi gọi lại.
     * Giữ khóa trong lúc gọi mạng có thể làm yêu cầu cùng ví phải chờ lâu.
     */
    @Override
    @Transactional
    public WalletTransactionResponse withdraw(Long userId, WalletWithdrawRequest request) {
        User user = requireUser(userId);
        Wallet wallet = requireDefaultWallet(userId);
        BankAccount bankAccount = requireOwnedAccount(userId, request.getBankAccountId());

        if (request.getPinCode() == null
                || request.getPinCode().isBlank()
                || !authService.verifyPinCode(userId, request.getPinCode())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        if (request.getAmount().compareTo(BigDecimal.valueOf(2000)) < 0) {
            throw new AppException(ErrorCode.WITHDRAW_MINIMUM_AMOUNT);
        }

        walletLimitHelper.enforceOutgoingLimits(userId, wallet, request.getAmount());

        String transactionCode = generateCode("WD");
        try {
            payOsPayoutService.createPayout(
                    bankAccount.getBankCode(),
                    bankAccount.getAccountNumber(),
                    bankAccount.getAccountName(),
                    request.getAmount().longValueExact(),
                    "Rut tien SmartSpend",
                    transactionCode
            );
        } catch (Exception payoutError) {
            throw new AppException(ErrorCode.WITHDRAW_FAILED);
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        WalletTransaction transaction = WalletTransaction.builder()
                .user(user)
                .wallet(wallet)
                .amount(request.getAmount())
                .type(WalletTransactionType.WITHDRAW)
                .note(normalizeNote(request.getNote()))
                .categoryId(null)
                .categoryName(null)
                .transactionCode(transactionCode)
                .bankAccountId(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .bankAccountNumber(bankAccount.getAccountNumber())
                .bankCode(bankAccount.getBankCode())
                .bankAccountName(bankAccount.getAccountName())
                .build();

        walletTransactionRepository.save(transaction);
        return toResponse(transaction, null, wallet.getBalance());
    }

    /**
     * Đọc lịch sử wallet_transactions của user, mới nhất trước, không phân trang. Gom ID danh mục rồi
     * tải theo lô cả danh mục đã xóa để hiển thị snapshot/trạng thái. Đọc số dư ví hiện tại một lần và
     * truyền cùng giá trị cho từng DTO: balanceAfter ở lịch sử này KHÔNG phải số dư lịch sử tại thời
     * điểm từng giao dịch. Không truy vấn bảng transactions trong hàm này.
     */
    @Override
    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getHistory(Long userId) {
        List<WalletTransaction> transactions =
                walletTransactionRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);

        Set<Long> categoryIds = transactions.stream()
                .map(WalletTransaction::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, CategoryItem> categories =
                categoryService.findItemsByIdsIncludingDeleted(categoryIds);

        Wallet wallet = walletRepository.findByUserIdAndIsDefaultTrue(userId).orElse(null);
        BigDecimal balance = wallet != null ? wallet.getBalance() : BigDecimal.ZERO;

        return transactions.stream()
                .map(tx -> {
                    Long categoryId = tx.getCategoryId();
                    CategoryItem category = categoryId == null ? null : categories.get(categoryId);
                    return toResponse(tx, category, balance);
                })
                .toList();
    }

    /**
     * Truy vấn bankAccount.id = accountId AND bankAccount.user.id = userId. Không tồn tại hoặc không
     * thuộc người dùng đều trả BANK_ACCOUNT_NOT_FOUND; ngăn dùng ID tài khoản ngân hàng của người
     * khác. Không gọi payOS để xác minh lại tên người nhận.
     */
    private BankAccount requireOwnedAccount(Long userId, Long accountId) {
        return bankAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));
    }

    /**
     * Tìm User bằng khóa chính; không thấy thì USER_NOT_FOUND. userId được controller lấy từ
     * principal; helper không tự đọc JWT.
     */
    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    /**
     * Lấy ví isDefault=true theo userId bằng truy vấn có PESSIMISTIC_WRITE. Khóa tồn tại tới khi
     * transaction caller kết thúc; không được gọi như thể đây là truy vấn đọc thông thường. Không có
     * ví thì WALLET_NOT_FOUND.
     */
    private Wallet requireDefaultWallet(Long userId) {
        return walletRepository.findDefaultWalletForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
    }

    /**
     * Trim ghi chú; null hoặc toàn khoảng trắng trả null. Không tự sinh nội dung mặc định và không
     * thay đổi dữ liệu ngân hàng.
     */
    private String normalizeNote(String note) {
        if (note == null || note.isBlank()) {
            return null;
        }
        return note.trim();
    }

    /**
     * Sinh mã prefix + timestamp milliseconds + 4 ký tự UUID viết hoa. Mã phục vụ tham chiếu/lịch sử,
     * không phải requestId ổn định qua retry; vẫn cần ràng buộc unique tại DB khi áp dụng.
     */
    private String generateCode(String prefix) {
        return prefix + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    /**
     * Ánh xạ lịch sử ví sang DTO; xác định danh mục đã xóa nhưng giữ nhóm hệ thống không bị gắn nhãn
     * đã xóa. Icon/màu lấy từ CategoryItem nếu còn tra được. balanceAfter là giá trị caller truyền
     * vào, helper không tính lại bút toán.
     */
    private WalletTransactionResponse toResponse(
            WalletTransaction transaction,
            CategoryItem category,
            BigDecimal balanceAfter) {
        boolean systemCategory = isSystemFundCategory(category, transaction.getCategoryName());
        boolean deleted = transaction.getCategoryId() != null
                && !systemCategory
                && (category == null || category.isDeleted());
        return WalletTransactionResponse.from(
                transaction,
                category != null ? category.getIcon() : null,
                category != null ? category.getColor() : null,
                category != null ? category.getBgColor() : null,
                deleted,
                balanceAfter
        );
    }

    /**
     * Nhận diện danh mục hệ thống qua user=null hoặc tên thuộc bộ nhãn quỹ/chia tiền/chuyển tiền. Bỏ
     * hậu tố (đã xóa) trước so tên. Chỉ phục vụ hiển thị, không chứng minh loại giao dịch tài chính.
     */
    private boolean isSystemFundCategory(CategoryItem category, String categoryName) {
        if (category != null && category.getUser() == null) {
            return true;
        }
        String label = category != null ? category.getLabel() : categoryName;
        if (label == null) {
            return false;
        }
        String cleaned = label.replaceAll("(?i)\\s*\\(đã xóa\\)\\s*$", "").trim();
        return "Nạp quỹ".equals(cleaned)
                || "Rút quỹ".equals(cleaned)
                || "Chia tiền".equals(cleaned)
                || "Chuyển tiền".equals(cleaned)
                || "Nhận chuyển tiền".equals(cleaned);
    }
}
