package com.example.Project20.controller;

import com.example.Project20.DTO.AdminModelUsageDto;
import com.example.Project20.DTO.PredictionPageResponseDto;
import com.example.Project20.DTO.PredictionStatsDto;
import com.example.Project20.entity.ReviewStatus;
import com.example.Project20.entity.Prediction;
import com.example.Project20.repository.PredictionRepository;
import com.example.Project20.service.PredictionWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import com.example.Project20.DTO.UserProfileDto;
import com.example.Project20.entity.User;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only endpoints")
public class AdminController {

    private final PredictionWorkflowService predictionWorkflowService;
    private final PredictionRepository predictionRepository;
    private final com.example.Project20.repository.UserRepository userRepository;
    private final com.example.Project20.service.PredictionReportEmailService predictionReportEmailService;

    @GetMapping("/predictions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all predictions or predictions for a specific user")
        public ResponseEntity<PredictionPageResponseDto> getAllPredictions(
            Principal principal,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "model", required = false) String model,
            @RequestParam(value = "reviewStatus", required = false) ReviewStatus reviewStatus
        ) {
        Pageable pageable = PageRequest.of(page, size);
        if (username != null && !username.isBlank()) {
            // return predictions for a specific user
            return ResponseEntity.ok(predictionWorkflowService.getUserHistory(username, "mine", model, reviewStatus, pageable));
        }
        // global listing using authenticated admin username
        return ResponseEntity.ok(predictionWorkflowService.getUserHistory(principal.getName(), "all", model, reviewStatus, pageable));
    }

    @PostMapping("/users/{username}/email")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send an arbitrary email to a user")
    public ResponseEntity<Void> emailUser(
            @PathVariable("username") String username,
            @RequestBody(required = false) com.example.Project20.DTO.EmailReportRequestDto request
    ) {
        var userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var user = userOpt.get();
        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String subject = request != null && request.getSubject() != null && !request.getSubject().isBlank()
                ? request.getSubject()
                : "Message from administrator";
        String message = request != null && request.getMessage() != null && !request.getMessage().isBlank()
                ? request.getMessage()
                : "An administrator has sent you a message.";

        predictionReportEmailService.sendEmail(email, subject, message);
        return ResponseEntity.accepted().build();
    }

        @GetMapping("/users")
        @PreAuthorize("hasRole('ADMIN')")
        @Operation(summary = "List all users (admin-only) with profile info")
        public ResponseEntity<List<UserProfileDto>> listUsers() {
        List<User> users = userRepository.findAll();
        List<UserProfileDto> dtos = users.stream()
            .map(u -> UserProfileDto.builder()
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .fullName(u.getFullName())
                .age(u.getAge())
                .gender(u.getGender())
                .phoneNumber(u.getPhoneNumber())
                .address(u.getAddress())
                .createdAt(u.getCreatedAt())
                .build())
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
        }

    @GetMapping("/model-usage")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin model usage overview with prediction counts and unique users per model")
    public ResponseEntity<AdminModelUsageDto> getModelUsageOverview(Principal principal) {
        PredictionStatsDto stats = predictionWorkflowService.getPredictionStats(principal.getName(), "all");
        List<Prediction> predictions = predictionRepository.findAll();

        Map<String, Long> userUsageByModel = predictions.stream()
                .filter(prediction -> prediction.getModelName() != null && prediction.getUsername() != null)
                .collect(Collectors.groupingBy(
                        prediction -> prediction.getModelName().toLowerCase(Locale.ROOT),
                        LinkedHashMap::new,
                        Collectors.mapping(Prediction::getUsername, Collectors.collectingAndThen(Collectors.toSet(), set -> (long) set.size()))
                ));

        ensureModelKeys(userUsageByModel);
        Map<String, Long> predictionUsageByModel = new LinkedHashMap<>(stats.getModelUsage());
        ensureModelKeys(predictionUsageByModel);

        AdminModelUsageDto dto = AdminModelUsageDto.builder()
                .totalPredictions(stats.getTotalPredictions())
                .totalUsers(userRepository.count())
                .latestPredictionAt(stats.getLatestPredictionAt())
                .predictionUsageByModel(predictionUsageByModel)
                .userUsageByModel(userUsageByModel)
                .build();

        return ResponseEntity.ok(dto);
    }

    private void ensureModelKeys(Map<String, Long> modelUsage) {
        for (String model : List.of("cnn", "resnet", "efficientnet")) {
            modelUsage.putIfAbsent(model, 0L);
        }
    }
}
