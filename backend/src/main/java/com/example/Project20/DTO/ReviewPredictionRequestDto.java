package com.example.Project20.DTO;

import com.example.Project20.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewPredictionRequestDto {

    @NotNull(message = "Review status is required")
    private ReviewStatus reviewStatus;

    private String reviewNotes;
}
