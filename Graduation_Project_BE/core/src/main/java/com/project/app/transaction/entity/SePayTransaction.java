package com.project.app.transaction.entity;

import com.project.app.transaction.enums.SePayMatchStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sepay_transactions")
public class SePayTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sepay_id", unique = true, nullable = false)
    private Long sepayId;

    @Column(name = "gateway")
    private String gateway;

    @Column(name = "transaction_date")
    private String transactionDate;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "content", length = 1000)
    private String content;

    @Column(name = "transfer_type")
    private String transferType;

    @Column(name = "transfer_amount", precision = 19, scale = 2)
    private BigDecimal transferAmount;

    @Column(name = "reference_code")
    private String referenceCode;

    @Column(name = "parsed_wallet_account")
    private String parsedWalletAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_status", length = 32)
    private SePayMatchStatus matchStatus;

    @Column(name = "match_note", length = 500)
    private String matchNote;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (matchStatus == null) {
            matchStatus = transaction != null ? SePayMatchStatus.MATCHED : SePayMatchStatus.UNMATCHED;
        }
    }

    public SePayTransaction() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSepayId() {
        return sepayId;
    }

    public void setSepayId(Long sepayId) {
        this.sepayId = sepayId;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public String getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(String transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getTransferType() {
        return transferType;
    }

    public void setTransferType(String transferType) {
        this.transferType = transferType;
    }

    public BigDecimal getTransferAmount() {
        return transferAmount;
    }

    public void setTransferAmount(BigDecimal transferAmount) {
        this.transferAmount = transferAmount;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
    }

    public String getParsedWalletAccount() {
        return parsedWalletAccount;
    }

    public void setParsedWalletAccount(String parsedWalletAccount) {
        this.parsedWalletAccount = parsedWalletAccount;
    }

    public SePayMatchStatus getMatchStatus() {
        return matchStatus;
    }

    public void setMatchStatus(SePayMatchStatus matchStatus) {
        this.matchStatus = matchStatus;
    }

    public String getMatchNote() {
        return matchNote;
    }

    public void setMatchNote(String matchNote) {
        this.matchNote = matchNote;
    }

    public Transaction getTransaction() {
        return transaction;
    }

    public void setTransaction(Transaction transaction) {
        this.transaction = transaction;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
