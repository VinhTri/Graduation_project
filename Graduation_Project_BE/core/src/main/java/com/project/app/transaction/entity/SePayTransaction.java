package com.project.app.transaction.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "sepay_transactions")
public class SePayTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sepay_id", unique = true, nullable = false)
    private Long sepayId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    public SePayTransaction() {
    }

    public SePayTransaction(Long sepayId, Transaction transaction) {
        this.sepayId = sepayId;
        this.transaction = transaction;
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

    public Transaction getTransaction() {
        return transaction;
    }

    public void setTransaction(Transaction transaction) {
        this.transaction = transaction;
    }
}
