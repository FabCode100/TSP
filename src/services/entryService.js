const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EntryService {
  async createEntry(userId, { content, type }) {
    const entry = await prisma.entry.create({
      data: {
        userId,
        content,
        type,
      },
    });
    return entry;
  }

  async getEntries(userId, { page = 1, limit = 20, type, archived = 'false' }) {
    const skip = (page - 1) * limit;
    const isArchived = archived === 'true';

    const where = {
      userId,
      archived: isArchived,
    };

    if (type) {
      where.type = type;
    }

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.entry.count({ where }),
    ]);

    return {
      data: entries,
      meta: {
        total,
        page: Number(page),
        hasMore: skip + entries.length < total,
      },
    };
  }

  async updateEntry(userId, entryId, data) {
    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    if (!entry || entry.userId !== userId) {
      const error = new Error('Entry not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.entry.update({
      where: { id: entryId },
      data,
    });

    return updated;
  }

  async deleteEntry(userId, entryId) {
    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    if (!entry || entry.userId !== userId) {
      const error = new Error('Entry not found or unauthorized');
      error.statusCode = 404;
      throw error;
    }

    await prisma.entry.update({
      where: { id: entryId },
      data: { archived: true },
    });

    return { success: true };
  }
}

module.exports = new EntryService();
