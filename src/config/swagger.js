/* eslint-disable no-undef */
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce Marketplace API",
      version: "1.0.0",
      description: "API documentation for the E-commerce Marketplace backend",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://backend-7316.onrender.com"
            : "http://localhost:5000",
      },
    ],
    // ADD THIS GLOBAL SECURITY BLOCK
    security: [
      {
        bearerAuth: []
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Human-readable error message",
            },
            code: {
              type: "string",
              description: "Machine-readable error code",
              enum: [
                "NOT_FOUND_ERROR",
                "VALIDATION_ERROR",
                "CONFLICT_ERROR",
                "AUTHENTICATION_ERROR",
                "FORBIDDEN",
                "INTERNAL_ERROR",
                "BAD_REQUEST",
              ],
            },
            details: {
              type: "object",
              description: "Additional error details",
              nullable: true,
            },
          },
          required: ["success", "message"],
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
          required: ["success"],
        },
        StoreFollowResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Store followed successfully",
            },
            data: {
              type: "null",
              example: null,
            },
          },
          required: ["success", "message", "data"],
        },
        StoreUnfollowResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Store unfollowed successfully",
            },
            data: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Successfully unfollowed store",
                },
              },
            },
          },
          required: ["success", "message", "data"],
        },
        FollowedStoresResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Followed stores retrieved successfully",
            },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  store: {
                    type: "object",
                    properties: {
                      publicId: {
                        type: "string",
                        format: "uuid",
                        example: "01234567-89ab-7def-0123-456789abcdef",
                      },
                      name: {
                        type: "string",
                        example: "My Electronics Store",
                      },
                    },
                  },
                },
              },
            },
          },
          required: ["success", "message", "data"],
        },
        StoreFollowersResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Store followers retrieved successfully",
            },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  user: {
                    type: "object",
                    properties: {
                      publicId: {
                        type: "string",
                        format: "uuid",
                        example: "01234567-89ab-7def-0123-456789abcdef",
                      },
                    },
                  },
                },
              },
            },
          },
          required: ["success", "message", "data"],
        },
        FollowStatusResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Follow status retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                isFollowing: {
                  type: "boolean",
                  example: true,
                },
              },
            },
          },
          required: ["success", "message", "data"],
        },
        FollowersCountResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Followers count retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                followersCount: {
                  type: "integer",
                  example: 150,
                },
              },
            },
          },
          required: ["success", "message", "data"],
        },
        FollowsCountResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Follows count retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                followsCount: {
                  type: "integer",
                  example: 25,
                },
              },
            },
          },
          required: ["success", "message", "data"],
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request - Validation Error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                details: null,
              },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized - Authentication Required",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Invalid credentials",
                code: "AUTHENTICATION_ERROR",
                details: null,
              },
            },
          },
        },
        Forbidden: {
          description: "Forbidden - Insufficient Permissions",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Insufficient permissions",
                code: "FORBIDDEN",
                details: null,
              },
            },
          },
        },
        NotFound: {
          description: "Not Found - Resource Not Found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Resource not found",
                code: "NOT_FOUND_ERROR",
                details: null,
              },
            },
          },
        },
        Conflict: {
          description: "Conflict - Resource Already Exists",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Resource already exists",
                code: "CONFLICT_ERROR",
                details: null,
              },
            },
          },
        },
        InternalError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Internal server error",
                code: "INTERNAL_ERROR",
                details: null,
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/modules/**/routes.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
