/* eslint-env node */
/* global process */
const { createLogger, format, transports } = require("winston");
// const { trace } = require("@opentelemetry/api");

// const traceContextFormat = format((info) => {
//   const activeSpan = trace.getActiveSpan();
//   if (activeSpan) {
//     const spanContext = activeSpan.spanContext();
//     if (spanContext) {
//       info.trace_id = spanContext.traceId;
//       info.span_id = spanContext.spanId;
//       info.trace_flags = spanContext.traceFlags;
//     }
//   }
//   return info;
// });

const loggerTransports = [
  new transports.Console({
    format:
      process.env.NODE_ENV === "production"
        ? format.combine(
            format.timestamp(),
            // traceContextFormat(),
            format.json()
          )
        : format.combine(format.colorize(), format.simple()),
  }),
];

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    // traceContextFormat(),
    format.json()
  ),
  transports: loggerTransports,
});

module.exports = logger;
