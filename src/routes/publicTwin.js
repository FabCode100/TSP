const publicFigureService = require('../services/publicFigureService');

async function publicTwinRoutes(fastify, options) {
  fastify.get('/profile/:figureId', async (request, reply) => {
    const { figureId } = request.params;
    const profile = await publicFigureService.getProfile(figureId);
    if (!profile) {
      return reply.code(404).send({ error: 'Identity not found' });
    }
    return { data: profile, error: null };
  });

  fastify.post('/chat/:figureId', async (request, reply) => {
    const { figureId } = request.params;
    const { message } = request.body;
    
    const origin = request.headers.origin || '*';
    reply.raw.setHeader('Access-Control-Allow-Origin', origin);
    reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');
    await publicFigureService.chatStream(figureId, message, reply);
  });
}

module.exports = publicTwinRoutes;
