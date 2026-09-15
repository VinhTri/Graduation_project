package com.project.app.transaction.repository;

import com.project.app.transaction.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * JOIN FETCH user/wallet để lấy giao dịch và hai đối tượng trong cùng truy vấn, phục vụ quản trị
     * tránh lazy load từng dòng. INNER JOIN chỉ lấy dòng có đủ quan hệ; không lọc người dùng/trạng
     * thái và không phân trang. Tầng API phải kiểm tra quyền admin.
     */
    @Query("SELECT t FROM Transaction t JOIN FETCH t.user JOIN FETCH t.wallet ORDER BY t.createdAt DESC")
    List<Transaction> findAllWithUserAndWalletOrderByCreatedAtDesc();

    /**
     * Tra mã nghiệp vụ, không phải ID database. Query không có userId và không khóa: caller phải kiểm
     * tra transaction.user trước trả dữ liệu/sửa. Mã trả lúc tạo QR không được save nên có thể không
     * tìm thấy ở đây.
     */
    Optional<Transaction> findByTransactionCode(String transactionCode);
    
    /**
     * Lọc chủ, loại, trạng thái và createdAt lớn hơn mốc (không bao gồm mốc), lấy một bản ghi mới
     * nhất. Đây là heuristic tìm giao dịch gần đây, không đối chiếu riêng request/reference và không
     * dùng để chứng minh một QR cụ thể đã được thanh toán.
     */
    Optional<Transaction> findFirstByUserAndTypeAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            com.project.app.user.entity.User user, 
            com.project.app.transaction.enums.TransactionType type, 
            com.project.app.transaction.enums.TransactionStatus status, 
            java.time.LocalDateTime createdAt
    );

    /**
     * Lọc user/type/status trong khoảng BETWEEN bao gồm cả đầu/cuối; không có thứ tự mặc định. Khi
     * chia báo cáo theo ngày liên tiếp cần chú ý giao dịch đúng biên có thể được tính ở cả hai khoảng.
     */
    java.util.List<Transaction> findByUserAndTypeAndStatusAndCreatedAtBetween(
            com.project.app.user.entity.User user,
            com.project.app.transaction.enums.TransactionType type,
            com.project.app.transaction.enums.TransactionStatus status,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate
    );

    /**
     * Lịch sử bảng transactions theo user, mới nhất trước. Không tự hợp nhất wallet_transactions và
     * không phân trang; rút tiền qua WalletTransactionService có thể chỉ tồn tại ở bảng ví.
     */
    java.util.List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Lọc type và note chứa chuỗi không phân biệt hoa thường, mới nhất trước. Không lọc user/status;
     * note là dữ liệu hiển thị có thể thay đổi, không dùng như khóa xác thực hoặc căn cứ duy nhất đối
     * soát.
     */
    java.util.List<Transaction> findByTypeAndNoteContainingIgnoreCaseOrderByCreatedAtDesc(
            com.project.app.transaction.enums.TransactionType type,
            String note
    );

    /**
     * Lịch sử Transaction của user gắn ví hiện có isDefault=true, mới nhất trước. Không lọc trạng
     * thái/loại và không bao gồm lịch sử chỉ có WalletTransaction.
     */
    java.util.List<Transaction> findByUserIdAndWallet_IsDefaultTrueOrderByCreatedAtDesc(Long userId);

    /**
     * Lọc đồng thời chủ giao dịch và ví, mới nhất trước; không lọc status. Là truy vấn đọc lịch sử,
     * không khóa ví và không xác minh tài khoản ngân hàng.
     */
    java.util.List<Transaction> findByUserIdAndWalletIdOrderByCreatedAtDesc(Long userId, Long walletId);

    /**
     * Xóa Transaction theo wallet.id trong transaction của caller. Không có userId: phải kiểm tra
     * quyền trước khi gọi. Không tự hoàn tiền, không tự xóa WalletTransaction/log SePay; quan hệ DB có
     * thể chặn xóa. Không dùng như hủy giao dịch ngân hàng.
     */
    void deleteAllByWalletId(Long walletId);

    /**
     * Kiểm tra user có ít nhất một Transaction trong BETWEEN [startDate,endDate]. Không lọc status,
     * nên có bản ghi không đồng nghĩa có thanh toán thành công. Không khóa và không đặt chỗ cho giao
     * dịch mới.
     */
    boolean existsByUserIdAndCreatedAtBetween(Long userId, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);

    /**
     * Chọn giao dịch user, một type, status, ví mặc định, trong [startDate,endDate]. Không ORDER BY,
     * không tổng hợp; caller phải chọn SUCCESS nếu chỉ muốn giao dịch thành công.
     */
    java.util.List<Transaction> findByUserAndTypeAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
            com.project.app.user.entity.User user,
            com.project.app.transaction.enums.TransactionType type,
            com.project.app.transaction.enums.TransactionStatus status,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate
    );

    /**
     * Giống bộ lọc ví mặc định nhưng type IN danh sách (ví dụ WITHDRAW/TRANSFER cho dòng tiền ra).
     * BETWEEN bao gồm hai đầu; không tự loại chuyển quỹ hoặc chống trùng với WalletTransaction.
     */
    java.util.List<Transaction> findByUserAndTypeInAndStatusAndWallet_IsDefaultTrueAndCreatedAtBetween(
            com.project.app.user.entity.User user,
            java.util.List<com.project.app.transaction.enums.TransactionType> types,
            com.project.app.transaction.enums.TransactionStatus status,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate
    );

    /**
     * COALESCE SUM theo walletId, type IN, status và createdAt >= startOfDay. Tên có daily nhưng JPQL
     * KHÔNG có cận trên ngày: caller chịu trách nhiệm mốc và phạm vi. Không khóa, không cộng
     * WalletTransaction; WalletLimitHelper hiện dùng repository lịch sử ví khác.
     */
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.wallet.id = :walletId " +
           "AND t.type IN :types AND t.status = :status AND t.createdAt >= :startOfDay")
    java.math.BigDecimal sumDailyTransactedAmount(
            @org.springframework.data.repository.query.Param("walletId") Long walletId, 
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay
    );

    /**
     * SUM theo một wallet/type/status và [from,to), trả 0 khi rỗng. Khoảng nửa mở tránh tính trùng mốc
     * ngày; không kiểm tra chủ ví trong query, caller phải cấp walletId hợp lệ.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.wallet.id = :walletId
              AND t.type = :type
              AND t.status = :status
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    java.math.BigDecimal sumAmountByWalletAndTypeAndCreatedAtRange(
            @org.springframework.data.repository.query.Param("walletId") Long walletId,
            @org.springframework.data.repository.query.Param("type") com.project.app.transaction.enums.TransactionType type,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );

    /**
     * SUM Transaction của user, ví mặc định, type IN, status, khoảng [from,to] bao gồm hai đầu. Không
     * chống trùng nếu caller cộng thêm toàn bộ WalletTransaction và không tự loại prefix quỹ.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId
              AND t.wallet.isDefault = true
              AND t.type IN :types
              AND t.status = :status
              AND t.createdAt >= :from
              AND t.createdAt <= :to
            """)
    java.math.BigDecimal sumAmountByUserDefaultWalletAndTypesAndStatusAndCreatedAtBetween(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );

    /**
     * Tổng bù dữ liệu Transaction của user/ví mặc định/type/status trong [from,to]. NOT EXISTS
     * WalletTransaction cùng user và transactionCode tránh đếm lại giao dịch đã có lịch sử ví. Orphan
     * ở đây là thiếu bản ghi đối ứng theo mã, không phải mất User/Wallet và không liên quan cascade
     * orphanRemoval.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId
              AND t.wallet.isDefault = true
              AND t.type = :type
              AND t.status = :status
              AND t.createdAt >= :from
              AND t.createdAt <= :to
              AND NOT EXISTS (
                  SELECT 1 FROM WalletTransaction wt
                  WHERE wt.user.id = :userId
                    AND wt.transactionCode = t.transactionCode
              )
            """)
    java.math.BigDecimal sumOrphanAmountByUserDefaultWalletAndTypeAndStatusAndCreatedAtBetween(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("type") com.project.app.transaction.enums.TransactionType type,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );

    /**
     * SUM theo user, type IN, status, categoryId, [from,to). COALESCE=0. Không giới hạn ví mặc định,
     * không chống trùng với WalletTransaction; caller chọn đúng nguồn báo cáo.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId
              AND t.type IN :types
              AND t.status = :status
              AND t.categoryId = :categoryId
              AND t.createdAt >= :from
              AND t.createdAt < :to
            """)
    java.math.BigDecimal sumAmountByUserAndTypesAndStatusAndCategoryAndCreatedAtRange(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("categoryId") Long categoryId,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );

    /**
     * Tổng bù theo danh mục và khoảng [from,to), chỉ lấy Transaction chưa có WalletTransaction cùng
     * user/mã. Lọc user/type IN/status/category. NOT EXISTS không so amount/type hai bảng; tính đúng
     * phụ thuộc các luồng ghi mã nhất quán.
     */
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId
              AND t.type IN :types
              AND t.status = :status
              AND t.categoryId = :categoryId
              AND t.createdAt >= :from
              AND t.createdAt < :to
              AND NOT EXISTS (
                  SELECT 1 FROM WalletTransaction wt
                  WHERE wt.user.id = :userId
                    AND wt.transactionCode = t.transactionCode
              )
            """)
    java.math.BigDecimal sumOrphanAmountByUserAndTypesAndStatusAndCategoryAndCreatedAtRange(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("categoryId") Long categoryId,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );

    /**
     * GROUP BY categoryId trả [categoryId, tổng amount]. Lọc user/type IN/status và danh mục khác
     * null; thực tế khoảng [from,to] bao gồm cả hai đầu dù tên hàm là Range. Loại FDEP/FWD (giữ mã
     * null), NOT EXISTS lịch sử ví cùng user/mã để bù dữ liệu cũ mà không đếm trùng. COALESCE áp trong
     * từng nhóm; không có nhóm thì danh sách rỗng.
     */
    @Query("""
            SELECT t.categoryId, COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.user.id = :userId
              AND t.type IN :types
              AND t.status = :status
              AND t.categoryId IS NOT NULL
              AND t.createdAt >= :from
              AND t.createdAt <= :to
              AND (t.transactionCode IS NULL OR (t.transactionCode NOT LIKE 'FDEP%' AND t.transactionCode NOT LIKE 'FWD%'))
              AND NOT EXISTS (
                  SELECT 1 FROM WalletTransaction wt
                  WHERE wt.user.id = :userId AND wt.transactionCode = t.transactionCode
              )
            GROUP BY t.categoryId
            """)
    java.util.List<Object[]> sumOrphanByCategoryForUserAndTypesAndStatusAndCreatedAtRange(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("types") java.util.List<com.project.app.transaction.enums.TransactionType> types,
            @org.springframework.data.repository.query.Param("status") com.project.app.transaction.enums.TransactionStatus status,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to
    );
}
