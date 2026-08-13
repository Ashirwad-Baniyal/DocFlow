package com.enterprise.docs.repository;

import com.enterprise.docs.model.Document;
import com.enterprise.docs.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    Page<Document> findByOwner(User owner, Pageable pageable);

    Page<Document> findByIsPublicTrue(Pageable pageable);

    /**
     * Fetch all documents that the given user either owns or is a collaborator on.
     */
    @Query("""
            SELECT DISTINCT d FROM Document d
            LEFT JOIN Collaborator c ON c.document = d
            WHERE d.owner.id = :userId OR c.user.id = :userId
            ORDER BY d.updatedAt DESC
            """)
    Page<Document> findAllAccessibleByUser(@Param("userId") String userId, Pageable pageable);

    /**
     * Full-text style search by title (case-insensitive LIKE).
     */
    @Query("""
            SELECT DISTINCT d FROM Document d
            LEFT JOIN Collaborator c ON c.document = d
            WHERE (d.owner.id = :userId OR c.user.id = :userId)
              AND LOWER(d.title) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY d.updatedAt DESC
            """)
    Page<Document> searchAccessibleByTitle(@Param("query") String query,
                                           @Param("userId") String userId,
                                           Pageable pageable);

    List<Document> findByOwner(User owner);
}
