import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

type BookingRecord = {
  id: string;
  startDate: Date;
  endDate: Date;
  people: number;
  notes: string | null;
};

type BlackoutRecord = {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
};

export async function calendarRoutes(app: FastifyInstance) {
  app.get('/calendar/house/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);

    const house = await prisma.house.findUnique({ where: { id: params.id } });
    if (!house) {
      reply.code(404).send({ message: 'Casa non trovata' });
      return;
    }

    const bookings = (await prisma.booking.findMany({
      where: { houseId: params.id, status: 'APPROVED' },
      select: { id: true, startDate: true, endDate: true, people: true, notes: true },
    })) as BookingRecord[];

    const blackouts = (await prisma.blackout.findMany({
      where: { houseId: params.id },
      select: { id: true, startDate: true, endDate: true, reason: true },
    })) as BlackoutRecord[];

    const events = [
      ...bookings.map((booking: BookingRecord) => ({
        id: booking.id,
        type: 'booking' as const,
        startDate: booking.startDate,
        endDate: booking.endDate,
        title: `Prenotazione approvata (${booking.people} persone)`,
        notes: booking.notes ?? undefined,
      })),
      ...blackouts.map((blackout: BlackoutRecord) => ({
        id: blackout.id,
        type: 'blackout' as const,
        startDate: blackout.startDate,
        endDate: blackout.endDate,
        title: blackout.reason ?? 'Non disponibile',
      })),
    ];

    reply.send({ houseId: params.id, events });
  });
}
