const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'News API',
    version: '0.1.0',
    description: 'Standalone MySQL API for saving articles and storing lightweight article comments.',
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
    { name: 'Comments' },
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
    '/api/articles/{articleHash}/comments': {
      get: {
        tags: ['Comments'],
        summary: 'List published comments for one saved article',
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
            description: 'Comment list for one article',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArticleCommentListResponse' },
              },
            },
          },
          404: {
            description: 'Article not found',
          },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Create a comment or reply for one saved article',
        parameters: [
          {
            name: 'articleHash',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCommentRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Created comment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ArticleCommentRecord' },
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
      CommentConsentInput: {
        type: 'object',
        properties: {
          ipAddress: { type: 'boolean' },
          location: { type: 'boolean' },
        },
      },
      CommentLocationInput: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          postcode: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
      },
      CreateCommentRequest: {
        type: 'object',
        required: ['body'],
        properties: {
          body: { type: 'string' },
          parent_comment_id: { type: 'integer', nullable: true },
          consent: { $ref: '#/components/schemas/CommentConsentInput' },
          location: { $ref: '#/components/schemas/CommentLocationInput' },
        },
      },
      CommentUserProfile: {
        type: 'object',
        properties: {
          gender: { type: 'string', nullable: true },
          name: {
            type: 'object',
            properties: {
              title: { type: 'string', nullable: true },
              first: { type: 'string', nullable: true },
              last: { type: 'string', nullable: true },
            },
          },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string', nullable: true },
              state: { type: 'string', nullable: true },
              country: { type: 'string', nullable: true },
              postcode: { type: 'string', nullable: true },
              coordinates: {
                type: 'object',
                properties: {
                  latitude: { type: 'string', nullable: true },
                  longitude: { type: 'string', nullable: true },
                },
              },
              timezone: {
                type: 'object',
                properties: {
                  offset: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                },
              },
            },
          },
          email: { type: 'string', nullable: true },
          login: {
            type: 'object',
            properties: {
              uuid: { type: 'string', nullable: true },
              username: { type: 'string', nullable: true },
            },
          },
          dob: {
            type: 'object',
            properties: {
              date: { type: 'string', nullable: true },
              age: { type: 'integer', nullable: true },
            },
          },
          registered: {
            type: 'object',
            properties: {
              date: { type: 'string', nullable: true },
              age: { type: 'integer', nullable: true },
            },
          },
          phone: { type: 'string', nullable: true },
          cell: { type: 'string', nullable: true },
          picture: {
            type: 'object',
            properties: {
              thumbnail: { type: 'string', nullable: true },
            },
          },
          nat: { type: 'string', nullable: true },
        },
      },
      CommentUserRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          display_name: { type: 'string' },
          username: { type: 'string', nullable: true },
          profile: { $ref: '#/components/schemas/CommentUserProfile' },
          profile_thumbnail_data_url: { type: 'string', nullable: true },
        },
      },
      ArticleCommentRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          parent_comment_id: { type: 'integer', nullable: true },
          body: { type: 'string' },
          status: { type: 'string' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' },
          user: { $ref: '#/components/schemas/CommentUserRecord' },
        },
      },
      ArticleCommentListResponse: {
        type: 'object',
        properties: {
          article_hash: { type: 'string' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/ArticleCommentRecord' },
          },
        },
      },
    },
  },
}

module.exports = openApiSpec
