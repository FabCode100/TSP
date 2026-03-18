const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

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

Retorne APENAS um JSON válido no formato:
{
  "tensoes": [{"title": "String", "sideA": "String", "sideB": "String", "relatedNodes": ["String"]}],
  "nucleo": [{"nodeId": "String", "description": "String"}],
  "marcos": [{"title": "String", "description": "String", "period": "String"}]
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
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
              relatedNodes: JSON.stringify(t.relatedNodes),
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
              relatedNodes: JSON.stringify([n.nodeId]),
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
              relatedNodes: JSON.stringify([]),
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

    return { data: patterns, meta: { total: patterns.length } };
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
