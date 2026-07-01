CREATE TABLE IF NOT EXISTS comment_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  signal_hash CHAR(64) NOT NULL,
  profile_source VARCHAR(32) NOT NULL DEFAULT 'randomuser',
  display_name VARCHAR(191) NOT NULL,
  username VARCHAR(191) NULL,
  email_placeholder VARCHAR(191) NULL,
  gender VARCHAR(32) NULL,
  nat VARCHAR(16) NULL,
  randomuser_login_uuid CHAR(36) NULL,
  ip_address_value VARCHAR(64) NULL,
  ip_address_consent TINYINT(1) NOT NULL DEFAULT 0,
  location_consent TINYINT(1) NOT NULL DEFAULT 0,
  location_json LONGTEXT NULL,
  profile_thumbnail_url TEXT NULL,
  profile_thumbnail_mime VARCHAR(64) NULL,
  profile_thumbnail_blob LONGBLOB NULL,
  raw_profile_json LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_comment_users_signal_hash (signal_hash),
  KEY idx_comment_users_randomuser_login_uuid (randomuser_login_uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_id INT UNSIGNED NOT NULL,
  parent_comment_id BIGINT UNSIGNED NULL,
  comment_user_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  status ENUM('published', 'hidden', 'deleted') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_article_comments_article_id (article_id),
  KEY idx_article_comments_parent_comment_id (parent_comment_id),
  KEY idx_article_comments_comment_user_id (comment_user_id),
  CONSTRAINT fk_article_comments_article
    FOREIGN KEY (article_id) REFERENCES news_articles(id)
      ON DELETE CASCADE,
  CONSTRAINT fk_article_comments_parent
    FOREIGN KEY (parent_comment_id) REFERENCES article_comments(id)
      ON DELETE SET NULL,
  CONSTRAINT fk_article_comments_user
    FOREIGN KEY (comment_user_id) REFERENCES comment_users(id)
      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;