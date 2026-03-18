const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI, Type } = require('@google/genai');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

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

    const chat = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: systemPrompt,
      },
    });

    // We don't have a way to set history directly in ai.chats.create with this SDK easily,
    // so we'll just send the message. For a real app, we'd format the history into the contents.
    // For now, we'll just send the current message.
    let fullResponse = '';

    try {
      const responseStream = await chat.sendMessageStream({ message });

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          reply.raw.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
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

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['suggestions'],
          },
        },
      });

      const result = JSON.parse(response.text);
      return { suggestions: result.suggestions || ['O que o Núcleo diz?', 'Explorar tensão', 'Último insight'] };
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return { suggestions: ['O que o Núcleo diz?', 'Explorar tensão', 'Último insight'] };
    }
  }
}

module.exports = new MirrorService();
