package com.example.Project20.DTO;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class AdminModelUsageDto {
    private long totalPredictions;
    private long totalUsers;
    private Instant latestPredictionAt;
    private Map<String, Long> predictionUsageByModel;
    private Map<String, Long> userUsageByModel;
}
