# Trabuwo Backend API

A Node.js/Express REST API backend for the Trabuwo ecommerce marketplace, built with Sequelize ORM and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access (Admin, Buyer, Seller)
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis (sessions, Shiprocket token, etc.)
- **Background jobs**: Graphile Worker (view flush, token cleanup, stock notifications, price recommendations, etc.)
- **Payments**: Razorpay (webhook at `POST /webhook`)
- **Logistics**: Shiprocket (webhook at `POST /logistics-webhook`)
- **File upload**: AWS S3 and CloudFront
- **SMS/notifications**: MSG91
- **GST verification**: GSTIN check API
- **API docs**: Swagger/OpenAPI at `/`
- **Logging**: Winston with request correlation
- **Security**: Helmet, CORS, cookie-parser
- **Validation**: express-validator per module
- **Observability** (optional): OpenTelemetry

## Prerequisites

- Node.js(v22.18.0)
- PostgreSQL
- Redis
- AWS S3 bucket (for uploads)
- npm or yarn

## Installation

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd backend
   npm install
   ```

2. **Environment**

   Create a `.env` file in the project root. Config is driven by the `config` package: see [config/default.json](config/default.json) for structure and [config/custom-environment-variables.json](config/custom-environment-variables.json) for env var names.

   **Minimum for local run:**

   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-jwt-secret

   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_HOST=localhost
   DB_PORT=5432

   REDIS_URL=redis://localhost:6379

   AWS_REGION=ap-south-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET_NAME=your-bucket
   AWS_S3_BUCKET_REGION=ap-south-1
   ```

   **Optional / for full features:** Razorpay (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`), Shiprocket (`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_WEBHOOK_API_KEY`), MSG91 (`MSG91_AUTH_KEY`, …), GST (`GSTIN_API_KEY`), encryption (`ENCRYPTION_KEY_V1`, …), blind index (`BLIND_INDEX_SALT`), Graphile Worker (`GRAPHILE_WORKER_SCHEMA`, `GRAPHILE_WORKER_CONCURRENCY`), OpenTelemetry (`OTEL_ENABLED`, `OTEL_ENDPOINT`, …). See [config/custom-environment-variables.json](config/custom-environment-variables.json).

3. **Database**

   ```bash
   createdb your_database_name
   npm run migrate
   ```

## Scripts

| Command                    | Description                      |
| -------------------------- | -------------------------------- |
| `npm run dev`              | Start with nodemon (development) |
| `npm start`                | Start production server          |
| `npm run migrate`          | Run database migrations          |
| `npm run migrate:undo`     | Undo last migration              |
| `npm run migrate:undo:all` | Undo all migrations              |
| `npm run lint`             | Run ESLint                       |
| `npm run lint:fix`         | ESLint with auto-fix             |

## Running the application

- **Development:** `npm run dev`
- **Production:** `npm start`

Server runs on **port 3000** by default (override with `PORT` in `.env`).

- **Health:** `GET http://localhost:3000/health-check` (DB + Redis)
- **Swagger UI:** `http://localhost:3000/`
- **API base:** `http://localhost:3000/api`

## Documentation

- **KT (Knowledge Transfer):** [docs/KT.md](docs/KT.md) — architecture, conventions, module layout, adding modules, operations.
- **API reference:** Swagger UI at `/` when the server is running.
