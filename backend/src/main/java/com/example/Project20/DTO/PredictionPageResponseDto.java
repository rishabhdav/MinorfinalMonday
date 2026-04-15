package com.example.Project20.DTO;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PredictionPageResponseDto {
    private List<PredictionResultDto> predictions;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}
