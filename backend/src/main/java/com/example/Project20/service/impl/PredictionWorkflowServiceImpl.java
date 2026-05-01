package com.example.Project20.service.impl;

import com.example.Project20.DTO.MlPredictionResponseDto;
import com.example.Project20.DTO.EmailReportRequestDto;
import com.example.Project20.DTO.PredictionPageResponseDto;
import com.example.Project20.DTO.PredictionResultDto;
import com.example.Project20.DTO.PredictionStatsDto;
import com.example.Project20.DTO.ReviewPredictionRequestDto;
import com.example.Project20.entity.Prediction;
import com.example.Project20.entity.ReviewStatus;
import com.example.Project20.entity.User;
import com.example.Project20.entity.UserRole;
import com.example.Project20.exception.ResourceNotFoundException;
import com.example.Project20.repository.PredictionRepository;
import com.example.Project20.repository.UserRepository;
import com.example.Project20.service.MlApiClient;
import com.example.Project20.service.PredictionReportEmailService;
import com.example.Project20.service.PredictionWorkflowService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PredictionWorkflowServiceImpl implements PredictionWorkflowService {

    private final PredictionRepository predictionRepository;
    private final UserRepository userRepository;
    private final MlApiClient mlApiClient;
    private final PredictionReportEmailService predictionReportEmailService;
    private final ObjectMapper objectMapper;

    @Value("${app.ml.enabled:false}")
    private boolean mlEnabled;

    @Value("${spring.application.name:Project}")
    private String applicationName;

    @Value("${app.signature.path:}")
    private String signaturePath;

    @Override
    public PredictionResultDto createPrediction(String username, MultipartFile image, String modelName) {
        User user = findUser(username);
        String normalizedModelName = normalizeModelName(modelName);
        MlPredictionResponseDto mlPrediction = resolvePrediction(normalizedModelName, image);

        String probabilitiesJson = serializeProbabilities(mlPrediction, normalizedModelName);
        StoredImage storedImage = readAndCompressImage(image);

        Prediction saved = predictionRepository.save(Prediction.builder()
                .username(user.getUsername())
                .imageData(storedImage.data())
                .imageContentType(storedImage.contentType())
                .classId(mlPrediction.getClass_id())
                .className(mlPrediction.getClass_name())
                .confidence(mlPrediction.getConfidence())
                .modelName(normalizedModelName)
                .probabilities(probabilitiesJson)
                .reviewStatus(ReviewStatus.PENDING_REVIEW)
                .createdAt(Instant.now())
                .build());

        return mapToDto(saved, user);
    }

    @Override
    public PredictionPageResponseDto getUserHistory(String username, String scope, String modelName, ReviewStatus reviewStatus, Pageable pageable) {
        User actor = findUser(username);
        // Admins default to global view unless they explicitly request 'mine'
        boolean globalScope = (scope == null)
            ? hasPrivilegedRole(actor)
            : (isGlobalScopeRequested(scope) && hasPrivilegedRole(actor));
        String normalizedModel = normalizeModelNameFilter(modelName);
        Page<Prediction> page = globalScope
                ? findGlobalHistory(normalizedModel, reviewStatus, pageable)
                : findUserHistory(username, normalizedModel, reviewStatus, pageable);

        List<PredictionResultDto> results = page.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PredictionPageResponseDto.builder()
                .predictions(results)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public PredictionResultDto getPredictionById(String username, String predictionId) {
        User actor = findUser(username);
        return mapToDto(loadPredictionForAccess(actor, predictionId));
    }

    @Override
    public PredictionResultDto reviewPrediction(String username, String predictionId, ReviewPredictionRequestDto request) {
        User actor = findUser(username);
        if (!hasPrivilegedRole(actor)) {
            throw new AccessDeniedException("Only admin users can review predictions");
        }

        Prediction prediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction not found: " + predictionId));

        prediction.setReviewStatus(request.getReviewStatus());
        prediction.setReviewNotes(request.getReviewNotes());
        prediction.setReviewedBy(actor.getUsername());
        prediction.setReviewedAt(Instant.now());
        predictionRepository.save(prediction);

        return mapToDto(prediction);
    }

    @Override
    public void deletePrediction(String username, String predictionId) {
        User actor = findUser(username);
        Prediction prediction = loadPredictionForAccess(actor, predictionId);
        predictionRepository.delete(prediction);
    }

    @Override
    public PredictionStatsDto getPredictionStats(String username, String scope) {
        User actor = findUser(username);
        // Admins default to global stats unless they explicitly request 'mine'
        boolean globalScope = (scope == null)
            ? hasPrivilegedRole(actor)
            : (isGlobalScopeRequested(scope) && hasPrivilegedRole(actor));
        List<Prediction> predictions = globalScope
                ? predictionRepository.findAll()
                : predictionRepository.findByUsernameOrderByCreatedAtDesc(username);

        return PredictionStatsDto.builder()
                .totalPredictions(predictions.size())
                .pendingReviewCount(countByStatus(predictions, ReviewStatus.PENDING_REVIEW))
                .reviewedCount(countByStatus(predictions, ReviewStatus.REVIEWED))
                .confirmedCount(countByStatus(predictions, ReviewStatus.CONFIRMED))
                .rejectedCount(countByStatus(predictions, ReviewStatus.REJECTED))
                .latestPredictionAt(predictions.stream().map(Prediction::getCreatedAt).filter(Objects::nonNull).max(Instant::compareTo).orElse(null))
                .modelUsage(buildModelUsage(predictions))
                .scope(globalScope ? "all" : "mine")
                .build();
    }

    @Override
    public byte[] generatePredictionReport(String username, String predictionId) {
        User actor = findUser(username);
        Prediction prediction = loadPredictionForAccess(actor, predictionId);
        User patient = findUser(prediction.getUsername());

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Header
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
                contentStream.newLineAtOffset(50, 800);
                contentStream.showText(applicationName + " - Prediction Report");
                contentStream.endText();

                // Watermark (rotated, centered)
                try {
                    contentStream.saveGraphicsState();
                    PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
                    gs.setNonStrokingAlphaConstant(0.08f);
                    contentStream.setGraphicsStateParameters(gs);
                    contentStream.setNonStrokingColor(200, 200, 200);

                    float pageWidth = page.getMediaBox().getWidth();
                    float pageHeight = page.getMediaBox().getHeight();
                    float centerX = pageWidth / 2f;
                    float centerY = pageHeight / 2f;
                    float angle = (float) Math.toRadians(45);

                    contentStream.transform(Matrix.getRotateInstance(angle, centerX, centerY));
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 72);
                    // place text so it's roughly centered after rotation
                    contentStream.newLineAtOffset(centerX - 200, centerY - 36);
                    contentStream.showText(applicationName);
                    contentStream.endText();
                } catch (Exception ex) {
                    // ignore watermark issues
                } finally {
                    try {
                        contentStream.restoreGraphicsState();
                    } catch (Exception ignore) {
                    }
                }

                // Main report body
                float y = 760;
                contentStream.setLeading(18f);
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                contentStream.newLineAtOffset(50, y - 40);

                for (String line : buildReportLines(prediction, patient)) {
                    contentStream.showText(line);
                    contentStream.newLine();
                }
                contentStream.endText();

                // Draw image if present
                BufferedImage reportImage = readImage(prediction.getImageData());
                if (reportImage != null) {
                    PDImageXObject pdImage = LosslessFactory.createFromImage(document, reportImage);
                    float imageWidth = 220;
                    float imageHeight = Math.min(220, (reportImage.getHeight() * imageWidth) / reportImage.getWidth());
                    contentStream.drawImage(pdImage, 50, 420, imageWidth, imageHeight);
                }

                // Signature block (text + optional embedded signature image)
                String signer = (actor != null ? (actor.getFullName() != null ? actor.getFullName() : actor.getUsername()) : "Administrator");
                float sigX = 50f;
                float sigY = 140f;

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
                contentStream.newLineAtOffset(sigX, sigY);
                contentStream.showText("Authorized by: " + signer);
                contentStream.endText();

                boolean drewSignatureImage = false;
                if (signaturePath != null && !signaturePath.isBlank()) {
                    try {
                        BufferedImage sigImg = null;
                        if (signaturePath.startsWith("classpath:")) {
                            String res = signaturePath.substring("classpath:".length());
                            try (var is = getClass().getResourceAsStream(res)) {
                                if (is != null) {
                                    sigImg = ImageIO.read(is);
                                }
                            }
                        } else {
                            java.io.File f = new java.io.File(signaturePath);
                            if (f.exists()) {
                                sigImg = ImageIO.read(f);
                            }
                        }

                        if (sigImg != null) {
                            PDImageXObject pdSig = LosslessFactory.createFromImage(document, sigImg);
                            float sigWidth = 150f;
                            float sigHeight = (sigImg.getHeight() * sigWidth) / (float) sigImg.getWidth();
                            // draw image slightly below the signer text
                            contentStream.drawImage(pdSig, sigX, sigY - sigHeight - 6f, sigWidth, sigHeight);
                            drewSignatureImage = true;
                        }
                    } catch (Exception ex) {
                        // ignore image embed errors and fall back to textual signature
                    }
                }

                if (!drewSignatureImage) {
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                    contentStream.newLineAtOffset(sigX, sigY - 18f);
                    contentStream.showText("Signature: _______________________________");
                    contentStream.endText();
                }
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Unable to generate prediction report", ex);
        }
    }

    @Override
    public void sendPredictionReportEmail(String username, String predictionId, EmailReportRequestDto request) {
        User actor = findUser(username);
        if (actor.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only admin users can send report emails");
        }

        Prediction prediction = predictionRepository.findById(predictionId)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction not found: " + predictionId));
        User patient = findUser(prediction.getUsername());
        if (patient.getEmail() == null || patient.getEmail().isBlank()) {
            throw new ResourceNotFoundException("Patient email not found for user: " + patient.getUsername());
        }

        byte[] pdf = generatePredictionReport(username, predictionId);
        String subject = request != null && request.getSubject() != null && !request.getSubject().isBlank()
                ? request.getSubject()
                : "Your diabetic retinopathy prediction report";
        String message = request != null && request.getMessage() != null && !request.getMessage().isBlank()
                ? request.getMessage()
                : defaultEmailMessage(patient, prediction, actor);

        predictionReportEmailService.sendReport(
                patient.getEmail(),
                subject,
                message,
                pdf,
                "prediction-" + predictionId + ".pdf"
        );
    }

    private Prediction loadPredictionForAccess(User actor, String predictionId) {
        if (hasPrivilegedRole(actor)) {
            return predictionRepository.findById(predictionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Prediction not found: " + predictionId));
        }
        return predictionRepository.findByIdAndUsername(predictionId, actor.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Prediction not found: " + predictionId));
    }

    private Page<Prediction> findUserHistory(String username, String modelName, ReviewStatus reviewStatus, Pageable pageable) {
        if (modelName != null && reviewStatus != null) {
            return predictionRepository.findByUsernameAndModelNameIgnoreCaseAndReviewStatusOrderByCreatedAtDesc(
                    username, modelName, reviewStatus, pageable);
        }
        if (modelName != null) {
            return predictionRepository.findByUsernameAndModelNameIgnoreCaseOrderByCreatedAtDesc(username, modelName, pageable);
        }
        if (reviewStatus != null) {
            return predictionRepository.findByUsernameAndReviewStatusOrderByCreatedAtDesc(username, reviewStatus, pageable);
        }
        return predictionRepository.findByUsernameOrderByCreatedAtDesc(username, pageable);
    }

    private Page<Prediction> findGlobalHistory(String modelName, ReviewStatus reviewStatus, Pageable pageable) {
        if (modelName != null && reviewStatus != null) {
            return predictionRepository.findByModelNameIgnoreCaseAndReviewStatusOrderByCreatedAtDesc(modelName, reviewStatus, pageable);
        }
        if (modelName != null) {
            return predictionRepository.findByModelNameIgnoreCaseOrderByCreatedAtDesc(modelName, pageable);
        }
        if (reviewStatus != null) {
            return predictionRepository.findByReviewStatusOrderByCreatedAtDesc(reviewStatus, pageable);
        }
        return predictionRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    private MlPredictionResponseDto resolvePrediction(String modelName, MultipartFile image) {
        if (!mlEnabled) {
            return buildDefaultPrediction(modelName);
        }

        try {
            return mlApiClient.predict(modelName, image);
        } catch (Exception ex) {
            return buildDefaultPrediction(modelName);
        }
    }

    private String serializeProbabilities(MlPredictionResponseDto mlPrediction, String modelName) {
        try {
            return objectMapper.writeValueAsString(mlPrediction.getProbabilities());
        } catch (JsonProcessingException ex) {
            try {
                MlPredictionResponseDto fallback = buildDefaultPrediction(modelName);
                return objectMapper.writeValueAsString(fallback.getProbabilities());
            } catch (JsonProcessingException fallbackEx) {
                throw new RuntimeException("Unable to serialize probabilities", fallbackEx);
            }
        }
    }

    private MlPredictionResponseDto buildDefaultPrediction(String modelName) {
        MlPredictionResponseDto fallback = new MlPredictionResponseDto();
        fallback.setClass_id(-1);
        fallback.setClass_name(modelName.toUpperCase(Locale.ROOT) + " default response");
        fallback.setConfidence(0.0d);
        fallback.setProbabilities(List.of(List.of(0.0d, 0.0d, 0.0d, 0.0d, 0.0d)));
        return fallback;
    }

    private PredictionResultDto mapToDto(Prediction prediction) {
        User patient = userRepository.findByUsername(prediction.getUsername()).orElse(null);
        return mapToDto(prediction, patient);
    }

    private PredictionResultDto mapToDto(Prediction prediction, User patient) {
        List<List<Double>> probabilities;
        try {
            probabilities = objectMapper.readValue(prediction.getProbabilities(), new TypeReference<>() {
            });
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("Unable to parse stored probabilities", ex);
        }

        return PredictionResultDto.builder()
                .id(prediction.getId())
                .username(prediction.getUsername())
                .patientEmail(patient != null ? patient.getEmail() : null)
                .patientName(patient != null ? patient.getFullName() : null)
                .patientAge(patient != null ? patient.getAge() : null)
                .patientGender(patient != null ? patient.getGender() : null)
                .imageUrl(buildImageDataUrl(prediction))
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

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private boolean hasPrivilegedRole(User user) {
        return user.getRole() == UserRole.ADMIN;
    }

    private boolean isGlobalScopeRequested(String scope) {
        return scope != null && "all".equalsIgnoreCase(scope);
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

    private String buildImageDataUrl(Prediction prediction) {
        if (prediction.getImageData() == null || prediction.getImageData().length == 0) {
            return null;
        }
        return "data:" + resolveStoredContentType(prediction) + ";base64," +
                Base64.getEncoder().encodeToString(prediction.getImageData());
    }

    private String resolveStoredContentType(Prediction prediction) {
        return (prediction.getImageContentType() == null || prediction.getImageContentType().isBlank())
                ? "application/octet-stream"
                : prediction.getImageContentType();
    }

    private StoredImage readAndCompressImage(MultipartFile image) {
        try {
            byte[] originalBytes = image.getBytes();
            String originalContentType = resolveContentType(image);

            if (!originalContentType.startsWith("image/")) {
                return new StoredImage(originalBytes, originalContentType);
            }

            BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(originalBytes));
            if (bufferedImage == null) {
                return new StoredImage(originalBytes, originalContentType);
            }

            BufferedImage rgbImage = new BufferedImage(bufferedImage.getWidth(), bufferedImage.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = rgbImage.createGraphics();
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, bufferedImage.getWidth(), bufferedImage.getHeight());
            graphics.drawImage(bufferedImage, 0, 0, null);
            graphics.dispose();

            ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
            try (ByteArrayOutputStream compressedOutput = new ByteArrayOutputStream();
                 MemoryCacheImageOutputStream imageOutputStream = new MemoryCacheImageOutputStream(compressedOutput)) {
                writer.setOutput(imageOutputStream);
                ImageWriteParam writeParam = writer.getDefaultWriteParam();
                if (writeParam.canWriteCompressed()) {
                    writeParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    writeParam.setCompressionQuality(0.7f);
                }
                writer.write(null, new IIOImage(rgbImage, null, null), writeParam);
                writer.dispose();

                byte[] compressedBytes = compressedOutput.toByteArray();
                if (compressedBytes.length > 0 && compressedBytes.length < originalBytes.length) {
                    return new StoredImage(compressedBytes, "image/jpeg");
                }
            }
            return new StoredImage(originalBytes, originalContentType);
        } catch (IOException ex) {
            throw new RuntimeException("Unable to process uploaded image", ex);
        }
    }

    private String resolveContentType(MultipartFile image) {
        String contentType = image.getContentType();
        return (contentType == null || contentType.isBlank()) ? "application/octet-stream" : contentType;
    }

    private long countByStatus(List<Prediction> predictions, ReviewStatus status) {
        return predictions.stream()
                .filter(prediction -> prediction.getReviewStatus() == status)
                .count();
    }

    private Map<String, Long> buildModelUsage(List<Prediction> predictions) {
        Map<String, Long> counts = predictions.stream()
                .collect(Collectors.groupingBy(
                        prediction -> prediction.getModelName() == null ? "unknown" : prediction.getModelName(),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        if (counts.isEmpty()) {
            counts.put("resnet", 0L);
            counts.put("cnn", 0L);
            counts.put("efficientnet", 0L);
        }
        return counts;
    }

    private List<String> buildReportLines(Prediction prediction, User patient) {
        List<String> lines = new ArrayList<>();
        lines.add("Prediction ID: " + prediction.getId());
        lines.add("Patient username: " + prediction.getUsername());
        lines.add("Patient name: " + valueOrDefault(patient != null ? patient.getFullName() : null));
        lines.add("Patient age: " + valueOrDefault(patient != null ? patient.getAge() : null));
        lines.add("Patient gender: " + valueOrDefault(patient != null ? patient.getGender() : null));
        lines.add("Model: " + valueOrDefault(prediction.getModelName()));
        lines.add("Class name: " + valueOrDefault(prediction.getClassName()));
        lines.add("Class ID: " + valueOrDefault(prediction.getClassId()));
        lines.add("Confidence: " + (prediction.getConfidence() == null ? "N/A" : String.format(Locale.ROOT, "%.2f%%", prediction.getConfidence() * 100)));
        lines.add("Review status: " + valueOrDefault(prediction.getReviewStatus()));
        lines.add("Reviewed by: " + valueOrDefault(prediction.getReviewedBy()));
        lines.add("Review notes: " + valueOrDefault(prediction.getReviewNotes()));
        lines.add("Created at: " + valueOrDefault(prediction.getCreatedAt()));
        lines.add("Reviewed at: " + valueOrDefault(prediction.getReviewedAt()));
        return lines;
    }

    private BufferedImage readImage(byte[] imageData) {
        if (imageData == null || imageData.length == 0) {
            return null;
        }
        try {
            return ImageIO.read(new ByteArrayInputStream(imageData));
        } catch (IOException ex) {
            return null;
        }
    }

    private String valueOrDefault(Object value) {
        return value == null ? "N/A" : value.toString();
    }

    private String defaultEmailMessage(User patient, Prediction prediction, User actor) {
        String patientName = patient.getFullName() == null || patient.getFullName().isBlank()
                ? patient.getUsername()
                : patient.getFullName();
        return "Hello " + patientName + ",\n\n"
                + "An administrator has shared your full diabetic retinopathy prediction report.\n"
                + "Prediction ID: " + prediction.getId() + "\n"
                + "Model: " + valueOrDefault(prediction.getModelName()) + "\n"
                + "Class: " + valueOrDefault(prediction.getClassName()) + "\n"
                + "Reviewed by: " + actor.getUsername() + "\n\n"
                + "Please find the PDF report attached.\n";
    }

    private record StoredImage(byte[] data, String contentType) {
    }
}
