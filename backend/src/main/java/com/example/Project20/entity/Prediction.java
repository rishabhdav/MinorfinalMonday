package com.example.Project20.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "predictions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private String cloudinaryPublicId;

    @Column(nullable = false)
    private Integer classId;

    @Column(nullable = false)
    private String className;

    @Column(nullable = false)
    private Double confidence;

    @Column(nullable = false, length = 64)
    private String modelName;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String probabilities;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewStatus reviewStatus;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    private String reviewedBy;

    private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
        if (this.reviewStatus == null) {
            this.reviewStatus = ReviewStatus.PENDING_REVIEW;
        }
    }
}
