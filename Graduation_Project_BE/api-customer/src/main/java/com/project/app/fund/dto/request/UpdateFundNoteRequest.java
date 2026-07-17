package com.project.app.fund.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateFundNoteRequest {

    @Size(max = 100)
    private String note;
}
