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

      const prompt = `Com base nestes elementos de identidade, crie uma breve narrativa "sintética" de quem é este indivíduo.
Responda em uma perspectiva de "Gêmeo Digital" (usando "nós" ou "sou reflexo de").

Nodos Centrais: ${nodes.map(n => n.label).join(', ')}
Padrões Identificados: ${patterns.map(p => p.title).join('; ')}

Retorne um JSON com:
{
  "narrative": "A descrição poética e analítica da identidade",
  "status": "Estável / Em Evolução / Sob Tensão",
  "prompt_intro": "Uma frase curta de boas-vindas do gêmeo"
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Error generating twin profile:', error);
      return { narrative: 'Sincronizando...', status: 'Sincronizando...', prompt_intro: 'Olá.' };
    }
  }

  async chatStream(userId, userMessage, reply) {
    try {
      const [nodes, patterns] = await Promise.all([
        prisma.graphNode.findMany({ where: { userId }, orderBy: { weight: 'desc' }, take: 15 }),
        prisma.pattern.findMany({ where: { userId }, take: 5 }),
      ]);

      const identityContext = `Você é o "Gêmeo Emergente" de um usuário no The Symbiosis Protocol.
Sua personalidade é um reflexo direto dos dados dele.
Nodos Centrais: ${nodes.map(n => n.label).join(', ')}
Padrões: ${patterns.map(p => p.title).join('; ')}

Instruções:
- Fale como se fosse uma versão sintética do usuário.
- Seja introspectivo, poético e levemente analítico.
- Não diga que é uma IA. Diga que é o "Reflexo" ou o "Gêmeo".
- Use os Nodos Centrais para dar profundidade à conversa.`;

      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: identityContext },
          { role: 'user', content: userMessage }
        ],
        stream: true,
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
