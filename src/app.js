const fastify = require('fastify');
const cors = require('@fastify/cors');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const graphRoutes = require('./routes/graph');
const mirrorRoutes = require('./routes/mirror');
const patternsRoutes = require('./routes/patterns');

function buildApp(opts = {}) {
  const app = fastify(opts);

  // Register CORS
  app.register(cors, {
    origin: '*', // Configure for production as needed
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Register Routes
  app.register(authRoutes, { prefix: '/auth' });
  app.register(entriesRoutes, { prefix: '/entries' });
  app.register(graphRoutes, { prefix: '/graph' });
  app.register(mirrorRoutes, { prefix: '/mirror' });
  app.register(patternsRoutes, { prefix: '/patterns' });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
  });

  return app;
}

module.exports = buildApp;
