const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
/*
The err.stack property contains a detailed description of where and why the error happened.

Example log:

Error: Cannot read property 'id' of undefined
    at /routes/user.js:12:15
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
*/
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
};

module.exports = errorHandler;