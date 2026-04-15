package com.example.Project20.service;

import com.example.Project20.DTO.MlPredictionResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MlApiClient {

    private final RestTemplate restTemplate;

    @Value("${ml.api.resnet-url}")
    private String resnetUrl;

    @Value("${ml.api.cnn-url}")
    private String cnnUrl;

    @Value("${ml.api.efficientnet-url}")
    private String efficientNetUrl;

    public MlPredictionResponseDto predict(String modelName, MultipartFile image) {
        String endpoint = switch (modelName.toLowerCase()) {
            case "cnn" -> cnnUrl;
            case "efficientnet" -> efficientNetUrl;
            default -> resnetUrl;
        };

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource imageResource;
        try {
            imageResource = new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            };
        } catch (IOException ex) {
            throw new IllegalStateException("Could not read image before calling ML API", ex);
        }

        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new HttpEntity<>(imageResource, fileHeaders));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<MlPredictionResponseDto> response = restTemplate.postForEntity(endpoint, request, MlPredictionResponseDto.class);
            MlPredictionResponseDto payload = response.getBody();
            if (payload == null) {
                return buildFallbackPrediction(modelName);
            }
            return sanitizePrediction(modelName, payload);
        } catch (RestClientException ex) {
            return buildFallbackPrediction(modelName);
        }
    }

    private MlPredictionResponseDto sanitizePrediction(String modelName, MlPredictionResponseDto payload) {
        boolean missingClassName = payload.getClass_name() == null || payload.getClass_name().isBlank();
        boolean missingProbabilities = payload.getProbabilities() == null || payload.getProbabilities().isEmpty();

        if (missingClassName || missingProbabilities) {
            return buildFallbackPrediction(modelName);
        }

        return payload;
    }

    private MlPredictionResponseDto buildFallbackPrediction(String modelName) {
        String normalizedModelName = modelName == null || modelName.isBlank()
                ? "resnet"
                : modelName.toLowerCase(Locale.ROOT);

        MlPredictionResponseDto fallback = new MlPredictionResponseDto();
        fallback.setClass_id(-1);
        fallback.setClass_name(normalizedModelName.toUpperCase(Locale.ROOT) + " default response");
        fallback.setConfidence(0.0d);
        fallback.setProbabilities(List.of(List.of(0.0d, 0.0d, 0.0d, 0.0d, 0.0d)));
        return fallback;
    }
}
