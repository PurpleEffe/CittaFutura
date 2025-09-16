import type { Role } from './shared.js';
import type { preHandlerHookHandler } from 'fastify';
import 'fastify';
import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: preHandlerHookHandler;
    authorize: (roles: Role[]) => preHandlerHookHandler;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: Role };
    user: { userId: string; role: Role };
  }
}

export {};
