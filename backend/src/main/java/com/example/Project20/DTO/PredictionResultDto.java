package com.example.Project20.DTO;

import com.example.Project20.entity.ReviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class PredictionResultDto {
    private Long id;
    private String imageUrl;
    private String modelName;
    private Integer classId;
    private String className;
    private Double confidence;
    private List<List<Double>> probabilities;
    private Instant createdAt;
    private ReviewStatus reviewStatus;
    private String reviewNotes;
    private String reviewedBy;
    private Instant reviewedAt;
}
