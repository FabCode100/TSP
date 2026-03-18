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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Session expired or invalid',
      });
    }

    // Inject user info into request
    request.user = {
      id: decoded.id,
      email: decoded.email,
    };
  } catch (err) {
    request.log.error(err);
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

module.exports = authenticate;
