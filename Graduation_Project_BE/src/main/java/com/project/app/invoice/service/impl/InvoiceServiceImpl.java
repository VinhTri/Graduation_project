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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(User user, InvoiceRequest request) {
        Invoice invoice = Invoice.builder()
                .invoiceName(request.getInvoiceName())
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .reminderOption(request.getReminderOption())
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
        
        invoice.setInvoiceName(request.getInvoiceName());
        invoice.setAmount(request.getAmount());
        invoice.setDueDate(request.getDueDate());
        invoice.setReminderOption(request.getReminderOption());
        invoice.setPaid(request.isPaid());
        
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
                .isPaid(invoice.isPaid())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
