package com.project.app.auth.service;

import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AccountSecurityService {
    public static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordPasswordFailure(Long userId) {
        User user = userRepository.findSecurityByIdForUpdate(userId).orElseThrow();
        user.setFailedPasswordAttempts(user.getFailedPasswordAttempts() + 1);
        return lockIfNeeded(user, user.getFailedPasswordAttempts());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordPinFailure(Long userId) {
        User user = userRepository.findSecurityByIdForUpdate(userId).orElseThrow();
        user.setFailedPinAttempts(user.getFailedPinAttempts() + 1);
        return lockIfNeeded(user, user.getFailedPinAttempts());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetPasswordFailures(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getFailedPasswordAttempts() != 0) {
            user.setFailedPasswordAttempts(0);
            userRepository.save(user);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetPinFailures(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getFailedPinAttempts() != 0) {
            user.setFailedPinAttempts(0);
            userRepository.save(user);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void unlock(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setSecurityLocked(false);
        user.setSecurityLockedAt(null);
        user.setFailedPasswordAttempts(0);
        user.setFailedPinAttempts(0);
        userRepository.save(user);
    }

    private boolean lockIfNeeded(User user, int attempts) {
        boolean newlyLocked = attempts >= MAX_FAILED_ATTEMPTS && !user.isSecurityLocked();
        if (newlyLocked) {
            user.setSecurityLocked(true);
            user.setSecurityLockedAt(LocalDateTime.now());
        }
        userRepository.save(user);
        return user.isSecurityLocked();
    }
}
