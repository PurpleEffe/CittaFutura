import type { FastifyInstance, FastifyReply } from 'fastify';
import { env } from '../env.js';
import type { Role } from '../types/shared.js';

const COOKIE_NAME = 'token';

type AuthUser = { id: string; role: Role };

export function signToken(app: FastifyInstance, user: AuthUser) {
  return app.jwt.sign({ userId: user.id, role: user.role }, { expiresIn: '7d' });
}

export function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(reply: FastifyReply) {
  reply.clearCookie(COOKIE_NAME, { path: '/' });
}
