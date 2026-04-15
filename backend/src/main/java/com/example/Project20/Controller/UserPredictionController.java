package com.example.Project20.controller;

import com.example.Project20.DTO.PredictionPageResponseDto;
import com.example.Project20.DTO.PredictionResultDto;
import com.example.Project20.DTO.ReviewPredictionRequestDto;
import com.example.Project20.entity.ReviewStatus;
import com.example.Project20.service.PredictionWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Validated
@Tag(name = "Prediction History", description = "Endpoints for user prediction CRUD and history")
public class UserPredictionController {

    private final PredictionWorkflowService predictionWorkflowService;

    @PostMapping("/predict")
    @Operation(summary = "Upload image, get ML prediction, and save result")
    public ResponseEntity<PredictionResultDto> predict(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "model", defaultValue = "resnet") String model,
            Principal principal) {
        PredictionResultDto result = predictionWorkflowService.createPrediction(principal.getName(), image, model);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/predictions")
    @Operation(summary = "Get logged-in user prediction history")
    public ResponseEntity<PredictionPageResponseDto> getHistory(
            Principal principal,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) int size,
            @RequestParam(value = "model", required = false) String model,
            @RequestParam(value = "reviewStatus", required = false) ReviewStatus reviewStatus) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(predictionWorkflowService.getUserHistory(principal.getName(), model, reviewStatus, pageable));
    }

    @GetMapping("/predictions/{id}")
    @Operation(summary = "Get a single prediction result belonging to the logged-in user")
    public ResponseEntity<PredictionResultDto> getPrediction(
            @PathVariable("id") Long id,
            Principal principal) {
        return ResponseEntity.ok(predictionWorkflowService.getPredictionById(principal.getName(), id));
    }

    @PatchMapping("/predictions/{id}/review")
    @Operation(summary = "Update clinician review status and notes for a prediction")
    public ResponseEntity<PredictionResultDto> reviewPrediction(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReviewPredictionRequestDto request,
            Principal principal) {
        return ResponseEntity.ok(predictionWorkflowService.reviewPrediction(principal.getName(), id, request));
    }

    @DeleteMapping("/predictions/{id}")
    @Operation(summary = "Delete a prediction and remove its image from Cloudinary")
    public ResponseEntity<Void> deletePrediction(
            @PathVariable("id") Long id,
            Principal principal) {
        predictionWorkflowService.deletePrediction(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
