package com.project.app.ai.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
@Data public class AiFeedbackRequest{
 @NotBlank @Size(max=64) private String messageId;
 @NotBlank @Pattern(regexp="HELPFUL|NOT_HELPFUL",message="Đánh giá không hợp lệ") private String rating;
}
