package com.enterprise.docs.repository;

import com.enterprise.docs.model.Collaborator;
import com.enterprise.docs.model.Document;
import com.enterprise.docs.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollaboratorRepository extends JpaRepository<Collaborator, String> {

    Optional<Collaborator> findByDocumentAndUser(Document document, User user);

    List<Collaborator> findByDocument(Document document);

    List<Collaborator> findByUser(User user);

    boolean existsByDocumentAndUser(Document document, User user);

    void deleteByDocumentAndUser(Document document, User user);
}
