const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const Groq = require('groq-sdk');
const { BUILD_IDENTITY_MODEL_PROMPT, TWIN_SYSTEM_PROMPT, TWIN_SESSION_SUMMARY_PROMPT } = require('../core/prompts');

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.RENDER_GROQ_API_KEY });

class TwinSharingService {
  // Generate a short 6-char hex token for sharing
  _generateShortToken() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  async createShareToken(ownerId, { permissionLevel, role, roleInstruction, expiresAt }) {
    const token = this._generateShortToken();

    const twinToken = await prisma.twinToken.create({
      data: {
        ownerId,
        token,
        permissionLevel: permissionLevel || 'PUBLIC',
        role: role || 'General',
        roleInstruction: roleInstruction || '',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    return twinToken;
  }

  async listMyTokens(ownerId) {
    return prisma.twinToken.findMany({
      where: { ownerId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeToken(ownerId, tokenId) {
    return prisma.twinToken.updateMany({
      where: { id: tokenId, ownerId },
      data: { isActive: false },
    });
  }

  async getAccessLogs(ownerId) {
    return prisma.twinAccessLog.findMany({
      where: { ownerId },
      include: { token: { select: { role: true, permissionLevel: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async validateToken(token) {
    const twinToken = await prisma.twinToken.findUnique({
      where: { token },
      include: { owner: { select: { id: true, email: true } } },
    });

    if (!twinToken || !twinToken.isActive) return null;
    if (twinToken.expiresAt && twinToken.expiresAt < new Date()) return null;

    return twinToken;
  }

  async getSharedTwinProfile(token) {
    const twinToken = await this.validateToken(token);
    if (!twinToken) return null;

    const ownerId = twinToken.ownerId;
    const permissionLevel = twinToken.permissionLevel;

    const [nodes, patterns, user] = await Promise.all([
      prisma.graphNode.findMany({ where: { userId: ownerId }, orderBy: { weight: 'desc' }, take: 20 }),
      prisma.pattern.findMany({ where: { userId: ownerId }, take: 10 }),
      prisma.user.findUnique({ where: { id: ownerId }, select: { email: true } }),
    ]);

    // Build identity model based on permission level
    const ownerName = user?.email?.split('@')[0] || 'Unknown';
    const nodeCount = await prisma.graphNode.count({ where: { userId: ownerId } });

    // Generate a narrative via AI
    try {
      const identityPrompt = BUILD_IDENTITY_MODEL_PROMPT
        .replace('{permission_level}', permissionLevel)
        .replace('{nodes}', nodes.map(n => `${n.label} (${n.type}, weight: ${n.weight})`).join('\n'));

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: identityPrompt }],
        max_tokens: 500,
      });

      const narrative = response.choices[0]?.message?.content || 'Sincronizando...';

      return {
        ownerName,
        permissionLevel,
        role: twinToken.role,
        narrative,
        nodeCount,
        maturity: Math.min(100, Math.round((nodeCount / 15) * 100)),
      };
    } catch (error) {
      console.error('[TwinSharing] Profile generation error:', error);
      return {
        ownerName,
        permissionLevel,
        role: twinToken.role,
        narrative: 'Conectando ao núcleo de identidade...',
        nodeCount,
        maturity: Math.min(100, Math.round((nodeCount / 15) * 100)),
      };
    }
  }

  async chatWithSharedTwin(token, message, reply) {
    const twinToken = await this.validateToken(token);
    if (!twinToken) {
      reply.raw.write(`data: ${JSON.stringify({ error: 'Token inválido ou expirado' })}\n\n`);
      reply.raw.end();
      return;
    }

    const ownerId = twinToken.ownerId;
    const permissionLevel = twinToken.permissionLevel;

    const [nodes, patterns, user] = await Promise.all([
      prisma.graphNode.findMany({ where: { userId: ownerId }, orderBy: { weight: 'desc' }, take: 15 }),
      prisma.pattern.findMany({ where: { userId: ownerId }, take: 5 }),
      prisma.user.findUnique({ where: { id: ownerId }, select: { email: true } }),
    ]);

    const ownerName = user?.email?.split('@')[0] || 'Unknown';
    const identityModel = `Nodos: ${nodes.map(n => n.label).join(', ')}\nPadrões: ${patterns.map(p => p.title).join('; ')}`;

    const systemPrompt = TWIN_SYSTEM_PROMPT
      .replace('{owner_name}', ownerName)
      .replace('{identity_model}', identityModel)
      .replace('{permission_level}', permissionLevel)
      .replace('{role}', twinToken.role || 'General');

    try {
      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
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
      console.error('[TwinSharing] Chat error:', error);
      reply.raw.write(`data: ${JSON.stringify({ error: 'Erro de sincronização' })}\n\n`);
      reply.raw.end();
    }
  }

  async endSession({ token, accessorName, duration, messageCount }) {
    const twinToken = await this.validateToken(token);
    if (!twinToken) return null;

    // Generate a summary
    let summary = `Sessão de ${messageCount} mensagens`;
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `${TWIN_SESSION_SUMMARY_PROMPT}\nAcessor: ${accessorName}, Duração: ${duration}s, Mensagens: ${messageCount}` }],
        max_tokens: 100,
      });
      summary = response.choices[0]?.message?.content || summary;
    } catch (e) {
      console.error('[TwinSharing] Summary generation error:', e);
    }

    return prisma.twinAccessLog.create({
      data: {
        tokenId: twinToken.id,
        ownerId: twinToken.ownerId,
        accessorName: accessorName || 'Visitante',
        duration: duration || 0,
        messageCount: messageCount || 0,
        summary,
      },
    });
  }

  // Get list of friends (tokens the user has connected with)
  async getConnections(userId) {
    // Get tokens where this user has access logs
    const logs = await prisma.twinAccessLog.findMany({
      where: { accessorName: { not: 'Visitante' } },
      include: {
        token: {
          include: { owner: { select: { id: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate by owner
    const seen = new Set();
    return logs.filter(log => {
      if (seen.has(log.token.ownerId)) return false;
      seen.add(log.token.ownerId);
      return true;
    }).map(log => ({
      ownerName: log.token.owner.email.split('@')[0],
      ownerId: log.token.ownerId,
      token: log.token.token,
      permissionLevel: log.token.permissionLevel,
      lastSync: log.createdAt,
      isActive: log.token.isActive,
    }));
  }
}

module.exports = new TwinSharingService();
