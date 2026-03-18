const errorHandler = (error, request, reply) => {
  request.log.error(error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  reply.status(statusCode).send({
    error: {
      code: statusCode,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  });
};

module.exports = errorHandler;
