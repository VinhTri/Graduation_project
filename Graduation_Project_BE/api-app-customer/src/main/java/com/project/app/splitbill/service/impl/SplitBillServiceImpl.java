package com.project.app.splitbill.service.impl;

import com.project.app.category.entity.CategoryItem;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.common.service.EmailService;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.service.NotificationService;
import com.project.app.splitbill.dto.request.CreateSplitBillRequest;
import com.project.app.splitbill.dto.request.PaySplitBillRequest;
import com.project.app.splitbill.dto.request.SplitMemberItemRequest;
import com.project.app.splitbill.dto.response.SplitBillMemberResponse;
import com.project.app.splitbill.dto.response.SplitBillResponse;
import com.project.app.splitbill.entity.SplitBill;
import com.project.app.splitbill.entity.SplitBillMember;
import com.project.app.splitbill.enums.SplitBillMemberStatus;
import com.project.app.splitbill.enums.SplitBillStatus;
import com.project.app.splitbill.repository.SplitBillMemberRepository;
import com.project.app.splitbill.repository.SplitBillRepository;
import com.project.app.splitbill.service.SplitBillService;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.repository.WalletTransactionRepository;
import com.project.app.wallet.service.WalletLimitHelper;
import com.project.app.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SplitBillServiceImpl implements SplitBillService {

    private final SplitBillRepository splitBillRepository;
    private final SplitBillMemberRepository splitBillMemberRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final CategoryItemRepository categoryItemRepository;
    private final WalletService walletService;
    private final WalletLimitHelper walletLimitHelper;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final BigDecimal MIN_AMOUNT_PER_PERSON = new BigDecimal("2000.00");
    private static final String SPLIT_CATEGORY_LABEL = "Chia tiền";
    private static final String SYSTEM_EXPENSE_GROUP = "Chi tiêu hệ thống";
    private static final String SYSTEM_INCOME_GROUP = "Thu nhập hệ thống";

    @Override
    @Transactional
    public SplitBillResponse createSplitBill(User currentUser, CreateSplitBillRequest request) {
        if (request.getMembers() == null || request.getMembers().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Validate each member
        Set<Long> processedUserIds = new HashSet<>();
        List<SplitBillMember> memberEntities = new ArrayList<>();

        SplitBill splitBill = SplitBill.builder()
                .creator(currentUser)
                .title(request.getTitle().trim())
                .totalAmount(request.getTotalAmount())
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .status(SplitBillStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        SplitBill savedBill = splitBillRepository.save(splitBill);

        for (SplitMemberItemRequest item : request.getMembers()) {
            if (item.getUserId().equals(currentUser.getId())) {
                continue; // Skip creator if included in members list
            }
            if (processedUserIds.contains(item.getUserId())) {
                continue; // Avoid duplicate members
            }
            if (item.getAmount() == null || item.getAmount().compareTo(MIN_AMOUNT_PER_PERSON) < 0) {
                throw new AppException(ErrorCode.SPLIT_BILL_MINIMUM_AMOUNT);
            }

            User memberUser = userRepository.findById(item.getUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            SplitBillMember member = SplitBillMember.builder()
                    .splitBill(savedBill)
                    .user(memberUser)
                    .amount(item.getAmount())
                    .status(SplitBillMemberStatus.PENDING)
                    .lastRemindedAt(null)
                    .createdAt(LocalDateTime.now())
                    .build();

            memberEntities.add(member);
            processedUserIds.add(item.getUserId());
        }

        if (memberEntities.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        List<SplitBillMember> savedMembers = splitBillMemberRepository.saveAll(memberEntities);
        savedBill.setMembers(savedMembers);

        // Gửi thông báo chuông (In-app notification) và Email (Gmail) cho từng thành viên B
        for (SplitBillMember member : savedMembers) {
            User receiver = member.getUser();
            String formattedMemberAmount = formatCurrency(member.getAmount());
            String formattedTotal = formatCurrency(savedBill.getTotalAmount());

            // 1. In-app Bell Notification
            try {
                notificationService.createNotification(
                        receiver,
                        "Yêu cầu chia tiền",
                        currentUser.getUsername() + " đã gửi cho bạn yêu cầu chia tiền '" + savedBill.getTitle() + "' với số tiền " + formattedMemberAmount + "đ.",
                        NotificationType.SPLIT_BILL_REQUEST,
                        savedBill.getId()
                );
            } catch (Exception e) {
                log.error("Lỗi khi tạo thông báo chuông chia tiền cho user {}: {}", receiver.getId(), e.getMessage());
            }

            // 2. Email qua Gmail
            if (receiver.getEmail() != null && !receiver.getEmail().isEmpty()) {
                try {
                    String subject = "[SmartSpend] Yêu cầu chia tiền mới từ " + currentUser.getUsername();
                    StringBuilder sb = new StringBuilder();
                    sb.append("Xin chào ").append(receiver.getUsername()).append(",\n\n");
                    sb.append("Bạn vừa nhận được một yêu cầu chia tiền từ ").append(currentUser.getUsername());
                    if (currentUser.getEmail() != null && !currentUser.getEmail().isEmpty()) {
                        sb.append(" (").append(currentUser.getEmail()).append(")");
                    }
                    sb.append(" trên ứng dụng SmartSpend:\n\n");
                    sb.append("• Khoản chi: ").append(savedBill.getTitle()).append("\n");
                    sb.append("• Tổng hóa đơn: ").append(formattedTotal).append("đ\n");
                    sb.append("• Số tiền bạn cần trả: ").append(formattedMemberAmount).append("đ\n");
                    if (savedBill.getNote() != null && !savedBill.getNote().isEmpty()) {
                        sb.append("• Lời nhắn: ").append(savedBill.getNote()).append("\n");
                    }
                    sb.append("\nVui lòng mở ứng dụng SmartSpend để kiểm tra chi tiết và thanh toán thuận tiện qua ví điện tử nhé.\n\n");
                    sb.append("Trân trọng,\nĐội ngũ SmartSpend.");

                    emailService.sendEmail(receiver.getEmail(), subject, sb.toString());
                } catch (Exception e) {
                    log.error("Gửi email yêu cầu chia tiền thất bại cho email {}: {}", receiver.getEmail(), e.getMessage());
                }
            }
        }

        return toResponse(savedBill, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SplitBillResponse> getMySplitBills(User currentUser) {
        List<SplitBill> bills = splitBillRepository.findAllByUserInvolved(currentUser);
        return bills.stream()
                .map(bill -> toResponse(bill, currentUser))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SplitBillResponse getSplitBillDetail(User currentUser, Long splitBillId) {
        SplitBill bill = splitBillRepository.findByIdWithMembers(splitBillId)
                .orElseThrow(() -> new AppException(ErrorCode.SPLIT_BILL_NOT_FOUND));

        boolean isCreator = bill.getCreator().getId().equals(currentUser.getId());
        boolean isMember = bill.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));

        if (!isCreator && !isMember) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        return toResponse(bill, currentUser);
    }

    @Override
    @Transactional
    public SplitBillResponse paySplitBill(User currentUser, Long splitBillId, PaySplitBillRequest request) {
        // Xác thực mã PIN
        if (currentUser.getPinCode() == null || currentUser.getPinCode().isEmpty()) {
            throw new AppException(ErrorCode.PIN_NOT_SET);
        }

        if (!passwordEncoder.matches(request.getPinCode(), currentUser.getPinCode())) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }

        // Tìm SplitBill
        SplitBill bill = splitBillRepository.findByIdWithMembers(splitBillId)
                .orElseThrow(() -> new AppException(ErrorCode.SPLIT_BILL_NOT_FOUND));

        if (bill.getStatus() == SplitBillStatus.CANCELLED) {
            throw new AppException(ErrorCode.SPLIT_BILL_COMPLETED);
        }

        // 4. Tìm bản ghi thành viên của currentUser
        SplitBillMember member = bill.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(currentUser.getId()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SPLIT_BILL_INVALID_MEMBER));

        if (member.getStatus() == SplitBillMemberStatus.PAID) {
            throw new AppException(ErrorCode.SPLIT_BILL_ALREADY_PAID);
        }

        BigDecimal payAmount = member.getAmount();

        // 5. Lấy ví người gửi và ví người tạo
        Wallet senderWallet = walletRepository.findDefaultWalletForUpdate(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        if (senderWallet.getBalance().compareTo(payAmount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        Wallet creatorWallet = walletService.getDefaultWallet(bill.getCreator().getId());

        walletLimitHelper.enforceOutgoingLimits(currentUser.getId(), senderWallet, payAmount);

        CategoryItem expenseCategory = requireSystemCategory(SPLIT_CATEGORY_LABEL, SYSTEM_EXPENSE_GROUP);
        CategoryItem incomeCategory = requireSystemCategory(SPLIT_CATEGORY_LABEL, SYSTEM_INCOME_GROUP);
        String senderNote = buildWalletNote(
                "Thanh toán chia tiền \"" + bill.getTitle() + "\" cho \"" + bill.getCreator().getUsername() + "\"",
                request.getNote());
        String receiverNote = "Nhận chia tiền \"" + bill.getTitle() + "\" từ \"" + currentUser.getUsername() + "\"";

        // 6. Thực hiện trừ / cộng ví
        senderWallet.setBalance(senderWallet.getBalance().subtract(payAmount));
        walletRepository.save(senderWallet);

        creatorWallet.setBalance(creatorWallet.getBalance().add(payAmount));
        walletRepository.save(creatorWallet);

        // 7. Tạo bản ghi giao dịch (mỗi bên một mã giao dịch duy nhất để tránh vi phạm unique constraint)
        String senderTxCode = "SB_OUT_" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String receiverTxCode = "SB_IN_" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Transaction senderTx = new Transaction();
        senderTx.setUser(currentUser);
        senderTx.setWallet(senderWallet);
        senderTx.setAmount(payAmount);
        senderTx.setType(TransactionType.TRANSFER);
        senderTx.setStatus(TransactionStatus.SUCCESS);
        senderTx.setTransactionCode(senderTxCode);
        senderTx.setNote(senderNote);
        senderTx.setCategoryId(expenseCategory.getId());
        transactionRepository.save(senderTx);
        saveWalletTransaction(
                currentUser, senderWallet, payAmount, WalletTransactionType.WITHDRAW,
                expenseCategory, senderTxCode, senderNote);

        Transaction receiverTx = new Transaction();
        receiverTx.setUser(bill.getCreator());
        receiverTx.setWallet(creatorWallet);
        receiverTx.setAmount(payAmount);
        receiverTx.setType(TransactionType.RECEIVE_TRANSFER);
        receiverTx.setStatus(TransactionStatus.SUCCESS);
        receiverTx.setTransactionCode(receiverTxCode);
        receiverTx.setNote(receiverNote);
        receiverTx.setCategoryId(incomeCategory.getId());
        transactionRepository.save(receiverTx);
        saveWalletTransaction(
                bill.getCreator(), creatorWallet, payAmount, WalletTransactionType.TOP_UP,
                incomeCategory, receiverTxCode, receiverNote);

        // 8. Cập nhật trạng thái thành viên
        member.setStatus(SplitBillMemberStatus.PAID);
        member.setPaidAt(LocalDateTime.now());
        member.setTransactionCode(senderTxCode);
        splitBillMemberRepository.save(member);

        // 9. Kiểm tra nếu tất cả thành viên đã trả -> COMPLETED
        boolean allPaid = bill.getMembers().stream()
                .allMatch(m -> m.getStatus() == SplitBillMemberStatus.PAID);
        if (allPaid) {
            bill.setStatus(SplitBillStatus.COMPLETED);
            splitBillRepository.save(bill);
            notificationService.createNotification(
                    bill.getCreator(),
                    "Khoản chia đã hoàn tất",
                    "Tất cả thành viên đã thanh toán khoản chia '" + bill.getTitle() + "'.",
                    NotificationType.SPLIT_BILL_COMPLETED,
                    bill.getId());
        }

        // 10. Gửi thông báo chuông và email cho người tạo bill A
        User creator = bill.getCreator();
        String formattedAmount = formatCurrency(payAmount);
        try {
            notificationService.createNotification(
                    creator,
                    "Đã nhận tiền chia",
                    currentUser.getUsername() + " đã thanh toán " + formattedAmount + "đ cho khoản chia '" + bill.getTitle() + "'.",
                    NotificationType.SPLIT_BILL_PAID,
                    bill.getId()
            );
        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo nhận tiền chia: {}", e.getMessage());
        }

        if (creator.getEmail() != null && !creator.getEmail().isEmpty()) {
            try {
                String subject = "[SmartSpend] " + currentUser.getUsername() + " đã thanh toán khoản chia tiền!";
                String text = "Xin chào " + creator.getUsername() + ",\n\n"
                        + "Thành viên " + currentUser.getUsername() + " vừa thanh toán số tiền " + formattedAmount + "đ cho khoản chia: '" + bill.getTitle() + "'.\n"
                        + "Tiền đã được cộng trực tiếp vào số dư ví SmartSpend của bạn.\n"
                        + (allPaid ? "\n🎉 Toàn bộ thành viên đã thanh toán đủ cho khoản chia này!\n" : "")
                        + "\nTrân trọng,\nĐội ngũ SmartSpend.";
                emailService.sendEmail(creator.getEmail(), subject, text);
            } catch (Exception e) {
                log.error("Lỗi gửi email cho người tạo khi nhận tiền chia: {}", e.getMessage());
            }
        }

        return toResponse(bill, currentUser);
    }

    @Override
    @Transactional
    public void remindMember(User currentUser, Long splitBillId, Long memberUserId) {
        SplitBill bill = splitBillRepository.findByIdWithMembers(splitBillId)
                .orElseThrow(() -> new AppException(ErrorCode.SPLIT_BILL_NOT_FOUND));

        if (!bill.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        SplitBillMember member = bill.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(memberUserId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SPLIT_BILL_INVALID_MEMBER));

        if (member.getStatus() == SplitBillMemberStatus.PAID) {
            throw new AppException(ErrorCode.SPLIT_BILL_ALREADY_PAID);
        }

        User receiver = member.getUser();

        // Kiểm tra cooldown 12 giờ chống spam nhắc nhở
        if (member.getLastRemindedAt() != null) {
            LocalDateTime nextAllowedTime = member.getLastRemindedAt().plusHours(12);
            if (LocalDateTime.now().isBefore(nextAllowedTime)) {
                throw new AppException(ErrorCode.SPLIT_BILL_REMINDER_COOLDOWN,
                        "Úi, bạn vừa nhắc nhở đây mà. Hãy đợi sau 12h nữa nha");
            }
        }
        String formattedAmount = formatCurrency(member.getAmount());

        // In-app Notification
        notificationService.createNotification(
                receiver,
                "Nhắc nhở thanh toán chia tiền",
                currentUser.getUsername() + " nhắc bạn thanh toán " + formattedAmount + "đ cho khoản chia '" + bill.getTitle() + "'.",
                NotificationType.SPLIT_BILL_REMINDER,
                bill.getId()
        );

        // Gmail
        if (receiver.getEmail() != null && !receiver.getEmail().isEmpty()) {
            try {
                String subject = "[SmartSpend Nhắc nhở] Thanh toán chia tiền: " + bill.getTitle();
                String text = "Xin chào " + receiver.getUsername() + ",\n\n"
                        + currentUser.getUsername() + " vừa gửi lời nhắc bạn thanh toán số tiền " + formattedAmount + "đ cho khoản chia '" + bill.getTitle() + "'.\n"
                        + "Vui lòng mở ứng dụng SmartSpend để thanh toán nhé.\n\n"
                        + "Trân trọng,\nĐội ngũ SmartSpend.";
                emailService.sendEmail(receiver.getEmail(), subject, text);
            } catch (Exception e) {
                log.error("Lỗi gửi email nhắc nhở chia tiền: {}", e.getMessage());
            }
        }

        member.setLastRemindedAt(LocalDateTime.now());
        splitBillMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void cancelSplitBill(User currentUser, Long splitBillId) {
        SplitBill bill = splitBillRepository.findByIdWithMembers(splitBillId)
                .orElseThrow(() -> new AppException(ErrorCode.SPLIT_BILL_NOT_FOUND));

        if (!bill.getCreator().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        if (bill.getStatus() != SplitBillStatus.PENDING) {
            throw new AppException(ErrorCode.SPLIT_BILL_COMPLETED);
        }

        boolean hasPaidMember = bill.getMembers().stream()
                .anyMatch(member -> member.getStatus() == SplitBillMemberStatus.PAID);
        if (hasPaidMember) {
            throw new AppException(ErrorCode.SPLIT_BILL_HAS_PAID_MEMBER);
        }

        bill.setStatus(SplitBillStatus.CANCELLED);
        splitBillRepository.save(bill);

        for (SplitBillMember member : bill.getMembers()) {
            if (!member.getUser().getId().equals(currentUser.getId())) {
                notificationService.createNotification(
                        member.getUser(),
                        "Khoản chia đã bị hủy",
                        currentUser.getUsername() + " đã hủy khoản chia '" + bill.getTitle() + "'.",
                        NotificationType.SPLIT_BILL_CANCELLED,
                        bill.getId());
            }
        }
    }

    private SplitBillResponse toResponse(SplitBill bill, User currentUser) {
        boolean isCreator = bill.getCreator().getId().equals(currentUser.getId());

        List<SplitBillMemberResponse> memberResponses = bill.getMembers().stream()
                .map(m -> SplitBillMemberResponse.builder()
                        .id(m.getId())
                        .userId(m.getUser().getId())
                        .username(m.getUser().getUsername())
                        .email(m.getUser().getEmail())
                        .accountNumber(walletService.getAccountNumberForUser(m.getUser().getId()))
                        .avatarUrl(m.getUser().getAvatarUrl())
                        .amount(m.getAmount())
                        .status(m.getStatus().name())
                        .paidAt(m.getPaidAt())
                        .transactionCode(m.getTransactionCode())
                        .lastRemindedAt(m.getLastRemindedAt())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalPaid = bill.getMembers().stream()
                .filter(m -> m.getStatus() == SplitBillMemberStatus.PAID)
                .map(SplitBillMember::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPending = bill.getMembers().stream()
                .filter(m -> m.getStatus() == SplitBillMemberStatus.PENDING)
                .map(SplitBillMember::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int paidCount = (int) bill.getMembers().stream()
                .filter(m -> m.getStatus() == SplitBillMemberStatus.PAID)
                .count();

        SplitBillMember currentMember = bill.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(currentUser.getId()))
                .findFirst()
                .orElse(null);

        String myStatus = currentMember != null ? currentMember.getStatus().name() : null;
        BigDecimal myAmount = currentMember != null ? currentMember.getAmount() : null;

        return SplitBillResponse.builder()
                .id(bill.getId())
                .creatorId(bill.getCreator().getId())
                .creatorUsername(bill.getCreator().getUsername())
                .creatorEmail(bill.getCreator().getEmail())
                .creatorAccountNumber(walletService.getAccountNumberForUser(bill.getCreator().getId()))
                .creatorAvatarUrl(bill.getCreator().getAvatarUrl())
                .title(bill.getTitle())
                .totalAmount(bill.getTotalAmount())
                .note(bill.getNote())
                .status(bill.getStatus().name())
                .createdAt(bill.getCreatedAt())
                .updatedAt(bill.getUpdatedAt())
                .members(memberResponses)
                .isCreator(isCreator)
                .myStatus(myStatus)
                .myAmount(myAmount)
                .totalPaidAmount(totalPaid)
                .totalPendingAmount(totalPending)
                .paidMembersCount(paidCount)
                .totalMembersCount(bill.getMembers().size())
                .build();
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount.longValue()).replace(',', '.');
    }

    private CategoryItem requireSystemCategory(String label, String groupTitle) {
        return categoryItemRepository
                .findFirstByLabelAndGroup_TitleAndUserIsNullAndIsDeletedFalse(label, groupTitle)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND));
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
                .categoryId(category.getId())
                .categoryName(category.getLabel())
                .transactionCode(transactionCode)
                .build());
    }
}
