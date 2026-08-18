package com.project.app.invoice.service.impl;

import com.project.app.common.exception.AppException;
import com.project.app.common.exception.ErrorCode;
import com.project.app.invoice.dto.request.InvoiceRequest;
import com.project.app.invoice.dto.response.InvoiceResponse;
import com.project.app.invoice.entity.Invoice;
import com.project.app.invoice.repository.InvoiceRepository;
import com.project.app.invoice.service.InvoiceService;
import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.entity.NotebookTransaction;
import com.project.app.notebook.enums.NotebookTransactionType;
import com.project.app.notebook.repository.NotebookBookRepository;
import com.project.app.notebook.repository.NotebookTransactionRepository;
import com.project.app.notebook.service.impl.NotebookBookServiceImpl;
import com.project.app.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final NotebookBookServiceImpl notebookBookService;
    private final NotebookBookRepository notebookBookRepository;
    private final NotebookTransactionRepository notebookTransactionRepository;

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
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        NotebookBook book = notebookBookService.getOrCreateCashBookEntity(user.getId());
        BigDecimal amount = invoice.getAmount();

        if (book.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.NOTEBOOK_INSUFFICIENT_BALANCE);
        }

        book.setBalance(book.getBalance().subtract(amount));
        notebookBookRepository.save(book);

        String transactionCode = "INV-" + invoice.getId() + "-"
                + System.currentTimeMillis()
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        notebookTransactionRepository.save(NotebookTransaction.builder()
                .user(user)
                .book(book)
                .amount(amount)
                .type(NotebookTransactionType.EXPENSE)
                .note("Thanh toán hóa đơn: " + invoice.getInvoiceName())
                .categoryId(null)
                .categoryName("Hóa đơn")
                .transactionCode(transactionCode)
                .build());

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
