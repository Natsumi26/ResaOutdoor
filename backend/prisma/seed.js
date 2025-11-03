import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // Créer l'utilisateur administrateur principal
  const hashedPassword = await bcrypt.hash('canyonlife', 10);

  const admin = await prisma.user.upsert({
    where: { login: 'canyonlife' },
    update: {
      role: 'super_admin' // Mettre à jour le rôle si l'utilisateur existe déjà
    },
    create: {
      login: 'canyonlife',
      password: hashedPassword,
      email: 'admin@canyonlife.com',
      role: 'super_admin', // Nouveau rôle super_admin au lieu de admin
      stripeAccount: null
    }
  });

  console.log('✅ Utilisateur super admin créé:', admin.login);

  console.log('✅ Base de données initialisée (vide - catégories à créer manuellement par les guides)');

  // Créer des produits d'exemple
  // const products = await Promise.all([
  //   prisma.product.upsert({
  //     where: { id: 'product-1' },
  //     update: {},
  //     create: {
  //       id: 'product-1',
  //       name: 'Raft intégral',
  //       shortDescription: 'Descente complète en raft',
  //       priceIndividual: 50,
  //       duration: 180,
  //       color: '#f97316',
  //       level: 'aventure',
  //       maxCapacity: 12,
  //       guideId: admin.id,
  //       categoryId: '1'
  //     }
  //   }),
  //   prisma.product.upsert({
  //     where: { id: 'product-2' },
  //     update: {},
  //     create: {
  //       id: 'product-2',
  //       name: 'Raft découverte',
  //       shortDescription: 'Initiation au raft',
  //       priceIndividual: 35,
  //       duration: 120,
  //       color: '#ef4444',
  //       level: 'découverte',
  //       maxCapacity: 12,
  //       guideId: admin.id,
  //       categoryId: '1'
  //     }
  //   }),
  //   prisma.product.upsert({
  //     where: { id: 'product-3' },
  //     update: {},
  //     create: {
  //       id: 'product-3',
  //       name: 'Zoïcu',
  //       shortDescription: 'Canyon en nage',
  //       priceIndividual: 45,
  //       duration: 150,
  //       color: '#3b82f6',
  //       level: 'aventure',
  //       maxCapacity: 12,
  //       guideId: admin.id,
  //       categoryId: '1'
  //     }
  //   }),
  //   prisma.product.upsert({
  //     where: { id: 'product-4' },
  //     update: {},
  //     create: {
  //       id: 'product-4',
  //       name: 'Baptême',
  //       shortDescription: 'Première expérience',
  //       priceIndividual: 30,
  //       duration: 90,
  //       color: '#8b5cf6',
  //       level: 'découverte',
  //       maxCapacity: 8,
  //       guideId: admin.id,
  //       categoryId: '1'
  //     }
  //   })
  // ]);

  // console.log('✅ Produits créés:', products.length);

  // Créer des sessions d'exemple pour la semaine courante
  // const today = new Date();
  // const sessions = [];

  // for (let i = 0; i < 7; i++) {
  //   const sessionDate = new Date(today);
  //   sessionDate.setDate(today.getDate() + i);

  //   // Session matin - Raft intégral
  //   sessions.push(
  //     prisma.session.create({
  //       data: {
  //         date: sessionDate,
  //         timeSlot: 'matin',
  //         startTime: '09:00',
  //         productId: 'product-1',
  //         guideId: admin.id,
  //         status: 'open'
  //       }
  //     })
  //   );

  //   // Session après-midi - Raft découverte
  //   sessions.push(
  //     prisma.session.create({
  //       data: {
  //         date: sessionDate,
  //         timeSlot: 'après-midi',
  //         startTime: '14:00',
  //         productId: 'product-2',
  //         guideId: admin.id,
  //         status: 'open'
  //       }
  //     })
  //   );

  //   // Session journée - Zoïcu (tous les 2 jours)
  //   if (i % 2 === 0) {
  //     sessions.push(
  //       prisma.session.create({
  //         data: {
  //           date: sessionDate,
  //           timeSlot: 'journée',
  //           startTime: '09:00',
  //           productId: 'product-3',
  //           guideId: admin.id,
  //           status: 'open'
  //         }
  //       })
  //     );
  //   }
  // }

//   const createdSessions = await Promise.all(sessions);
//   console.log('✅ Sessions créées:', sessions.length);

//   // Créer quelques réservations de test
//   const bookings = [];

//   // Ajouter 2-3 réservations sur les premières sessions
//   for (let i = 0; i < Math.min(5, createdSessions.length); i++) {
//     const session = createdSessions[i];

//     // Réservation 1 - Payée complètement
//     bookings.push(
//       prisma.booking.create({
//         data: {
//           clientFirstName: 'Jean',
//           clientLastName: 'Dupont',
//           clientEmail: 'jean.dupont@example.com',
//           clientPhone: '0612345678',
//           clientNationality: 'Française',
//           numberOfPeople: 2,
//           totalPrice: 100,
//           amountPaid: 100,
//           status: 'confirmed',
//           sessionId: session.id
//         }
//       }).then(async (booking) => {
//         // Ajouter un paiement
//         await prisma.payment.create({
//           data: {
//             amount: 100,
//             method: 'CB',
//             bookingId: booking.id
//           }
//         });
//         // Ajouter l'historique
//         await prisma.bookingHistory.create({
//           data: {
//             action: 'created',
//             details: 'Réservation créée pour 2 personne(s)',
//             bookingId: booking.id
//           }
//         });
//         await prisma.bookingHistory.create({
//           data: {
//             action: 'payment',
//             details: 'Paiement de 100€ via CB',
//             bookingId: booking.id
//           }
//         });
//         return booking;
//       })
//     );

//     // Réservation 2 - Partiellement payée
//     if (i < 3) {
//       bookings.push(
//         prisma.booking.create({
//           data: {
//             clientFirstName: 'Marie',
//             clientLastName: 'Martin',
//             clientEmail: 'marie.martin@example.com',
//             clientPhone: '0623456789',
//             numberOfPeople: 3,
//             totalPrice: 150,
//             amountPaid: 50,
//             status: 'pending',
//             sessionId: session.id
//           }
//         }).then(async (booking) => {
//           await prisma.payment.create({
//             data: {
//               amount: 50,
//               method: 'espèces',
//               notes: 'Acompte',
//               bookingId: booking.id
//             }
//           });
//           await prisma.bookingHistory.create({
//             data: {
//               action: 'created',
//               details: 'Réservation créée pour 3 personne(s)',
//               bookingId: booking.id
//             }
//           });
//           await prisma.bookingHistory.create({
//             data: {
//               action: 'payment',
//               details: 'Paiement de 50€ via espèces',
//               bookingId: booking.id
//             }
//           });
//           return booking;
//         })
//       );
//     }
//   }

//   await Promise.all(bookings);
//   console.log('✅ Réservations créées:', bookings.length);

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
