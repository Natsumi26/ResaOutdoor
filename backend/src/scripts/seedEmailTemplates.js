import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  {
    type: 'booking_confirmation',
    name: 'Confirmation de réservation',
    subject: 'Confirmation de réservation - {{productName}}',
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
    <p>Bonjour {{clientFirstName}} {{clientLastName}},</p>

    <p>Votre réservation a été confirmée avec succès ! Nous sommes ravis de vous accueillir pour cette aventure.</p>

    <div class="info-box">
      <h3>📋 Détails de votre réservation</h3>

      <div class="info-row">
        <span class="label">Activité :</span>
        <span class="value">{{productName}}</span>
      </div>

      <div class="info-row">
        <span class="label">Date :</span>
        <span class="value">{{sessionDate}}</span>
      </div>

      <div class="info-row">
        <span class="label">Créneau :</span>
        <span class="value">{{sessionTimeSlot}} - {{sessionStartTime}}</span>
      </div>

      <div class="info-row">
        <span class="label">Guide :</span>
        <span class="value">{{guideName}}</span>
      </div>

      <div class="info-row">
        <span class="label">Nombre de personnes :</span>
        <span class="value">{{numberOfPeople}}</span>
      </div>

      <div class="info-row">
        <span class="label">Prix total :</span>
        <span class="value total">{{totalPrice}}€</span>
      </div>

      <div class="info-row">
        <span class="label">Montant payé :</span>
        <span class="value" style="color: #10b981;">{{amountPaid}}€</span>
      </div>

      <div class="info-row">
        <span class="label">Reste à payer :</span>
        <span class="value" style="color: #ef4444;">{{amountDue}}€</span>
      </div>
    </div>

    <div class="info-box">
      <h3>ℹ️ Informations importantes</h3>
      <p>{{postBookingMessage}}</p>
    </div>

    <div class="info-box">
      <h3>📍 Point de rendez-vous</h3>
      <p>Retrouvez-nous au point de rendez-vous :</p>
      <a href="{{wazeLink}}" class="button">📱 Ouvrir dans Waze</a>
      <a href="{{googleMapsLink}}" class="button">🗺️ Ouvrir dans Google Maps</a>
    </div>

    <div class="info-box">
      <h3>Gérer sa réservation</h3>
      <p>Vous pouvez visualiser et compléter votre réservation en cliquant sur ce lien :</p>
      <a href="{{bookingLink}}" class="button">📋 Ma réservation</a>
    </div>

    <div class="info-box">
      <h3>📞 Contact</h3>
      <p>Pour toute question, n'hésitez pas à nous contacter :</p>
      <p>Email: contact@canyonlife.fr</p>
    </div>

    <p>À très bientôt pour cette aventure inoubliable !</p>
    <p>L'équipe Canyon Life 🌊</p>
  </div>

  <div class="footer">
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    <p>© 2025 Canyon Life - Tous droits réservés</p>
  </div>
</body>
</html>`,
    textContent: `Bonjour {{clientFirstName}} {{clientLastName}},

Votre réservation a été confirmée avec succès !

DÉTAILS DE VOTRE RÉSERVATION
-----------------------------
Activité: {{productName}}
Date: {{sessionDate}}
Créneau: {{sessionTimeSlot}} - {{sessionStartTime}}
Guide: {{guideName}}
Nombre de personnes: {{numberOfPeople}}
Prix total: {{totalPrice}}€
Montant payé: {{amountPaid}}€
Reste à payer: {{amountDue}}€

INFORMATIONS IMPORTANTES
{{postBookingMessage}}

Lien de votre réservation: {{bookingLink}}

À très bientôt pour cette aventure inoubliable !

L'équipe Canyon Life`,
    isActive: true
  },
  {
    type: 'booking_reminder',
    name: 'Rappel de réservation (24h avant)',
    subject: '🔔 Rappel - {{productName}} demain !',
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
    }
    .header {
      background: #f59e0b;
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #fffbeb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .reminder-box {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }
    .info-row {
      padding: 8px 0;
      font-size: 16px;
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
    <h1>⏰ Rappel - Votre activité est demain !</h1>
    <p>Canyon Life</p>
  </div>

  <div class="content">
    <p>Bonjour {{clientFirstName}} {{clientLastName}},</p>

    <p><strong>N'oubliez pas :</strong> Votre activité <strong>{{productName}}</strong> a lieu demain !</p>

    <div class="reminder-box">
      <h3>📋 Rappel de votre réservation</h3>

      <div class="info-row">
        <strong>📅 Date :</strong> {{sessionDate}}
      </div>

      <div class="info-row">
        <strong>⏰ Heure :</strong> {{sessionStartTime}}
      </div>

      <div class="info-row">
        <strong>👥 Guide :</strong> {{guideName}}
      </div>

      <div class="info-row">
        <strong>🏔️ Activité :</strong> {{productName}}
      </div>
    </div>

    <div class="reminder-box">
      <h3>💡 Conseils pour demain</h3>
      <ul>
        <li>Prévoyez d'arriver 10 minutes avant l'heure de départ</li>
        <li>Apportez de l'eau et une collation</li>
        <li>Portez des vêtements adaptés à l'activité</li>
        <li>N'oubliez pas votre appareil photo !</li>
      </ul>
    </div>

    <p>Nous avons hâte de vous accueillir demain pour cette belle aventure ! 🏔️</p>
    <p>L'équipe Canyon Life 🌊</p>
  </div>

  <div class="footer">
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    <p>© 2025 Canyon Life - Tous droits réservés</p>
  </div>
</body>
</html>`,
    textContent: `Bonjour {{clientFirstName}} {{clientLastName}},

N'oubliez pas : Votre activité {{productName}} a lieu demain !

RAPPEL DE VOTRE RÉSERVATION
-----------------------------
Date : {{sessionDate}}
Heure : {{sessionStartTime}}
Guide : {{guideName}}
Activité : {{productName}}

Conseils pour demain :
- Prévoyez d'arriver 10 minutes avant l'heure de départ
- Apportez de l'eau et une collation
- Portez des vêtements adaptés à l'activité

À demain ! 🏔️

L'équipe Canyon Life`,
    isActive: true
  },
  {
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
    <p>Bonjour {{clientFirstName}} {{clientLastName}},</p>

    <p>Nous avons bien reçu votre paiement de <strong>{{amountPaid}}€</strong>.</p>

    <div class="amount">{{amountPaid}}€</div>

    <div class="success-badge">
      ✓ Paiement enregistré
    </div>

    <div class="info-box">
      <h3>📋 Récapitulatif de votre réservation</h3>

      <div class="info-row">
        <span class="label">Activité :</span>
        <span class="value">{{productName}}</span>
      </div>

      <div class="info-row">
        <span class="label">Date :</span>
        <span class="value">{{sessionDate}}</span>
      </div>

      <div class="info-row">
        <span class="label">Nombre de personnes :</span>
        <span class="value">{{numberOfPeople}}</span>
      </div>
    </div>

    <div class="info-box">
      <h3>💰 Détails du paiement</h3>

      <div class="info-row">
        <span class="label">Montant de ce paiement :</span>
        <span class="value" style="color: #10b981; font-weight: bold;">{{amountPaid}}€</span>
      </div>

      <div class="info-row">
        <span class="label">Prix total :</span>
        <span class="value">{{totalPrice}}€</span>
      </div>

      <div class="info-row">
        <span class="label">Total payé :</span>
        <span class="value" style="color: #10b981;">{{totalPaid}}€</span>
      </div>

      <div class="info-row">
        <span class="label">Reste à payer :</span>
        <span class="value" style="color: #ef4444;">{{amountDue}}€</span>
      </div>
    </div>

    <p>Merci pour votre confiance !</p>
    <p>L'équipe Canyon Life 🌊</p>
  </div>

  <div class="footer">
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    <p>© 2025 Canyon Life - Tous droits réservés</p>
  </div>
</body>
</html>`,
    textContent: `Bonjour {{clientFirstName}} {{clientLastName}},

Nous avons bien reçu votre paiement de {{amountPaid}}€.

RÉCAPITULATIF DE VOTRE RÉSERVATION
-----------------------------------
Activité: {{productName}}
Date: {{sessionDate}}
Nombre de personnes: {{numberOfPeople}}

DÉTAILS DU PAIEMENT
-------------------
Montant de ce paiement: {{amountPaid}}€
Prix total: {{totalPrice}}€
Total payé: {{totalPaid}}€
Reste à payer: {{amountDue}}€

Merci pour votre confiance !

L'équipe Canyon Life`,
    isActive: true
  }
];

async function seedEmailTemplates() {
  console.log('🌱 Début du seed des templates d\'emails...');

  for (const template of emailTemplates) {
    try {
      // Vérifier si le template existe déjà
      const existing = await prisma.emailTemplate.findUnique({
        where: { type: template.type }
      });

      if (existing) {
        console.log(`⚠️  Template "${template.type}" existe déjà, mise à jour...`);
        await prisma.emailTemplate.update({
          where: { type: template.type },
          data: template
        });
        console.log(`✅ Template "${template.type}" mis à jour`);
      } else {
        await prisma.emailTemplate.create({
          data: template
        });
        console.log(`✅ Template "${template.type}" créé`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour le template "${template.type}":`, error.message);
    }
  }

  console.log('🎉 Seed terminé !');
}

seedEmailTemplates()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
