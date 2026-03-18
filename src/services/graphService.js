const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI, Type } = require('@google/genai');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

class GraphService {
  async extractAndUpdateGraph(userId, content) {
    try {
      const prompt = `Extraia de 2 a 5 conceitos-chave desta entrada de diário pessoal.
Retorne APENAS JSON: { concepts: [{label, type}] }
Tipos possíveis: conceito | emocao | pessoa | evento

Entrada:
${content}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    type: { type: Type.STRING },
                  },
                  required: ['label', 'type'],
                },
              },
            },
            required: ['concepts'],
          },
        },
      });

      const result = JSON.parse(response.text);
      const concepts = result.concepts || [];
      const newNodes = [];
      const updatedNodes = [];
      const newEdges = [];

      // Process nodes
      for (const concept of concepts) {
        let node = await prisma.graphNode.findUnique({
          where: {
            userId_label: {
              userId,
              label: concept.label,
            },
          },
        });

        if (node) {
          node = await prisma.graphNode.update({
            where: { id: node.id },
            data: { weight: node.weight + 0.1 },
          });
          updatedNodes.push(node);
        } else {
          node = await prisma.graphNode.create({
            data: {
              userId,
              label: concept.label,
              type: concept.type,
              weight: 1.0,
            },
          });
          newNodes.push(node);
        }
      }

      // Process edges
      const allNodes = [...newNodes, ...updatedNodes];
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const sourceId = allNodes[i].id;
          const targetId = allNodes[j].id;

          // Ensure consistent ordering to avoid duplicate pairs in different directions
          const [id1, id2] = [sourceId, targetId].sort();

          let edge = await prisma.graphEdge.findUnique({
            where: {
              sourceId_targetId: {
                sourceId: id1,
                targetId: id2,
              },
            },
          });

          if (edge) {
            edge = await prisma.graphEdge.update({
              where: { id: edge.id },
              data: { strength: edge.strength + 0.1 },
            });
          } else {
            edge = await prisma.graphEdge.create({
              data: {
                userId,
                sourceId: id1,
                targetId: id2,
                strength: 0.5,
              },
            });
            newEdges.push(edge);
          }
        }
      }

      return { newNodes, updatedNodes, newEdges };
    } catch (error) {
      console.error('Error extracting graph:', error);
      return { newNodes: [], updatedNodes: [], newEdges: [] };
    }
  }

  async getGraph(userId) {
    const [nodes, edges] = await Promise.all([
      prisma.graphNode.findMany({ where: { userId } }),
      prisma.graphEdge.findMany({ where: { userId } }),
    ]);

    return {
      data: { nodes, edges },
      meta: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    };
  }

  async getNode(userId, nodeId) {
    const node = await prisma.graphNode.findUnique({
      where: { id: nodeId },
    });

    if (!node || node.userId !== userId) {
      const error = new Error('Node not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    const edges = await prisma.graphEdge.findMany({
      where: {
        userId,
        OR: [{ sourceId: nodeId }, { targetId: nodeId }],
      },
    });

    return { data: { node, edges } };
  }

  async deleteNode(userId, nodeId) {
    const node = await prisma.graphNode.findUnique({
      where: { id: nodeId },
    });

    if (!node || node.userId !== userId) {
      const error = new Error('Node not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    await prisma.graphNode.delete({
      where: { id: nodeId },
    });

    return { success: true };
  }
}

module.exports = new GraphService();
