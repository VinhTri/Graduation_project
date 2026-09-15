package com.project.app.wallet.repository;

import com.project.app.wallet.entity.Wallet;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    /**
     * Danh sách mọi ví có user.id khớp; không lọc loại/default, không sắp xếp, không khóa ghi.
     */
    List<Wallet> findByUserId(Long userId);
    /**
     * SELECT ví theo đồng thời id và chủ sở hữu; tránh truy cập chéo bằng ID. Optional rỗng nếu không
     * thuộc user; không phân biệt không tồn tại/không có quyền. Không khóa ghi.
     */
    Optional<Wallet> findByIdAndUserId(Long id, Long userId);
    /**
     * Đọc ví mặc định của user, không PESSIMISTIC_WRITE. Dùng hiển thị/chọn ví; thao tác tiền cần dùng
     * truy vấn khóa hoặc kiểm soát version.
     */
    Optional<Wallet> findByUserIdAndIsDefaultTrue(Long userId);

    /**
     * JPQL lọc user.id và isDefault=true, gắn PESSIMISTIC_WRITE. DB thường thực thi SELECT FOR UPDATE;
     * khóa giữ đến khi transaction caller commit/rollback. Dùng bảo vệ kiểm tra số dư/hạn mức rồi cập
     * nhật. Không tự tạo ví, không khóa toàn bộ bảng, không làm thay caller kiểm tra sở hữu ngân hàng.
     * Yêu cầu transaction đang hoạt động.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.user.id = :userId AND w.isDefault = true")
    Optional<Wallet> findDefaultWalletForUpdate(
            @org.springframework.data.repository.query.Param("userId") Long userId);
    /**
     * Đọc ví theo chủ và loại; Optional chỉ phù hợp khi dữ liệu có tối đa một kết quả. Không khóa,
     * không tự bảo đảm unique trong schema.
     */
    Optional<Wallet> findByUserIdAndWalletType(Long userId, com.project.app.wallet.enums.WalletType walletType);
    /**
     * Đọc các ví thuộc user và loại nằm trong danh sách; không sắp xếp hoặc khóa ghi.
     */
    List<Wallet> findByUserIdAndWalletTypeIn(Long userId, List<com.project.app.wallet.enums.WalletType> walletTypes);
    /**
     * Tra định danh ví toàn hệ thống, dùng webhook và tìm bên nhận chuyển nội bộ. Không lọc userId vì
     * bên nhận có thể là người khác. Không có @Lock; cập nhật sau đọc này dựa vào Wallet.@Version để
     * phát hiện xung đột, chưa tự retry.
     */
    Optional<Wallet> findByAccountNumber(String accountNumber);

    /**
     * JPQL chọn User thông qua Wallet; UPPER/TRIM ở cả hai vế hỗ trợ tra người nhận theo định danh ví.
     * Không cộng/trừ tiền; không khóa. Khác findByAccountNumber không chuẩn hóa chuỗi trong câu truy
     * vấn.
     */
    @Query("SELECT w.user FROM Wallet w WHERE UPPER(TRIM(w.accountNumber)) = UPPER(TRIM(:accountNumber))")
    Optional<User> findUserByAccountNumberIgnoreCase(@org.springframework.data.repository.query.Param("accountNumber") String accountNumber);
    /**
     * Kiểm tra định danh ví đã dùng, hỗ trợ sinh số tài khoản. EXISTS không đặt chỗ hoặc khóa giá trị;
     * ràng buộc unique DB vẫn cần để xử lý hai lần tạo đồng thời.
     */
    boolean existsByAccountNumber(String accountNumber);
}
