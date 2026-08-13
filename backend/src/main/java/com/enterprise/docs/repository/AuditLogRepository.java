package com.enterprise.docs.repository;

import com.enterprise.docs.model.AuditLog;
import com.enterprise.docs.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    Page<AuditLog> findByUserOrderByTimestampDesc(User user, Pageable pageable);

    List<AuditLog> findByAction(String action);
}
