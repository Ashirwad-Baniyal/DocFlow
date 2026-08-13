-- ============================================================
-- MySQL 8.0 Init Script — Google Docs Clone
-- Encoding: utf8mb4 / utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS defaultdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE defaultdb;

-- ============================================================
-- 1. roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id   INT          NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO roles (name) VALUES
  ('ROLE_USER'),
  ('ROLE_ADMIN'),
  ('ROLE_EDITOR');

-- ============================================================
-- 2. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) DEFAULT NULL COMMENT 'NULL for OAuth2-only accounts',
  full_name     VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500) DEFAULT NULL,
  provider      VARCHAR(20)  NOT NULL DEFAULT 'LOCAL' COMMENT 'LOCAL | GOOGLE | GITHUB',
  provider_id   VARCHAR(255) DEFAULT NULL COMMENT 'OAuth2 provider subject ID',
  enabled       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  INDEX idx_users_email (email),
  INDEX idx_users_provider (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. user_roles  (join table)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  user_id VARCHAR(36) NOT NULL,
  role_id INT         NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
    REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. documents
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id         VARCHAR(36)   NOT NULL,
  title      VARCHAR(500)  NOT NULL DEFAULT 'Untitled Document',
  content    LONGTEXT      DEFAULT NULL COMMENT 'Quill Delta JSON or plain HTML',
  owner_id   VARCHAR(36)   NOT NULL,
  is_public  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_documents_owner FOREIGN KEY (owner_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_documents_owner (owner_id),
  INDEX idx_documents_updated (updated_at),
  FULLTEXT INDEX idx_documents_title_ft (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. collaborators
-- ============================================================
CREATE TABLE IF NOT EXISTS collaborators (
  id          VARCHAR(36) NOT NULL,
  document_id VARCHAR(36) NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'READ' COMMENT 'READ | COMMENT | WRITE | OWNER',
  invited_by  VARCHAR(36) DEFAULT NULL,
  invited_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_collaborator (document_id, user_id),
  CONSTRAINT fk_collab_document FOREIGN KEY (document_id)
    REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_collab_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_collab_inviter FOREIGN KEY (invited_by)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_collaborators_user (user_id),
  INDEX idx_collaborators_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. document_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id               VARCHAR(36) NOT NULL,
  document_id      VARCHAR(36) NOT NULL,
  content_snapshot LONGTEXT    DEFAULT NULL,
  version_number   INT         NOT NULL DEFAULT 1,
  change_summary   VARCHAR(500) DEFAULT NULL,
  created_by       VARCHAR(36) DEFAULT NULL,
  created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_versions_document FOREIGN KEY (document_id)
    REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_versions_creator FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_versions_document (document_id),
  INDEX idx_versions_number  (document_id, version_number),
  INDEX idx_versions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. comments
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id           VARCHAR(36) NOT NULL,
  document_id  VARCHAR(36) NOT NULL,
  user_id      VARCHAR(36) NOT NULL,
  content      TEXT        NOT NULL,
  start_offset INT         NOT NULL DEFAULT 0,
  end_offset   INT         NOT NULL DEFAULT 0,
  resolved     TINYINT(1)  NOT NULL DEFAULT 0,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_comments_document FOREIGN KEY (document_id)
    REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_comments_document (document_id),
  INDEX idx_comments_resolved (document_id, resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. replies
-- ============================================================
CREATE TABLE IF NOT EXISTS replies (
  id         VARCHAR(36) NOT NULL,
  comment_id VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_replies_comment FOREIGN KEY (comment_id)
    REFERENCES comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_replies_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_replies_comment (comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         VARCHAR(36)  NOT NULL,
  user_id    VARCHAR(36)  NOT NULL,
  title      VARCHAR(255) NOT NULL,
  content    TEXT         DEFAULT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  type       VARCHAR(50)  NOT NULL COMMENT 'SHARE_INVITE | COMMENT_MENTION | DOCUMENT_EDIT | SYSTEM',
  link       VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notifications_user    (user_id),
  INDEX idx_notifications_read    (user_id, is_read),
  INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id         VARCHAR(36)  NOT NULL,
  user_id    VARCHAR(36)  DEFAULT NULL,
  action     VARCHAR(100) NOT NULL COMMENT 'e.g. DOCUMENT_CREATE, USER_LOGIN, SHARE_INVITE',
  resource   VARCHAR(100) DEFAULT NULL COMMENT 'e.g. document, user, comment',
  resource_id VARCHAR(36) DEFAULT NULL,
  details    TEXT         DEFAULT NULL COMMENT 'JSON payload of the action',
  ip_address VARCHAR(45)  DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  timestamp  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_audit_user      (user_id),
  INDEX idx_audit_timestamp (timestamp),
  INDEX idx_audit_action    (action),
  INDEX idx_audit_resource  (resource, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. refresh_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          VARCHAR(36)   NOT NULL,
  user_id     VARCHAR(36)   NOT NULL,
  token       VARCHAR(512)  NOT NULL,
  expiry_date TIMESTAMP     NOT NULL,
  revoked     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_refresh_token (token(255)),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_rt_user   (user_id),
  INDEX idx_rt_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. document_locks  (pessimistic concurrency indicator)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_locks (
  document_id  VARCHAR(36)  NOT NULL,
  locked_by    VARCHAR(36)  NOT NULL,
  session_id   VARCHAR(128) NOT NULL,
  locked_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   TIMESTAMP    NOT NULL,
  PRIMARY KEY (document_id),
  CONSTRAINT fk_lock_document FOREIGN KEY (document_id)
    REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_lock_user FOREIGN KEY (locked_by)
    REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_lock_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed default admin user  (password: Admin@1234)
-- bcrypt hash of "Admin@1234"
-- ============================================================
INSERT IGNORE INTO users (id, email, password_hash, full_name, provider, enabled)
VALUES (
  'system-admin-00000000-0000-0000',
  'admin@docs.internal',
  '$2a$12$K9h0Y.z6g1y4.xsVLrj9POeG5g7aBEcxKN2nGJBgT.T9dYGVm8IOm',
  'System Administrator',
  'LOCAL',
  1
);

-- Assign ROLE_ADMIN to system admin
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 'system-admin-00000000-0000-0000', id
FROM roles WHERE name = 'ROLE_ADMIN';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT 'system-admin-00000000-0000-0000', id
FROM roles WHERE name = 'ROLE_USER';

-- ============================================================
-- Verify
-- ============================================================
SELECT 'Schema initialised successfully' AS status;
