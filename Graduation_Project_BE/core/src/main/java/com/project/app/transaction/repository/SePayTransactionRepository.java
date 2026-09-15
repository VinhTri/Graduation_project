package com.project.app.transaction.repository;

import com.project.app.transaction.entity.SePayTransaction;
import com.project.app.transaction.enums.SePayMatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SePayTransactionRepository extends JpaRepository<SePayTransaction, Long> {
    /**
     * Kiểm tra id sự kiện SePay đã có trong log, bất kể MATCHED/UNMATCHED/IGNORED. Hỗ trợ bỏ qua gửi
     * lặp sau commit; không khóa nên không đủ chống race một mình. Cần unique sepayId và transaction;
     * lỗi cạnh tranh có thể phải xử lý lại.
     */
    boolean existsBySepayId(Long sepayId);

    /**
     * Tra log theo ID ngoài hệ thống, không phải khóa chính nội bộ. Dùng kiểm tra/đối soát, không xác
     * thực key và không tự cộng tiền.
     */
    Optional<SePayTransaction> findBySepayId(Long sepayId);

    /**
     * Tra log có transaction.id khớp; tên _Id đi qua association transaction. Không tìm theo
     * transactionCode. Không khóa ghi.
     */
    Optional<SePayTransaction> findByTransaction_Id(Long transactionId);

    /**
     * Toàn bộ log mới nhất trước, gồm cả chưa khớp/bỏ qua. Không phân trang và không tự tải eager các
     * quan hệ lazy.
     */
    List<SePayTransaction> findAllByOrderByCreatedAtDesc();

    /**
     * Lọc một trạng thái đối soát, mới nhất trước; không thay đổi trạng thái hoặc thử cộng tiền lại.
     */
    List<SePayTransaction> findByMatchStatusOrderByCreatedAtDesc(SePayMatchStatus matchStatus);

    /**
     * Đếm log theo trạng thái, không tính tổng tiền; dùng số liệu đối soát.
     */
    long countByMatchStatus(SePayMatchStatus matchStatus);

    /**
     * LEFT JOIN FETCH log -> Transaction -> User/Wallet để lấy chi tiết trong một truy vấn. LEFT giữ
     * cả log chưa liên kết Transaction, tránh mất UNMATCHED. Sắp xếp mới nhất trước, không phân
     * trang/khóa.
     */
    @Query("SELECT s FROM SePayTransaction s LEFT JOIN FETCH s.transaction t LEFT JOIN FETCH t.user LEFT JOIN FETCH t.wallet ORDER BY s.createdAt DESC")
    List<SePayTransaction> findAllWithDetailsOrderByCreatedAtDesc();
}
