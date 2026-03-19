const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token not provided',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      console.log('[AuthMiddleware] JWT verified for:', decoded.email);
    } catch (ve) {
      console.error('[AuthMiddleware] JWT verification failed:', ve.message);
      throw ve; // Re-throw to be caught by the outer catch
    }

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      console.warn('[AuthMiddleware] Session not found in DB for token');
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Session not found',
      });
    }

    if (session.expiresAt < new Date()) {
      console.warn('[AuthMiddleware] Session expired:', session.expiresAt);
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Session expired',
      });
    }

    // Inject user info into request
    request.user = {
      id: decoded.id,
      email: decoded.email,
    };
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err.message);
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

module.exports = authenticate;
