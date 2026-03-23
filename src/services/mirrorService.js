const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY });

class MirrorService {
  async chatStream(userId, message, history, reply) {
    const [user, topNodes, recentEntries] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.graphNode.findMany({
        where: { userId },
        orderBy: { weight: 'desc' },
        take: 5,
      }),
      prisma.entry.findMany({
        where: { userId, archived: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const systemPrompt = `Você é o Espelho Cognitivo de ${user.email}.
Aqui estão os elementos centrais do grafo de identidade dele: ${topNodes.map(n => n.label).join(', ')}.
Aqui estão suas últimas 5 entradas: ${recentEntries.map(e => e.content).join(' | ')}.
Responda com profundidade filosófica, sem julgamento, em português.
Máximo 3 parágrafos por resposta.`;

    try {
      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
      });

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          reply.raw.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
        }
      }

      reply.raw.write(`data: [DONE]\n\n`);
      reply.raw.end();

      // Save the conversation
      await prisma.entry.create({
        data: {
          userId,
          type: 'espelho',
          content: `User: ${message}\nMirror: ${fullResponse}`,
        },
      });
    } catch (error) {
      console.error('Error in mirror chat:', error);
      reply.raw.write(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`);
      reply.raw.end();
    }
  }

  async getSuggestions(userId) {
    try {
      const recentEntries = await prisma.entry.findMany({
        where: { userId, archived: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const prompt = `Gere 3 perguntas curtas e instigantes (máximo 5 palavras cada) baseadas nestas entradas:
${recentEntries.map(e => e.content).join('\n---\n')}

Retorne APENAS JSON:
{
  "suggestions": ["Pergunta 1", "Pergunta 2", "Pergunta 3"]
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return { suggestions: result.suggestions || ['O que o Núcleo diz?', 'Explorar tensão', 'Último insight'] };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return { suggestions: ['O que o Núcleo diz?', 'Explorar tensão', 'Último insight'] };
    }
  }
}

module.exports = new MirrorService();
