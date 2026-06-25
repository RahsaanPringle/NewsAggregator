CREATE TABLE IF NOT EXISTS news_articles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_hash CHAR(64) NOT NULL,
  article_id VARCHAR(191) NULL,
  title TEXT NULL,
  link TEXT NULL,
  snippet TEXT NULL,
  source_name VARCHAR(191) NULL,
  published_datetime_utc DATETIME NULL,
  authors_json TEXT NULL,
  endpoint_path VARCHAR(255) NULL,
  query_params_json TEXT NULL,
  raw_article_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_news_articles_article_hash (article_hash),
  KEY idx_news_articles_published_datetime_utc (published_datetime_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
