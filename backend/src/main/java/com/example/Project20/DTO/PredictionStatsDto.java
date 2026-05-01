package com.example.Project20.DTO;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class PredictionStatsDto {
    private long totalPredictions;
    private long pendingReviewCount;
    private long reviewedCount;
    private long confirmedCount;
    private long rejectedCount;
    private Instant latestPredictionAt;
    private Map<String, Long> modelUsage;
    private String scope;
}
