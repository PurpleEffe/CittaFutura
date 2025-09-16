import { config } from 'dotenv';
import { PrismaClient, Role, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

config();

const prisma = new PrismaClient();

async function createUser(email: string, password: string, role: Role, name: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role,
      name,
    },
  });
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.blackout.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

  const admin = await createUser('admin@demo.local', 'admin123!', 'ADMIN', 'Admin Demo');
  const manager = await createUser('gestore@demo.local', 'gestore123!', 'GESTORE', 'Gestore Demo');
  const guest = await createUser('utente@demo.local', 'utente123!', 'USER', 'Utente Demo');

  const housesData = [
    {
      slug: 'casa-del-sole',
      title: 'Casa del Sole',
      summary: 'Luminoso appartamento nel cuore di Città Futura.',
      capacity: 4,
      services: ['cucina', 'wifi', 'lavatrice'],
      photos: ['/images/case/casa-del-sole-1.jpg'],
    },
    {
      slug: 'giardino-condiviso',
      title: 'Giardino Condiviso',
      summary: 'Spazio accogliente con ampio giardino per attività all’aperto.',
      capacity: 6,
      services: ['cucina', 'wifi', 'accessibile'],
      photos: ['/images/case/giardino-1.jpg'],
    },
    {
      slug: 'torre-urbana',
      title: 'Torre Urbana',
      summary: 'Alloggio su più livelli con vista sulla piazza principale.',
      capacity: 5,
      services: ['cucina', 'wifi'],
      photos: ['/images/case/torre-1.jpg'],
    },
  ];

  const houses = new Map<string, { id: string; slug: string }>();

  for (const house of housesData) {
    const created = await prisma.house.create({ data: house });
    houses.set(created.slug, created);
  }

  const today = dayjs();

  await prisma.booking.create({
    data: {
      userId: guest.id,
      houseId: houses.get('casa-del-sole')!.id,
      startDate: today.add(10, 'day').startOf('day').toDate(),
      endDate: today.add(14, 'day').startOf('day').toDate(),
      people: 2,
      notes: 'Prima visita a Città Futura!',
      status: BookingStatus.IN_REVIEW,
    },
  });

  await prisma.booking.create({
    data: {
      userId: guest.id,
      houseId: houses.get('giardino-condiviso')!.id,
      startDate: today.add(20, 'day').startOf('day').toDate(),
      endDate: today.add(25, 'day').startOf('day').toDate(),
      people: 3,
      notes: 'Attività di volontariato',
      status: BookingStatus.APPROVED,
    },
  });

  await prisma.blackout.create({
    data: {
      houseId: houses.get('torre-urbana')!.id,
      startDate: today.add(5, 'day').startOf('day').toDate(),
      endDate: today.add(7, 'day').startOf('day').toDate(),
      reason: 'Manutenzione programmata',
    },
  });

  console.log('Seed completato.');
  console.log('Admin:', admin.email);
  console.log('Gestore:', manager.email);
  console.log('Utente:', guest.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
