/* eslint-env node */
/* global process */
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./config/logger");
const cookieParser = require("cookie-parser");
const config = require("config");
const sequelize = require("./config/database");
const {
  healthCheck: redisHealthCheck,
  closeConnection: closeRedisConnection,
} = require("./config/redis");
const graphileWorkerService = require("./services/graphileWorkerService");
const errorHandler = require("./middleware/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const { Role } = require("./modules/auth/model");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("./utils/asyncHandler");
const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  logger.info(`CORS Middleware: Method=${req.method}, Origin=${origin}`);

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Platform, X-Requested-With, Accept, Origin"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});


// Trust proxy - Required if behind a load balancer (Nginx, AWS ELB, etc.)
app.set("trust proxy", 1);

// General API rate limiter: max 500 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for Auth/OTP: max 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});


// Webhook route - bypasses all middleware except raw body parsing
const paymentController = require("./modules/payment/controller");
const shiprocketController = require("./modules/shiprocket/controller");

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.webhook,
);

app.use(express.json());

app.post(
  "/logistics-webhook",
  asyncHandler(shiprocketController.handleWebhook),
);

app.use(cookieParser());

app.use((req, res, next) => {
  req.correlationId = uuidv4();
  logger.info("Request started", {
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip || "unknown",
    timestamp: new Date().toISOString(),
  });

  res.on("finish", () => {
    logger.info("Request completed", {
      correlationId: req.correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: Date.now() - req._startTime,
      contentLength: res.get("Content-Length") || 0,
      timestamp: new Date().toISOString(),
    });
  });

  req._startTime = Date.now();
  next();
});

app.get(
  "/health-check",
  asyncHandler(async (req, res) => {
    await sequelize.query("SELECT 1");
    const redisHealth = await redisHealthCheck();

    return res.status(200).json({
      success: true,
      message: "Service is healthy",
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        redis: redisHealth ? "connected" : "degraded",
      },
    });
  }),
);

app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);
app.use("/api", require("./routes"));

app.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);


app.use(errorHandler);

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection established.");
  } catch (err) {
    logger.error("❌ Database connection failed:", err);
    throw err;
  }
}

async function connectRedis() {
  try {
    const isHealthy = await redisHealthCheck();
    if (isHealthy) {
      logger.info("Redis connection established.");
    } else {
      logger.warn("Redis connection failed, but continuing...");
    }
  } catch (err) {
    logger.warn("Redis connection failed, but continuing...", err);
  }
}

async function initializeGraphileWorker() {
  try {
    await graphileWorkerService.initialize();
    await graphileWorkerService.scheduleRecurringTasks();
    logger.info("Graphile Worker initialized and recurring tasks scheduled.");
  } catch (err) {
    logger.warn(
      "Graphile Worker initialization failed, but continuing...",
      err,
    );
  }
}

async function setupPgTrgmIndex() {
  try {
    await sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX IF NOT EXISTS category_name_trgm_idx
      ON categories
      USING GIN (name gin_trgm_ops);
    `);
    logger.info("🔍 pg_trgm extension and GIN index set up successfully.");
  } catch (err) {
    logger.warn(
      "Could not set up pg_trgm or index. Continuing without it.",
      err,
    );
  }
}

async function setupProductSearchIndexes() {
  try {
    await sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE EXTENSION IF NOT EXISTS unaccent;
      CREATE INDEX IF NOT EXISTS products_search_vector_idx 
      ON products USING GIN ("search_vector");
      CREATE INDEX IF NOT EXISTS products_name_trgm_idx 
      ON products USING GIN (name gin_trgm_ops);
    `);

    logger.info("Product search indexes created successfully.");
  } catch (err) {
    logger.warn("Could not create product search indexes.", err);
  }
}

async function seedRoles() {
  const roles = ["admin", "buyer", "seller"];
  for (const roleName of roles) {
    await Role.findOrCreate({ where: { name: roleName } });
  }
  logger.info("Default roles seeded.");
}

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();
    await initializeGraphileWorker();

    await setupPgTrgmIndex();
    await setupProductSearchIndexes();
    await seedRoles();

    const PORT = config.get("port") || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Server failed to start:", err);
    process.exit(1);
  }
}

startServer();

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await sequelize.close();
  await closeRedisConnection();
  await graphileWorkerService.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await sequelize.close();
  await closeRedisConnection();
  await graphileWorkerService.close();
  process.exit(0);
});
