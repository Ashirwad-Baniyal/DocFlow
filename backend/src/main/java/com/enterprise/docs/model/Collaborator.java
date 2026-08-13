package com.enterprise.docs.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Collaborator entity: join table between User and Document with access role.
 */
@Entity
@Table(
    name = "collaborators",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_collaborator", columnNames = {"document_id", "user_id"})
    },
    indexes = {
        @Index(name = "idx_collaborators_user", columnList = "user_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Collaborator {

    @Id
    @Column(length = 36)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CollaboratorRole role = CollaboratorRole.READ;

    @Column(name = "invited_at", updatable = false)
    private LocalDateTime invitedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        invitedAt = LocalDateTime.now();
    }

    public enum CollaboratorRole {
        READ, WRITE, OWNER
    }
}
