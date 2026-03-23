const errorHandler = (error, request, reply) => {
  request.log.error(error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  reply.status(statusCode).send({
    error: {
      code: statusCode,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: error.toString() // Adicionado para debug no Render
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  });
};

module.exports = errorHandler;
