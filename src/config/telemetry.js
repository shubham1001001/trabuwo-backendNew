const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const {
  OTLPMetricExporter,
} = require("@opentelemetry/exporter-metrics-otlp-http");
const { resourceFromAttributes } = require("@opentelemetry/resources");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");
const config = require("config");

let sdk = null;

function initTelemetry() {
  try {
    const otelConfig = config.get("opentelemetry");

    if (!otelConfig.enabled) {
      console.log("OpenTelemetry is disabled in configuration");
      return;
    }

    console.log("Initializing OpenTelemetry...");

    const headers = {};
    if (otelConfig.headers) {
      const firstEqualIndex = otelConfig.headers.indexOf("=");
      if (firstEqualIndex > 0) {
        const headerName = otelConfig.headers.substring(0, firstEqualIndex);
        const headerValue = otelConfig.headers.substring(firstEqualIndex + 1);
        headers[headerName] = headerValue;
      }
    }

    const traceExporter = new OTLPTraceExporter({
      url: `${otelConfig.endpoint}/v1/traces`,
      headers,
    });

    const metricExporter = new OTLPMetricExporter({
      url: `${otelConfig.endpoint}/v1/metrics`,
      headers,
    });

    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000,
    });

    const resource = resourceFromAttributes({
      "service.name": otelConfig.serviceName,
      "service.version": otelConfig.serviceVersion,
      "deployment.environment": otelConfig.environment,
    });

    sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": {
            enabled: false,
          },
          "@opentelemetry/instrumentation-express": {
            enabled: true,
          },
          "@opentelemetry/instrumentation-http": {
            enabled: true,
          },
          "@opentelemetry/instrumentation-ioredis": {
            enabled: true,
          },
          "@opentelemetry/instrumentation-aws-sdk": {
            enabled: true,
          },
        }),
      ],
    });

    sdk.start();
    console.log("OpenTelemetry initialized successfully");
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry:", error);
  }
}

async function shutdownTelemetry() {
  if (sdk) {
    try {
      await sdk.shutdown();
      console.log("OpenTelemetry shutdown completed");
    } catch (error) {
      console.error("Error during OpenTelemetry shutdown:", error);
    }
  }
}

module.exports = {
  initTelemetry,
  shutdownTelemetry,
};
