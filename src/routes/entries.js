const entryService = require('../services/entryService');
const graphService = require('../services/graphService');
const patternService = require('../services/patternService');
const authenticate = require('../middlewares/authenticate');

async function entriesRoutes(fastify, options) {
  fastify.addHook('preHandler', authenticate);

  fastify.post('/', async (request, reply) => {
    const { content, type } = request.body;
    const userId = request.user.id;

    const entry = await entryService.createEntry(userId, { content, type });

    // Background tasks
    const graphUpdate = graphService.extractAndUpdateGraph(userId, content);
    const patternUpdate = patternService.analyzeNewEntry(userId, entry.id);

    // We can await them or let them run in background. The prompt says:
    // "não bloqueia response" for patterns, but let's just await graph for simplicity
    // or return immediately and let them run.
    graphUpdate.catch(err => request.log.error('Graph update failed:', err));
    patternUpdate.catch(err => request.log.error('Pattern update failed:', err));

    return {
      data: {
        entry,
        message: 'Entry created. Graph and patterns are updating in background.',
      },
      error: null,
      meta: null,
    };
  });

  fastify.get('/', async (request, reply) => {
    const { page, limit, type, archived } = request.query;
    const result = await entryService.getEntries(request.user.id, { page, limit, type, archived });
    return { data: result.data, error: null, meta: result.meta };
  });

  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;
    const updated = await entryService.updateEntry(request.user.id, id, data);
    return { data: updated, error: null, meta: null };
  });

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await entryService.deleteEntry(request.user.id, id);
    return { data: result, error: null, meta: null };
  });
}

module.exports = entriesRoutes;
