import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

const houseQuerySchema = z.object({
  q: z.string().optional(),
  services: z.string().optional(),
  capacity: z.coerce.number().optional(),
});

const houseBodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().max(2000).optional(),
  capacity: z.number().int().positive().default(4),
  services: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
});

const houseUpdateSchema = houseBodySchema.partial();

export async function houseRoutes(app: FastifyInstance) {
  app.get('/houses', async (request) => {
    const query = houseQuerySchema.parse(request.query);

    const servicesFilter = query.services
      ? query.services
          .split(',')
          .map((service) => service.trim())
          .filter(Boolean)
      : [];

    const houses = await prisma.house.findMany({
      where: {
        AND: [
          query.q
            ? {
                OR: [
                  { title: { contains: query.q, mode: 'insensitive' } },
                  { summary: { contains: query.q, mode: 'insensitive' } },
                ],
              }
            : {},
          query.capacity ? { capacity: { gte: query.capacity } } : {},
          servicesFilter.length > 0
            ? {
                services: {
                  hasEvery: servicesFilter,
                },
              }
            : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return { houses };
  });

  app.get('/houses/:slug', async (request, reply) => {
    const { slug } = z.object({ slug: z.string() }).parse(request.params);

    const house = await prisma.house.findUnique({
      where: { slug },
      include: { blackout: true, bookings: true },
    });

    if (!house) {
      reply.code(404).send({ message: 'Casa non trovata' });
      return;
    }

    return { house };
  });

  const managementGuard = app.authorize(['GESTORE', 'ADMIN']);

  app.post('/houses', { preHandler: managementGuard }, async (request, reply) => {
    const payload = houseBodySchema.parse(request.body);

    try {
      const house = await prisma.house.create({ data: payload });
      reply.code(201).send({ house });
    } catch (error) {
      reply.code(400).send({ message: 'Impossibile creare la casa', error: String(error) });
    }
  });

  app.put('/houses/:id', { preHandler: managementGuard }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = houseUpdateSchema.parse(request.body);

    try {
      const house = await prisma.house.update({ where: { id: params.id }, data: payload });
      reply.send({ house });
    } catch (error) {
      reply.code(400).send({ message: 'Impossibile aggiornare la casa', error: String(error) });
    }
  });

  app.delete('/houses/:id', { preHandler: managementGuard }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);

    try {
      await prisma.house.delete({ where: { id: params.id } });
      reply.send({ success: true });
    } catch (error) {
      reply.code(400).send({ message: 'Impossibile eliminare la casa', error: String(error) });
    }
  });
}
