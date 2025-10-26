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


    // Récupérer les settings pour les variables de l'entreprise
    const settings = await prisma.settings.findFirst();

    // Ajouter les variables de l'entreprise (logo, etc.)
    const allVariables = {
      ...variables,
      companyName: settings?.companyName || 'Canyon Life',
      companyEmail: settings?.companyEmail || '',
      companyPhone: settings?.companyPhone || '',
      companyWebsite: settings?.website || '',
      logo: settings?.logo ? `${process.env.FRONTEND_URL || 'http://localhost:5000'}${settings.logo}` : ''
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
        .total {
          font-size: 1.2em;
          color: #667eea;
          font-weight: bold;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
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
        <h1>🏔️ Confirmation de Réservation</h1>
        <p>Canyon Life</p>
      </div>

      <div class="content">
        <p>Bonjour ${booking.clientFirstName} ${booking.clientLastName},</p>

        <p>Votre réservation a été confirmée avec succès ! Nous sommes ravis de vous accueillir pour cette aventure.</p>

        <div class="info-box">
          <h3>📋 Détails de votre réservation</h3>

          <div class="info-row">
            <span class="label">Activité :</span>
            <span class="value">${product.name}</span>
          </div>

          <div class="info-row">
            <span class="label">Date :</span>
            <span class="value">${sessionDate}</span>
          </div>

          <div class="info-row">
            <span class="label">Créneau :</span>
            <span class="value">${session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} - ${session.startTime}</span>
          </div>

          <div class="info-row">
            <span class="label">Guide :</span>
            <span class="value">${session.guide.login}</span>
          </div>

          <div class="info-row">
            <span class="label">Nombre de personnes :</span>
            <span class="value">${booking.numberOfPeople}</span>
          </div>

          <div class="info-row">
            <span class="label">Prix total :</span>
            <span class="value total">${booking.totalPrice}€</span>
          </div>

          ${booking.amountPaid > 0 ? `
          <div class="info-row">
            <span class="label">Montant payé :</span>
            <span class="value" style="color: #10b981;">${booking.amountPaid}€</span>
          </div>

          <div class="info-row">
            <span class="label">Reste à payer :</span>
            <span class="value" style="color: #ef4444;">${booking.totalPrice - booking.amountPaid}€</span>
          </div>
          ` : ''}
        </div>

        ${product.postBookingMessage ? `
        <div class="info-box">
          <h3>ℹ️ Informations importantes</h3>
          <p>${product.postBookingMessage}</p>
        </div>
        ` : ''}

        ${product.wazeLink || product.googleMapsLink ? `
        <div class="info-box">
          <h3>📍 Point de rendez-vous</h3>
          <p>Retrouvez-nous au point de rendez-vous :</p>
          ${product.wazeLink ? `<a href="${product.wazeLink}" class="button">📱 Ouvrir dans Waze</a>` : ''}
          ${product.googleMapsLink ? `<a href="${product.googleMapsLink}" class="button">🗺️ Ouvrir dans Google Maps</a>` : ''}
        </div>
        ` : ''}

        <div class="info-box">
          <h3>Gérer sa réservation</h3>
          <p>Vous pouvez compléter votre formulaire des participants en cliquant sur ce lien,</p>
          <a href='${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/my-booking/${booking.id}' class="button">📋 Ma réservation</a>
        </div>

        <div class="info-box" style="background: #fef3c7; border-left-color: #f59e0b;">
          <h3>❌ Besoin d'annuler ?</h3>
          <p>Vous pouvez annuler votre réservation en respectant notre politique d'annulation :</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Plus de 48h avant : Remboursement intégral (100%)</li>
            <li>Entre 24h et 48h : Remboursement partiel (50%)</li>
            <li>Moins de 24h : Pas de remboursement</li>
          </ul>
          <a href='${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/cancel-booking/${booking.id}' class="button" style="background: #ef4444;">Annuler ma réservation</a>
        </div>

        <div class="info-box">
          <h3>📞 Contact</h3>
          <p>Pour toute question, n'hésitez pas à nous contacter :</p>
          <p>Email: ${defaultFrom}</p>
        </div>

        <p>À très bientôt pour cette aventure inoubliable !</p>
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
      googleMapsLink: product.googleMapsLink || ''
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
  const { session, product } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; background: #fffbeb; margin-top: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⏰ Rappel - Votre activité est demain !</h1>
      </div>
      <div class="content">
        <p>Bonjour ${booking.clientFirstName} ${booking.clientLastName},</p>
        <p><strong>N'oubliez pas :</strong> Votre activité <strong>${product.name}</strong> a lieu demain !</p>
        <p>📅 Date : ${sessionDate}</p>
        <p>⏰ Heure : ${session.startTime}</p>
        <p>👥 Guide : ${session.guide.login}</p>
        <p>À demain ! 🏔️</p>
      </div>
    </body>
    </html>
  `;

  try {
    const mailOptions = {
      from: defaultFrom,
      to: booking.clientEmail,
      subject: `🔔 Rappel - ${product.name} demain !`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email de rappel envoyé:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email de rappel:', error);
    throw error;
  }
};

/**
 * Template HTML pour email de confirmation de paiement
 */
const paymentConfirmationTemplate = (booking, amountPaid) => {
  const { session, product } = booking;
  const sessionDate = format(new Date(session.date), 'EEEE dd MMMM yyyy', { locale: fr });
  const isFullyPaid = booking.amountPaid >= booking.totalPrice;

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
        .success-badge {
          background: #10b981;
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          display: inline-block;
          margin: 20px 0;
          font-weight: bold;
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
        .amount {
          font-size: 2em;
          color: #10b981;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
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
        <h1>✅ Paiement confirmé !</h1>
        <p>Canyon Life</p>
      </div>

      <div class="content">
        <p>Bonjour ${booking.clientFirstName} ${booking.clientLastName},</p>

        <p>Nous avons bien reçu votre paiement de <strong>${amountPaid}€</strong>.</p>

        <div class="amount">${amountPaid}€</div>

        <div class="success-badge">
          ${isFullyPaid ? '✓ Réservation entièrement payée' : '✓ Paiement enregistré'}
        </div>

        <div class="info-box">
          <h3>📋 Récapitulatif de votre réservation</h3>

          <div class="info-row">
            <span class="label">Activité :</span>
            <span class="value">${product.name}</span>
          </div>

          <div class="info-row">
            <span class="label">Date :</span>
            <span class="value">${sessionDate}</span>
          </div>

          <div class="info-row">
            <span class="label">Créneau :</span>
            <span class="value">${session.timeSlot.charAt(0).toUpperCase() + session.timeSlot.slice(1)} - ${session.startTime}</span>
          </div>

          <div class="info-row">
            <span class="label">Guide :</span>
            <span class="value">${session.guide.login}</span>
          </div>

          <div class="info-row">
            <span class="label">Nombre de personnes :</span>
            <span class="value">${booking.numberOfPeople}</span>
          </div>
        </div>

        <div class="info-box">
          <h3>💰 Détails du paiement</h3>

          <div class="info-row">
            <span class="label">Montant de ce paiement :</span>
            <span class="value" style="color: #10b981; font-weight: bold;">${amountPaid}€</span>
          </div>

          <div class="info-row">
            <span class="label">Prix total :</span>
            <span class="value">${booking.totalPrice}€</span>
          </div>

          <div class="info-row">
            <span class="label">Total payé :</span>
            <span class="value" style="color: #10b981;">${booking.amountPaid}€</span>
          </div>

          ${!isFullyPaid ? `
          <div class="info-row">
            <span class="label">Reste à payer :</span>
            <span class="value" style="color: #ef4444;">${booking.totalPrice - booking.amountPaid}€</span>
          </div>
          ` : `
          <div class="info-row">
            <span class="label">Statut :</span>
            <span class="value" style="color: #10b981; font-weight: bold;">✓ ENTIÈREMENT PAYÉ</span>
          </div>
          `}
        </div>

        ${isFullyPaid ? `
        <p style="background: #ecfdf5; padding: 15px; border-radius: 8px; border: 2px solid #10b981; color: #065f46;">
          🎉 <strong>Félicitations !</strong> Votre réservation est maintenant confirmée et entièrement payée.
          Vous êtes prêt pour l'aventure !
        </p>
        ` : `
        <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 2px solid #f59e0b; color: #92400e;">
          ℹ️ Votre paiement a bien été enregistré. Un solde de <strong>${booking.totalPrice - booking.amountPaid}€</strong> reste à régler.
        </p>
        `}

        <p>À très bientôt pour cette aventure inoubliable !</p>
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
 * Envoyer un email de confirmation de paiement
 */
export const sendPaymentConfirmation = async (booking, amountPaid) => {
  try {
    const isFullyPaid = booking.amountPaid >= booking.totalPrice;
    const mailOptions = {
      from: defaultFrom,
      to: booking.clientEmail,
      subject: isFullyPaid
        ? `✅ Paiement confirmé - ${booking.product.name} `
        : `💳 Paiement de ${amountPaid}€ confirmé - ${booking.product.name}`,
      html: paymentConfirmationTemplate(booking, amountPaid)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email de confirmation de paiement envoyé:', info.messageId);

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
 * Template HTML pour email de bon cadeau
 */
const giftVoucherTemplate = (code, amount, metadata) => {
  const { recipientName, recipientEmail, message } = metadata;

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
        .voucher-box {
          background: white;
          padding: 30px;
          margin: 20px 0;
          border-radius: 12px;
          border: 3px dashed #f59e0b;
          text-align: center;
        }
        .voucher-code {
          font-size: 2em;
          color: #f59e0b;
          font-weight: bold;
          letter-spacing: 3px;
          margin: 20px 0;
          padding: 15px;
          background: #fffbeb;
          border-radius: 8px;
        }
        .voucher-amount {
          font-size: 2.5em;
          color: #059669;
          font-weight: bold;
          margin: 10px 0;
        }
        .info-box {
          background: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }
        .message-box {
          background: #fffbeb;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          font-style: italic;
          border-left: 4px solid #f59e0b;
        }
        .button {
          display: inline-block;
          background: #f59e0b;
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
        <h1>🎁 Bon Cadeau Canyon Life</h1>
        <p>Une aventure inoubliable vous attend !</p>
      </div>

      <div class="content">
        ${recipientName ? `<p>Bonjour ${recipientName},</p>` : '<p>Bonjour,</p>'}

        <p>Vous avez reçu un bon cadeau pour vivre une expérience exceptionnelle avec Canyon Life !</p>

        ${message ? `
        <div class="message-box">
          <h3>💌 Message personnel :</h3>
          <p>${message}</p>
        </div>
        ` : ''}

        <div class="voucher-box">
          <h2>Votre bon cadeau</h2>
          <div class="voucher-amount">${amount}€</div>

          <p><strong>Votre code unique :</strong></p>
          <div class="voucher-code">${code}</div>

          <p style="color: #6b7280; font-size: 0.9em; margin-top: 20px;">
            Utilisez ce code lors de votre réservation pour bénéficier de votre bon cadeau
          </p>
        </div>

        <div class="info-box">
          <h3>📋 Comment utiliser votre bon cadeau ?</h3>
          <ol>
            <li>Rendez-vous sur notre site de réservation</li>
            <li>Choisissez l'activité et la date qui vous conviennent</li>
            <li>Lors du paiement, entrez votre code : <strong>${code}</strong></li>
            <li>Le montant du bon cadeau sera automatiquement déduit</li>
          </ol>
        </div>

        <div class="info-box">
          <h3>ℹ️ Informations importantes</h3>
          <ul>
            <li><strong>Validité :</strong> 1 an à partir de la date d'achat</li>
            <li><strong>Valeur :</strong> ${amount}€</li>
            <li><strong>Utilisations :</strong> Une seule fois</li>
            <li><strong>Code :</strong> ${code}</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking" class="button">
            Réserver maintenant
          </a>
        </div>

        <p>Nous avons hâte de vous faire vivre cette aventure extraordinaire !</p>
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
 * Envoyer un email de bon cadeau
 */
export const sendGiftVoucherEmail = async (recipientEmail, code, amount, metadata = {}) => {
  try {
    const { recipientName, buyerEmail } = metadata;

    const mailOptions = {
      from: defaultFrom,
      to: recipientEmail || buyerEmail, // Envoyer à l'acheteur si pas de destinataire
      subject: `🎁 Votre bon cadeau Canyon Life de ${amount}€`,
      html: giftVoucherTemplate(code, amount, metadata)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email de bon cadeau envoyé:', info.messageId);

    // En développement, afficher le lien pour voir l'email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email de bon cadeau:', error);
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
      googleMapsLink: product.googleMapsLink || ''
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
