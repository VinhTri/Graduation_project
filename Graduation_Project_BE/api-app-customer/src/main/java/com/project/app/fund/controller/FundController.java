package com.project.app.fund.controller;

import com.project.app.auth.security.CustomUserDetails;
import com.project.app.common.dto.ApiResponse;
import com.project.app.fund.dto.request.CreateFundRequest;
import com.project.app.fund.dto.request.FundAmountRequest;
import com.project.app.fund.dto.request.InviteFundRequest;
import com.project.app.fund.dto.request.UpdateFundNoteRequest;
import com.project.app.fund.dto.response.FundDetailResponse;
import com.project.app.fund.dto.response.FundSummaryResponse;
import com.project.app.fund.dto.response.FundTransactionResponse;
import com.project.app.fund.service.FundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/funds")
@RequiredArgsConstructor
public class FundController {

    private final FundService fundService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FundSummaryResponse>>> listMyFunds(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<FundSummaryResponse> data = fundService.listMyFunds(userDetails.getUser());
        return ResponseEntity.ok(ApiResponse.<List<FundSummaryResponse>>builder()
                .success(true)
                .message("Lấy danh sách quỹ thành công")
                .data(data)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FundDetailResponse>> createFund(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateFundRequest request) {
        FundDetailResponse data = fundService.createFund(userDetails.getUser(), request);
        return ResponseEntity.ok(ApiResponse.<FundDetailResponse>builder()
                .success(true)
                .message("Tạo quỹ thành công")
                .data(data)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FundDetailResponse>> getFundDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        FundDetailResponse data = fundService.getFundDetail(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<FundDetailResponse>builder()
                .success(true)
                .message("Lấy chi tiết quỹ thành công")
                .data(data)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFund(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        fundService.deleteFund(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Xóa quỹ thành công")
                .build());
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveFund(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        fundService.leaveFund(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã rời quỹ thành công")
                .build());
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<ApiResponse<FundDetailResponse>> deposit(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody FundAmountRequest request) {
        FundDetailResponse data = fundService.deposit(userDetails.getUser(), id, request);
        return ResponseEntity.ok(ApiResponse.<FundDetailResponse>builder()
                .success(true)
                .message("Nạp tiền vào quỹ thành công")
                .data(data)
                .build());
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<FundDetailResponse>> withdraw(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody FundAmountRequest request) {
        FundDetailResponse data = fundService.withdraw(userDetails.getUser(), id, request);
        return ResponseEntity.ok(ApiResponse.<FundDetailResponse>builder()
                .success(true)
                .message("Rút tiền từ quỹ thành công")
                .data(data)
                .build());
    }

    @PutMapping("/{id}/transactions/{txId}/note")
    public ResponseEntity<ApiResponse<FundTransactionResponse>> updateNote(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long txId,
            @Valid @RequestBody UpdateFundNoteRequest request) {
        FundTransactionResponse data = fundService.updateTransactionNote(
                userDetails.getUser(), id, txId, request);
        return ResponseEntity.ok(ApiResponse.<FundTransactionResponse>builder()
                .success(true)
                .message("Cập nhật ghi chú thành công")
                .data(data)
                .build());
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<ApiResponse<FundDetailResponse>> inviteMember(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody InviteFundRequest request) {
        FundDetailResponse data = fundService.inviteMember(userDetails.getUser(), id, request);
        return ResponseEntity.ok(ApiResponse.<FundDetailResponse>builder()
                .success(true)
                .message("Đã gửi lời mời tham gia quỹ")
                .data(data)
                .build());
    }

    @PostMapping("/{id}/accept-invite")
    public ResponseEntity<ApiResponse<FundDetailResponse>> acceptInvite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        FundDetailResponse data = fundService.acceptInvite(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<FundDetailResponse>builder()
                .success(true)
                .message("Đã tham gia quỹ thành công")
                .data(data)
                .build());
    }

    @PostMapping("/{id}/reject-invite")
    public ResponseEntity<ApiResponse<Void>> rejectInvite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        fundService.rejectInvite(userDetails.getUser(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Đã từ chối lời mời tham gia quỹ")
                .build());
    }
}
