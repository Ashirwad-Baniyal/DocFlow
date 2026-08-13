package com.enterprise.docs.repository;

import com.enterprise.docs.model.Document;
import com.enterprise.docs.model.DocumentVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, String> {

    Page<DocumentVersion> findByDocumentOrderByVersionNumberDesc(Document document, Pageable pageable);

    Optional<DocumentVersion> findByDocumentAndVersionNumber(Document document, Integer versionNumber);

    @Query("SELECT COALESCE(MAX(v.versionNumber), 0) FROM DocumentVersion v WHERE v.document = :document")
    Integer findMaxVersionByDocument(@Param("document") Document document);
}
