package com.example.Project20.service;

import com.example.Project20.DTO.PredictionPageResponseDto;
import com.example.Project20.DTO.PredictionResultDto;
import com.example.Project20.DTO.ReviewPredictionRequestDto;
import com.example.Project20.entity.ReviewStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface PredictionWorkflowService {

    PredictionResultDto createPrediction(String username, MultipartFile image, String modelName);

    PredictionPageResponseDto getUserHistory(String username, String modelName, ReviewStatus reviewStatus, Pageable pageable);

    PredictionResultDto getPredictionById(String username, Long predictionId);

    PredictionResultDto reviewPrediction(String username, Long predictionId, ReviewPredictionRequestDto request);

    void deletePrediction(String username, Long predictionId);
}
