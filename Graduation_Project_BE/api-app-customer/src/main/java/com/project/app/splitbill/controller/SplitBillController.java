package com.project.app.splitbill.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.splitbill.dto.request.CreateSplitBillRequest;
import com.project.app.splitbill.dto.request.PaySplitBillRequest;
import com.project.app.splitbill.dto.response.SplitBillResponse;
import com.project.app.splitbill.service.SplitBillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/split-bills")
@RequiredArgsConstructor
public class SplitBillController {

    private final SplitBillService splitBillService;

    @PostMapping
    public ResponseEntity<ApiResponse<SplitBillResponse>> createSplitBill(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateSplitBillRequest request) {
        SplitBillResponse data = splitBillService.createSplitBill(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<SplitBillResponse>builder()
                .success(true)
                .message("Tạo yêu cầu chia tiền thành công")
                .data(data)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SplitBillResponse>>> getMySplitBills(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<SplitBillResponse> data = splitBillService.getMySplitBills(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<List<SplitBillResponse>>builder()
                .success(true)
                .message("Lấy danh sách chia tiền thành công")
                .data(data)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SplitBillResponse>> getSplitBillDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        SplitBillResponse data = splitBillService.getSplitBillDetail(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<SplitBillResponse>builder()
                .success(true)
                .message("Lấy chi tiết yêu cầu chia tiền thành công")
                .data(data)
                .build());
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<SplitBillResponse>> paySplitBill(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody PaySplitBillRequest request) {
        SplitBillResponse data = splitBillService.paySplitBill(userDetails.getUser(), id, request);
        return ResponseEntity.ok(ApiResponse.<SplitBillResponse>builder()
                .success(true)
                .message("Thanh toán chia tiền thành công")
                .data(data)
                .build());
    }

    @PostMapping("/{id}/remind/{memberUserId}")
    public ResponseEntity<ApiResponse<Void>> remindMember(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long memberUserId) {
        splitBillService.remindMember(userDetails.getUser(), id, memberUserId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã gửi lời nhắc thanh toán")
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelSplitBill(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        splitBillService.cancelSplitBill(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã hủy yêu cầu chia tiền")
                .build());
    }
}
