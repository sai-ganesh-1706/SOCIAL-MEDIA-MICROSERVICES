/*
Winston is a Node.js library used to log messages in your application.

Logs can include:

Info messages (info)

Warnings (warn)

Errors (error)

Debugging info (debug)

It’s more powerful than console.log because:

You can have multiple log levels.

Logs can be saved to files, databases, or even external logging services.

Logs can be formatted (timestamp, color, JSON).

You can have different transports (outputs) at the same time. 
*/

const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "identity-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

module.exports = logger;