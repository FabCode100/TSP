const twinService = require('../services/twinService');
const authenticate = require('../middlewares/authenticate');

async function twinRoutes(fastify, options) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/profile', async (request, reply) => {
    const profile = await twinService.getTwinProfile(request.user.id);
    return { data: profile, error: null, meta: null };
  });

  fastify.post('/chat', async (request, reply) => {
    const { message } = request.body;
    const origin = request.headers.origin || '*';
    reply.raw.setHeader('Access-Control-Allow-Origin', origin);
    reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');
    
    await twinService.chatStream(request.user.id, message, reply);
  });
}

module.exports = twinRoutes;
