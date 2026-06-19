package com.project.app.report.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.report.dto.response.ReportDistributionResponse;
import com.project.app.report.dto.response.ReportTrendResponse;
import com.project.app.report.service.ReportService;
import com.project.app.transaction.entity.TransactionType;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/distribution")
    public ResponseEntity<ApiResponse<List<ReportDistributionResponse>>> getDistributionReport(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam TransactionType type,
            @RequestParam(defaultValue = "MONTH") String filter,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<ReportDistributionResponse> data = reportService.getDistributionReport(userDetails.getUser(), type, filter, date);
        return ResponseEntity.ok(ApiResponse.<List<ReportDistributionResponse>>builder()
                .success(true)
                .message("Lấy dữ liệu phân bổ thành công")
                .data(data)
                .build());
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<List<ReportTrendResponse>>> getTrendReport(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam TransactionType type,
            @RequestParam(defaultValue = "MONTH") String filter,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<ReportTrendResponse> data = reportService.getTrendReport(userDetails.getUser(), type, filter, date);
        return ResponseEntity.ok(ApiResponse.<List<ReportTrendResponse>>builder()
                .success(true)
                .message("Lấy dữ liệu xu hướng thành công")
                .data(data)
                .build());
    }
}
