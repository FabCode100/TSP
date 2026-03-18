const mirrorService = require('../services/mirrorService');
const authenticate = require('../middlewares/authenticate');

async function mirrorRoutes(fastify, options) {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/chat', async (request, reply) => {
    const { message, history } = request.body;
    await mirrorService.chatStream(request.user.id, message, history, reply);
  });

  fastify.get('/suggestions', async (request, reply) => {
    const result = await mirrorService.getSuggestions(request.user.id);
    return { data: result, error: null, meta: null };
  });
}

module.exports = mirrorRoutes;
