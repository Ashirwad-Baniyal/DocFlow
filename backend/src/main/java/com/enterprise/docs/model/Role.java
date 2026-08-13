package com.enterprise.docs.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Role entity. Used for role-based access control.
 * Seeded values: ROLE_USER, ROLE_ADMIN, ROLE_EDITOR.
 */
@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;
}
