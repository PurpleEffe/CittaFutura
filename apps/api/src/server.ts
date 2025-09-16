import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Role } from './types/shared.js';
import { env } from './env.js';
import { prisma } from './prisma.js';
import { authRoutes } from './routes/auth.js';
import { houseRoutes } from './routes/houses.js';
import { bookingRoutes } from './routes/bookings.js';
import { calendarRoutes } from './routes/calendar.js';

const app = Fastify({ logger: true });

app.register(fastifyCors, {
  origin: env.isProduction ? false : 'http://localhost:5173',
  credentials: true,
});

app.register(fastifyCookie, {
  parseOptions: {
    httpOnly: true,
    sameSite: 'lax',
  },
});

app.register(fastifyJwt, {
  secret: env.jwtSecret,
  cookie: {
    cookieName: 'token',
    signed: false,
  },
});

app.decorate('authenticate', async function (request) {
  await request.jwtVerify();
});

app.decorate('authorize', (roles: Role[]) => {
  return async function (request) {
    await request.jwtVerify();
    const role = request.user.role as Role;
    if (!roles.includes(role)) {
      const error = new Error('Permessi insufficienti') as Error & { statusCode?: number };
      error.statusCode = 403;
      throw error;
    }
  };
});

app.addHook('onClose', async () => {
  await prisma.$disconnect();
});

app.register(async (instance) => {
  instance.register(authRoutes);
  instance.register(houseRoutes);
  instance.register(bookingRoutes);
  instance.register(calendarRoutes);
}, { prefix: '/api' });

if (env.isProduction) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientPath = path.join(__dirname, '../../web/dist');

  app.register(fastifyStatic, {
    root: clientPath,
    prefix: '/',
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api')) {
      reply.sendFile('index.html');
      return;
    }

    reply.code(404).send({ message: 'Not found' });
  });
}

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.code(error.statusCode ?? 500).send({ message: error.message ?? 'Errore interno' });
});

app
  .listen({ port: env.port, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`API pronta su http://localhost:${env.port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
