package com.project.app.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String code;
    private String message;
    private T data;

    /** Body thành công có data. */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /** Body thành công không data. */
    public static ApiResponse<Void> success(String message) {
        return success(message, null);
    }

    /** Body thất bại nghiệp vụ (HTTP vẫn có thể 200). */
    public static <T> ApiResponse<T> failure(String message, T data) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .build();
    }

    /** Body thất bại nghiệp vụ, không data. */
    public static ApiResponse<Void> failure(String message) {
        return failure(message, null);
    }

    /** HTTP 200 + body thành công có data. */
    public static <T> ResponseEntity<ApiResponse<T>> ok(String message, T data) {
        return ResponseEntity.ok(success(message, data));
    }

    /** HTTP 200 + body thành công không data. */
    public static ResponseEntity<ApiResponse<Void>> ok(String message) {
        return ok(message, null);
    }
}
