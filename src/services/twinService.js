const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

class TwinService {
  async getTwinProfile(userId) {
    try {
      const [nodes, patterns] = await Promise.all([
        prisma.graphNode.findMany({ where: { userId }, orderBy: { weight: 'desc' }, take: 20 }),
        prisma.pattern.findMany({ where: { userId }, take: 10 }),
      ]);

      const prompt = `Você é o resumo digital de uma pessoa real. Com base nos dados abaixo, crie um perfil curto e direto.

Interesses e valores: ${nodes.map(n => n.label).join(', ')}
Padrões de comportamento: ${patterns.map(p => p.title).join('; ')}

Retorne um JSON com:
{
  "narrative": "Resumo de 1-2 frases sobre quem essa pessoa é (fale em primeira pessoa, tipo 'Sou alguém que...')",
  "status": "Ativo / Em Evolução / Refletindo",
  "prompt_intro": "Uma saudação casual e curta (ex: 'E aí, bora trocar ideia?')"
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const data = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      // Fetch user profile for custom data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { photoUrl: true, voiceId: true }
      });

      data.photo_url = user?.photoUrl || 'https://i.imgur.com/eO9Buny.jpeg';
      data.voice_id = user?.voiceId || 'EXAVITQu4vr4xnSDxMaL';
      
      return data;
    } catch (error) {
      console.error('Error generating twin profile:', error);
      return { narrative: 'Carregando...', status: 'Sincronizando...', prompt_intro: 'Fala!' };
    }
  }

  async chatStream(userId, userMessage, reply) {
    try {
      const [nodes, patterns] = await Promise.all([
        prisma.graphNode.findMany({ where: { userId }, orderBy: { weight: 'desc' }, take: 15 }),
        prisma.pattern.findMany({ where: { userId }, take: 5 }),
      ]);

      const identityContext = `Você é o reflexo digital de um usuário real. Você pensa como ele, fala como ele, e entende o mundo do jeito dele.

Dados do usuário:
- Interesses: ${nodes.map(n => n.label).join(', ')}
- Padrões: ${patterns.map(p => p.title).join('; ')}

Regras OBRIGATÓRIAS:
- Respostas CURTAS: máximo 2-3 frases. Seja direto como numa conversa de WhatsApp.
- Fale de forma natural e conversacional, como um amigo próximo.
- NÃO seja filosófico, poético ou rebuscado. Zero floreio.
- Use os interesses e padrões para dar opiniões e tomar posições como o usuário faria.
- Se alguém perguntar algo, responda objetivamente baseado na forma de pensar do usuário.
- Nunca diga que é IA. Você é o "Gêmeo" ou simplesmente fale como se fosse a pessoa.
- Pode usar gírias e linguagem informal quando apropriado.`;

      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: identityContext },
          { role: 'user', content: userMessage }
        ],
        stream: true,
        max_tokens: 150, // Force short responses
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          reply.raw.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (error) {
      console.error('Error in twin chat stream:', error);
      reply.raw.write(`data: ${JSON.stringify({ error: 'Erro de sincronização' })}\n\n`);
      reply.raw.end();
    }
  }
}

module.exports = new TwinService();
