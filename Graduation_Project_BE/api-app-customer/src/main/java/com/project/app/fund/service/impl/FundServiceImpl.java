package com.project.app.fund.service.impl;

import com.project.app.auth.service.AuthService;
import com.project.app.category.repository.CategoryItemRepository;
import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.friendship.entity.Friendship;
import com.project.app.friendship.entity.FriendshipStatus;
import com.project.app.friendship.repository.FriendshipRepository;
import com.project.app.fund.dto.request.CreateFundRequest;
import com.project.app.fund.dto.request.FundAmountRequest;
import com.project.app.fund.dto.request.InviteFundRequest;
import com.project.app.fund.dto.request.UpdateFundNoteRequest;
import com.project.app.fund.dto.response.FundDetailResponse;
import com.project.app.fund.dto.response.FundInvitationResponse;
import com.project.app.fund.dto.response.FundMemberResponse;
import com.project.app.fund.dto.response.FundSummaryResponse;
import com.project.app.fund.dto.response.FundTransactionResponse;
import com.project.app.fund.entity.Fund;
import com.project.app.fund.entity.FundMember;
import com.project.app.fund.entity.FundTransaction;
import com.project.app.fund.enums.FundMemberRole;
import com.project.app.fund.enums.FundMemberStatus;
import com.project.app.fund.enums.FundStatus;
import com.project.app.fund.enums.FundTransactionType;
import com.project.app.fund.repository.FundMemberRepository;
import com.project.app.fund.repository.FundRepository;
import com.project.app.fund.repository.FundTransactionRepository;
import com.project.app.fund.service.FundService;
import com.project.app.notification.enums.NotificationType;
import com.project.app.notification.repository.NotificationRepository;
import com.project.app.notification.service.NotificationService;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FundServiceImpl implements FundService {

    private static final int MAX_OWNED_FUNDS = 6;
    private static final int MAX_JOINED_FUNDS = 6;
    private static final int MAX_FUND_MEMBERS = 10;
    private static final BigDecimal MIN_AMOUNT = new BigDecimal("10000");
    private static final String FUND_DEPOSIT_CATEGORY_LABEL = "Nạp quỹ";
    private static final String FUND_WITHDRAW_CATEGORY_LABEL = "Rút quỹ";

    private final FundRepository fundRepository;
    private final FundMemberRepository fundMemberRepository;
    private final FundTransactionRepository fundTransactionRepository;
    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final AuthService authService;
    private final TransactionRepository transactionRepository;
    private final CategoryItemRepository categoryItemRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FundSummaryResponse> listMyFunds(User user) {
        return fundRepository.findActiveFundsForUser(user.getId()).stream()
                .map(fund -> toSummary(fund, user.getId()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FundInvitationResponse> listPendingInvitations(User user) {
        return fundMemberRepository.findPendingInvitationsForUser(user.getId()).stream()
                .map(m -> {
                    Fund f = m.getFund();
                    long memberCount = fundMemberRepository.countByFundIdAndStatus(f.getId(), FundMemberStatus.ACTIVE);
                    return FundInvitationResponse.builder()
                            .id(m.getId())
                            .fundId(f.getId())
                            .fundName(f.getName())
                            .balance(f.getBalance())
                            .targetAmount(f.getTargetAmount())
                            .coverColorSeed(f.getCoverColorSeed())
                            .ownerId(f.getOwner().getId())
                            .ownerName(f.getOwner().getUsername())
                            .ownerAvatar(f.getOwner().getAvatarUrl())
                            .memberCount(memberCount)
                            .invitedAt(m.getJoinedAt())
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FundDetailResponse getFundDetail(User user, Long fundId) {
        Fund fund = requireActiveFund(fundId);
        requireActiveMember(fundId, user.getId());
        return toDetail(fund, user.getId());
    }

    @Override
    @Transactional
    public FundDetailResponse createFund(User user, CreateFundRequest request) {
        long owned = fundRepository.countByOwnerIdAndStatus(user.getId(), FundStatus.ACTIVE);
        if (owned >= MAX_OWNED_FUNDS) {
            throw new AppException(ErrorCode.FUND_OWNER_LIMIT_EXCEEDED);
        }
        if (request.getTargetAmount() == null || request.getTargetAmount().compareTo(MIN_AMOUNT) < 0) {
            throw new AppException(ErrorCode.FUND_TARGET_REQUIRED);
        }
        if (fundRepository.existsByOwnerIdAndCoverColorSeedAndStatus(
                user.getId(), request.getCoverColorSeed(), FundStatus.ACTIVE)) {
            throw new AppException(ErrorCode.FUND_COLOR_TAKEN);
        }

        Fund fund = new Fund();
        fund.setOwner(user);
        fund.setName(request.getName().trim());
        fund.setBalance(BigDecimal.ZERO);
        fund.setTargetAmount(request.getTargetAmount());
        fund.setCoverColorSeed(request.getCoverColorSeed());
        fund.setStatus(FundStatus.ACTIVE);
        fund = fundRepository.save(fund);

        FundMember ownerMember = new FundMember();
        ownerMember.setFund(fund);
        ownerMember.setUser(user);
        ownerMember.setRole(FundMemberRole.OWNER);
        ownerMember.setStatus(FundMemberStatus.ACTIVE);
        ownerMember.setContributedAmount(BigDecimal.ZERO);
        ownerMember.setJoinedAt(LocalDateTime.now());
        fundMemberRepository.save(ownerMember);

        return toDetail(fund, user.getId());
    }

    @Override
    @Transactional
    public void deleteFund(User user, Long fundId) {
        Fund fund = requireActiveFund(fundId);
        if (!fund.getOwner().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.FUND_NOT_OWNER);
        }
        if (fund.getBalance().compareTo(BigDecimal.ZERO) > 0) {
            throw new AppException(ErrorCode.FUND_HAS_BALANCE);
        }

        notificationRepository.deleteByTypeAndRelatedId(NotificationType.FUND_INVITE, fundId);
        notificationRepository.deleteByTypeAndRelatedId(NotificationType.FUND_INVITE_ACCEPTED, fundId);
        fundTransactionRepository.deleteByFundId(fundId);
        fundMemberRepository.deleteByFundId(fundId);
        fundRepository.delete(fund);
    }

    @Override
    @Transactional
    public void leaveFund(User user, Long fundId) {
        Fund fund = requireActiveFund(fundId);
        if (fund.getOwner().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.FUND_OWNER_CANNOT_LEAVE);
        }

        FundMember member = requireActiveMember(fundId, user.getId());
        member.setStatus(FundMemberStatus.LEFT);
        fundMemberRepository.save(member);

        notificationService.createNotification(
                fund.getOwner(),
                "Thành viên rời quỹ",
                user.getUsername() + " đã rời khỏi quỹ \"" + fund.getName() + "\".",
                NotificationType.GENERAL,
                fund.getId()
        );
    }

    @Override
    @Transactional
    public FundDetailResponse deposit(User user, Long fundId, FundAmountRequest request) {
        verifyPin(user.getId(), request.getPinCode());
        validateAmount(request.getAmount());

        Fund fund = requireActiveFund(fundId);
        FundMember member = requireActiveMember(fundId, user.getId());

        Wallet wallet = walletService.getDefaultWallet(user.getId());
        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        fund.setBalance(fund.getBalance().add(request.getAmount()));
        fundRepository.save(fund);

        member.setContributedAmount(member.getContributedAmount().add(request.getAmount()));
        fundMemberRepository.save(member);

        FundTransaction tx = new FundTransaction();
        tx.setFund(fund);
        tx.setUser(user);
        tx.setAmount(request.getAmount());
        tx.setType(FundTransactionType.DEPOSIT);
        tx.setNote(trimNote(request.getNote()));
        fundTransactionRepository.save(tx);

        // Ghi vào lịch sử ví + báo cáo: nạp quỹ = chi tiêu (WITHDRAW) + danh mục "Nạp quỹ"
        createWalletTransaction(
                user,
                wallet,
                request.getAmount(),
                TransactionType.WITHDRAW,
                FUND_DEPOSIT_CATEGORY_LABEL,
                "FDEP",
                buildWalletNote("Nạp vào quỹ \"" + fund.getName() + "\"", request.getNote())
        );

        return toDetail(fund, user.getId());
    }

    @Override
    @Transactional
    public FundDetailResponse withdraw(User user, Long fundId, FundAmountRequest request) {
        verifyPin(user.getId(), request.getPinCode());
        validateAmount(request.getAmount());

        Fund fund = requireActiveFund(fundId);
        if (!fund.getOwner().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.FUND_NOT_OWNER);
        }
        requireActiveMember(fundId, user.getId());

        if (fund.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.FUND_INSUFFICIENT_BALANCE);
        }

        fund.setBalance(fund.getBalance().subtract(request.getAmount()));
        fundRepository.save(fund);

        Wallet wallet = walletService.getDefaultWallet(user.getId());
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        walletRepository.save(wallet);

        FundTransaction tx = new FundTransaction();
        tx.setFund(fund);
        tx.setUser(user);
        tx.setAmount(request.getAmount());
        tx.setType(FundTransactionType.WITHDRAW);
        tx.setNote(trimNote(request.getNote()));
        fundTransactionRepository.save(tx);

        // Ghi vào lịch sử ví + báo cáo: rút quỹ = thu nhập (TOP_UP) + danh mục "Rút quỹ"
        createWalletTransaction(
                user,
                wallet,
                request.getAmount(),
                TransactionType.TOP_UP,
                FUND_WITHDRAW_CATEGORY_LABEL,
                "FWD",
                buildWalletNote("Rút từ quỹ \"" + fund.getName() + "\" về ví", request.getNote())
        );

        return toDetail(fund, user.getId());
    }

    @Override
    @Transactional
    public FundTransactionResponse updateTransactionNote(
            User user, Long fundId, Long txId, UpdateFundNoteRequest request) {
        requireActiveFund(fundId);
        requireActiveMember(fundId, user.getId());

        FundTransaction tx = fundTransactionRepository.findByIdAndFundId(txId, fundId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TRANSACTION));

        if (!tx.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        tx.setNote(trimNote(request.getNote()));
        fundTransactionRepository.save(tx);
        return toTxResponse(tx);
    }

    @Override
    @Transactional
    public FundDetailResponse inviteMember(User user, Long fundId, InviteFundRequest request) {
        Fund fund = requireActiveFund(fundId);
        requireActiveMember(fundId, user.getId());

        if (request.getUserId() == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        if (request.getUserId().equals(user.getId())) {
            throw new AppException(ErrorCode.FUND_CANNOT_INVITE_SELF);
        }

        User invitee = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Cho phép mời cả người chưa kết bạn; khi họ chấp nhận sẽ trở thành bạn bè với chủ quỹ

        Optional<FundMember> existing = fundMemberRepository.findByFundIdAndUserId(fundId, invitee.getId());
        if (existing.isPresent()) {
            FundMember member = existing.get();
            if (member.getStatus() == FundMemberStatus.ACTIVE) {
                throw new AppException(ErrorCode.FUND_ALREADY_MEMBER);
            }
            if (member.getStatus() == FundMemberStatus.INVITED) {
                throw new AppException(ErrorCode.FUND_INVITE_EXISTS);
            }
            // LEFT → mời lại: cần còn slot (ACTIVE + INVITED < 10)
            ensureFundHasMemberSlot(fundId);
            member.setStatus(FundMemberStatus.INVITED);
            member.setRole(FundMemberRole.MEMBER);
            member.setJoinedAt(LocalDateTime.now());
            fundMemberRepository.save(member);
        } else {
            ensureFundHasMemberSlot(fundId);
            FundMember member = new FundMember();
            member.setFund(fund);
            member.setUser(invitee);
            member.setRole(FundMemberRole.MEMBER);
            member.setStatus(FundMemberStatus.INVITED);
            member.setContributedAmount(BigDecimal.ZERO);
            member.setJoinedAt(LocalDateTime.now());
            fundMemberRepository.save(member);
        }

        notificationService.createNotification(
                invitee,
                "Lời mời tham gia quỹ",
                user.getUsername() + " đã mời bạn tham gia quỹ \"" + fund.getName()
                        + "\". Chấp nhận để tham gia và trở thành bạn bè.",
                NotificationType.FUND_INVITE,
                fund.getId()
        );

        return toDetail(fund, user.getId());
    }

    @Override
    @Transactional
    public FundDetailResponse acceptInvite(User user, Long fundId) {
        Fund fund = requireActiveFund(fundId);
        FundMember member = fundMemberRepository.findByFundIdAndUserId(fundId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.FUND_INVITE_NOT_FOUND));

        if (member.getStatus() != FundMemberStatus.INVITED) {
            if (member.getStatus() == FundMemberStatus.ACTIVE) {
                throw new AppException(ErrorCode.FUND_ALREADY_MEMBER);
            }
            throw new AppException(ErrorCode.FUND_INVITE_NOT_FOUND);
        }

        long joined = fundMemberRepository.countJoinedFunds(
                user.getId(), FundMemberStatus.ACTIVE, FundMemberRole.OWNER);
        if (joined >= MAX_JOINED_FUNDS) {
            throw new AppException(ErrorCode.FUND_JOINED_LIMIT_EXCEEDED);
        }

        long activeMembers = fundMemberRepository.countByFundIdAndStatus(fundId, FundMemberStatus.ACTIVE);
        if (activeMembers >= MAX_FUND_MEMBERS) {
            throw new AppException(ErrorCode.FUND_MEMBER_LIMIT_EXCEEDED);
        }

        member.setStatus(FundMemberStatus.ACTIVE);
        member.setJoinedAt(LocalDateTime.now());
        fundMemberRepository.save(member);

        // Chấp nhận tham gia quỹ → đảm bảo trở thành bạn bè với chủ quỹ
        ensureFriendship(user, fund.getOwner());

        notificationRepository.deleteByUserIdAndTypeAndRelatedId(
                user.getId(), NotificationType.FUND_INVITE, fund.getId()
        );

        notificationService.createNotification(
                fund.getOwner(),
                "Đã tham gia quỹ",
                user.getUsername() + " đã chấp nhận lời mời và tham gia quỹ \"" + fund.getName() + "\".",
                NotificationType.FUND_INVITE_ACCEPTED,
                fund.getId()
        );

        return toDetail(fund, user.getId());
    }

    @Override
    @Transactional
    public void rejectInvite(User user, Long fundId) {
        FundMember member = fundMemberRepository.findByFundIdAndUserId(fundId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.FUND_INVITE_NOT_FOUND));

        if (member.getStatus() != FundMemberStatus.INVITED) {
            throw new AppException(ErrorCode.FUND_INVITE_NOT_FOUND);
        }

        fundMemberRepository.delete(member);

        notificationRepository.deleteByUserIdAndTypeAndRelatedId(
                user.getId(), NotificationType.FUND_INVITE, fundId
        );
    }

    private void ensureFundHasMemberSlot(Long fundId) {
        long occupied = fundMemberRepository.countByFundIdAndStatusIn(
                fundId,
                List.of(FundMemberStatus.ACTIVE, FundMemberStatus.INVITED)
        );
        if (occupied >= MAX_FUND_MEMBERS) {
            throw new AppException(ErrorCode.FUND_MEMBER_LIMIT_EXCEEDED);
        }
    }

    private void ensureFriendship(User userA, User userB) {
        if (userA.getId().equals(userB.getId())) {
            return;
        }
        Optional<Friendship> existing = friendshipRepository.findFriendshipBetweenUsers(userA, userB);
        if (existing.isPresent()) {
            Friendship friendship = existing.get();
            if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
                friendship.setStatus(FriendshipStatus.ACCEPTED);
                friendshipRepository.save(friendship);
            }
            return;
        }
        friendshipRepository.save(new Friendship(userA, userB, FriendshipStatus.ACCEPTED));
    }

    private void verifyPin(Long userId, String pinCode) {
        if (pinCode == null || pinCode.isBlank() || !authService.verifyPinCode(userId, pinCode)) {
            throw new AppException(ErrorCode.INVALID_PIN);
        }
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(MIN_AMOUNT) < 0) {
            throw new AppException(ErrorCode.FUND_INVALID_AMOUNT);
        }
    }

    private Fund requireActiveFund(Long fundId) {
        return fundRepository.findByIdAndStatus(fundId, FundStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.FUND_NOT_FOUND));
    }

    private FundMember requireActiveMember(Long fundId, Long userId) {
        FundMember member = fundMemberRepository.findByFundIdAndUserId(fundId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.FUND_NOT_MEMBER));
        if (member.getStatus() != FundMemberStatus.ACTIVE) {
            throw new AppException(ErrorCode.FUND_NOT_MEMBER);
        }
        return member;
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

    private void createWalletTransaction(
            User user,
            Wallet wallet,
            BigDecimal amount,
            TransactionType type,
            String categoryLabel,
            String codePrefix,
            String note
    ) {
        Long categoryId = categoryItemRepository
                .findFirstByLabelAndUserIsNullAndIsDeletedFalse(categoryLabel)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_ITEM_NOT_FOUND))
                .getId();

        Transaction walletTx = new Transaction();
        walletTx.setUser(user);
        walletTx.setWallet(wallet);
        walletTx.setAmount(amount);
        walletTx.setType(type);
        walletTx.setStatus(TransactionStatus.SUCCESS);
        walletTx.setTransactionCode(
                codePrefix + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase()
        );
        walletTx.setNote(note);
        walletTx.setCategoryId(categoryId);
        transactionRepository.save(walletTx);
    }

    private FundSummaryResponse toSummary(Fund fund, Long currentUserId) {
        long memberCount = fundMemberRepository.countByFundIdAndStatus(fund.getId(), FundMemberStatus.ACTIVE);
        return FundSummaryResponse.builder()
                .id(fund.getId())
                .name(fund.getName())
                .balance(fund.getBalance())
                .targetAmount(fund.getTargetAmount())
                .coverColorSeed(fund.getCoverColorSeed())
                .isOwner(fund.getOwner().getId().equals(currentUserId))
                .memberCount(memberCount)
                .build();
    }

    private FundDetailResponse toDetail(Fund fund, Long currentUserId) {
        List<FundMember> members = fundMemberRepository
                .findByFundIdAndStatusNotOrderByJoinedAtAsc(fund.getId(), FundMemberStatus.LEFT);

        java.util.Set<Long> leftUserIds = resolveLeftUserIds(fund.getId());

        List<FundTransaction> txs = fundTransactionRepository
                .findByFundIdOrderByCreatedAtDesc(fund.getId());

        return FundDetailResponse.builder()
                .id(fund.getId())
                .name(fund.getName())
                .balance(fund.getBalance())
                .targetAmount(fund.getTargetAmount())
                .coverColorSeed(fund.getCoverColorSeed())
                .isOwner(fund.getOwner().getId().equals(currentUserId))
                .memberCount(members.stream().filter(m -> m.getStatus() == FundMemberStatus.ACTIVE).count())
                .members(members.stream().map(this::toMemberResponse).toList())
                .transactions(txs.stream().map(tx -> toTxResponse(tx, leftUserIds)).toList())
                .build();
    }

    private java.util.Set<Long> resolveLeftUserIds(Long fundId) {
        return fundMemberRepository.findByFundIdAndStatus(fundId, FundMemberStatus.LEFT).stream()
                .map(m -> m.getUser().getId())
                .collect(java.util.stream.Collectors.toSet());
    }

    private FundMemberResponse toMemberResponse(FundMember member) {
        return FundMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .name(member.getUser().getUsername())
                .avatarUrl(member.getUser().getAvatarUrl())
                .role(member.getRole().name())
                .status(member.getStatus().name())
                .contributedAmount(member.getContributedAmount())
                .build();
    }

    private FundTransactionResponse toTxResponse(FundTransaction tx) {
        return toTxResponse(tx, java.util.Collections.emptySet());
    }

    private FundTransactionResponse toTxResponse(FundTransaction tx, java.util.Set<Long> leftUserIds) {
        Long userId = tx.getUser().getId();
        return FundTransactionResponse.builder()
                .id(tx.getId())
                .userId(userId)
                .userName(tx.getUser().getUsername())
                .avatarUrl(tx.getUser().getAvatarUrl())
                .amount(tx.getAmount())
                .type(tx.getType().name())
                .note(tx.getNote())
                .createdAt(tx.getCreatedAt())
                .memberLeft(leftUserIds.contains(userId))
                .build();
    }
}
