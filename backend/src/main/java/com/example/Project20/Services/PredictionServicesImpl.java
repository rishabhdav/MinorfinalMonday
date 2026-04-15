package com.example.Project20.Services;

import com.example.Project20.DTO.PredictionResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class PredictionServicesImpl implements IPredictionServices {

    private final RestTemplate restTemplate;

    private PredictionResponseDto callModel(String url, MultipartFile image){

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
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded image", e);
        }

        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new HttpEntity<>(imageResource, fileHeaders));

        HttpEntity<MultiValueMap<String, Object>> entity =
                new HttpEntity<>(body, headers);

        ResponseEntity<PredictionResponseDto> response =
                restTemplate.postForEntity(
                        url,
                        entity,
                        PredictionResponseDto.class
                );

        return response.getBody();
    }

    @Override
    public PredictionResponseDto resnetClassifier(MultipartFile image) {

        return callModel("http://127.0.0.1:8000/predict", image);
    }

    @Override
    public PredictionResponseDto cnnClassifier(MultipartFile image) {

        return callModel("http://127.0.0.1:8001/predict", image);
    }
    
    @Override
    public PredictionResponseDto efficientNetClassifier(MultipartFile image) {

        return callModel("http://127.0.0.1:8003/predict", image);
    }
}
