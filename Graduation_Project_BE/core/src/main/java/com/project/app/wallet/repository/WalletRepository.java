package com.project.app.wallet.repository;

import com.project.app.wallet.entity.Wallet;
import com.project.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserId(Long userId);
    Optional<Wallet> findByIdAndUserId(Long id, Long userId);
    Optional<Wallet> findByUserIdAndIsDefaultTrue(Long userId);
    Optional<Wallet> findByUserIdAndWalletType(Long userId, com.project.app.wallet.enums.WalletType walletType);
    List<Wallet> findByUserIdAndWalletTypeIn(Long userId, List<com.project.app.wallet.enums.WalletType> walletTypes);
    Optional<Wallet> findByAccountNumber(String accountNumber);

    @Query("SELECT w.user FROM Wallet w WHERE UPPER(TRIM(w.accountNumber)) = UPPER(TRIM(:accountNumber))")
    Optional<User> findUserByAccountNumberIgnoreCase(@org.springframework.data.repository.query.Param("accountNumber") String accountNumber);
    boolean existsByAccountNumber(String accountNumber);
}
