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
      role: 'super_admin', // Mettre à jour le rôle si l'utilisateur existe déjà
      email: 'vincent.garcia95@wanadoo.fr' // Mettre à jour l'email aussi
    },
    create: {
      login: 'canyonlife',
      password: hashedPassword,
      email: 'vincent.garcia95@wanadoo.fr',
      role: 'super_admin', // Nouveau rôle super_admin au lieu de admin
      stripeAccount: null
    }
  });

  console.log('✅ Utilisateur super admin créé:', admin.login);

  // Créer le template d'email de rappel pour les formulaires incomplets
  const existingTemplate = await prisma.emailTemplate.findFirst({
    where: {
      type: 'form_reminder',
      userId: admin.id
    }
  });

  if (existingTemplate) {
    // Mettre à jour le template existant
    await prisma.emailTemplate.update({
      where: { id: existingTemplate.id },
      data: {
        type: 'form_reminder',
        name: 'Rappel formulaire participants',
        subject: 'Rappel : Complétez votre formulaire pour votre activité du {{date}}',
        htmlContent: `<!DOCTYPE html>
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
    a {
      color: #1976d2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #1a5f7a;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 12px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{logo}}"
         alt="Logo {{companyName}}"
         style="max-width: 250px; height: auto; display: block; margin: 0 auto;">
  </div>

  <p>Bonjour {{clientFirstName}},</p>

  <p>
    Le jour de votre activité « <strong>{{productName}}</strong> » approche.<br>
    Nous avons rendez-vous le <strong>{{date}}</strong> à <strong>{{timeSlot}}</strong>.
  </p>

  <p>
    ⚠️ <strong>Nous n'avons pas encore reçu le formulaire des participants.</strong>
  </p>

  <p>
    Pour que tout se passe au mieux le jour J, pourriez-vous le compléter dès que possible en cliquant sur le bouton ci-dessous&nbsp;?
  </p>

  <p>
    <a href="{{formLink}}" class="btn">
      ⚠️ Compléter le formulaire des participants
    </a>
  </p>

  <p>
    Ces informations (taille, pointure, etc.) nous permettent de préparer l'équipement adapté à chacun.
    Sans elles, il nous est difficile d'anticiper correctement le matériel pour votre groupe.
  </p>

  <p
    style="
      background: #fff3cd;
      padding: 12px;
      border-left: 4px solid #ffc107;
      margin: 16px 0;
    "
  >
    ⚠️ Sans ce formulaire complété avant l'activité, nous ne pouvons pas garantir
    de disposer de l'équipement parfaitement adapté pour tous les participants.
  </p>

  <p>
    Si vous avez déjà rempli le formulaire récemment, vous pouvez ignorer ce message.
  </p>

  <p>
    En cas de question, n'hésitez pas à nous contacter.
  </p>

  <p>
    À très bientôt en plein air&nbsp;!
  </p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

  <div style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p style="line-height: 1.8;">
      🌐 Site web : <a href="{{companyWebsite}}" target="_blank" style="color: #1976d2; text-decoration: none;">{{companyWebsite}}</a><br>
      📧 Email : <a href="mailto:{{companyEmail}}" style="color: #1976d2; text-decoration: none;">{{companyEmail}}</a><br>
      📞 Téléphone : <a href="tel:{{companyPhone}}" style="color: #1976d2; text-decoration: none;">{{companyPhone}}</a>
    </p>
  </div>

</body>
</html>`,
        textContent: `{{companyName}}

Bonjour {{clientFirstName}},

Le jour de votre activité « {{productName}} » approche.
Nous avons rendez-vous le {{date}} à {{timeSlot}}.

Nous n'avons pas encore reçu le formulaire des participants.

Pourriez-vous le compléter dès que possible en utilisant ce lien :
{{formLink}}

Ces informations (taille, pointure, etc.) nous permettent de préparer l'équipement adapté à chacun.
Sans elles, il nous est difficile d'anticiper correctement le matériel pour votre groupe.

⚠️ Sans ce formulaire complété avant l'activité, nous ne pouvons pas garantir de disposer de l'équipement parfaitement adapté pour tous les participants.

Si vous avez déjà rempli le formulaire récemment, vous pouvez ignorer ce message.

Si vous avez des questions, n'hésitez pas à nous contacter.

À très bientôt en plein air !

---
{{companyName}}
Site : {{companyWebsite}}
Email : {{companyEmail}}
Tél : {{companyPhone}}`,
        variables: JSON.stringify([
          'clientFirstName',
          'clientLastName',
          'productName',
          'date',
          'timeSlot',
          'formLink',
          'logo',
          'companyName',
          'companyWebsite',
          'companyEmail',
          'companyPhone'
        ]),
        userId: admin.id
      }
    });

    console.log('✅ Template email rappel formulaire mis à jour');
  } else {
    // Créer le template s'il n'existe pas
    await prisma.emailTemplate.create({
      data: {
        type: 'form_reminder',
        name: 'Rappel formulaire participants',
        subject: 'Rappel : Complétez votre formulaire pour votre activité du {{date}}',
        htmlContent: `<!DOCTYPE html>
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
    a {
      color: #1976d2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #1a5f7a;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 12px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{logo}}"
         alt="Logo {{companyName}}"
         style="max-width: 250px; height: auto; display: block; margin: 0 auto;">
  </div>

  <p>Bonjour {{clientFirstName}},</p>

  <p>
    Le jour de votre activité « <strong>{{productName}}</strong> » approche.<br>
    Nous avons rendez-vous le <strong>{{date}}</strong> à <strong>{{timeSlot}}</strong>.
  </p>

  <p>
    ⚠️ <strong>Nous n'avons pas encore reçu le formulaire des participants.</strong>
  </p>

  <p>
    Pour que tout se passe au mieux le jour J, pourriez-vous le compléter dès que possible en cliquant sur le bouton ci-dessous&nbsp;?
  </p>

  <p>
    <a href="{{formLink}}" class="btn">
      ⚠️ Compléter le formulaire des participants
    </a>
  </p>

  <p>
    Ces informations (taille, pointure, etc.) nous permettent de préparer l'équipement adapté à chacun.
    Sans elles, il nous est difficile d'anticiper correctement le matériel pour votre groupe.
  </p>

  <p
    style="
      background: #fff3cd;
      padding: 12px;
      border-left: 4px solid #ffc107;
      margin: 16px 0;
    "
  >
    ⚠️ Sans ce formulaire complété avant l'activité, nous ne pouvons pas garantir
    de disposer de l'équipement parfaitement adapté pour tous les participants.
  </p>

  <p>
    Si vous avez déjà rempli le formulaire récemment, vous pouvez ignorer ce message.
  </p>

  <p>
    En cas de question, n'hésitez pas à nous contacter.
  </p>

  <p>
    À très bientôt en plein air&nbsp;!
  </p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

  <div style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p style="line-height: 1.8;">
      🌐 Site web : <a href="{{companyWebsite}}" target="_blank" style="color: #1976d2; text-decoration: none;">{{companyWebsite}}</a><br>
      📧 Email : <a href="mailto:{{companyEmail}}" style="color: #1976d2; text-decoration: none;">{{companyEmail}}</a><br>
      📞 Téléphone : <a href="tel:{{companyPhone}}" style="color: #1976d2; text-decoration: none;">{{companyPhone}}</a>
    </p>
  </div>

</body>
</html>`,
        textContent: `{{companyName}}

Bonjour {{clientFirstName}},

Le jour de votre activité « {{productName}} » approche.
Nous avons rendez-vous le {{date}} à {{timeSlot}}.

Nous n'avons pas encore reçu le formulaire des participants.

Pourriez-vous le compléter dès que possible en utilisant ce lien :
{{formLink}}

Ces informations (taille, pointure, etc.) nous permettent de préparer l'équipement adapté à chacun.
Sans elles, il nous est difficile d'anticiper correctement le matériel pour votre groupe.

⚠️ Sans ce formulaire complété avant l'activité, nous ne pouvons pas garantir de disposer de l'équipement parfaitement adapté pour tous les participants.

Si vous avez déjà rempli le formulaire récemment, vous pouvez ignorer ce message.

Si vous avez des questions, n'hésitez pas à nous contacter.

À très bientôt en plein air !

---
{{companyName}}
Site : {{companyWebsite}}
Email : {{companyEmail}}
Tél : {{companyPhone}}`,
        variables: JSON.stringify([
          'clientFirstName',
          'clientLastName',
          'productName',
          'date',
          'timeSlot',
          'formLink',
          'logo',
          'companyName',
          'companyWebsite',
          'companyEmail',
          'companyPhone'
        ]),
        userId: admin.id
      }
    });

    console.log('✅ Template email rappel formulaire créé');
  }

  // Créer ou mettre à jour le template de confirmation de réservation
  const existingConfirmationTemplate = await prisma.emailTemplate.findFirst({
    where: {
      type: 'booking_confirmation',
      userId: admin.id
    }
  });

  if (existingConfirmationTemplate) {
    await prisma.emailTemplate.update({
      where: { id: existingConfirmationTemplate.id },
      data: {
        type: 'booking_confirmation',
        name: 'Confirmation de réservation',
        subject: 'Ta réservation {{productName}} est confirmée !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo img { max-width: 250px; height: auto; }
    h2 { color: #1a5f7a; text-align: center; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .payment { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
    .btn { display: inline-block; padding: 12px 24px; background: #1a5f7a; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 12px 0; font-weight: bold; }
    .footer { font-size: 14px; color: #555; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="{{logo}}" alt="Logo {{companyName}}">
    </div>

    <h2>C'est confirmé ! 🎉</h2>

    <p>Salut {{clientFirstName}},</p>

    <p>Top ! Ta réservation pour <strong>{{productName}}</strong> est bien enregistrée.</p>

    <p><strong>📅 Rendez-vous le {{sessionDate}} à {{sessionStartTime}}</strong></p>

    <div class="warning">
      <p><strong>⚠️ Important :</strong></p>
      {{#postBookingMessage}}
      <p>{{postBookingMessage}}</p>
      {{/postBookingMessage}}
      {{#equipmentList}}
      <p><strong>Matériel à apporter :</strong></p>
      <p style="white-space: pre-line;">{{equipmentList}}</p>
      {{/equipmentList}}
    </div>

    <div class="payment">
      <p><strong>💰 Paiement :</strong></p>
      <p>Prix total : {{totalPrice}}€<br>
      Déjà payé : {{amountPaid}}€<br>
      Reste à régler : {{amountDue}}€</p>
    </div>

    <p style="text-align: center;">
      <a href="{{bookingLink}}" class="btn">📋 Voir ma réservation</a>
    </p>

    {{#wazeLink}}
    <p>🚗 <a href="{{wazeLink}}" target="_blank">Itinéraire Waze</a></p>
    {{/wazeLink}}

    {{#googleMapsLink}}
    <p>🗺️ <a href="{{googleMapsLink}}" target="_blank">Itinéraire Google Maps</a></p>
    {{/googleMapsLink}}

    <p>Une question ? N'hésite pas à me contacter !</p>

    <p>À très vite,<br>{{guideName}}</p>

    <div class="footer">
      <p><strong>{{companyName}}</strong></p>
      <p>
        🌐 <a href="{{companyWebsite}}">{{companyWebsite}}</a><br>
        📧 <a href="mailto:{{companyEmail}}">{{companyEmail}}</a><br>
        📞 <a href="tel:{{companyPhone}}">{{companyPhone}}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Salut {{clientFirstName}},

Top ! Ta réservation pour {{productName}} est bien enregistrée.

📅 Rendez-vous le {{sessionDate}} à {{sessionStartTime}}

⚠️ Important :
{{postBookingMessage}}

{{#equipmentList}}
Matériel à apporter :
{{equipmentList}}
{{/equipmentList}}

💰 Paiement :
Prix total : {{totalPrice}}€
Déjà payé : {{amountPaid}}€
Reste à régler : {{amountDue}}€

📋 Voir ma réservation : {{bookingLink}}

{{#wazeLink}}
🚗 Itinéraire Waze : {{wazeLink}}
{{/wazeLink}}

{{#googleMapsLink}}
🗺️ Itinéraire Google Maps : {{googleMapsLink}}
{{/googleMapsLink}}

Une question ? N'hésite pas à me contacter !

À très vite,
{{guideName}}

{{companyName}}
{{companyWebsite}}
{{companyEmail}}
{{companyPhone}}`,
        variables: JSON.stringify([
          'clientFirstName',
          'clientLastName',
          'clientEmail',
          'productName',
          'sessionDate',
          'sessionTimeSlot',
          'sessionStartTime',
          'guideName',
          'numberOfPeople',
          'totalPrice',
          'amountPaid',
          'amountDue',
          'bookingId',
          'bookingLink',
          'postBookingMessage',
          'equipmentList',
          'wazeLink',
          'googleMapsLink',
          'logo',
          'companyName',
          'companyWebsite',
          'companyEmail',
          'companyPhone'
        ]),
        userId: admin.id
      }
    });
    console.log('✅ Template email confirmation réservation mis à jour');
  } else {
    await prisma.emailTemplate.create({
      data: {
        type: 'booking_confirmation',
        name: 'Confirmation de réservation',
        subject: 'Ta réservation {{productName}} est confirmée !',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo img { max-width: 250px; height: auto; }
    h2 { color: #1a5f7a; text-align: center; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .payment { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
    .btn { display: inline-block; padding: 12px 24px; background: #1a5f7a; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 12px 0; font-weight: bold; }
    .footer { font-size: 14px; color: #555; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="{{logo}}" alt="Logo {{companyName}}">
    </div>

    <h2>C'est confirmé ! 🎉</h2>

    <p>Salut {{clientFirstName}},</p>

    <p>Top ! Ta réservation pour <strong>{{productName}}</strong> est bien enregistrée.</p>

    <p><strong>📅 Rendez-vous le {{sessionDate}} à {{sessionStartTime}}</strong></p>

    <div class="warning">
      <p><strong>⚠️ Important :</strong></p>
      {{#postBookingMessage}}
      <p>{{postBookingMessage}}</p>
      {{/postBookingMessage}}
      {{#equipmentList}}
      <p><strong>Matériel à apporter :</strong></p>
      <p style="white-space: pre-line;">{{equipmentList}}</p>
      {{/equipmentList}}
    </div>

    <div class="payment">
      <p><strong>💰 Paiement :</strong></p>
      <p>Prix total : {{totalPrice}}€<br>
      Déjà payé : {{amountPaid}}€<br>
      Reste à régler : {{amountDue}}€</p>
    </div>

    <p style="text-align: center;">
      <a href="{{bookingLink}}" class="btn">📋 Voir ma réservation</a>
    </p>

    {{#wazeLink}}
    <p>🚗 <a href="{{wazeLink}}" target="_blank">Itinéraire Waze</a></p>
    {{/wazeLink}}

    {{#googleMapsLink}}
    <p>🗺️ <a href="{{googleMapsLink}}" target="_blank">Itinéraire Google Maps</a></p>
    {{/googleMapsLink}}

    <p>Une question ? N'hésite pas à me contacter !</p>

    <p>À très vite,<br>{{guideName}}</p>

    <div class="footer">
      <p><strong>{{companyName}}</strong></p>
      <p>
        🌐 <a href="{{companyWebsite}}">{{companyWebsite}}</a><br>
        📧 <a href="mailto:{{companyEmail}}">{{companyEmail}}</a><br>
        📞 <a href="tel:{{companyPhone}}">{{companyPhone}}</a>
      </p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Salut {{clientFirstName}},

Top ! Ta réservation pour {{productName}} est bien enregistrée.

📅 Rendez-vous le {{sessionDate}} à {{sessionStartTime}}

⚠️ Important :
{{postBookingMessage}}

{{#equipmentList}}
Matériel à apporter :
{{equipmentList}}
{{/equipmentList}}

💰 Paiement :
Prix total : {{totalPrice}}€
Déjà payé : {{amountPaid}}€
Reste à régler : {{amountDue}}€

📋 Voir ma réservation : {{bookingLink}}

{{#wazeLink}}
🚗 Itinéraire Waze : {{wazeLink}}
{{/wazeLink}}

{{#googleMapsLink}}
🗺️ Itinéraire Google Maps : {{googleMapsLink}}
{{/googleMapsLink}}

Une question ? N'hésite pas à me contacter !

À très vite,
{{guideName}}

{{companyName}}
{{companyWebsite}}
{{companyEmail}}
{{companyPhone}}`,
        variables: JSON.stringify([
          'clientFirstName',
          'clientLastName',
          'clientEmail',
          'productName',
          'sessionDate',
          'sessionTimeSlot',
          'sessionStartTime',
          'guideName',
          'numberOfPeople',
          'totalPrice',
          'amountPaid',
          'amountDue',
          'bookingId',
          'bookingLink',
          'postBookingMessage',
          'equipmentList',
          'wazeLink',
          'googleMapsLink',
          'logo',
          'companyName',
          'companyWebsite',
          'companyEmail',
          'companyPhone'
        ]),
        userId: admin.id
      }
    });
    console.log('✅ Template email confirmation réservation créé');
  }

  // Créer ou mettre à jour le template de notification guide
  const existingGuideNotifTemplate = await prisma.emailTemplate.findFirst({
    where: {
      type: 'guide_notification',
      userId: admin.id
    }
  });

  if (existingGuideNotifTemplate) {
    await prisma.emailTemplate.update({
      where: { id: existingGuideNotifTemplate.id },
      data: {
        type: 'guide_notification',
        name: 'Notification guide (nouvelle réservation)',
        subject: '🔔 Nouvelle réservation - {{productName}} le {{sessionDate}}',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
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
    .summary {
      background: #f5f5f5;
      border-left: 4px solid #1976d2;
      padding: 12px 16px;
      margin: 20px 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .col {
      width: 48%;
      box-sizing: border-box;
    }
    .important {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px 16px;
      margin: 20px 0;
    }
    .amount {
      font-weight: bold;
      color: #1976d2;
    }
    a {
      color: #1976d2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    @media (max-width: 480px) {
      .col {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 200px; height: auto;" />
  </div>

  <p>Salut {{guideName}},</p>

  <p>Une nouvelle réservation vient d'être enregistrée pour ta session :</p>

  <div class="summary">
    <div class="col">
      <p><strong>Activité :</strong> {{productName}}</p>
      <p><strong>Date :</strong> {{sessionDate}}</p>
      <p><strong>Heure :</strong> {{sessionStartTime}}</p>
      <p><strong>Participants :</strong> {{numberOfPeople}}</p>
    </div>
    <div class="col">
      <p><strong>Client :</strong> {{clientFirstName}} {{clientLastName}}</p>
      <p><strong>Email :</strong> {{clientEmail}}</p>
      <p><strong>Téléphone :</strong> {{clientPhone}}</p>
    </div>
  </div>

  <div class="important">
    <p><strong>Paiement :</strong></p>
    <p>
      Prix total : <span class="amount">{{totalPrice}} €</span><br>
      Déjà payé : <span class="amount">{{amountPaid}} €</span><br>
      Reste à payer sur place : <span class="amount">{{amountDue}} €</span>
    </p>
  </div>

  <p><strong>Places restantes dans la session :</strong> {{remainingSpots}}</p>

</body>
</html>`,
        textContent: `Salut {{guideName}},

Une nouvelle réservation vient d'être enregistrée pour ta session :

Activité : {{productName}}
Date : {{sessionDate}}
Heure : {{sessionStartTime}}
Participants : {{numberOfPeople}}

Client : {{clientFirstName}} {{clientLastName}}
Email : {{clientEmail}}
Téléphone : {{clientPhone}}

Paiement :
- Prix total : {{totalPrice}} €
- Déjà payé : {{amountPaid}} €
- Reste à payer sur place : {{amountDue}} €

Places restantes dans la session : {{remainingSpots}}`,
        variables: JSON.stringify([
          'guideName',
          'clientFirstName',
          'clientLastName',
          'clientEmail',
          'clientPhone',
          'productName',
          'sessionDate',
          'sessionStartTime',
          'numberOfPeople',
          'totalPrice',
          'amountPaid',
          'amountDue',
          'bookingLink',
          'remainingSpots',
          'logo',
          'companyName'
        ]),
        userId: admin.id
      }
    });
    console.log('✅ Template email notification guide mis à jour');
  } else {
    await prisma.emailTemplate.create({
      data: {
        type: 'guide_notification',
        name: 'Notification guide (nouvelle réservation)',
        subject: '🔔 Nouvelle réservation - {{productName}} le {{sessionDate}}',
        htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
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
    .summary {
      background: #f5f5f5;
      border-left: 4px solid #1976d2;
      padding: 12px 16px;
      margin: 20px 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .col {
      width: 48%;
      box-sizing: border-box;
    }
    .important {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px 16px;
      margin: 20px 0;
    }
    .amount {
      font-weight: bold;
      color: #1976d2;
    }
    a {
      color: #1976d2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    @media (max-width: 480px) {
      .col {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="logo">
    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 200px; height: auto;" />
  </div>

  <p>Salut {{guideName}},</p>

  <p>Une nouvelle réservation vient d'être enregistrée pour ta session :</p>

  <div class="summary">
    <div class="col">
      <p><strong>Activité :</strong> {{productName}}</p>
      <p><strong>Date :</strong> {{sessionDate}}</p>
      <p><strong>Heure :</strong> {{sessionStartTime}}</p>
      <p><strong>Participants :</strong> {{numberOfPeople}}</p>
    </div>
    <div class="col">
      <p><strong>Client :</strong> {{clientFirstName}} {{clientLastName}}</p>
      <p><strong>Email :</strong> {{clientEmail}}</p>
      <p><strong>Téléphone :</strong> {{clientPhone}}</p>
    </div>
  </div>

  <div class="important">
    <p><strong>Paiement :</strong></p>
    <p>
      Prix total : <span class="amount">{{totalPrice}} €</span><br>
      Déjà payé : <span class="amount">{{amountPaid}} €</span><br>
      Reste à payer sur place : <span class="amount">{{amountDue}} €</span>
    </p>
  </div>

  <p><strong>Places restantes dans la session :</strong> {{remainingSpots}}</p>

</body>
</html>`,
        textContent: `Salut {{guideName}},

Une nouvelle réservation vient d'être enregistrée pour ta session :

Activité : {{productName}}
Date : {{sessionDate}}
Heure : {{sessionStartTime}}
Participants : {{numberOfPeople}}

Client : {{clientFirstName}} {{clientLastName}}
Email : {{clientEmail}}
Téléphone : {{clientPhone}}

Paiement :
- Prix total : {{totalPrice}} €
- Déjà payé : {{amountPaid}} €
- Reste à payer sur place : {{amountDue}} €

Places restantes dans la session : {{remainingSpots}}`,
        variables: JSON.stringify([
          'guideName',
          'clientFirstName',
          'clientLastName',
          'clientEmail',
          'clientPhone',
          'productName',
          'sessionDate',
          'sessionStartTime',
          'numberOfPeople',
          'totalPrice',
          'amountPaid',
          'amountDue',
          'bookingLink',
          'remainingSpots',
          'logo',
          'companyName'
        ]),
        userId: admin.id
      }
    });
    console.log('✅ Template email notification guide créé');
  }

  // Créer ou mettre à jour le template de confirmation de paiement
  const existingPaymentTemplate = await prisma.emailTemplate.findFirst({
    where: {
      type: 'payment_confirmation',
      userId: admin.id
    }
  });

  const paymentTemplateData = {
    type: 'payment_confirmation',
    name: 'Confirmation de paiement',
    subject: '✅ Paiement confirmé - {{productName}}',
    htmlContent: `<!DOCTYPE html>
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
    .success {
      background: #e8f5e9;
      border-left: 4px solid #43a047;
      padding: 12px 16px;
      margin: 20px 0;
    }
    .amount {
      font-weight: bold;
      color: #1976d2;
    }
    a {
      color: #1976d2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="logo">
    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 250px; height: auto;" />
  </div>

  <p>Bonjour {{clientFirstName}},</p>

  <p>Nous avons bien reçu ton paiement d'un montant de <span class="amount">{{amountPaid}} €</span>. 🎉</p>

  <div class="success">
    <p><strong>💳 Ton paiement est confirmé.</strong></p>
    <p>Un email de <strong>confirmation de réservation</strong> récapitule tous les détails de ton activité (horaires, lieu de rendez-vous, équipement, etc.).</p>
  </div>

  <p>Si tu ne retrouves pas cet email, pense à vérifier dans tes courriers indésirables ou promotions.</p>

  <p>On se réjouit de te retrouver sur le terrain !</p>

  <p>À bientôt,</p>

  <p><strong>L'équipe {{companyName}}</strong></p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

  <div class="signature" style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p>
      🌐 <a href="{{companyWebsite}}" target="_blank" style="color: #1976d2;">{{companyWebsite}}</a><br>
      📧 <a href="mailto:{{companyEmail}}" style="color: #1976d2;">{{companyEmail}}</a><br>
      📞 <a href="tel:{{companyPhone}}" style="color: #1976d2;">{{companyPhone}}</a>
    </p>
  </div>
</body>
</html>`,
    textContent: `{{companyName}}

Bonjour {{clientFirstName}},

Nous avons bien reçu ton paiement d'un montant de {{amountPaid}} €.

Ton paiement est maintenant confirmé.

Un email de confirmation de réservation récapitule tous les détails de ton activité (horaires, lieu de rendez-vous, équipement, etc.).

Si tu ne retrouves pas cet email, pense à vérifier dans tes courriers indésirables ou dans l'onglet "Promotions".

On se réjouit de te retrouver sur le terrain !

À bientôt,

L'équipe {{companyName}}

---
{{companyName}}
Site : {{companyWebsite}}
Email : {{companyEmail}}
Tél : {{companyPhone}}`,
    variables: JSON.stringify([
      'clientFirstName',
      'clientLastName',
      'amountPaid',
      'logo',
      'companyName',
      'companyWebsite',
      'companyEmail',
      'companyPhone'
    ]),
    userId: admin.id
  };

  if (existingPaymentTemplate) {
    await prisma.emailTemplate.update({
      where: { id: existingPaymentTemplate.id },
      data: paymentTemplateData
    });
    console.log('✅ Template email confirmation paiement mis à jour');
  } else {
    await prisma.emailTemplate.create({ data: paymentTemplateData });
    console.log('✅ Template email confirmation paiement créé');
  }

  // Créer ou mettre à jour le template de bon cadeau
  const existingGiftVoucherTemplate = await prisma.emailTemplate.findFirst({
    where: {
      type: 'gift_voucher',
      userId: admin.id
    }
  });

  const giftVoucherTemplateData = {
    type: 'gift_voucher',
    name: 'Bon cadeau',
    subject: '🎁 Tu as reçu un bon cadeau {{companyName}} !',
    htmlContent: `<!DOCTYPE html>
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
    .gift {
      background: #fff3e0;
      border-left: 4px solid #fb8c00;
      padding: 12px 16px;
      margin: 20px 0;
    }
    .amount {
      font-weight: bold;
      color: #fb8c00;
    }
    a {
      color: #1976d2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="logo">
    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 250px; height: auto;" />
  </div>

  <p>Bonjour {{clientFirstName}},</p>

  <p>Bonne nouvelle, tu as reçu un <strong>bon cadeau {{companyName}}</strong> 🎁</p>

  <div class="gift">
    <p><strong>Offert par :</strong> {{giftSender}}</p>
    <p><strong>Pour :</strong> {{giftRecipient}}</p>
    <p><strong>Montant :</strong> <span class="amount">{{giftAmount}} €</span></p>
    <p><strong>Message :</strong> "{{giftMessage}}"</p>
    <p><strong>Code cadeau :</strong> {{giftCode}}</p>
  </div>

  <p>Pour utiliser ce bon, il te suffit de choisir une activité sur notre site :</p>
  <p><a href="{{companyWebsite}}">{{companyWebsite}}</a></p>

  <p>Lors de ta réservation, indique simplement ton code cadeau : <strong>{{giftCode}}</strong>.</p>

  <p>On a hâte de te faire vivre une belle expérience en extérieur 🌿</p>

  <p>À bientôt,</p>

  <p><strong>L'équipe {{companyName}}</strong></p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

  <div class="signature" style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p>
      🌐 <a href="{{companyWebsite}}" target="_blank" style="color: #1976d2;">{{companyWebsite}}</a><br>
      📧 <a href="mailto:{{companyEmail}}" style="color: #1976d2;">{{companyEmail}}</a><br>
      📞 <a href="tel:{{companyPhone}}" style="color: #1976d2;">{{companyPhone}}</a>
    </p>
  </div>
</body>
</html>`,
    textContent: `{{companyName}}

Bonjour {{clientFirstName}},

Bonne nouvelle, tu as reçu un bon cadeau {{companyName}} !

Offert par : {{giftSender}}
Pour : {{giftRecipient}}
Montant : {{giftAmount}} €
Message : "{{giftMessage}}"
Code cadeau : {{giftCode}}

Pour utiliser ce bon, choisis une activité sur notre site :
{{companyWebsite}}

Lors de ta réservation, indique simplement ton code cadeau : {{giftCode}}.

On a hâte de te faire vivre une belle expérience en extérieur 🌿

À bientôt,

L'équipe {{companyName}}

---
{{companyName}}
Site : {{companyWebsite}}
Email : {{companyEmail}}
Tél : {{companyPhone}}`,
    variables: JSON.stringify([
      'clientFirstName',
      'giftSender',
      'giftRecipient',
      'giftAmount',
      'giftMessage',
      'giftCode',
      'logo',
      'companyName',
      'companyWebsite',
      'companyEmail',
      'companyPhone'
    ]),
    userId: admin.id
  };

  if (existingGiftVoucherTemplate) {
    await prisma.emailTemplate.update({
      where: { id: existingGiftVoucherTemplate.id },
      data: giftVoucherTemplateData
    });
    console.log('✅ Template email bon cadeau mis à jour');
  } else {
    await prisma.emailTemplate.create({ data: giftVoucherTemplateData });
    console.log('✅ Template email bon cadeau créé');
  }

  // Créer ou mettre à jour le template de rappel 24h
  const existingReminderTemplate = await prisma.emailTemplate.findFirst({
    where: {
      type: 'booking_reminder',
      userId: admin.id
    }
  });

  const reminderTemplateData = {
    type: 'booking_reminder',
    name: 'Rappel 24h avant l\'activité',
    subject: '⏰ Rappel - {{productName}} demain !',
    htmlContent: `<!DOCTYPE html>
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
    .amount {
      font-weight: bold;
      color: #1976d2;
    }
  </style>
</head>
<body>
  <div class="logo">
    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 250px; height: auto;" />
  </div>

  <p>Salut {{clientFirstName}},</p>

  <p>Petit rappel pour ton activité <strong>{{productName}}</strong> prévue le <strong>{{sessionDate}}</strong> à <strong>{{sessionStartTime}}</strong>.</p>

  <div class="payment">
    <h3>💳 Récapitulatif de ta réservation</h3>
    <p>
      <strong>Prix total :</strong>
      <span class="amount">{{totalPrice}} €</span>
      <strong> → Déjà payé :</strong>
      <span class="amount">{{amountPaid}} €</span>
    </p>
    <p>
      <strong>Reste à payer sur place :</strong>
      <span class="amount">{{amountDue}} €</span>
    </p>
  </div>

  <div class="warning">
    ⚠️ <strong>Important</strong> : si tu dois encore modifier des informations sur les participants, tu peux le faire via ce lien :<br>
    <a href="{{bookingLink}}">{{bookingLink}}</a><br>
    (modifications possibles jusqu'à la veille de l'activité).
  </div>

  <p>Pour que tout se passe au mieux, merci d'arriver environ 10 minutes avant l'heure du rendez-vous, le temps de te préparer tranquillement.</p>

  <p>
    <strong>Point de rendez-vous :</strong>
    <a href="{{googleMapsLink}}">Google Maps</a> /
    <a href="{{wazeLink}}">Waze</a>
  </p>

  <p><strong>Équipement à prévoir :</strong></p>
  <p>{{equipmentList}}</p>

  <p>On a hâte de te retrouver en plein air 😄</p>

  <p>À très bientôt,</p>

  <p><strong>L'équipe {{companyName}}</strong></p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

  <div class="signature" style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p>
      🌐 <a href="{{companyWebsite}}" target="_blank" style="color: #1976d2;">{{companyWebsite}}</a><br>
      📧 <a href="mailto:{{companyEmail}}" style="color: #1976d2;">{{companyEmail}}</a><br>
      📞 <a href="tel:{{companyPhone}}" style="color: #1976d2;">{{companyPhone}}</a>
    </p>
  </div>
</body>
</html>`,
    textContent: `{{companyName}}

Salut {{clientFirstName}},

Petit rappel pour ton activité {{productName}} prévue le {{sessionDate}} à {{sessionStartTime}}.

Récapitulatif de ta réservation :
- Prix total : {{totalPrice}} €
- Déjà payé : {{amountPaid}} €
- Reste à payer sur place : {{amountDue}} €

Si tu dois encore modifier des informations sur les participants, tu peux le faire ici :
{{bookingLink}}
(Modifications possibles jusqu'à la veille de l'activité.)

Pour que tout se passe au mieux, merci d'arriver environ 10 minutes avant l'heure du rendez-vous, le temps de te préparer tranquillement.

Point de rendez-vous :
- Google Maps : {{googleMapsLink}}
- Waze : {{wazeLink}}

Équipement à prévoir :
{{equipmentList}}

On a hâte de te retrouver en plein air 😄

À très bientôt,

L'équipe {{companyName}}

---
{{companyName}}
Site : {{companyWebsite}}
Email : {{companyEmail}}
Tél : {{companyPhone}}`,
    variables: JSON.stringify([
      'clientFirstName',
      'clientLastName',
      'productName',
      'sessionDate',
      'sessionStartTime',
      'numberOfPeople',
      'guideName',
      'totalPrice',
      'amountPaid',
      'amountDue',
      'postBookingMessage',
      'equipmentList',
      'wazeLink',
      'googleMapsLink',
      'bookingLink',
      'logo',
      'companyName',
      'companyWebsite',
      'companyEmail',
      'companyPhone'
    ]),
    userId: admin.id
  };

  if (existingReminderTemplate) {
    await prisma.emailTemplate.update({
      where: { id: existingReminderTemplate.id },
      data: reminderTemplateData
    });
    console.log('✅ Template email rappel 24h mis à jour');
  } else {
    await prisma.emailTemplate.create({ data: reminderTemplateData });
    console.log('✅ Template email rappel 24h créé');
  }

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
