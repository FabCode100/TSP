const twinService = require('../services/twinService');
const authenticate = require('../middlewares/authenticate');
const { db, bucket } = require('../lib/firebase');
const googleTTS = require('google-tts-api');
const axios = require('axios');

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
    const { text, photoUrl } = request.body;
    const userId = request.user.id;

    try {
      // 1. Gerar áudio via Google TTS (Grátis)
      const audioUrl = googleTTS.getAudioUrl(text, { lang: 'pt', slow: false, host: 'https://translate.google.com' });
      const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      
      // 2. Upload áudio para Firebase Storage
      const jobId = `${userId}_${Date.now()}`;
      const audioFile = bucket.file(`audio/${jobId}.mp3`);
      await audioFile.save(Buffer.from(audioResponse.data), { contentType: 'audio/mpeg' });
      await audioFile.makePublic();
      const publicAudioUrl = audioFile.publicUrl();

      // 3. Criar Job no Firestore
      const jobRef = db.collection('avatar_jobs').doc(jobId);
      await jobRef.set({
        userId,
        photo_url: photoUrl,
        audio_url: publicAudioUrl,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      return { success: true, jobId, audioUrl: publicAudioUrl };
    } catch (error) {
      console.error('Avatar generation error:', error);
      return reply.status(500).send({ success: false, error: error.message });
    }
  });

  fastify.get('/avatar/status/:jobId', async (request, reply) => {
    const { jobId } = request.params;
    try {
      const jobDoc = await db.collection('avatar_jobs').doc(jobId).get();
      if (!jobDoc.exists) {
        return reply.status(404).send({ success: false, error: 'Job not found' });
      }
      return { success: true, data: jobDoc.data() };
    } catch (error) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}

module.exports = twinRoutes;
