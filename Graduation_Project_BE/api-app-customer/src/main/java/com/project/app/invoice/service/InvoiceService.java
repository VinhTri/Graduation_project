package com.project.app.invoice.service;

import com.project.app.invoice.dto.request.InvoiceRequest;
import com.project.app.invoice.dto.response.InvoiceResponse;
import com.project.app.user.entity.User;

import java.util.List;

public interface InvoiceService {
    InvoiceResponse createInvoice(User user, InvoiceRequest request);
    List<InvoiceResponse> getInvoices(User user);
    InvoiceResponse getInvoiceById(Long id, User user);
    InvoiceResponse updateInvoice(Long id, User user, InvoiceRequest request);
    void deleteInvoice(Long id, User user);
    InvoiceResponse updateInvoiceStatus(Long id, User user, boolean isPaid);
    InvoiceResponse payInvoiceWithCash(Long id, User user);
}
