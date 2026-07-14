package com.project.app.user.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 150, updatable = false)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Column(length = 100)
    private String pinCode;

    @Column(name = "failed_pin_attempts", nullable = false)
    private int failedPinAttempts = 0;

    @Column(name = "lockout_time")
    private java.time.LocalDateTime lockoutTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false, updatable = false)
    private Role role;

    @Column(nullable = false)
    private boolean isActive = true;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    public User() {
    }

    public User(String username, String email, String password, Role role, boolean isActive) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.isActive = isActive;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }

    public Role getRole() {
        return role;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public int getFailedPinAttempts() {
        return failedPinAttempts;
    }

    public void incrementFailedPin() {
        this.failedPinAttempts++;
    }

    public void resetFailedPin() {
        this.failedPinAttempts = 0;
        this.lockoutTime = null;
    }

    public java.time.LocalDateTime getLockoutTime() {
        return lockoutTime;
    }

    public void setLockoutTime(java.time.LocalDateTime lockoutTime) {
        this.lockoutTime = lockoutTime;
    }

    public boolean isLocked() {
        if (lockoutTime == null) {
            return false;
        }
        if (java.time.LocalDateTime.now().isAfter(lockoutTime)) {
            lockoutTime = null;
            failedPinAttempts = 0;
            return false;
        }
        return true;
    }
}
