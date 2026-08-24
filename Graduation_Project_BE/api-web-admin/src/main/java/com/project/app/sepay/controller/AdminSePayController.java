package com.project.app.sepay.controller;

import com.project.app.common.dto.ApiResponse;
import com.project.app.audit.service.AdminAuditService;
import com.project.app.auth.security.CustomUserDetails;
import com.project.app.sepay.dto.request.ManualCreditRequest;
import com.project.app.sepay.dto.response.ReconciliationReportResponse;
import com.project.app.sepay.dto.response.SePayTransactionResponse;
import com.project.app.sepay.service.AdminSePayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/sepay")
@RequiredArgsConstructor
public class AdminSePayController {

    private final AdminSePayService adminSePayService;
    private final AdminAuditService auditService;

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SePayTransactionResponse>>> getHistory() {
        List<SePayTransactionResponse> data = adminSePayService.getSePayHistory();
        return ResponseEntity.ok(ApiResponse.<List<SePayTransactionResponse>>builder()
                .success(true)
                .message("Lấy lịch sử webhook/giao dịch SePay thành công")
                .data(data)
                .build());
    }

    @GetMapping("/reconciliation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReconciliationReportResponse>> previewReconciliation() {
        ReconciliationReportResponse report = adminSePayService.runReconciliation(false);
        return ResponseEntity.ok(ApiResponse.<ReconciliationReportResponse>builder()
                .success(true)
                .message("Xem trước kết quả đối soát thành công")
                .data(report)
                .build());
    }

    @PostMapping("/reconciliation/run")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReconciliationReportResponse>> runReconciliation(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ReconciliationReportResponse report = adminSePayService.runReconciliation(true);
        auditService.record(userDetails.getUser(), "SEPAY_RECONCILIATION_RUN", "SEPAY", null,
                "Chạy đối soát và cập nhật trạng thái khớp");
        return ResponseEntity.ok(ApiResponse.<ReconciliationReportResponse>builder()
                .success(true)
                .message("Đã chạy đối soát và cập nhật trạng thái khớp")
                .data(report)
                .build());
    }

    @PostMapping("/transactions/{id}/credit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SePayTransactionResponse>> manualCredit(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ManualCreditRequest request
    ) {
        SePayTransactionResponse data = adminSePayService.manualCredit(id, request);
        auditService.record(userDetails.getUser(), "SEPAY_MANUAL_CREDIT", "SEPAY_TRANSACTION", id,
                "Cộng tiền thủ công sau đối soát; mã nội bộ " + data.getInternalTransactionCode()
                        + "; lý do: " + request.getReason().trim());
        return ResponseEntity.ok(ApiResponse.<SePayTransactionResponse>builder()
                .success(true)
                .message("Đã cộng tiền thủ công vào ví và khớp giao dịch SePay")
                .data(data)
                .build());
    }
}
