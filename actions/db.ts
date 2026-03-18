'use server';

import { PrismaClient } from '@prisma/client';
import { extractIdentityGraph } from '@/lib/aiClient';

const prisma = new PrismaClient();

// For MVP, we'll use a single user ID
const USER_ID = 'user-1';

export async function getOrCreateUser() {
  let user = await prisma.user.findUnique({ where: { id: USER_ID } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: USER_ID,
        email: 'user@example.com',
        password: 'password', // Mock
      },
    });
  }
  return user;
}

export async function saveOnboarding(answers: string[]) {
  const user = await getOrCreateUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { onboarding: JSON.stringify(answers) },
  });

  // Create entries for each answer
  const types = ['ORIGEM', 'PERMANÊNCIA', 'DECISÃO', 'TRANSFORMAÇÃO', 'ESSÊNCIA'];
  for (let i = 0; i < answers.length; i++) {
    if (answers[i].trim()) {
      await addEntry(answers[i], types[i] || 'REFLEXÃO');
      
      // Extract identity graph from the answer and update the graph
      try {
        const graphData = await extractIdentityGraph(answers[i]);
        if (graphData.concepts.length > 0) {
          await updateGraph(graphData.concepts, graphData.edges);
        }
      } catch (e) {
        console.error('Failed to extract graph for onboarding answer:', e);
      }
    }
  }

  // After onboarding, extract initial patterns
  try {
    const entries = await getEntries();
    const graph = await getGraphData();
    const { extractPatterns } = await import('@/lib/aiClient');
    const patterns = await extractPatterns(entries.slice(0, 10), graph.nodes.slice(0, 10));
    if (patterns.length > 0) {
      await savePatterns(patterns);
    }
  } catch (e) {
    console.error('Failed to extract initial patterns:', e);
  }
}

export async function getEntries() {
  const user = await getOrCreateUser();
  return prisma.entry.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addEntry(content: string, type: string) {
  const user = await getOrCreateUser();
  return prisma.entry.create({
    data: {
      userId: user.id,
      content,
      type,
    },
  });
}

export async function removeEntry(id: string) {
  return prisma.entry.update({
    where: { id },
    data: { archived: true },
  });
}

export async function getGraphData() {
  const user = await getOrCreateUser();
  const nodes = await prisma.graphNode.findMany({ where: { userId: user.id } });
  const edges = await prisma.graphEdge.findMany({ where: { userId: user.id } });
  return { nodes, edges };
}

export async function updateGraph(newNodes: any[], newEdges: any[]) {
  const user = await getOrCreateUser();
  
  // Very simplified graph update for MVP
  for (const n of newNodes) {
    const label = n.label?.toLowerCase().trim();
    if (!label) continue;

    const existing = await prisma.graphNode.findFirst({
      where: { userId: user.id, label }
    });
    if (existing) {
      await prisma.graphNode.update({
        where: { id: existing.id },
        data: { weight: existing.weight + 0.1 }
      });
    } else {
      await prisma.graphNode.create({
        data: {
          userId: user.id,
          label,
          type: n.type || 'conceito',
          weight: 1.0
        }
      });
    }
  }

  // To create edges, we need the actual node IDs.
  // We'll fetch all nodes again to map labels to IDs.
  const allNodes = await prisma.graphNode.findMany({ where: { userId: user.id } });
  const nodeMap = new Map(allNodes.map(n => [n.label, n.id]));

  for (const e of newEdges) {
    const sourceLabel = e.sourceLabel?.toLowerCase().trim();
    const targetLabel = e.targetLabel?.toLowerCase().trim();
    const sourceId = nodeMap.get(sourceLabel);
    const targetId = nodeMap.get(targetLabel);
    if (sourceId && targetId && sourceId !== targetId) {
      const [id1, id2] = [sourceId, targetId].sort();
      const existingEdge = await prisma.graphEdge.findFirst({
        where: { sourceId: id1, targetId: id2 }
      });
      if (existingEdge) {
        await prisma.graphEdge.update({
          where: { id: existingEdge.id },
          data: { strength: existingEdge.strength + 0.1 }
        });
      } else {
        await prisma.graphEdge.create({
          data: {
            userId: user.id,
            sourceId: id1,
            targetId: id2,
            strength: 0.5
          }
        });
      }
    }
  }
}

export async function getPatterns() {
  const user = await getOrCreateUser();
  const patterns = await prisma.pattern.findMany({
    where: { userId: user.id },
    orderBy: { detectedAt: 'desc' },
  });
  return patterns;
}

export async function savePatterns(patterns: any[]) {
  const user = await getOrCreateUser();
  for (const p of patterns) {
    const existing = await prisma.pattern.findFirst({
      where: { userId: user.id, title: p.title }
    });
    if (!existing) {
      await prisma.pattern.create({
        data: {
          userId: user.id,
          type: p.type,
          title: p.title,
          description: p.description,
          relatedNodes: JSON.stringify(p.relatedNodes || []),
        }
      });
    }
  }
}
