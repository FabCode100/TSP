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
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    
    await twinService.chatStream(request.user.id, message, reply);
  });
}

module.exports = twinRoutes;
