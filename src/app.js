const fastify = require('fastify');
const cors = require('@fastify/cors');
const path = require('path');
const staticPlugin = require('@fastify/static');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const graphRoutes = require('./routes/graph');
const mirrorRoutes = require('./routes/mirror');
const patternsRoutes = require('./routes/patterns');
const twinRoutes = require('./routes/twin');
const twinSharingRoutes = require('./routes/twinSharing');
const publicTwinRoutes = require('./routes/publicTwin');

function buildApp(opts = {}) {
  const app = fastify(opts);

  // Register CORS
  app.register(cors, {
    origin: true, // Dynamically reflect the request origin (required for credentials: true)
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Serve Static Frontend (Next.js export)
  app.register(staticPlugin, {
    root: path.join(__dirname, '../out'),
    prefix: '/',
    wildcard: false,
  });

  // Register Routes
  app.register(authRoutes, { prefix: '/auth' });
  app.register(entriesRoutes, { prefix: '/entries' });
  app.register(graphRoutes, { prefix: '/graph' });
  app.register(mirrorRoutes, { prefix: '/mirror' });
  app.register(patternsRoutes, { prefix: '/patterns' });
  app.register(twinRoutes, { prefix: '/twin' });
  app.register(twinSharingRoutes, { prefix: '/twin/share' });
  app.register(publicTwinRoutes, { prefix: '/twin/public' });

  // Handle SPA routing for the static export
  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url.startsWith('/auth') || 
        request.raw.url.startsWith('/entries') || 
        request.raw.url.startsWith('/graph') || 
        request.raw.url.startsWith('/mirror') || 
        request.raw.url.startsWith('/patterns') || 
        request.raw.url.startsWith('/twin')) {
      return reply.code(404).send({ error: 'Not Found (API)' });
    }
    return reply.sendFile('index.html');
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
  });

  return app;
}

module.exports = buildApp;
