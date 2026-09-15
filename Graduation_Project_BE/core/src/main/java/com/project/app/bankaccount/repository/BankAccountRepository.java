package com.project.app.bankaccount.repository;

import com.project.app.bankaccount.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
    /**
     * Danh sách tài khoản ngân hàng đã lưu cho user, dùng chọn đích rút. Không gọi ngân hàng và không
     * xác minh lại trạng thái tài khoản.
     */
    List<BankAccount> findByUserId(Long userId);
    
    /**
     * Tra id tài khoản liên kết cùng userId; điều kiện quyền sở hữu bắt buộc trước payout. Đây là sở
     * hữu bản ghi trong app, không phải chứng minh danh tính ngân hàng ngoài hệ thống.
     */
    Optional<BankAccount> findByIdAndUserId(Long id, Long userId);
    
    /**
     * Kiểm tra số tài khoản đã liên kết với user; chưa bao gồm bankCode nên số trùng ở hai ngân hàng
     * cũng bị xem như trùng. EXISTS không khóa, không thay ràng buộc unique.
     */
    boolean existsByAccountNumberAndUserId(String accountNumber, Long userId);
}
