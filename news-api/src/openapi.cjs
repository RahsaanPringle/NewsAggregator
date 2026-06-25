const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'News API',
    version: '0.1.0',
    description: 'Standalone MySQL API for saving and inspecting news articles.',
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
  tags: [
    { name: 'System' },
    { name: 'Articles' },
    { name: 'MySQL Sync' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check service health',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/mysql/articles/status': {
      post: {
        tags: ['MySQL Sync'],
        summary: 'Check which articles already exist in MySQL',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ArticleStatusRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Article hash status lookup',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArticleStatusResponse' },
              },
            },
          },
        },
      },
    },
    '/api/mysql/articles': {
      post: {
        tags: ['MySQL Sync'],
        summary: 'Insert an article into MySQL if it is missing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaveArticleRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Article inserted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaveArticleResponse' },
              },
            },
          },
          200: {
            description: 'Article already existed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaveArticleResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Articles'],
        summary: 'List saved articles',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 500, default: 50 },
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Saved articles list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArticleListResponse' },
              },
            },
          },
        },
      },
    },
    '/api/articles/{articleHash}': {
      get: {
        tags: ['Articles'],
        summary: 'Fetch one saved article by hash',
        parameters: [
          {
            name: 'articleHash',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Saved article',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArticleRecord' },
              },
            },
          },
          404: {
            description: 'Article not found',
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        tags: ['System'],
        summary: 'Get the raw OpenAPI spec',
        responses: {
          200: {
            description: 'OpenAPI JSON document',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
        },
      },
      ArticleInput: {
        type: 'object',
        properties: {
          article_id: { type: 'string' },
          title: { type: 'string' },
          link: { type: 'string' },
          snippet: { type: 'string' },
          source_name: { type: 'string' },
          published_datetime_utc: { type: 'string', format: 'date-time' },
          authors: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      ArticleStatusRequest: {
        type: 'object',
        required: ['articles'],
        properties: {
          articles: {
            type: 'array',
            items: { $ref: '#/components/schemas/ArticleInput' },
          },
        },
      },
      ArticleStatusResponse: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          articleHashes: {
            type: 'array',
            items: { type: 'string' },
          },
          existingArticleHashes: {
            type: 'array',
            items: { type: 'string' },
          },
          message: { type: 'string' },
          error: { type: 'string' },
        },
      },
      SaveArticleRequest: {
        type: 'object',
        required: ['article'],
        properties: {
          article: { $ref: '#/components/schemas/ArticleInput' },
          endpointPath: { type: 'string' },
          queryParams: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
      },
      SaveArticleResponse: {
        type: 'object',
        properties: {
          articleHash: { type: 'string' },
          inserted: { type: 'boolean' },
          alreadyExists: { type: 'boolean' },
        },
      },
      ArticleRecord: {
        type: 'object',
        properties: {
          article_hash: { type: 'string' },
          article_id: { type: 'string', nullable: true },
          title: { type: 'string', nullable: true },
          link: { type: 'string', nullable: true },
          snippet: { type: 'string', nullable: true },
          source_name: { type: 'string', nullable: true },
          published_datetime_utc: { type: 'string', nullable: true },
          authors: {
            type: 'array',
            items: { type: 'string' },
          },
          endpoint_path: { type: 'string', nullable: true },
          query_params: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
        },
      },
      ArticleListResponse: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/ArticleRecord' },
          },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
          total: { type: 'integer' },
        },
      },
    },
  },
}

module.exports = openApiSpec
