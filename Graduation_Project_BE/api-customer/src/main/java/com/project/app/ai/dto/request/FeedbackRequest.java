package com.project.app.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {

    @NotNull(message = "Message ID cannot be null")
    private Long messageId;

    @NotBlank(message = "Rating must be UPVOTE or DOWNVOTE")
    private String rating; // "UPVOTE", "DOWNVOTE"

    private String comment;
}
