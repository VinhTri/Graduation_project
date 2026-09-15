package com.project.app.control.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.control.dto.FinanceCaseRequest;
import com.project.app.control.dto.ResolveCaseRequest;
import com.project.app.control.entity.FinanceCase;
import com.project.app.control.service.AdminControlCenterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/control-center")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminControlCenterController {
    private final AdminControlCenterService service;

    @GetMapping("/transactions") public ResponseEntity<ApiResponse<Map<String,Object>>> transactions() { return ok("Lấy trung tâm giao dịch thành công", service.transactions()); }
    @GetMapping("/reports") public ResponseEntity<ApiResponse<Map<String,Object>>> reports() { return ok("Tạo báo cáo vận hành thành công", service.report()); }
    @GetMapping("/alerts") public ResponseEntity<ApiResponse<List<Map<String,Object>>>> alerts() { return ok("Lấy cảnh báo thành công", service.alerts()); }
    @GetMapping("/cases") public ResponseEntity<ApiResponse<List<FinanceCase>>> cases() { return ok("Lấy hồ sơ sự cố thành công", service.cases()); }

    @PostMapping("/cases")
    public ResponseEntity<ApiResponse<FinanceCase>> create(@Valid @RequestBody FinanceCaseRequest request, @AuthenticationPrincipal CustomUserDetails admin) {
        return ok("Đã tạo hồ sơ sự cố", service.createCase(request, admin.getUser()));
    }

    @PutMapping("/cases/{id}/resolve")
    public ResponseEntity<ApiResponse<FinanceCase>> resolve(@PathVariable Long id, @Valid @RequestBody ResolveCaseRequest request, @AuthenticationPrincipal CustomUserDetails admin) {
        return ok("Đã đóng hồ sơ sự cố", service.resolveCase(id, request.resolutionNote(), admin.getUser()));
    }

    private <T> ResponseEntity<ApiResponse<T>> ok(String message, T data) {
        return ResponseEntity.ok(ApiResponse.<T>builder().success(true).message(message).data(data).build());
    }
}
