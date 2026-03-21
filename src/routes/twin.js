const twinService = require('../services/twinService');
const authenticate = require('../middlewares/authenticate');
const ttsService = require('../services/ttsService');

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

  fastify.post('/avatar/generate', async (request, reply) => {
    const { text, photoUrl, voiceId } = request.body;
    const userId = request.user.id;

    try {
      // 0. Determinar a voz: usar a fornecida ou buscar a do usuário
      let finalVoiceId = voiceId;
      
      if (!finalVoiceId) {
        const authService = require('../services/authService');
        const user = await authService.getMe(userId);
        finalVoiceId = user?.voiceId;
      }

      // 1. Gerar áudio via TTSService
      console.log(`[AvatarRoute] Generating audio for user ${userId}, requested voiceId: ${voiceId}, finalVoiceId: ${finalVoiceId}`);
      const audioBuffer = await ttsService.generateAudio(text, { voiceId: finalVoiceId });
      
      // 2. Converter para base64 data URL
      const base64Audio = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      
      console.log(`[AvatarRoute] Audio generated successfully. Size: ${audioBuffer.length} bytes`);

      return { success: true, data: { jobId: `${userId}_${Date.now()}`, audioUrl } };
    } catch (error) {
      console.error('Avatar generation error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}

module.exports = twinRoutes;
