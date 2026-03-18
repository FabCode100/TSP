const graphService = require('../services/graphService');
const authenticate = require('../middlewares/authenticate');

async function graphRoutes(fastify, options) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', async (request, reply) => {
    const result = await graphService.getGraph(request.user.id);
    return { data: result.data, error: null, meta: result.meta };
  });

  fastify.get('/node/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await graphService.getNode(request.user.id, id);
    return { data: result.data, error: null, meta: null };
  });

  fastify.delete('/node/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await graphService.deleteNode(request.user.id, id);
    return { data: result, error: null, meta: null };
  });
}

module.exports = graphRoutes;
