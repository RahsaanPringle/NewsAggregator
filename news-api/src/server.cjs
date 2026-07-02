const crypto = require('node:crypto')
const https = require('node:https')
const path = require('node:path')
const dotenv = require('dotenv')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mysql = require('mysql2/promise')
const swaggerUi = require('swagger-ui-express')
const openApiSpec = require('./openapi.cjs')

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config()

const PORT = Number(process.env.PORT || 4001)
const MYSQL_HOST = normalizeString(process.env.MYSQL_HOST || 'my04.winhost.com')
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306)
const MYSQL_DATABASE = normalizeString(process.env.MYSQL_DATABASE)
const MYSQL_USER = normalizeString(process.env.MYSQL_USER)
const MYSQL_PASSWORD = normalizeString(process.env.MYSQL_PASSWORD)
const CORS_ORIGIN = normalizeCorsOrigins(process.env.CORS_ORIGIN)

const pool = createMysqlPool()
const app = express()

const CREATE_NEWS_ARTICLES_TABLE_SQL = `
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
`

const CREATE_COMMENT_USERS_TABLE_SQL = `
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
`

const CREATE_ARTICLE_COMMENTS_TABLE_SQL = `
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
`

const CREATE_COMMENT_MESSAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS comment_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    recipient_comment_user_id BIGINT UNSIGNED NOT NULL,
    sender_comment_user_id BIGINT UNSIGNED NOT NULL,
    article_id INT UNSIGNED NOT NULL,
    parent_comment_id BIGINT UNSIGNED NOT NULL,
    reply_comment_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_comment_messages_reply_comment_id (reply_comment_id),
    KEY idx_comment_messages_recipient_created_at (recipient_comment_user_id, created_at),
    KEY idx_comment_messages_sender_comment_user_id (sender_comment_user_id),
    KEY idx_comment_messages_article_id (article_id),
    CONSTRAINT fk_comment_messages_recipient
      FOREIGN KEY (recipient_comment_user_id) REFERENCES comment_users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comment_messages_sender
      FOREIGN KEY (sender_comment_user_id) REFERENCES comment_users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comment_messages_article
      FOREIGN KEY (article_id) REFERENCES news_articles(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comment_messages_parent_comment
      FOREIGN KEY (parent_comment_id) REFERENCES article_comments(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comment_messages_reply_comment
      FOREIGN KEY (reply_comment_id) REFERENCES article_comments(id)
        ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false }))

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/openapi.json', (_request, response) => {
  response.json(openApiSpec)
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }))

app.post('/api/mysql/articles/status', async (request, response) => {
  const articles = Array.isArray(request.body?.articles) ? request.body.articles : []
  const articleHashes = articles.map((article) => computeArticleHash(article))

  if (!isMysqlConfigured()) {
    response.status(200).json({
      enabled: false,
      message: 'MySQL is not configured.',
      articleHashes: [],
      existingArticleHashes: [],
    })
    return
  }

  try {
    await ensureSchema()

    if (articleHashes.length === 0) {
      response.status(200).json({
        enabled: true,
        articleHashes: [],
        existingArticleHashes: [],
      })
      return
    }

    const uniqueHashes = [...new Set(articleHashes)]
    const placeholders = uniqueHashes.map(() => '?').join(', ')
    const [rows] = await pool.query(
      `SELECT article_hash FROM news_articles WHERE article_hash IN (${placeholders})`,
      uniqueHashes,
    )

    response.status(200).json({
      enabled: true,
      articleHashes,
      existingArticleHashes: rows.map((row) => row.article_hash),
    })
  } catch (error) {
    response.status(502).json({
      enabled: false,
      error: error.message || 'Unable to query MySQL article status.',
    })
  }
})

app.post('/api/mysql/articles', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  const article = request.body?.article
  const endpointPath = normalizeString(request.body?.endpointPath)
  const queryParams = isPlainObject(request.body?.queryParams) ? request.body.queryParams : {}

  if (!isPlainObject(article)) {
    response.status(400).json({ error: 'Request body must include an article object.' })
    return
  }

  try {
    await ensureSchema()

    const articleHash = computeArticleHash(article)
    const [existingRows] = await pool.query('SELECT id FROM news_articles WHERE article_hash = ? LIMIT 1', [articleHash])

    if (existingRows.length > 0) {
      response.status(200).json({ articleHash, inserted: false, alreadyExists: true })
      return
    }

    const authors = Array.isArray(article.authors) ? article.authors : []
    const publishedAtUtc = parseArticlePublishedDate(article.published_datetime_utc)

    await pool.execute(
      `INSERT INTO news_articles (
        article_hash,
        article_id,
        title,
        link,
        snippet,
        source_name,
        published_datetime_utc,
        authors_json,
        endpoint_path,
        query_params_json,
        raw_article_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        articleHash,
        normalizeNullableString(article.article_id, 191),
        normalizeNullableString(article.title),
        normalizeNullableString(article.link),
        normalizeNullableString(article.snippet),
        normalizeNullableString(article.source_name, 191),
        publishedAtUtc,
        JSON.stringify(authors),
        normalizeNullableString(endpointPath, 255),
        JSON.stringify(queryParams),
        JSON.stringify(article),
      ],
    )

    response.status(201).json({ articleHash, inserted: true, alreadyExists: false })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to save article to MySQL.' })
  }
})

app.get('/api/mysql/articles', listArticlesHandler)
app.get('/api/articles', listArticlesHandler)

async function listArticlesHandler(request, response) {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  try {
    await ensureSchema()

    const limit = clampInteger(request.query.limit, 50, 1, 500)
    const offset = clampInteger(request.query.offset, 0, 0, 1000000)
    const search = normalizeString(request.query.search)

    const params = []
    let whereClause = ''

    if (search) {
      whereClause = 'WHERE title LIKE ? OR snippet LIKE ? OR source_name LIKE ? OR link LIKE ?'
      const term = `%${search}%`
      params.push(term, term, term, term)
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM news_articles ${whereClause}`,
      params,
    )

    const [rows] = await pool.query(
      `SELECT
        article_hash,
        article_id,
        title,
        link,
        snippet,
        source_name,
        published_datetime_utc,
        authors_json,
        endpoint_path,
        query_params_json,
        created_at,
        updated_at
      FROM news_articles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )

    response.json({
      items: rows.map(normalizeArticleRow),
      limit,
      offset,
      total: countRows[0]?.total ?? 0,
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load articles from MySQL.' })
  }
}

app.get('/api/articles/:articleHash', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  try {
    await ensureSchema()

    const [rows] = await pool.query('SELECT * FROM news_articles WHERE article_hash = ? LIMIT 1', [request.params.articleHash])
    if (rows.length === 0) {
      response.status(404).json({ error: 'Article not found.' })
      return
    }

    response.json(normalizeArticleRow(rows[0]))
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load article from MySQL.' })
  }
})

app.get('/api/articles/:articleHash/comments', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  try {
    await ensureSchema()

    const articleRow = await findArticleByHash(request.params.articleHash)
    if (!articleRow) {
      response.status(404).json({ error: 'Article not found.' })
      return
    }

    const [rows] = await pool.query(
      `SELECT
        c.id,
        c.parent_comment_id,
        c.body,
        c.status,
        c.created_at,
        c.updated_at,
        u.id AS user_id,
        u.display_name,
        u.username,
        u.profile_thumbnail_mime,
        u.profile_thumbnail_blob,
        u.raw_profile_json
      FROM article_comments c
      INNER JOIN comment_users u ON u.id = c.comment_user_id
      WHERE c.article_id = ?
        AND c.deleted_at IS NULL
        AND c.status = 'published'
      ORDER BY c.created_at ASC`,
      [articleRow.id],
    )

    response.json({
      article_hash: articleRow.article_hash,
      items: rows.map(normalizeCommentRow),
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load comments.' })
  }
})

app.post('/api/articles/:articleHash/comments', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  const body = normalizeNullableString(request.body?.body)
  if (!body) {
    response.status(400).json({ error: 'Request body must include a non-empty comment body.' })
    return
  }

  const requestedParentCommentId = normalizeInteger(request.body?.parent_comment_id)
  const parentCommentId = requestedParentCommentId && requestedParentCommentId > 0
    ? requestedParentCommentId
    : null
  const requestedCommentUserId = normalizeInteger(request.body?.comment_user_id)

  try {
    await ensureSchema()

    const articleRow = await findArticleByHash(request.params.articleHash)
    if (!articleRow) {
      response.status(404).json({ error: 'Article not found.' })
      return
    }

    let parentCommentRow = null
    if (parentCommentId) {
      const [parentRows] = await pool.query(
        `SELECT id
              , comment_user_id
         FROM article_comments
         WHERE id = ?
           AND article_id = ?
           AND deleted_at IS NULL
           AND status = 'published'
         LIMIT 1`,
        [parentCommentId, articleRow.id],
      )

      if (parentRows.length === 0) {
        response.status(400).json({ error: 'Parent comment was not found for this article.' })
        return
      }

      parentCommentRow = parentRows[0]
    }

    let userId = null

    if (requestedCommentUserId && requestedCommentUserId > 0) {
      const requestedCommentUser = await findCommentUserById(requestedCommentUserId)
      if (!requestedCommentUser) {
        response.status(400).json({ error: 'comment_user_id was not found.' })
        return
      }

      userId = requestedCommentUser.id
    } else {
      const location = normalizeLocationInput(request.body?.location)
      const consent = normalizeConsentInput(request.body?.consent)
      const requesterIp = getRequestIpAddress(request)
      const signalHash = computeCommentUserSignalHash(requesterIp, consent.location ? location : null)

      userId = await findOrCreateCommentUser({
        signalHash,
        requesterIp,
        location,
        consent,
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO article_comments (
        article_id,
        parent_comment_id,
        comment_user_id,
        body,
        status
      ) VALUES (?, ?, ?, ?, 'published')`,
      [articleRow.id, parentCommentId, userId, body],
    )

    if (parentCommentRow && Number(parentCommentRow.comment_user_id) !== Number(userId)) {
      await createCommentReplyMessage({
        recipientCommentUserId: parentCommentRow.comment_user_id,
        senderCommentUserId: userId,
        articleId: articleRow.id,
        parentCommentId: parentCommentRow.id,
        replyCommentId: result.insertId,
      })
    }

    const [rows] = await pool.query(
      `SELECT
        c.id,
        c.parent_comment_id,
        c.body,
        c.status,
        c.created_at,
        c.updated_at,
        u.id AS user_id,
        u.display_name,
        u.username,
        u.profile_thumbnail_mime,
        u.profile_thumbnail_blob,
        u.raw_profile_json
      FROM article_comments c
      INNER JOIN comment_users u ON u.id = c.comment_user_id
      WHERE c.id = ?
      LIMIT 1`,
      [result.insertId],
    )

    response.status(201).json(normalizeCommentRow(rows[0]))
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to create comment.' })
  }
})

app.post('/api/comment-users/random', async (_request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  try {
    await ensureSchema()

    const randomUserProfile = await fetchRandomUserProfile()
    const profile = projectRandomUserProfile(randomUserProfile, null)
    const thumbnail = await downloadThumbnailAsset(profile.picture?.thumbnail)
    const displayName = buildDisplayName(profile)
    const signalHash = crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex')

    const [result] = await pool.execute(
      `INSERT INTO comment_users (
        signal_hash,
        profile_source,
        display_name,
        username,
        email_placeholder,
        gender,
        nat,
        randomuser_login_uuid,
        ip_address_value,
        ip_address_consent,
        location_consent,
        location_json,
        profile_thumbnail_url,
        profile_thumbnail_mime,
        profile_thumbnail_blob,
        raw_profile_json
      ) VALUES (?, 'randomuser', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        signalHash,
        displayName,
        normalizeNullableString(profile.login?.username, 191),
        normalizeNullableString(profile.email, 191),
        normalizeNullableString(profile.gender, 32),
        normalizeNullableString(profile.nat, 16),
        normalizeNullableString(profile.login?.uuid, 36),
        null,
        0,
        0,
        null,
        normalizeNullableString(profile.picture?.thumbnail),
        thumbnail.mimeType,
        thumbnail.buffer,
        JSON.stringify(profile),
      ],
    )

    const [rows] = await pool.query(
      `SELECT
        id,
        display_name,
        username,
        email_placeholder,
        gender,
        nat,
        created_at,
        profile_thumbnail_mime,
        profile_thumbnail_blob
      FROM comment_users
      WHERE id = ?
      LIMIT 1`,
      [result.insertId],
    )

    response.status(201).json(normalizeCommentUserRow(rows[0]))
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to create random comment user.' })
  }
})

app.get('/api/comment-messages/inbox', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  const commentUserId = normalizeInteger(request.query.commentUserId)
  if (!commentUserId || commentUserId <= 0) {
    response.status(400).json({ error: 'Query parameter commentUserId must be a positive integer.' })
    return
  }

  const limit = clampInteger(request.query.limit, 10, 1, 50)

  try {
    await ensureSchema()

    const [rows] = await pool.query(
      `SELECT
        m.id,
        m.created_at,
        m.read_at,
        m.parent_comment_id,
        m.reply_comment_id,
        a.article_hash,
        a.title AS article_title,
        parent_comment.body AS parent_comment_body,
        reply_comment.body AS reply_comment_body,
        sender.id AS sender_user_id,
        sender.display_name AS sender_display_name,
        sender.username AS sender_username,
        sender.profile_thumbnail_mime AS sender_profile_thumbnail_mime,
        sender.profile_thumbnail_blob AS sender_profile_thumbnail_blob
      FROM comment_messages m
      INNER JOIN news_articles a ON a.id = m.article_id
      INNER JOIN article_comments parent_comment ON parent_comment.id = m.parent_comment_id
      INNER JOIN article_comments reply_comment ON reply_comment.id = m.reply_comment_id
      INNER JOIN comment_users sender ON sender.id = m.sender_comment_user_id
      WHERE m.recipient_comment_user_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?`,
      [commentUserId, limit],
    )

    const [countRows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread_total
      FROM comment_messages
      WHERE recipient_comment_user_id = ?`,
      [commentUserId],
    )

    response.json({
      comment_user_id: commentUserId,
      total: Number(countRows[0]?.total || 0),
      unread_total: Number(countRows[0]?.unread_total || 0),
      items: rows.map(normalizeCommentMessageRow),
    })
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load inbox messages.' })
  }
})

app.get('/api/comment-users/:commentUserId', async (request, response) => {
  if (!isMysqlConfigured()) {
    response.status(503).json({ error: 'MySQL is not configured.' })
    return
  }

  const commentUserId = normalizeInteger(request.params.commentUserId)
  if (!commentUserId || commentUserId <= 0) {
    response.status(400).json({ error: 'commentUserId must be a positive integer.' })
    return
  }

  try {
    await ensureSchema()

    const [rows] = await pool.query(
      `SELECT
        id,
        display_name,
        username,
        email_placeholder,
        gender,
        nat,
        created_at,
        profile_thumbnail_mime,
        profile_thumbnail_blob
      FROM comment_users
      WHERE id = ?
      LIMIT 1`,
      [commentUserId],
    )

    if (rows.length === 0) {
      response.status(404).json({ error: 'Comment user not found.' })
      return
    }

    response.json(normalizeCommentUserRow(rows[0]))
  } catch (error) {
    response.status(502).json({ error: error.message || 'Unable to load comment user.' })
  }
})

app.use((error, _request, response, _next) => {
  response.status(500).json({ error: error.message || 'Unexpected server error.' })
})

app.listen(PORT, () => {
  console.log(`News API listening on http://127.0.0.1:${PORT}`)
  console.log(`Swagger UI available at http://127.0.0.1:${PORT}/docs`)
})

async function ensureSchema() {
  await pool.query(CREATE_NEWS_ARTICLES_TABLE_SQL)
  await pool.query(CREATE_COMMENT_USERS_TABLE_SQL)
  await pool.query(CREATE_ARTICLE_COMMENTS_TABLE_SQL)
  await pool.query(CREATE_COMMENT_MESSAGES_TABLE_SQL)
  await ensureArticleCommentsReplySchema()
}

async function createCommentReplyMessage({
  recipientCommentUserId,
  senderCommentUserId,
  articleId,
  parentCommentId,
  replyCommentId,
}) {
  await pool.execute(
    `INSERT INTO comment_messages (
      recipient_comment_user_id,
      sender_comment_user_id,
      article_id,
      parent_comment_id,
      reply_comment_id
    ) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE id = id`,
    [recipientCommentUserId, senderCommentUserId, articleId, parentCommentId, replyCommentId],
  )
}

async function ensureArticleCommentsReplySchema() {
  const [columnRows] = await pool.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'article_comments'
       AND COLUMN_NAME = 'parent_comment_id'
     LIMIT 1`,
    [MYSQL_DATABASE],
  )

  if (columnRows.length === 0) {
    await pool.query(
      `ALTER TABLE article_comments
       ADD COLUMN parent_comment_id BIGINT UNSIGNED NULL AFTER article_id`,
    )
  }

  const [indexRows] = await pool.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'article_comments'
       AND INDEX_NAME = 'idx_article_comments_parent_comment_id'
     LIMIT 1`,
    [MYSQL_DATABASE],
  )

  if (indexRows.length === 0) {
    await pool.query(
      `ALTER TABLE article_comments
       ADD KEY idx_article_comments_parent_comment_id (parent_comment_id)`,
    )
  }

  const [foreignKeyRows] = await pool.query(
    `SELECT 1
     FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ?
       AND TABLE_NAME = 'article_comments'
       AND CONSTRAINT_NAME = 'fk_article_comments_parent'
     LIMIT 1`,
    [MYSQL_DATABASE],
  )

  if (foreignKeyRows.length === 0) {
    await pool.query(
      `ALTER TABLE article_comments
       ADD CONSTRAINT fk_article_comments_parent
       FOREIGN KEY (parent_comment_id) REFERENCES article_comments(id)
       ON DELETE SET NULL`,
    )
  }
}

async function findArticleByHash(articleHash) {
  const [rows] = await pool.query(
    'SELECT id, article_hash FROM news_articles WHERE article_hash = ? LIMIT 1',
    [articleHash],
  )

  return rows[0] ?? null
}

async function findCommentUserById(commentUserId) {
  const [rows] = await pool.query('SELECT id FROM comment_users WHERE id = ? LIMIT 1', [commentUserId])
  return rows[0] ?? null
}

async function findOrCreateCommentUser({ signalHash, requesterIp, location, consent }) {
  const [existingRows] = await pool.query(
    'SELECT id FROM comment_users WHERE signal_hash = ? LIMIT 1',
    [signalHash],
  )

  if (existingRows.length > 0) {
    return existingRows[0].id
  }

  const randomUserProfile = await fetchRandomUserProfile()
  const profile = projectRandomUserProfile(randomUserProfile, consent.location ? location : null)
  const thumbnail = await downloadThumbnailAsset(profile.picture?.thumbnail)
  const displayName = buildDisplayName(profile)

  const [result] = await pool.execute(
    `INSERT INTO comment_users (
      signal_hash,
      profile_source,
      display_name,
      username,
      email_placeholder,
      gender,
      nat,
      randomuser_login_uuid,
      ip_address_value,
      ip_address_consent,
      location_consent,
      location_json,
      profile_thumbnail_url,
      profile_thumbnail_mime,
      profile_thumbnail_blob,
      raw_profile_json
    ) VALUES (?, 'randomuser', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      signalHash,
      displayName,
      normalizeNullableString(profile.login?.username, 191),
      normalizeNullableString(profile.email, 191),
      normalizeNullableString(profile.gender, 32),
      normalizeNullableString(profile.nat, 16),
      normalizeNullableString(profile.login?.uuid, 36),
      consent.ipAddress ? normalizeNullableString(requesterIp, 64) : null,
      consent.ipAddress ? 1 : 0,
      consent.location ? 1 : 0,
      location ? JSON.stringify(location) : null,
      normalizeNullableString(profile.picture?.thumbnail),
      thumbnail.mimeType,
      thumbnail.buffer,
      JSON.stringify(profile),
    ],
  )

  return result.insertId
}

async function fetchRandomUserProfile() {
  const payload = await httpsRequestJson('https://randomuser.me/api/')
  const profile = Array.isArray(payload?.results) ? payload.results[0] : null

  if (!isPlainObject(profile)) {
    throw new Error('RandomUser returned an unexpected payload.')
  }

  return profile
}

function projectRandomUserProfile(profile, locationOverride) {
  const projected = {
    gender: normalizeNullableString(profile.gender, 32),
    name: {
      title: normalizeNullableString(profile.name?.title, 32),
      first: normalizeNullableString(profile.name?.first, 191),
      last: normalizeNullableString(profile.name?.last, 191),
    },
    location: {
      city: normalizeNullableString(profile.location?.city, 191),
      state: normalizeNullableString(profile.location?.state, 191),
      country: normalizeNullableString(profile.location?.country, 191),
      postcode: normalizeNullableString(profile.location?.postcode, 32),
      coordinates: {
        latitude: normalizeNullableString(profile.location?.coordinates?.latitude, 64),
        longitude: normalizeNullableString(profile.location?.coordinates?.longitude, 64),
      },
      timezone: {
        offset: normalizeNullableString(profile.location?.timezone?.offset, 32),
        description: normalizeNullableString(profile.location?.timezone?.description, 191),
      },
    },
    email: normalizeNullableString(profile.email, 191),
    login: {
      uuid: normalizeNullableString(profile.login?.uuid, 36),
      username: normalizeNullableString(profile.login?.username, 191),
    },
    dob: {
      date: normalizeNullableString(profile.dob?.date, 64),
      age: normalizeInteger(profile.dob?.age),
    },
    registered: {
      date: normalizeNullableString(profile.registered?.date, 64),
      age: normalizeInteger(profile.registered?.age),
    },
    phone: normalizeNullableString(profile.phone, 64),
    cell: normalizeNullableString(profile.cell, 64),
    picture: {
      thumbnail: normalizeNullableString(profile.picture?.thumbnail),
    },
    nat: normalizeNullableString(profile.nat, 16),
  }

  if (locationOverride) {
    projected.location = {
      city: locationOverride.city,
      state: locationOverride.state,
      country: locationOverride.country,
      postcode: locationOverride.postcode,
      coordinates: {
        latitude: locationOverride.latitude,
        longitude: locationOverride.longitude,
      },
      timezone: {
        offset: null,
        description: null,
      },
    }
  }

  return projected
}

async function downloadThumbnailAsset(url) {
  const normalizedUrl = normalizeNullableString(url)
  if (!normalizedUrl) {
    return { buffer: null, mimeType: null }
  }

  try {
    const response = await httpsRequestBuffer(normalizedUrl)
    return {
      buffer: response.buffer,
      mimeType: normalizeNullableString(response.contentType, 64),
    }
  } catch {
    return { buffer: null, mimeType: null }
  }
}

function buildDisplayName(profile) {
  const nameParts = [profile.name?.first, profile.name?.last].filter(Boolean)
  if (nameParts.length > 0) {
    return nameParts.join(' ').slice(0, 191)
  }

  return normalizeNullableString(profile.login?.username, 191) || 'Guest Commenter'
}

function normalizeCommentRow(row) {
  if (!row) {
    return null
  }

  const profile = safeJsonParse(row.raw_profile_json, {})

  return {
    id: row.id,
    parent_comment_id: row.parent_comment_id,
    body: row.body,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user: {
      id: row.user_id,
      display_name: row.display_name,
      username: row.username,
      profile,
      profile_thumbnail_data_url: toDataUrl(row.profile_thumbnail_mime, row.profile_thumbnail_blob),
    },
  }
}

function normalizeCommentMessageRow(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    created_at: row.created_at,
    read_at: row.read_at,
    parent_comment_id: row.parent_comment_id,
    reply_comment_id: row.reply_comment_id,
    article: {
      article_hash: row.article_hash,
      title: row.article_title,
    },
    parent_comment_excerpt: buildMessageExcerpt(row.parent_comment_body),
    reply_comment_excerpt: buildMessageExcerpt(row.reply_comment_body),
    sender: {
      id: row.sender_user_id,
      display_name: row.sender_display_name,
      username: row.sender_username,
      profile_thumbnail_data_url: toDataUrl(row.sender_profile_thumbnail_mime, row.sender_profile_thumbnail_blob),
    },
  }
}

function normalizeCommentUserRow(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    display_name: row.display_name,
    username: row.username,
    email_placeholder: row.email_placeholder,
    gender: row.gender,
    nat: row.nat,
    created_at: row.created_at,
    profile_thumbnail_data_url: toDataUrl(row.profile_thumbnail_mime, row.profile_thumbnail_blob),
  }
}

function buildMessageExcerpt(value) {
  const normalized = normalizeNullableString(value)
  if (!normalized) {
    return ''
  }

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized
}

function getRequestIpAddress(request) {
  const forwarded = normalizeNullableString(request.headers['x-forwarded-for'])
  const candidate = forwarded ? forwarded.split(',')[0] : request.ip
  return normalizeNullableString(String(candidate || '').replace(/^::ffff:/, ''), 64) || 'unknown'
}

function normalizeLocationInput(value) {
  if (!isPlainObject(value)) {
    return null
  }

  return {
    city: normalizeNullableString(value.city ?? value.locality, 191),
    state: normalizeNullableString(value.state ?? value.region, 191),
    country: normalizeNullableString(value.country, 191),
    postcode: normalizeNullableString(value.postcode ?? value.postalCode, 32),
    latitude: normalizeCoordinate(value.latitude ?? value.lat ?? value.coords?.latitude),
    longitude: normalizeCoordinate(value.longitude ?? value.lng ?? value.coords?.longitude),
  }
}

function normalizeConsentInput(value) {
  return {
    ipAddress: normalizeBoolean(value?.ipAddress),
    location: normalizeBoolean(value?.location),
  }
}

function computeCommentUserSignalHash(requesterIp, location) {
  const payload = {
    ipAddress: normalizeNullableString(requesterIp, 64),
    location: location
      ? {
          city: location.city,
          state: location.state,
          country: location.country,
          postcode: location.postcode,
          latitude: location.latitude,
          longitude: location.longitude,
        }
      : null,
  }

  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function httpsRequestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const statusCode = response.statusCode || 500
        if (statusCode < 200 || statusCode >= 300) {
          response.resume()
          reject(new Error(`Request failed with status ${statusCode}.`))
          return
        }

        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch {
            reject(new Error('Failed to parse JSON response.'))
          }
        })
      })
      .on('error', reject)
  })
}

function httpsRequestBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const statusCode = response.statusCode || 500
        if (statusCode < 200 || statusCode >= 300) {
          response.resume()
          reject(new Error(`Request failed with status ${statusCode}.`))
          return
        }

        const chunks = []
        response.on('data', (chunk) => {
          chunks.push(chunk)
        })
        response.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: response.headers['content-type'] || null,
          })
        })
      })
      .on('error', reject)
  })
}

function toDataUrl(mimeType, blob) {
  if (!mimeType || !blob) {
    return null
  }

  const buffer = Buffer.isBuffer(blob) ? blob : Buffer.from(blob)
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

function createMysqlPool() {
  return mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  })
}

function isMysqlConfigured() {
  return Boolean(MYSQL_HOST && MYSQL_DATABASE && MYSQL_USER && MYSQL_PASSWORD)
}

function computeArticleHash(article) {
  const stablePayload = {
    articleId: normalizeString(article?.article_id),
    title: normalizeString(article?.title),
    link: normalizeString(article?.link),
    snippet: normalizeString(article?.snippet),
    sourceName: normalizeString(article?.source_name),
    publishedDatetimeUtc: normalizeString(article?.published_datetime_utc),
    authors: Array.isArray(article?.authors)
      ? article.authors.map((author) => normalizeString(author)).filter(Boolean)
      : [],
  }

  return crypto.createHash('sha256').update(JSON.stringify(stablePayload)).digest('hex')
}

function normalizeArticleRow(row) {
  return {
    article_hash: row.article_hash,
    article_id: row.article_id,
    title: row.title,
    link: row.link,
    snippet: row.snippet,
    source_name: row.source_name,
    published_datetime_utc: row.published_datetime_utc,
    authors: safeJsonParse(row.authors_json, []),
    endpoint_path: row.endpoint_path,
    query_params: safeJsonParse(row.query_params_json, {}),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function normalizeString(value, maxLength = 65535) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()
  if (!normalized) {
    return null
  }

  return normalized.slice(0, maxLength)
}

function normalizeNullableString(value, maxLength = 65535) {
  return normalizeString(value, maxLength)
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function normalizeInteger(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isNaN(parsed) ? null : parsed
}

function normalizeCoordinate(value) {
  const normalized = normalizeNullableString(value, 64)
  if (!normalized) {
    return null
  }

  const parsed = Number.parseFloat(normalized)
  if (Number.isNaN(parsed)) {
    return null
  }

  return String(parsed)
}

function parseArticlePublishedDate(value) {
  const normalized = normalizeString(value)
  if (!normalized) {
    return null
  }

  const parsedDate = new Date(normalized)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.toISOString().slice(0, 19).replace('T', ' ')
}

function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clampInteger(value, defaultValue, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (Number.isNaN(parsed)) {
    return defaultValue
  }

  return Math.min(max, Math.max(min, parsed))
}

function normalizeCorsOrigins(value) {
  if (!value) {
    return true
  }

  const origins = String(value)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins.length > 0 ? origins : true
}
