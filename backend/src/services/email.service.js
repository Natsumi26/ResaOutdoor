import { transporter, defaultFrom } from '../config/email.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import nodemailer from 'nodemailer';
import prisma from '../config/database.js';

/**
 * Récupérer un template depuis la BDD et remplacer les variables
 * Logique : chercher d'abord le template personnalisé de l'utilisateur, sinon le template global
 */
const getTemplateWithVariables = async (type, variables, userId) => {
  try {
    // Chercher d'abord le template personnalisé de l'utilisateur
    let template = await prisma.emailTemplate.findFirst({
      where: {
        userId,
        type,
        isActive: true
      }
    });

    // Si pas trouvé, chercher le template global
    if (!template) {
      template = await prisma.emailTemplate.findFirst({
        where: {
          userId: null,
          type,
          isActive: true
        }
      });
    }

    if (!template) {
      console.log(`Aucun template actif trouvé pour le type: ${type}`);
      return null;
    }

    console.log(`✅ Template "${type}" chargé (${template.userId ? 'personnalisé' : 'global'})`);


    // Récupérer les settings pour les variables de l'entreprise du guide spécifique
    const settings = await prisma.settings.findUnique({
      where: { userId }
    });

    // Ajouter les variables de l'entreprise (logo, etc.)
    const allVariables = {
      ...variables,
      companyName: settings?.companyName || 'Canyon Life',
      companyEmail: settings?.companyEmail || '',
      companyPhone: settings?.companyPhone || '',
      companyWebsite: settings?.website || '',
      logo: settings?.logo ? `${process.env.APP_URL || 'http://localhost:5000'}${settings.logo}` : ''
    };

    // Remplacer toutes les variables dans le contenu HTML
    let htmlContent = template.htmlContent;
    let textContent = template.textContent || '';
    let subject = template.subject;

    // Remplacer chaque variable
    Object.keys(allVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = allVariables[key] !== undefined && allVariables[key] !== null ? allVariables[key] : '';
      htmlContent = htmlContent.replaceAll(placeholder, value);
      textContent = textContent.replaceAll(placeholder, value);
      subject = subject.replaceAll(placeholder, value);
    });

    return {
      subject,
      htmlContent,
      textContent
    };
  } catch (error) {
    console.error('Erreur récupération template:', error);
    return null;
  }
};

/**
 * Template HTML pour email de confirmation de réservation (FALLBACK si pas de template en BDD)
 */
const bookingConfirmationTemplate = (booking) => {
  const { session, product } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .warning {
          background: #fff9c4;
          border-left: 4px solid #fbc02d;
          padding: 12px 16px;
          margin: 20px 0;
        }
        .payment {
          background: #e3f2fd;
          border-left: 4px solid #1976d2;
          padding: 12px 16px;
          margin: 20px 0;
        }
        a {
          color: #1976d2;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        ul {
          margin: 10px 0;
          padding-left: 25px;
        }
        ul li {
          margin: 8px 0;
        }
        .amount {
          font-weight: bold;
          color: #1976d2;
        }
      </style>
    </head>
    <body>
      <p>Bonjour ${booking.clientFirstName},</p>

      <p>Ta réservation est bien confirmée pour le ${product.name}, le ${sessionDate} à ${session.startTime} !</p>

      <div class="payment">
        <h3>💳 Récapitulatif de ta réservation</h3>
        <p>
          <strong>Prix total :</strong>
          <span class="amount">${booking.totalPrice} €</span>
          <strong> → Déjà payé :</strong>
          <span class="amount">${booking.amountPaid} €</span>
        </p>
        <p>
          <strong>Reste à payer sur place :</strong>
          <span class="amount">${booking.totalPrice - booking.amountPaid} €</span>
        </p>
      </div>

      <div class="warning">
        ⚠️ <strong>Important</strong> : si ce n'est pas déjà fait, pense à
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/my-booking/${booking.id}">remplir le formulaire</a> concernant les participants.<br>
        Tu pourras encore le modifier jusqu'à la veille de l'activité.
      </div>

      <p>Pour que tout se passe au mieux, merci d'arriver environ 10 minutes avant l'heure du rendez-vous, le temps de te préparer tranquillement.</p>

      <p>
        <strong>Point de rendez-vous :</strong>
        ${product.googleMapsLink ? `<a href="${product.googleMapsLink}">Google Maps</a>` : ''} ${product.wazeLink ? `/ <a href="${product.wazeLink}">Waze</a>` : ''}
      </p>

      <p><strong>N'oublie pas d'emporter avec toi :</strong></p>

      <ul>
        <li>Des chaussures fermées qui accrochent (type baskets ou chaussures de sport).</li>
        <li>Des vêtements de sport adaptés à la météo du jour.</li>
        <li>Une petite veste ou coupe-vent si les conditions sont fraîches.</li>
        <li>Une bouteille d'eau pour rester bien hydraté(e).</li>
        <li>Un petit encas si tu as tendance à avoir faim facilement.</li>
      </ul>

      <p>Et surtout, amène ta bonne humeur 😄 !</p>

      <p>Avec ça, on est sûr de passer un super moment ensemble en plein air !</p>

      <p>À très bientôt,</p>

      <p><strong>L'équipe Canyon Life</strong></p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

      <div style="font-size: 14px; color: #555; text-align: center;">
        <p><strong>Canyon Life</strong></p>
      </div>

    </body>
    </html>
  `;
};

/**
 * Template texte simple pour email de confirmation
 */
const bookingConfirmationText = (booking) => {
  const { session, product } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

  return `
Bonjour ${booking.clientFirstName} ${booking.clientLastName},

Votre réservation a été confirmée avec succès !

DÉTAILS DE VOTRE RÉSERVATION
-----------------------------
Activité: ${product.name}
Date: ${sessionDate}
Créneau: ${session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} - ${session.startTime}
Guide: ${session.guide.login}
Nombre de personnes: ${booking.numberOfPeople}
Prix total: ${booking.totalPrice}€
${booking.amountPaid > 0 ? `Montant payé: ${booking.amountPaid}€\nReste à payer: ${booking.totalPrice - booking.amountPaid}€` : ''}

${product.postBookingMessage ? `\nINFORMATIONS IMPORTANTES\n${product.postBookingMessage}\n` : ''}

À très bientôt pour cette aventure inoubliable !

L'équipe Canyon Life
  `;
};

/**
 * Envoyer un email de confirmation de réservation
 */
export const sendBookingConfirmation = async (booking) => {
  try {
    const { session, product } = booking;
    const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

    // Récupérer la liste de matériel si elle existe
    let equipmentListText = '';
    if (product.equipmentListId) {
      const equipmentList = await prisma.equipmentList.findUnique({
        where: { id: product.equipmentListId }
      });
      equipmentListText = equipmentList ? equipmentList.items : '';
    }

    // Préparer les variables pour le template
    const variables = {
      clientFirstName: booking.clientFirstName,
      clientLastName: booking.clientLastName,
      clientEmail: booking.clientEmail,
      productName: product.name,
      sessionDate: sessionDate,
      sessionTimeSlot: session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1),
      sessionStartTime: session.startTime,
      guideName: session.guide.login,
      numberOfPeople: booking.numberOfPeople,
      totalPrice: booking.totalPrice,
      amountPaid: booking.amountPaid,
      amountDue: booking.totalPrice - booking.amountPaid,
      bookingId: booking.id,
      bookingLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/my-booking/${booking.id}`,
      postBookingMessage: product.postBookingMessage || '',
      wazeLink: product.wazeLink || '',
      googleMapsLink: product.googleMapsLink || '',
      equipmentList: equipmentListText
    };

    // Essayer de récupérer le template depuis la BDD pour ce guide
    const userId = session.guide.id || session.guideId;
    const templateData = await getTemplateWithVariables('booking_confirmation', variables, userId);

    let subject, html, text;

    if (templateData) {
      // Utiliser le template de la BDD
      subject = templateData.subject;
      html = templateData.htmlContent;
      text = templateData.textContent;
      console.log('✅ Template de confirmation chargé depuis la BDD');
    } else {
      // Fallback sur le template hardcodé
      subject = `Confirmation de réservation - ${product.name}`;
      html = bookingConfirmationTemplate(booking);
      text = bookingConfirmationText(booking);
      console.log('⚠️ Utilisation du template de confirmation par défaut (hardcodé)');
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.clientEmail,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email de confirmation envoyé:', info.messageId);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw error;
  }
};

/**
 * Envoyer un email de rappel (24h avant la session)
 */
export const sendBookingReminder = async (booking) => {
  try {
    const { session, product } = booking;
    const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

    // Récupérer la liste de matériel si elle existe
    let equipmentListText = '';
    if (product.equipmentListId) {
      const equipmentList = await prisma.equipmentList.findUnique({
        where: { id: product.equipmentListId }
      });
      equipmentListText = equipmentList ? equipmentList.items : '';
    }

    // Préparer les variables pour le template
    const variables = {
      clientFirstName: booking.clientFirstName,
      clientLastName: booking.clientLastName,
      productName: product.name,
      sessionDate: sessionDate,
      sessionStartTime: session.startTime,
      numberOfPeople: booking.numberOfPeople,
      guideName: session.guide.login,
      totalPrice: booking.totalPrice,
      amountPaid: booking.amountPaid,
      amountDue: booking.totalPrice - booking.amountPaid,
      bookingLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/my-booking/${booking.id}`,
      postBookingMessage: product.postBookingMessage || '',
      equipmentList: equipmentListText,
      wazeLink: product.wazeLink || '',
      googleMapsLink: product.googleMapsLink || ''
    };

    // Essayer de récupérer le template depuis la BDD pour ce guide
    const userId = session.guide.id || session.guideId;
    const templateData = await getTemplateWithVariables('booking_reminder', variables, userId);

    let subject, html, text;

    if (templateData) {
      // Utiliser le template de la BDD
      subject = templateData.subject;
      html = templateData.htmlContent;
      text = templateData.textContent;
    } else {
      // Fallback sur un template simple
      subject = `⏰ Rappel - ${product.name} demain !`;
      html = `
        <p>Bonjour ${booking.clientFirstName},</p>
        <p>Petit rappel pour ton activité <strong>${product.name}</strong> prévue demain le ${sessionDate} à ${session.startTime}.</p>
        <p>À très bientôt !</p>
      `;
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.clientEmail,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de rappel envoyé:', info.messageId, 'to:', booking.clientEmail);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email de rappel:', error);
    throw error;
  }
};

/**
 * Envoyer un email de confirmation de paiement
 */
export const sendPaymentConfirmation = async (booking, amountPaid) => {
  try {
    const { session, product } = booking;

    // Préparer les variables pour le template
    const variables = {
      clientFirstName: booking.clientFirstName,
      clientLastName: booking.clientLastName,
      amountPaid: amountPaid
    };

    // Essayer de récupérer le template depuis la BDD pour ce guide
    const userId = session.guide.id || session.guideId;
    const templateData = await getTemplateWithVariables('payment_confirmation', variables, userId);

    let subject, html, text;

    if (templateData) {
      // Utiliser le template de la BDD
      subject = templateData.subject;
      html = templateData.htmlContent;
      text = templateData.textContent;
    } else {
      // Fallback sur un template simple
      subject = `✅ Paiement confirmé - ${product.name}`;
      html = `
        <p>Bonjour ${booking.clientFirstName},</p>
        <p>Nous avons bien reçu ton paiement d'un montant de ${amountPaid} €. 🎉</p>
        <p>Ton paiement est confirmé.</p>
        <p>À bientôt !</p>
      `;
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.clientEmail,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email de confirmation de paiement envoyé:', info.messageId, 'to:', booking.clientEmail);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email de confirmation de paiement:', error);
    throw error;
  }
};

/**
 * Envoyer un email personnalisé
 */
export const sendCustomEmail = async (to, subject, content) => {
  try {
    const mailOptions = {
      from: defaultFrom,
      to,
      subject,
      html: content
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email personnalisé envoyé:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email personnalisé:', error);
    throw error;
  }
};

/**
 * Envoyer un email de bon cadeau
 * @param {Object} giftVoucher - L'objet bon cadeau complet de la base de données
 */
export const sendGiftVoucherEmail = async (giftVoucher) => {
  try {
    const { code, amount, recipientEmail, buyerEmail, recipientName, message, user } = giftVoucher;

    const userId = user?.id || giftVoucher.userId;

    // Récupérer les paramètres utilisateur
    const settings = await prisma.settings.findUnique({
      where: { userId }
    });

    const variables = {
      clientFirstName: recipientName || '',
      giftSender: buyerEmail || '',
      giftRecipient: recipientEmail || '',
      giftAmount: amount?.toFixed(2) || '0.00',
      giftMessage: message || '',
      giftCode: code || '',
      logo: settings?.logo || '',
      companyName: settings?.companyName || 'Canyon Life',
      companyWebsite: settings?.companyWebsite || process.env.FRONTEND_URL || 'http://localhost:3000',
      companyEmail: settings?.companyEmail || process.env.EMAIL_USER || '',
      companyPhone: settings?.companyPhone || ''
    };

    // Récupérer le template depuis la base de données
    const templateData = await getTemplateWithVariables('gift_voucher', variables, userId);

    const mailOptions = {
      from: defaultFrom,
      to: recipientEmail || buyerEmail, // Envoyer à l'acheteur si pas de destinataire
      subject: templateData.subject,
      html: templateData.htmlContent,
      text: templateData.textContent
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email de bon cadeau envoyé:', info.messageId, 'to:', recipientEmail || buyerEmail);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email de bon cadeau:', error);
    throw error;
  }
};

/**
 * Template HTML pour notification de nouvelle réservation au guide
 */
const guideNewBookingTemplate = (booking) => {
  const { session, product, clientFirstName, clientLastName, clientEmail, clientPhone, numberOfPeople, totalPrice } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });
  const sessionTime = session.startTime;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #6b7280;
        }
        .value {
          color: #111827;
        }
        .alert {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Nouvelle Réservation !</h1>
        <p>Une nouvelle réservation a été effectuée pour votre session</p>
      </div>
      <div class="content">
        <div class="info-box">
          <h2>📅 Détails de la Session</h2>
          <div class="info-row">
            <span class="label">Canyon :</span>
            <span class="value">${product.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Date :</span>
            <span class="value">${sessionDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Heure :</span>
            <span class="value">${sessionTime}</span>
          </div>
          <div class="info-row">
            <span class="label">Nombre de personnes :</span>
            <span class="value">${numberOfPeople}</span>
          </div>
          <div class="info-row">
            <span class="label">Montant :</span>
            <span class="value">${totalPrice.toFixed(2)} €</span>
          </div>
        </div>

        <div class="info-box">
          <h2>👤 Informations Client</h2>
          <div class="info-row">
            <span class="label">Nom :</span>
            <span class="value">${clientFirstName} ${clientLastName}</span>
          </div>
          <div class="info-row">
            <span class="label">Email :</span>
            <span class="value">${clientEmail}</span>
          </div>
          <div class="info-row">
            <span class="label">Téléphone :</span>
            <span class="value">${clientPhone || 'Non renseigné'}</span>
          </div>
        </div>

        <div class="alert">
          <strong>💡 Action requise :</strong> Connectez-vous au tableau de bord pour voir tous les détails de cette réservation.
        </div>

        <div class="footer">
          <p>Canyon Life - Système de gestion de réservations</p>
          <p>Cet email a été envoyé automatiquement</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template HTML pour notification de paiement au guide
 */
const guidePaymentReceivedTemplate = (booking, payment) => {
  const { session, product, clientFirstName, clientLastName } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #6b7280;
        }
        .value {
          color: #111827;
        }
        .amount {
          font-size: 1.5em;
          color: #3b82f6;
          font-weight: bold;
          text-align: center;
          padding: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💰 Paiement Reçu</h1>
        <p>Un paiement a été effectué pour une réservation</p>
      </div>
      <div class="content">
        <div class="amount">
          ${payment.amount.toFixed(2)} €
        </div>

        <div class="info-box">
          <h2>📅 Détails de la Réservation</h2>
          <div class="info-row">
            <span class="label">Client :</span>
            <span class="value">${clientFirstName} ${clientLastName}</span>
          </div>
          <div class="info-row">
            <span class="label">Canyon :</span>
            <span class="value">${product.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Date :</span>
            <span class="value">${sessionDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Méthode de paiement :</span>
            <span class="value">${payment.method === 'card' ? 'Carte bancaire' : payment.method === 'cash' ? 'Espèces' : 'Autre'}</span>
          </div>
        </div>

        <div class="footer">
          <p>Canyon Life - Système de gestion de réservations</p>
          <p>Cet email a été envoyé automatiquement</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template HTML pour notification d'annulation au guide
 */
const guideCancellationTemplate = (booking) => {
  const { session, product, clientFirstName, clientLastName, numberOfPeople } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #6b7280;
        }
        .value {
          color: #111827;
        }
        .alert {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>❌ Réservation Annulée</h1>
        <p>Une réservation a été annulée</p>
      </div>
      <div class="content">
        <div class="info-box">
          <h2>📅 Détails de la Réservation Annulée</h2>
          <div class="info-row">
            <span class="label">Client :</span>
            <span class="value">${clientFirstName} ${clientLastName}</span>
          </div>
          <div class="info-row">
            <span class="label">Canyon :</span>
            <span class="value">${product.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Date :</span>
            <span class="value">${sessionDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Nombre de personnes :</span>
            <span class="value">${numberOfPeople}</span>
          </div>
        </div>

        <div class="alert">
          <strong>📊 Capacité disponible :</strong> ${numberOfPeople} place(s) sont maintenant disponibles pour cette session.
        </div>

        <div class="footer">
          <p>Canyon Life - Système de gestion de réservations</p>
          <p>Cet email a été envoyé automatiquement</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template HTML pour notification de modification au guide
 */
const guideModificationTemplate = (booking) => {
  const { session, product, clientFirstName, clientLastName, numberOfPeople } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #6b7280;
        }
        .value {
          color: #111827;
        }
        .alert {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✏️ Réservation Modifiée</h1>
        <p>Une réservation a été mise à jour</p>
      </div>
      <div class="content">
        <div class="info-box">
          <h2>📅 Détails de la Réservation</h2>
          <div class="info-row">
            <span class="label">Client :</span>
            <span class="value">${clientFirstName} ${clientLastName}</span>
          </div>
          <div class="info-row">
            <span class="label">Canyon :</span>
            <span class="value">${product.name}</span>
          </div>
          <div class="info-row">
            <span class="label">Date :</span>
            <span class="value">${sessionDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Nombre de personnes :</span>
            <span class="value">${numberOfPeople}</span>
          </div>
        </div>

        <div class="alert">
          <strong>💡 Info :</strong> Connectez-vous au tableau de bord pour voir les détails des modifications.
        </div>

        <div class="footer">
          <p>Canyon Life - Système de gestion de réservations</p>
          <p>Cet email a été envoyé automatiquement</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envoyer une notification au guide lors d'une nouvelle réservation
 */
export const sendGuideNewBookingNotification = async (booking) => {
  try {
    // Vérifier que le guide a un email
    if (!booking.session?.guide?.email) {
      console.log('Pas d\'email pour le guide, notification ignorée');
      return { success: false, reason: 'no_guide_email' };
    }

    const { session, product } = booking;
    const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

    // Calculer les places restantes dans la session
    const totalCapacity = product.maxCapacity || 10;
    const currentOccupancy = session.bookings
      ?.filter(b => b.status !== 'cancelled')
      ?.reduce((sum, b) => sum + (b.numberOfPeople || 0), 0) || 0;
    const remainingSpots = totalCapacity - currentOccupancy;

    // Récupérer la liste de matériel si elle existe
    let equipmentListText = '';
    if (product.equipmentListId) {
      const equipmentList = await prisma.equipmentList.findUnique({
        where: { id: product.equipmentListId }
      });
      equipmentListText = equipmentList ? equipmentList.items : '';
    }

    // Préparer les variables pour le template
    const variables = {
      clientFirstName: booking.clientFirstName,
      clientLastName: booking.clientLastName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone || 'Non renseigné',
      productName: product.name,
      sessionDate: sessionDate,
      sessionTimeSlot: session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1),
      sessionStartTime: session.startTime,
      guideName: session.guide.login,
      numberOfPeople: booking.numberOfPeople,
      totalPrice: booking.totalPrice,
      amountPaid: booking.amountPaid,
      amountDue: booking.totalPrice - booking.amountPaid,
      bookingId: booking.id,
      bookingLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/my-booking/${booking.id}`,
      bookingAdminLink: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reservations`,
      remainingSpots: remainingSpots,
      postBookingMessage: product.postBookingMessage || '',
      wazeLink: product.wazeLink || '',
      googleMapsLink: product.googleMapsLink || '',
      equipmentList: equipmentListText
    };

    // Essayer de récupérer le template depuis la BDD pour ce guide
    const userId = session.guide.id || session.guideId;
    const templateData = await getTemplateWithVariables('guide_notification', variables, userId);

    let subject, html;

    if (templateData) {
      // Utiliser le template de la BDD
      subject = templateData.subject;
      html = templateData.htmlContent;
    } else {
      // Fallback sur le template hardcodé
      subject = `🎉 Nouvelle réservation - ${booking.product.name}`;
      html = guideNewBookingTemplate(booking);
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.session.guide.email,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de nouvelle réservation envoyé au guide:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email au guide (nouvelle réservation):', error);
    // Ne pas bloquer la réservation si l'email échoue
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer une notification au guide lors d'un paiement
 */
export const sendGuidePaymentNotification = async (booking, payment) => {
  try {
    if (!booking.session?.guide?.email) {
      console.log('Pas d\'email pour le guide, notification ignorée');
      return { success: false, reason: 'no_guide_email' };
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.session.guide.email,
      subject: `💰 Paiement reçu - ${booking.clientFirstName} ${booking.clientLastName}`,
      html: guidePaymentReceivedTemplate(booking, payment)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de paiement envoyé au guide:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email au guide (paiement):', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer une notification au guide lors d'une annulation
 */
export const sendGuideCancellationNotification = async (booking) => {
  try {
    if (!booking.session?.guide?.email) {
      console.log('Pas d\'email pour le guide, notification ignorée');
      return { success: false, reason: 'no_guide_email' };
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.session.guide.email,
      subject: `❌ Annulation - ${booking.product.name}`,
      html: guideCancellationTemplate(booking)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email d\'annulation envoyé au guide:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email au guide (annulation):', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer une notification au guide lors d'une modification
 */
export const sendGuideModificationNotification = async (booking) => {
  try {
    if (!booking.session?.guide?.email) {
      console.log('Pas d\'email pour le guide, notification ignorée');
      return { success: false, reason: 'no_guide_email' };
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.session.guide.email,
      subject: `✏️ Modification - ${booking.product.name}`,
      html: guideModificationTemplate(booking)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de modification envoyé au guide:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email au guide (modification):', error);
    return { success: false, error: error.message };
  }
};

/**
 * Template HTML pour email d'échec de paiement
 */
const paymentFailedTemplate = (metadata, reason) => {
  const { type } = metadata;
  const isBooking = type === 'new_booking';
  const isGiftVoucher = type === 'gift_voucher';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .error-box {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>❌ Échec du paiement</h1>
        <p>Votre paiement n'a pas pu être traité</p>
      </div>

      <div class="content">
        <p>Bonjour,</p>

        <p>Nous sommes désolés, mais votre paiement pour ${isBooking ? 'votre réservation' : 'le bon cadeau'} n'a pas pu être traité.</p>

        <div class="error-box">
          <h3>❗ Raison de l'échec</h3>
          <p>${reason || 'Le paiement a été refusé par votre banque.'}</p>
        </div>

        <div class="info-box">
          <h3>🔄 Que faire maintenant ?</h3>
          <ul>
            <li>Vérifiez que votre carte bancaire est valide et dispose de fonds suffisants</li>
            <li>Assurez-vous que les informations de votre carte sont correctes</li>
            <li>Contactez votre banque si le problème persiste</li>
            <li>Réessayez le paiement avec une autre carte si nécessaire</li>
          </ul>
        </div>

        ${isBooking ? `
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/search" class="button">
            Réessayer ma réservation
          </a>
        </div>
        ` : ''}

        ${isGiftVoucher ? `
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/gift-voucher" class="button">
            Réessayer l'achat du bon cadeau
          </a>
        </div>
        ` : ''}

        <div class="info-box">
          <h3>📞 Besoin d'aide ?</h3>
          <p>Si vous rencontrez des difficultés, n'hésitez pas à nous contacter :</p>
          <p>Email: ${defaultFrom}</p>
        </div>

        <p>Nous restons à votre disposition pour toute question.</p>
        <p>L'équipe Canyon Life 🌊</p>
      </div>

      <div class="footer">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p>© ${new Date().getFullYear()} Canyon Life - Tous droits réservés</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envoyer un email d'échec de paiement
 */
export const sendPaymentFailedEmail = async (paymentIntent, reason) => {
  try {
    const { metadata } = paymentIntent;
    const email = metadata.buyerEmail || metadata.clientEmail;

    if (!email) {
      console.error('❌ Pas d\'email trouvé pour notifier l\'échec de paiement');
      return { success: false, reason: 'no_email' };
    }

    const type = metadata.type;
    const subject = type === 'gift_voucher'
      ? '❌ Échec du paiement de votre bon cadeau'
      : '❌ Échec du paiement de votre réservation';

    const mailOptions = {
      from: defaultFrom,
      to: email,
      subject,
      html: paymentFailedTemplate(metadata, reason)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email d\'échec de paiement envoyé:', info.messageId, 'to:', email);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email d\'échec de paiement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fonction générique pour envoyer un email
 * Utilisée notamment pour la newsletter
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: defaultFrom,
      to,
      subject,
      html,
      text: text || subject
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email générique envoyé:', info.messageId, 'to:', to);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email générique:', error);
    throw error;
  }
};

/**
 * Template HTML pour email de réinitialisation de mot de passe
 */
const passwordResetTemplate = (resetLink, userLogin) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔒 Réinitialisation de mot de passe</h1>
        <p>RésaOutdoor</p>
      </div>

      <div class="content">
        <p>Bonjour ${userLogin},</p>

        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

        <div style="text-align: center;">
          <a href="${resetLink}" class="button">
            Réinitialiser mon mot de passe
          </a>
        </div>

        <div class="info-box">
          <h3>ℹ️ Informations importantes</h3>
          <ul>
            <li><strong>Validité :</strong> Ce lien est valide pendant 1 heure</li>
            <li><strong>Usage unique :</strong> Le lien ne peut être utilisé qu'une seule fois</li>
            <li><strong>Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
          </ul>
        </div>

        <div class="warning-box">
          <strong>⚠️ Attention :</strong> Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email. Votre mot de passe actuel restera inchangé.
        </div>

        <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #667eea;">${resetLink}</p>

        <p>Cordialement,<br>L'équipe RésaOutdoor</p>
      </div>

      <div class="footer">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p>© ${new Date().getFullYear()} RésaOutdoor - Tous droits réservés</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export const sendPasswordResetEmail = async (email, resetToken, userLogin) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: defaultFrom,
      to: email,
      subject: '🔒 Réinitialisation de votre mot de passe - RésaOutdoor',
      html: passwordResetTemplate(resetLink, userLogin)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email de réinitialisation de mot de passe envoyé:', info.messageId, 'to:', email);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email de réinitialisation:', error);
    throw error;
  }
};

/**
 * Template HTML pour email de code 2FA
 */
const twoFactorCodeTemplate = (code, userLogin) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .code-box {
          background: white;
          padding: 30px;
          margin: 20px 0;
          border-radius: 8px;
          text-align: center;
          border: 2px solid #667eea;
        }
        .code {
          font-size: 3em;
          color: #667eea;
          font-weight: bold;
          letter-spacing: 10px;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Code de vérification</h1>
        <p>Authentification à 2 facteurs</p>
      </div>

      <div class="content">
        <p>Bonjour ${userLogin},</p>

        <p>Voici votre code de vérification pour vous connecter à RésaOutdoor :</p>

        <div class="code-box">
          <p style="margin: 0; color: #6b7280; font-size: 0.9em;">CODE DE VÉRIFICATION</p>
          <div class="code">${code}</div>
          <p style="margin: 0; color: #6b7280; font-size: 0.9em;">Entrez ce code dans la page de connexion</p>
        </div>

        <div class="info-box">
          <h3>ℹ️ Informations importantes</h3>
          <ul>
            <li><strong>Validité :</strong> Ce code est valide pendant 10 minutes</li>
            <li><strong>Usage unique :</strong> Le code ne peut être utilisé qu'une seule fois</li>
            <li><strong>Tentatives :</strong> Vous avez 3 tentatives maximum</li>
          </ul>
        </div>

        <div class="warning-box">
          <strong>⚠️ Sécurité :</strong> Si vous n'êtes pas à l'origine de cette tentative de connexion, ignorez cet email et assurez-vous que votre mot de passe est sécurisé.
        </div>

        <p>Cordialement,<br>L'équipe RésaOutdoor</p>
      </div>

      <div class="footer">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p>© ${new Date().getFullYear()} RésaOutdoor - Tous droits réservés</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envoyer un email avec le code 2FA
 */
export const sendTwoFactorCode = async (email, code, userLogin) => {
  try {
    const mailOptions = {
      from: defaultFrom,
      to: email,
      subject: '🔐 Code de vérification - RésaOutdoor',
      html: twoFactorCodeTemplate(code, userLogin)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email de code 2FA envoyé:', info.messageId, 'to:', email);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email de code 2FA:', error);
    throw error;
  }
};

/**
 * Envoyer un email de rappel pour formulaire participants incomplet
 */
export const sendFormReminder = async (booking) => {
  try {
    const { session, product } = booking;
    const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

    // Récupérer la liste de matériel si elle existe
    let equipmentListText = '';
    if (product.equipmentListId) {
      const equipmentList = await prisma.equipmentList.findUnique({
        where: { id: product.equipmentListId }
      });
      equipmentListText = equipmentList ? equipmentList.items : '';
    }

    // Préparer les variables pour le template
    const variables = {
      clientFirstName: booking.clientFirstName,
      clientLastName: booking.clientLastName,
      productName: product.name,
      date: sessionDate,
      timeSlot: session.startTime, // Utiliser l'heure de RDV au lieu de "matin/après-midi"
      formLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/my-booking/${booking.id}`,
      equipmentList: equipmentListText
    };

    // Récupérer le template depuis la BDD pour ce guide
    const userId = session.guide.id || session.guideId;
    const templateData = await getTemplateWithVariables('form_reminder', variables, userId);

    if (!templateData) {
      console.error('❌ Template form_reminder non trouvé');
      throw new Error('Template form_reminder non trouvé');
    }

    const mailOptions = {
      from: defaultFrom,
      to: booking.clientEmail,
      subject: templateData.subject,
      text: templateData.textContent,
      html: templateData.htmlContent
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email de rappel formulaire envoyé:', info.messageId, 'to:', booking.clientEmail);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email de rappel formulaire:', error);
    throw error;
  }
};
