const twinSharingService = require('../services/twinSharingService');
const authenticate = require('../middlewares/authenticate');

async function twinSharingRoutes(fastify, options) {
  // =============================================
  // OWNER ROUTES (require authentication)
  // =============================================

  // Create a new share token
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { permissionLevel, role, roleInstruction, expiresAt } = request.body;
    const token = await twinSharingService.createShareToken(request.user.id, {
      permissionLevel,
      role,
      roleInstruction,
      expiresAt,
    });
    return { data: token, error: null };
  });

  // List my active tokens
  fastify.get('/tokens', { preHandler: [authenticate] }, async (request, reply) => {
    const tokens = await twinSharingService.listMyTokens(request.user.id);
    return { data: tokens, error: null };
  });

  // Revoke a token
  fastify.delete('/tokens/:id', { preHandler: [authenticate] }, async (request, reply) => {
    await twinSharingService.revokeToken(request.user.id, request.params.id);
    return { data: { success: true }, error: null };
  });

  // Get access logs
  fastify.get('/logs', { preHandler: [authenticate] }, async (request, reply) => {
    const logs = await twinSharingService.getAccessLogs(request.user.id);
    return { data: logs, error: null };
  });

  // Get connections/friends
  fastify.get('/connections', { preHandler: [authenticate] }, async (request, reply) => {
    const connections = await twinSharingService.getConnections(request.user.id);
    return { data: connections, error: null };
  });

  // =============================================
  // PUBLIC ROUTES (no authentication required)
  // =============================================

  // Validate a token
  fastify.get('/validate/:token', async (request, reply) => {
    const token = await twinSharingService.validateToken(request.params.token);
    if (!token) {
      reply.code(404);
      return { data: null, error: 'Token inválido ou expirado' };
    }
    return { data: { valid: true, permissionLevel: token.permissionLevel, role: token.role }, error: null };
  });

  // Get shared twin profile
  fastify.get('/explore/:token', async (request, reply) => {
    const profile = await twinSharingService.getSharedTwinProfile(request.params.token);
    if (!profile) {
      reply.code(404);
      return { data: null, error: 'Token inválido ou expirado' };
    }
    return { data: profile, error: null };
  });

  // Chat with shared twin (SSE stream)
  fastify.post('/explore/:token/chat', async (request, reply) => {
    const { message } = request.body;
    
    // Manually set CORS and SSE headers for raw response
    reply.raw.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    reply.raw.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    const origin = request.headers.origin || '*';
    reply.raw.setHeader('Access-Control-Allow-Origin', origin);
    reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');

    await twinSharingService.chatWithSharedTwin(request.params.token, message, reply);
  });

  // End session
  fastify.post('/explore/:token/end', async (request, reply) => {
    const { accessorName, duration, messageCount } = request.body;
    const log = await twinSharingService.endSession({
      token: request.params.token,
      accessorName,
      duration,
      messageCount,
    });
    if (!log) {
      reply.code(404);
      return { data: null, error: 'Token inválido' };
    }
    return { data: log, error: null };
  });
}

module.exports = twinSharingRoutes;
