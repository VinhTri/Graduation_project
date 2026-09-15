package com.project.app.wallet.repository;

import com.project.app.wallet.entity.WalletTransaction;
import com.project.app.wallet.enums.WalletTransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    /**
     * Lịch sử ví của user qua association user.id, mới nhất trước; không lọc walletId, loại hay trạng
     * thái và không phân trang. Không bao gồm Transaction chưa có bản ghi lịch sử ví tương ứng.
     */
    List<WalletTransaction> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

    /**
     * Tra cùng mã giao dịch và chủ sở hữu; dùng sửa ghi chú/danh mục của đúng người dùng, kể cả rút
     * tiền chỉ có WalletTransaction. Không khóa ghi.
     */
    Optional<WalletTransaction> findByTransactionCodeAndUser_Id(String transactionCode, Long userId);

    /**
     * SUM theo user, type, category, cửa sổ [from,to). COALESCE trả 0 khi không có dòng. Không lọc ví
     * mặc định, không loại mã quỹ; caller chịu trách nhiệm chọn đúng loại và phạm vi.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.categoryId = :categoryId
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    BigDecimal sumAmountByUserAndTypeAndCategoryAndCreatedAtRange(
            @Param("userId") Long userId,
            @Param("type") WalletTransactionType type,
            @Param("categoryId") Long categoryId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /**
     * GROUP BY categoryId, trả mỗi Object[] = [categoryId, tổng amount]. Chỉ danh mục khác null;
     * khoảng [from,to] bao gồm cả hai đầu. Loại FDEP/FWD nhưng giữ mã null. Dùng báo cáo phân bổ, khác
     * truy vấn hạn mức không loại quỹ.
     */
    @Query("""
            SELECT t.categoryId, COALESCE(SUM(t.amount), 0) FROM WalletTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.categoryId IS NOT NULL
              AND t.createdAt >= :from
              AND t.createdAt <= :to
              AND (t.transactionCode IS NULL OR (t.transactionCode NOT LIKE 'FDEP%' AND t.transactionCode NOT LIKE 'FWD%'))
            GROUP BY t.categoryId
            """)
    List<Object[]> sumByCategoryForUserAndTypeAndCreatedAtRange(
            @Param("userId") Long userId,
            @Param("type") WalletTransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /**
     * SUM theo user + type trong [from,to), COALESCE=0. Đây là nguồn WalletLimitHelper tính WITHDRAW
     * đã dùng. Không lọc walletId/default/status, không loại FDEP/FWD. Không khóa bản ghi; caller phải
     * khóa ví khi dùng kết quả để quyết định chi tiền.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t
            WHERE t.user.id = :userId
              AND t.type = :type
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    BigDecimal sumAmountByUserAndTypeAndCreatedAtRange(
            @Param("userId") Long userId,
            @Param("type") WalletTransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /** Tổng dòng tiền Ví thuần, không tính các bản ghi đối ứng do nghiệp vụ Quỹ tạo ra. */
    /**
     * Tổng ví mặc định theo user/type trong [from,to] bao gồm hai đầu. Loại prefix FDEP/FWD để bỏ luân
     * chuyển quỹ. SQL NOT LIKE với NULL không true, nên mã null cũng không được lấy. COALESCE=0; phục
     * vụ báo cáo, không phải cùng định nghĩa cửa sổ hạn mức.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM WalletTransaction t
            WHERE t.user.id = :userId
              AND t.wallet.isDefault = true
              AND t.type = :type
              AND t.createdAt >= :from
              AND t.createdAt <= :to
              AND t.transactionCode NOT LIKE 'FDEP%'
              AND t.transactionCode NOT LIKE 'FWD%'
            """)
    BigDecimal sumWalletOnlyAmountByUserAndTypeAndCreatedAtBetween(
            @Param("userId") Long userId,
            @Param("type") WalletTransactionType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
