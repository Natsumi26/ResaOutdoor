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
