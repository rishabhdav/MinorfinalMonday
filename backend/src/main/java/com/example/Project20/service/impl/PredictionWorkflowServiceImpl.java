package com.example.Project20.service.impl;

import com.example.Project20.DTO.MlPredictionResponseDto;
import com.example.Project20.DTO.PredictionPageResponseDto;
import com.example.Project20.DTO.PredictionResultDto;
import com.example.Project20.DTO.ReviewPredictionRequestDto;
import com.example.Project20.entity.Prediction;
import com.example.Project20.entity.ReviewStatus;
import com.example.Project20.entity.User;
import com.example.Project20.exception.ResourceNotFoundException;
import com.example.Project20.repository.PredictionRepository;
import com.example.Project20.repository.UserRepository;
import com.example.Project20.service.CloudinaryService;
import com.example.Project20.service.MlApiClient;
import com.example.Project20.service.PredictionWorkflowService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PredictionWorkflowServiceImpl implements PredictionWorkflowService {

    private final PredictionRepository predictionRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final MlApiClient mlApiClient;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PredictionResultDto createPrediction(String username, MultipartFile image, String modelName) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        String normalizedModelName = normalizeModelName(modelName);

        var uploadResult = cloudinaryService.uploadImage(image);
        MlPredictionResponseDto mlPrediction;
        try {
            mlPrediction = mlApiClient.predict(normalizedModelName, image);
        } catch (Exception ex) {
            mlPrediction = buildDefaultPrediction(normalizedModelName);
        }

        String probabilitiesJson;
        try {
            probabilitiesJson = objectMapper.writeValueAsString(mlPrediction.getProbabilities());
        } catch (JsonProcessingException ex) {
            try {
                mlPrediction = buildDefaultPrediction(normalizedModelName);
                probabilitiesJson = objectMapper.writeValueAsString(mlPrediction.getProbabilities());
            } catch (JsonProcessingException fallbackEx) {
                throw new RuntimeException("Unable to serialize probabilities", fallbackEx);
            }
        }

        Prediction saved = predictionRepository.save(Prediction.builder()
                .imageUrl(uploadResult.url())
                .cloudinaryPublicId(uploadResult.publicId())
                .classId(mlPrediction.getClass_id())
                .className(mlPrediction.getClass_name())
                .confidence(mlPrediction.getConfidence())
                .modelName(normalizedModelName)
                .probabilities(probabilitiesJson)
                .reviewStatus(ReviewStatus.PENDING_REVIEW)
                .user(user)
                .build());

        return mapToDto(saved);
    }

    private MlPredictionResponseDto buildDefaultPrediction(String modelName) {
        MlPredictionResponseDto fallback = new MlPredictionResponseDto();
        fallback.setClass_id(-1);
        fallback.setClass_name(modelName.toUpperCase(Locale.ROOT) + " default response");
        fallback.setConfidence(0.0d);
        fallback.setProbabilities(List.of(List.of(0.0d, 0.0d, 0.0d, 0.0d, 0.0d)));
        return fallback;
    }

    @Override
    public PredictionPageResponseDto getUserHistory(String username, String modelName, ReviewStatus reviewStatus, Pageable pageable) {
        Page<Prediction> page = predictionRepository.findUserHistory(username, normalizeModelNameFilter(modelName), reviewStatus, pageable);
        List<PredictionResultDto> results = page.stream().map(this::mapToDto).collect(Collectors.toList());
        return PredictionPageResponseDto.builder()
                .predictions(results)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public PredictionResultDto getPredictionById(String username, Long predictionId) {
        Prediction prediction = predictionRepository.findByIdAndUserUsername(predictionId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction not found: " + predictionId));
        return mapToDto(prediction);
    }

    @Override
    @Transactional
    public PredictionResultDto reviewPrediction(String username, Long predictionId, ReviewPredictionRequestDto request) {
        Prediction prediction = predictionRepository.findByIdAndUserUsername(predictionId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction not found: " + predictionId));

        prediction.setReviewStatus(request.getReviewStatus());
        prediction.setReviewNotes(request.getReviewNotes());
        prediction.setReviewedBy(username);
        prediction.setReviewedAt(Instant.now());

        return mapToDto(prediction);
    }

    @Override
    @Transactional
    public void deletePrediction(String username, Long predictionId) {
        Prediction prediction = predictionRepository.findByIdAndUserUsername(predictionId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction not found: " + predictionId));

        cloudinaryService.deleteImage(prediction.getCloudinaryPublicId());
        predictionRepository.delete(prediction);
    }

    private PredictionResultDto mapToDto(Prediction prediction) {
        List<List<Double>> probabilities;
        try {
            probabilities = objectMapper.readValue(prediction.getProbabilities(), new TypeReference<>() {
            });
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("Unable to parse stored probabilities", ex);
        }

        return PredictionResultDto.builder()
                .id(prediction.getId())
                .imageUrl(prediction.getImageUrl())
                .modelName(prediction.getModelName())
                .classId(prediction.getClassId())
                .className(prediction.getClassName())
                .confidence(prediction.getConfidence())
                .probabilities(probabilities)
                .createdAt(prediction.getCreatedAt())
                .reviewStatus(prediction.getReviewStatus())
                .reviewNotes(prediction.getReviewNotes())
                .reviewedBy(prediction.getReviewedBy())
                .reviewedAt(prediction.getReviewedAt())
                .build();
    }

    private String normalizeModelName(String modelName) {
        return modelName == null || modelName.isBlank()
                ? "resnet"
                : modelName.toLowerCase(Locale.ROOT);
    }

    private String normalizeModelNameFilter(String modelName) {
        return modelName == null || modelName.isBlank() || "all".equalsIgnoreCase(modelName)
                ? null
                : modelName.toLowerCase(Locale.ROOT);
    }
}
