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

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false, updatable = false)
    private Role role;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(name = "failed_password_attempts", nullable = false)
    private int failedPasswordAttempts = 0;

    @Column(name = "failed_pin_attempts", nullable = false)
    private int failedPinAttempts = 0;

    @Column(name = "security_locked", nullable = false)
    private boolean securityLocked = false;

    @Column(name = "security_locked_at")
    private java.time.LocalDateTime securityLockedAt;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /** Ký hiệu tiền tệ: dong | vnd. Mặc định hệ thống: dong (đ). */
    @Column(name = "money_suffix", length = 10)
    private String moneySuffix;

    /** Cách viết số: comma | dot. Mặc định hệ thống: comma (100,000). */
    @Column(name = "money_separator", length = 10)
    private String moneySeparator;

    /** Giao diện: light | dark | system. Mặc định: light. */
    @Column(name = "theme_mode", length = 10)
    private String themeMode;

    /** Ngôn ngữ: vi | en. Mặc định: vi. */
    @Column(name = "app_language", length = 10)
    private String language;

    /** Bật nhắc nhở ghi chép sổ tay mỗi ngày. */
    @Column(name = "notebook_reminder_enabled", nullable = false)
    private boolean notebookReminderEnabled = false;

    /** Giờ nhắc trong ngày (HH:mm). */
    @Column(name = "notebook_reminder_time")
    private java.time.LocalTime notebookReminderTime;

    /** Ngày đã gửi nhắc gần nhất, tránh gửi trùng trong cùng ngày. */
    @Column(name = "notebook_reminder_last_sent_on")
    private java.time.LocalDate notebookReminderLastSentOn;

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

    public int getFailedPasswordAttempts() { return failedPasswordAttempts; }
    public void setFailedPasswordAttempts(int value) { failedPasswordAttempts = value; }
    public int getFailedPinAttempts() { return failedPinAttempts; }
    public void setFailedPinAttempts(int value) { failedPinAttempts = value; }
    public boolean isSecurityLocked() { return securityLocked; }
    public void setSecurityLocked(boolean value) { securityLocked = value; }
    public java.time.LocalDateTime getSecurityLockedAt() { return securityLockedAt; }
    public void setSecurityLockedAt(java.time.LocalDateTime value) { securityLockedAt = value; }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getMoneySuffix() {
        return moneySuffix;
    }

    public void setMoneySuffix(String moneySuffix) {
        this.moneySuffix = moneySuffix;
    }

    public String getMoneySeparator() {
        return moneySeparator;
    }

    public void setMoneySeparator(String moneySeparator) {
        this.moneySeparator = moneySeparator;
    }

    public String resolvedMoneySuffix() {
        return "vnd".equalsIgnoreCase(moneySuffix) ? "vnd" : "dong";
    }

    public String resolvedMoneySeparator() {
        return "dot".equalsIgnoreCase(moneySeparator) ? "dot" : "comma";
    }

    public String getThemeMode() {
        return themeMode;
    }

    public void setThemeMode(String themeMode) {
        this.themeMode = themeMode;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String resolvedThemeMode() {
        if ("dark".equalsIgnoreCase(themeMode) || "system".equalsIgnoreCase(themeMode)) {
            return themeMode.toLowerCase();
        }
        return "light";
    }

    public String resolvedLanguage() {
        return "en".equalsIgnoreCase(language) ? "en" : "vi";
    }

    public boolean isNotebookReminderEnabled() {
        return notebookReminderEnabled;
    }

    public void setNotebookReminderEnabled(boolean notebookReminderEnabled) {
        this.notebookReminderEnabled = notebookReminderEnabled;
    }

    public java.time.LocalTime getNotebookReminderTime() {
        return notebookReminderTime;
    }

    public void setNotebookReminderTime(java.time.LocalTime notebookReminderTime) {
        this.notebookReminderTime = notebookReminderTime;
    }

    public java.time.LocalDate getNotebookReminderLastSentOn() {
        return notebookReminderLastSentOn;
    }

    public void setNotebookReminderLastSentOn(java.time.LocalDate notebookReminderLastSentOn) {
        this.notebookReminderLastSentOn = notebookReminderLastSentOn;
    }
}
