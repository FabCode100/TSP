const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

class AuthService {
  async register({ email, password, onboardingAnswers }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error('Email already in use');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        onboarding: onboardingAnswers ? JSON.stringify(onboardingAnswers) : null,
      },
    });

    const token = this.generateToken(user);
    await this.createSession(user.id, token);

    return { token, user: { id: user.id, email: user.email } };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user);
    await this.createSession(user.id, token);

    return { token, user: { id: user.id, email: user.email } };
  }

  async logout(token) {
    await prisma.session.deleteMany({
      where: { token },
    });
    return { success: true };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true, onboarding: true },
    });
    const entryCount = await prisma.entry.count({ where: { userId } });

    return { ...user, entryCount };
  }

  generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '30d',
    });
  }

  async createSession(userId, token) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
  async updateOnboarding(userId, answers) {
    return prisma.user.update({
      where: { id: userId },
      data: { onboarding: JSON.stringify(answers) },
    });
  }
}

module.exports = new AuthService();
