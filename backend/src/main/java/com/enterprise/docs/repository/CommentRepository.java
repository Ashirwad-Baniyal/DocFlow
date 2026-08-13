package com.enterprise.docs.repository;

import com.enterprise.docs.model.Comment;
import com.enterprise.docs.model.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {

    Page<Comment> findByDocument(Document document, Pageable pageable);

    List<Comment> findByDocumentAndResolvedFalse(Document document);
}
