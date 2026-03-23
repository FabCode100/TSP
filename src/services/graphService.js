const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.RENDER_GROQ_API_KEY });

class GraphService {
  async extractAndUpdateGraph(userId, content) {
    try {
      const prompt = `Extraia de 2 a 5 conceitos-chave desta entrada de diário pessoal.
Retorne APENAS um JSON válido.
Tipos possíveis: conceito | emocao | pessoa | evento

Entrada:
${content}

Retorne no formato:
{
  "concepts": [
    {"label": "String", "type": "String"}
  ]
}`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
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
