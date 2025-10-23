import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import sessionRoutes from './routes/session.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import participantRoutes from './routes/participant.routes.js';
import giftVoucherRoutes from './routes/giftVoucher.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import emailRoutes from './routes/email.routes.js';
import stripeRoutes from './routes/stripe.routes.js';
import resellerRoutes from './routes/reseller.routes.js';
import emailTemplateRoutes from './routes/emailTemplate.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initNotificationService } from './services/notification.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// IMPORTANT: Le webhook Stripe doit recevoir le raw body AVANT express.json()
// On monte la route webhook AVANT les middlewares JSON
import stripeWebhookRoute from './routes/stripe.routes.js';
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoute);

// Maintenant on peut parser JSON pour toutes les autres routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes (sauf webhook qui est déjà monté)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/gift-vouchers', giftVoucherRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/resellers', resellerRoutes);
// On remonte les autres routes Stripe (sauf webhook)
app.use('/api/stripe', stripeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handler (doit être en dernier)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// 🔔 Configuration Socket.io pour les notifications en temps réel
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialiser le service de notifications
initNotificationService(io);

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log('👤 Client connecté:', socket.id);

  // Rejoindre une room selon le rôle de l'utilisateur
  socket.on('join-room', (data) => {
    const { role, userId } = data;

    if (role === 'admin') {
      socket.join('admins');
      console.log(`👨‍💼 Admin ${userId} a rejoint la room admins`);
    } else if (role === 'client' && userId) {
      socket.join(`client-${userId}`);
      console.log(`👤 Client ${userId} a rejoint sa room personnelle`);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('👋 Client déconnecté:', socket.id);
  });
});

// Exporter io pour pouvoir l'utiliser dans les routes
export { io };

// 🔒 Gérer les arrêts propres pour éviter les conflits de port
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('🛑 Serveur fermé proprement (SIGTERM)');
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('🛑 Serveur fermé proprement (SIGINT)');
  });
});

export default app;
