const patternService = require('../services/patternService');
const authenticate = require('../middlewares/authenticate');

async function patternsRoutes(fastify, options) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (request, reply) => {
    const result = await patternService.getPatterns(request.user.id);
    return { data: result.data, error: null, meta: result.meta };
  });

  fastify.patch('/:id/seen', async (request, reply) => {
    const { id } = request.params;
    const result = await patternService.markAsSeen(request.user.id, id);
    return { data: result.data, error: null, meta: null };
  });
}

module.exports = patternsRoutes;
