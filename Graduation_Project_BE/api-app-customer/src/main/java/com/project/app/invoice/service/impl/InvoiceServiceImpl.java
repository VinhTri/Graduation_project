package com.project.app.invoice.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.invoice.dto.request.InvoiceRequest;
import com.project.app.invoice.dto.response.InvoiceResponse;
import com.project.app.invoice.entity.Invoice;
import com.project.app.invoice.repository.InvoiceRepository;
import com.project.app.invoice.service.InvoiceService;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.project.app.wallet.service.WalletService;
import com.project.app.wallet.repository.WalletRepository;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.wallet.entity.Wallet;
import java.math.BigDecimal;
import java.util.UUID;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(User user, InvoiceRequest request) {
        Invoice invoice = Invoice.builder()
                .invoiceName(request.getInvoiceName())
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .reminderOption(request.getReminderOption())
                .reminderTime(request.getReminderTime())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .oldReading(request.getOldReading())
                .newReading(request.getNewReading())
                .pricePerKwh(request.getPricePerKwh())
                .isPaid(request.isPaid())
                .user(user)
                .build();

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(savedInvoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoices(User user) {
        List<Invoice> invoices = invoiceRepository.findByUserOrderByDueDateAsc(user);
        return invoices.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id, User user) {
        Invoice invoice = getInvoice(id, user);
        return mapToResponse(invoice);
    }

    @Override
    @Transactional
    public InvoiceResponse updateInvoice(Long id, User user, InvoiceRequest request) {
        Invoice invoice = getInvoice(id, user);
        
        boolean reminderChanged = false;
        if (request.getReminderOption() != null && !request.getReminderOption().equals(invoice.getReminderOption())) reminderChanged = true;
        if (request.getReminderTime() != null && !request.getReminderTime().equals(invoice.getReminderTime())) reminderChanged = true;
        if (request.getDueDate() != null && !request.getDueDate().equals(invoice.getDueDate())) reminderChanged = true;
        
        invoice.setInvoiceName(request.getInvoiceName());
        invoice.setAmount(request.getAmount());
        invoice.setDueDate(request.getDueDate());
        invoice.setReminderOption(request.getReminderOption());
        invoice.setReminderTime(request.getReminderTime());
        invoice.setStartDate(request.getStartDate());
        invoice.setEndDate(request.getEndDate());
        invoice.setOldReading(request.getOldReading());
        invoice.setNewReading(request.getNewReading());
        invoice.setPricePerKwh(request.getPricePerKwh());
        invoice.setPaid(request.isPaid());
        
        if (reminderChanged) {
            invoice.setNotified(false);
        }
        
        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(updatedInvoice);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id, User user) {
        Invoice invoice = getInvoice(id, user);
        invoiceRepository.delete(invoice);
    }

    @Override
    @Transactional
    public InvoiceResponse updateInvoiceStatus(Long id, User user, boolean isPaid) {
        Invoice invoice = getInvoice(id, user);
        invoice.setPaid(isPaid);
        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(updatedInvoice);
    }
    
    @Override
    @Transactional
    public InvoiceResponse payInvoiceWithCash(Long id, User user) {
        Invoice invoice = getInvoice(id, user);
        if (invoice.isPaid()) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // Already paid
        }

        Wallet cashWallet = walletService.getOrCreateCashWallet(user.getId());
        BigDecimal amount = invoice.getAmount();
        
        if (cashWallet.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // Deduct balance
        cashWallet.setBalance(cashWallet.getBalance().subtract(amount));
        walletRepository.save(cashWallet);

        // Create transaction history
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setWallet(cashWallet);
        transaction.setAmount(amount);
        transaction.setType(TransactionType.EXPENSE);
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setTransactionCode("INV-" + invoice.getId() + "-" + System.currentTimeMillis());
        transaction.setNote("Thanh toán hóa đơn: " + invoice.getInvoiceName());
        transactionRepository.save(transaction);

        // Mark as paid
        invoice.setPaid(true);
        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return mapToResponse(updatedInvoice);
    }
    
    private Invoice getInvoice(Long id, User user) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));
                
        if (!invoice.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        return invoice;
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceName(invoice.getInvoiceName())
                .amount(invoice.getAmount())
                .dueDate(invoice.getDueDate())
                .reminderOption(invoice.getReminderOption())
                .reminderTime(invoice.getReminderTime())
                .startDate(invoice.getStartDate())
                .endDate(invoice.getEndDate())
                .oldReading(invoice.getOldReading())
                .newReading(invoice.getNewReading())
                .pricePerKwh(invoice.getPricePerKwh())
                .isPaid(invoice.isPaid())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
