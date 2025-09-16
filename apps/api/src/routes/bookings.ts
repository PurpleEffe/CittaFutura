import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { assertValidRange } from '../utils/overlap.js';
import { BOOKING_STATUSES, type BookingStatus } from '../types/shared.js';

const bookingCreateSchema = z.object({
  houseId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  people: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
});

const bookingStatusEnum = z.enum(BOOKING_STATUSES as [BookingStatus, ...BookingStatus[]]);

const bookingStatusSchema = z.object({
  status: bookingStatusEnum,
});

const bookingQuerySchema = z.object({
  status: bookingStatusEnum.optional(),
  houseId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const bookingProposalSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  msg: z.string().max(2000).optional(),
});


async function ensureNoOverlap(bookingId: string, houseId: string, startDate: Date, endDate: Date) {
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      houseId,
      status: 'APPROVED',
      id: { not: bookingId },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  if (overlappingBookings.length > 0) {
    throw new Error('Esiste già una prenotazione approvata nelle stesse date');
  }

  const overlappingBlackouts = await prisma.blackout.findMany({
    where: {
      houseId,
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  if (overlappingBlackouts.length > 0) {
    throw new Error('Le date richieste sono bloccate');
  }
}

export async function bookingRoutes(app: FastifyInstance) {
  app.post('/bookings', { preHandler: app.authenticate }, async (request, reply) => {
    const payload = bookingCreateSchema.parse(request.body);
    assertValidRange(payload.startDate, payload.endDate);

    const house = await prisma.house.findUnique({ where: { id: payload.houseId } });
    if (!house) {
      reply.code(404).send({ message: 'Casa non trovata' });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        houseId: payload.houseId,
        userId: request.user.userId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        people: payload.people,
        notes: payload.notes ?? null,
      },
    });

    reply.code(201).send({ booking });
  });

  app.get('/bookings/me', { preHandler: app.authenticate }, async (request) => {
    const bookings = await prisma.booking.findMany({
      where: { userId: request.user.userId },
      include: { house: true },
      orderBy: { createdAt: 'desc' },
    });

    return { bookings };
  });

  const managementGuard = app.authorize(['GESTORE', 'ADMIN']);

  app.get('/bookings', { preHandler: managementGuard }, async (request) => {
    const query = bookingQuerySchema.parse(request.query);

    const bookings = await prisma.booking.findMany({
      where: {
        AND: [
          query.status ? { status: query.status } : {},
          query.houseId ? { houseId: query.houseId } : {},
          query.from && query.to
            ? {
                startDate: { lt: query.to },
                endDate: { gt: query.from },
              }
            : {},
        ],
      },
      include: { house: true, user: true },
      orderBy: { createdAt: 'desc' },
    });

    return { bookings };
  });

  app.patch('/bookings/:id/status', { preHandler: managementGuard }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = bookingStatusSchema.parse(request.body);

    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking) {
      reply.code(404).send({ message: 'Prenotazione non trovata' });
      return;
    }

    if (payload.status === 'APPROVED') {
      try {
        await ensureNoOverlap(booking.id, booking.houseId, booking.startDate, booking.endDate);
      } catch (error) {
        reply.code(409).send({ message: (error as Error).message });
        return;
      }
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: payload.status,
        updatedAt: new Date(),
      },
    });

    reply.send({ booking: updated });
  });

  app.post('/bookings/:id/propose', { preHandler: managementGuard }, async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const payload = bookingProposalSchema.parse(request.body);

    assertValidRange(payload.startDate, payload.endDate);

    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking) {
      reply.code(404).send({ message: 'Prenotazione non trovata' });
      return;
    }

    const notes = payload.msg
      ? `${payload.msg}${booking.notes ? `\n\nNote precedenti:\n${booking.notes}` : ''}`
      : booking.notes;

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: {
        startDate: payload.startDate,
        endDate: payload.endDate,
        notes,
        status: 'IN_REVIEW',
      },
    });

    reply.send({ booking: updated });
  });
}
