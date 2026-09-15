package com.project.app.invoice.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.invoice.dto.request.InvoiceRequest;
import com.project.app.invoice.dto.response.InvoiceResponse;
import com.project.app.invoice.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody InvoiceRequest request) {
        
        InvoiceResponse response = invoiceService.createInvoice(userDetails.getUser(), request);
        
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message("Tạo hóa đơn thành công")
                .data(response)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoices(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<InvoiceResponse> response = invoiceService.getInvoices(userDetails.getUser());
        
        return ResponseEntity.ok(ApiResponse.<List<InvoiceResponse>>builder()
                .success(true)
                .message("Lấy danh sách hóa đơn thành công")
                .data(response)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        InvoiceResponse response = invoiceService.getInvoiceById(id, userDetails.getUser());
        
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message("Lấy thông tin hóa đơn thành công")
                .data(response)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody InvoiceRequest request) {
        
        InvoiceResponse response = invoiceService.updateInvoice(id, userDetails.getUser(), request);
        
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message("Cập nhật hóa đơn thành công")
                .data(response)
                .build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoiceStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestParam boolean isPaid) {
        
        InvoiceResponse response = invoiceService.updateInvoiceStatus(id, userDetails.getUser(), isPaid);
        
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message("Cập nhật trạng thái hóa đơn thành công")
                .data(response)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        
        invoiceService.deleteInvoice(id, userDetails.getUser());
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa hóa đơn thành công")
                .build());
    }
}
