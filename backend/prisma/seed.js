import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // Créer l'utilisateur administrateur principal
  const hashedPassword = await bcrypt.hash('canyonlife', 10);

  const admin = await prisma.user.upsert({
    where: { login: 'canyonlife' },
    update: {},
    create: {
      login: 'canyonlife',
      password: hashedPassword,
      email: 'admin@canyonlife.com',
      role: 'admin',
      stripeAccount: null
    }
  });

  console.log('✅ Utilisateur admin créé:', admin.login);

  // Créer quelques catégories d'exemple
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: '1' },
      update: {},
      create: {
        id: '1',
        name: 'Canyoning',
        description: 'Activités de descente de canyon'
      }
    }),
    prisma.category.upsert({
      where: { id: '2' },
      update: {},
      create: {
        id: '2',
        name: 'Via Ferrata',
        description: 'Parcours en via ferrata'
      }
    })
  ]);

  console.log('✅ Catégories créées:', categories.length);

  // Créer des produits d'exemple
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        name: 'Raft intégral',
        shortDescription: 'Descente complète en raft',
        priceIndividual: 50,
        duration: 180,
        color: '#f97316',
        level: 'aventure',
        maxCapacity: 12,
        guideId: admin.id,
        categoryId: '1'
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        name: 'Raft découverte',
        shortDescription: 'Initiation au raft',
        priceIndividual: 35,
        duration: 120,
        color: '#ef4444',
        level: 'découverte',
        maxCapacity: 12,
        guideId: admin.id,
        categoryId: '1'
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        name: 'Zoïcu',
        shortDescription: 'Canyon en nage',
        priceIndividual: 45,
        duration: 150,
        color: '#3b82f6',
        level: 'aventure',
        maxCapacity: 12,
        guideId: admin.id,
        categoryId: '1'
      }
    }),
    prisma.product.upsert({
      where: { id: 'product-4' },
      update: {},
      create: {
        id: 'product-4',
        name: 'Baptême',
        shortDescription: 'Première expérience',
        priceIndividual: 30,
        duration: 90,
        color: '#8b5cf6',
        level: 'découverte',
        maxCapacity: 8,
        guideId: admin.id,
        categoryId: '1'
      }
    })
  ]);

  console.log('✅ Produits créés:', products.length);

  // Créer des sessions d'exemple pour la semaine courante
  const today = new Date();
  const sessions = [];

  for (let i = 0; i < 7; i++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() + i);

    // Session matin - Raft intégral
    sessions.push(
      prisma.session.create({
        data: {
          date: sessionDate,
          timeSlot: 'matin',
          startTime: '09:00',
          productId: 'product-1',
          guideId: admin.id,
          status: 'open'
        }
      })
    );

    // Session après-midi - Raft découverte
    sessions.push(
      prisma.session.create({
        data: {
          date: sessionDate,
          timeSlot: 'après-midi',
          startTime: '14:00',
          productId: 'product-2',
          guideId: admin.id,
          status: 'open'
        }
      })
    );

    // Session journée - Zoïcu (tous les 2 jours)
    if (i % 2 === 0) {
      sessions.push(
        prisma.session.create({
          data: {
            date: sessionDate,
            timeSlot: 'journée',
            startTime: '09:00',
            productId: 'product-3',
            guideId: admin.id,
            status: 'open'
          }
        })
      );
    }
  }

  await Promise.all(sessions);
  console.log('✅ Sessions créées:', sessions.length);

  console.log('🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
