import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toPublicUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const payload = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      reply.code(400).send({ message: 'Email già registrata' });
      return;
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        name: payload.name ?? null,
      },
    });

    const token = signToken(app, user);
    setAuthCookie(reply, token);

    reply.send({ user: toPublicUser(user) });
  });

  app.post('/auth/login', async (request, reply) => {
    const payload = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      reply.code(401).send({ message: 'Credenziali non valide' });
      return;
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      reply.code(401).send({ message: 'Credenziali non valide' });
      return;
    }

    const token = signToken(app, user);
    setAuthCookie(reply, token);

    reply.send({ user: toPublicUser(user) });
  });

  app.post('/auth/logout', { preHandler: app.authenticate }, async (_, reply) => {
    clearAuthCookie(reply);
    reply.send({ success: true });
  });

  app.get('/me', { preHandler: app.authenticate }, async (request) => {
    const me = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!me) {
      return { user: null };
    }

    return { user: toPublicUser(me) };
  });
}
