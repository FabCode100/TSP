const authService = require('../services/authService');
const authenticate = require('../middlewares/authenticate');

async function authRoutes(fastify, options) {
  fastify.post('/register', async (request, reply) => {
    const { email, password, onboardingAnswers } = request.body;
    const { token, user } = await authService.register({ email, password, onboardingAnswers });
    return { data: { token, user }, error: null, meta: null };
  });

  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;
    const { token, user } = await authService.login({ email, password });
    return { data: { token, user }, error: null, meta: null };
  });

  fastify.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const token = request.headers.authorization.split(' ')[1];
    await authService.logout(token);
    return { data: { success: true }, error: null, meta: null };
  });

  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getMe(request.user.id);
    return { data: user, error: null, meta: null };
  });
}

module.exports = authRoutes;
