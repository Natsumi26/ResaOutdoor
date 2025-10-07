import nodemailer from 'nodemailer';

// Configuration du transporteur email
const createTransporter = () => {
  // En développement, utiliser Ethereal Email (faux SMTP pour tester)
  // En production, utiliser un vrai service SMTP (Gmail, SendGrid, etc.)

  if (process.env.NODE_ENV === 'production') {
    // Configuration pour production (Gmail, SendGrid, etc.)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Configuration pour développement (Gmail avec mot de passe d'application)
    // Ou utiliser Ethereal pour tester sans vrai email
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
};

export const transporter = createTransporter();

// Email par défaut de l'expéditeur
export const defaultFrom = process.env.EMAIL_FROM || 'noreply@canyonlife.com';
