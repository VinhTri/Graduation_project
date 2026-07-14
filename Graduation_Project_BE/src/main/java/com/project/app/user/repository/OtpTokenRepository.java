package com.project.app.user.repository;

import com.project.app.user.entity.OtpPurpose;
import com.project.app.user.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByEmailAndOtpAndPurposeAndUsedFalse(String email, String otp, OtpPurpose purpose);

    @Transactional
    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.email = :email AND o.purpose = :purpose")
    void deleteByEmailAndPurpose(@Param("email") String email, @Param("purpose") OtpPurpose purpose);
}
