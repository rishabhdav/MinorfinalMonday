package com.example.Project20.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "predictions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prediction {

    @Id
    private String id;

    @Indexed
    private String username;

    private byte[] imageData;

    private String imageContentType;

    private Integer classId;

    private String className;

    private Double confidence;

    @Indexed
    private String modelName;

    private String probabilities;

    @Indexed
    private Instant createdAt;

    private ReviewStatus reviewStatus;

    private String reviewNotes;

    private String reviewedBy;

    private Instant reviewedAt;

    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.reviewStatus == null) {
            this.reviewStatus = ReviewStatus.PENDING_REVIEW;
        }
    }
}
