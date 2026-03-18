const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI, Type } = require('@google/genai');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

class PatternService {
  async analyzeNewEntry(userId, entryId) {
    try {
      const [entries, topNodes] = await Promise.all([
        prisma.entry.findMany({
          where: { userId, archived: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        prisma.graphNode.findMany({
          where: { userId },
          orderBy: { weight: 'desc' },
          take: 10,
        }),
      ]);

      const prompt = `Analise estas entradas e identifique:
1. TENSÕES: contradições ou conflitos recorrentes entre temas
2. NÚCLEO: os 3 elementos mais centrais da identidade
3. MARCOS: mudanças significativas de perspectiva ao longo do tempo

Entradas:
${entries.map(e => e.content).join('\n---\n')}

Top Nodes:
${topNodes.map(n => n.label).join(', ')}

Retorne APENAS JSON:
{
  "tensoes": [{"title": "String", "sideA": "String", "sideB": "String", "relatedNodes": ["String"]}],
  "nucleo": [{"nodeId": "String", "description": "String"}],
  "marcos": [{"title": "String", "description": "String", "period": "String"}]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tensoes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    sideA: { type: Type.STRING },
                    sideB: { type: Type.STRING },
                    relatedNodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['title', 'sideA', 'sideB', 'relatedNodes'],
                },
              },
              nucleo: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nodeId: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['nodeId', 'description'],
                },
              },
              marcos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    period: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'period'],
                },
              },
            },
            required: ['tensoes', 'nucleo', 'marcos'],
          },
        },
      });

      const result = JSON.parse(response.text);
      const newPatterns = [];

      // Process tensoes
      for (const t of result.tensoes || []) {
        const existing = await prisma.pattern.findUnique({
          where: { userId_title: { userId, title: t.title } },
        });
        if (!existing) {
          const p = await prisma.pattern.create({
            data: {
              userId,
              type: 'tensao',
              title: t.title,
              description: `${t.sideA} vs ${t.sideB}`,
              relatedNodes: t.relatedNodes,
            },
          });
          newPatterns.push(p);
        }
      }

      // Process nucleo
      for (const n of result.nucleo || []) {
        const existing = await prisma.pattern.findUnique({
          where: { userId_title: { userId, title: `Núcleo: ${n.nodeId}` } },
        });
        if (!existing) {
          const p = await prisma.pattern.create({
            data: {
              userId,
              type: 'nucleo',
              title: `Núcleo: ${n.nodeId}`,
              description: n.description,
              relatedNodes: [n.nodeId],
            },
          });
          newPatterns.push(p);
        }
      }

      // Process marcos
      for (const m of result.marcos || []) {
        const existing = await prisma.pattern.findUnique({
          where: { userId_title: { userId, title: m.title } },
        });
        if (!existing) {
          const p = await prisma.pattern.create({
            data: {
              userId,
              type: 'marco',
              title: m.title,
              description: `${m.period}: ${m.description}`,
              relatedNodes: [],
            },
          });
          newPatterns.push(p);
        }
      }

      return { newPatterns };
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return { newPatterns: [] };
    }
  }

  async getPatterns(userId) {
    const patterns = await prisma.pattern.findMany({
      where: { userId },
      orderBy: { detectedAt: 'desc' },
    });

    const grouped = {
      nucleo: patterns.filter(p => p.type === 'nucleo'),
      tensoes: patterns.filter(p => p.type === 'tensao'),
      marcos: patterns.filter(p => p.type === 'marco'),
    };

    return { data: grouped, meta: { total: patterns.length } };
  }

  async markAsSeen(userId, patternId) {
    const pattern = await prisma.pattern.findUnique({ where: { id: patternId } });
    if (!pattern || pattern.userId !== userId) {
      const error = new Error('Pattern not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.pattern.update({
      where: { id: patternId },
      data: { seen: true },
    });

    return { data: updated };
  }
}

module.exports = new PatternService();
