package com.project.app.user.entity;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "otp_tokens")
public class OtpToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 6)
    private String otp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpPurpose purpose;

    @Column(nullable = false)
    private Date expiryDate;

    @Column(nullable = false)
    private boolean used = false;

    public OtpToken() {
    }

    public OtpToken(String email, String otp, OtpPurpose purpose, Date expiryDate) {
        this.email = email;
        this.otp = otp;
        this.purpose = purpose;
        this.expiryDate = expiryDate;
    }

    public boolean isExpired() {
        return new Date().after(this.expiryDate);
    }

    public Long getId() { return id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public OtpPurpose getPurpose() { return purpose; }
    public void setPurpose(OtpPurpose purpose) { this.purpose = purpose; }

    public Date getExpiryDate() { return expiryDate; }
    public void setExpiryDate(Date expiryDate) { this.expiryDate = expiryDate; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
}
