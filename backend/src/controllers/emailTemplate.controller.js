import prisma from '../config/database.js';

/**
 * Récupérer tous les templates d'emails
 */
export const getAllTemplates = async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'asc' }
    });

    res.json({ templates });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer un template par son type
 */
export const getTemplateByType = async (req, res) => {
  try {
    const { type } = req.params;

    const template = await prisma.emailTemplate.findUnique({
      where: { type }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Erreur récupération template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer un nouveau template (ou remplacer l'existant)
 */
export const createTemplate = async (req, res) => {
  try {
    const { type, name, subject, htmlContent, textContent, variables, isActive } = req.body;

    // Vérifier si le type existe déjà
    const existing = await prisma.emailTemplate.findUnique({
      where: { type }
    });

    let template;

    if (existing) {
      // Si un template existe déjà, le remplacer (UPDATE)
      template = await prisma.emailTemplate.update({
        where: { type },
        data: {
          name,
          subject,
          htmlContent,
          textContent,
          variables: variables ? JSON.stringify(variables) : null,
          isActive: isActive !== undefined ? isActive : true
        }
      });
    } else {
      // Sinon, créer un nouveau template
      template = await prisma.emailTemplate.create({
        data: {
          type,
          name,
          subject,
          htmlContent,
          textContent,
          variables: variables ? JSON.stringify(variables) : null,
          isActive: isActive !== undefined ? isActive : true
        }
      });
    }

    res.status(201).json({ template });
  } catch (error) {
    console.error('Erreur création template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour un template
 */
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, htmlContent, textContent, variables, isActive } = req.body;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(htmlContent && { htmlContent }),
        ...(textContent !== undefined && { textContent }),
        ...(variables && { variables: JSON.stringify(variables) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ template });
  } catch (error) {
    console.error('Erreur mise à jour template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un template
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.emailTemplate.delete({
      where: { id }
    });

    res.json({ message: 'Template supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Initialiser les templates par défaut s'ils n'existent pas
 */
export const initializeDefaultTemplates = async (req, res) => {
  try {
    const defaultTemplates = [
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
  </style>
</head>
<body>
  <div class="logo">
    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 250px; height: auto;" />
  </div>

  <p>Bonjour {{clientFirstName}},</p>

  <p>Votre réservation est confirmée !</p>

  <p>Vous trouverez vos billets en pièce jointe.</p>

  <div class="warning">
    ⚠️ <strong>Important</strong>, vous devez <a href="{{bookingLink}}">remplir le formulaire</a> sur les participants ⚠️
  </div>

  <p>Pour que tout se passe au mieux, pense à arriver au moins 5 minutes avant l'heure de rendez-vous.</p>

  <p><strong>Point de rendez-vous :</strong> <a href="{{googleMapsLink}}">Google maps</a> / <a href="{{wazeLink}}">Waze</a></p>

  <p><strong>N'oublie pas d'emporter avec toi :</strong></p>

  <ul>
    <li>Des chaussures qui accrochent, comme des baskets, et prévois également des chaussures de rechange pour après l'activité.</li>
    <li>Ton maillot de bain (porté directement sous tous les vêtements)</li>
    <li>Une serviette de bain pour te sécher et te changer après le canyon.</li>
    <li>Une bouteille d'eau pour rester bien hydraté(e) tout au long de l'expérience.</li>
  </ul>

  <p>{{postBookingMessage}}</p>

  <p>Et surtout, amène avec toi toute la bonne humeur !</p>

  <p>Avec ça, on est sûr de passer un super moment ensemble. 😊</p>

  <p>À très bientôt !</p>

  <p>{{guideName}} (celui que tu devras chercher sur le parking)</p>
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

À très bientôt pour cette aventure inoubliable !

L'équipe {{companyName}}`
      },
      {
        type: 'booking_reminder',
        name: 'Rappel de réservation',
        subject: '🔔 Rappel - {{productName}} demain !',
        htmlContent: `<!DOCTYPE html>
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
    <p>Bonjour {{clientFirstName}} {{clientLastName}},</p>
    <p><strong>N'oubliez pas :</strong> Votre activité <strong>{{productName}}</strong> a lieu demain !</p>
    <p>📅 Date : {{sessionDate}}</p>
    <p>⏰ Heure : {{sessionStartTime}}</p>
    <p>👥 Guide : {{guideName}}</p>
    <p>À demain ! 🏔️</p>
  </div>
</body>
</html>`,
        textContent: `Bonjour {{clientFirstName}} {{clientLastName}},

Rappel : Votre activité {{productName}} a lieu demain !

Date : {{sessionDate}}
Heure : {{sessionStartTime}}
Guide : {{guideName}}

À demain ! 🏔️`
      },
      {
        type: 'payment_confirmation',
        name: 'Confirmation de paiement',
        subject: 'Paiement reçu - {{productName}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Paiement reçu</h1>
    </div>
    <div class="content">
      <p>Bonjour {{clientFirstName}},</p>
      <p>Nous avons bien reçu votre paiement de <strong>{{amountPaid}}€</strong> pour <strong>{{productName}}</strong>.</p>

      <div class="info-box">
        <h3>Détails du paiement</h3>
        <p><strong>Montant de ce paiement :</strong> {{amountPaid}}€</p>
        <p><strong>Total payé :</strong> {{totalPaid}}€</p>
        <p><strong>Prix total :</strong> {{totalPrice}}€</p>
        <p><strong>Montant restant :</strong> {{amountDue}}€</p>
      </div>

      <p>Merci pour votre confiance !</p>
      <p>L'équipe</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Bonjour {{clientFirstName}},

Nous avons bien reçu votre paiement de {{amountPaid}}€ pour {{productName}}.

DÉTAILS DU PAIEMENT
Montant de ce paiement : {{amountPaid}}€
Total payé : {{totalPaid}}€
Prix total : {{totalPrice}}€
Montant restant : {{amountDue}}€

Merci pour votre confiance !
L'équipe`
      },
      {
        type: 'gift_voucher',
        name: 'Bon cadeau',
        subject: 'Votre bon cadeau',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .voucher { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; border: 3px dashed #e74c3c; text-align: center; }
    .code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 Votre bon cadeau</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Voici votre bon cadeau !</p>

      <div class="voucher">
        <h2>BON CADEAU</h2>
        <p>Code :</p>
        <div class="code">XXXXXX</div>
        <p style="margin-top: 20px;">Montant : XX€</p>
      </div>

      <p>Pour utiliser ce bon cadeau, rendez-vous sur notre site de réservation et entrez le code lors de la réservation.</p>
      <p>Merci et à bientôt !</p>
    </div>
  </div>
</body>
</html>`,
        textContent: `Votre bon cadeau

Code : XXXXXX
Montant : XX€

Pour utiliser ce bon cadeau, rendez-vous sur notre site de réservation et entrez le code lors de la réservation.

Merci et à bientôt !`
      }
    ];

    const created = [];
    for (const template of defaultTemplates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { type: template.type }
      });

      if (!existing) {
        const newTemplate = await prisma.emailTemplate.create({
          data: template
        });
        created.push(newTemplate);
      }
    }

    res.json({
      message: `${created.length} template(s) créé(s)`,
      created
    });
  } catch (error) {
    console.error('Erreur initialisation templates:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les variables disponibles pour les templates
 */
export const getAvailableVariables = async (req, res) => {
  try {
    // Variables communes à tous les templates
    const commonVariables = [
      { key: '{{companyName}}', description: 'Nom de l\'entreprise' },
      { key: '{{companyEmail}}', description: 'Email de l\'entreprise' },
      { key: '{{companyPhone}}', description: 'Téléphone de l\'entreprise' },
      { key: '{{logo}}', description: 'Logo de l\'entreprise (URL)' }
    ];

    const variables = {
      booking_confirmation: [
        ...commonVariables,
        { key: '{{clientFirstName}}', description: 'Prénom du client' },
        { key: '{{clientLastName}}', description: 'Nom du client' },
        { key: '{{clientEmail}}', description: 'Email du client' },
        { key: '{{productName}}', description: 'Nom du produit/activité' },
        { key: '{{sessionDate}}', description: 'Date de la session' },
        { key: '{{sessionTimeSlot}}', description: 'Créneau horaire' },
        { key: '{{sessionStartTime}}', description: 'Heure de début' },
        { key: '{{guideName}}', description: 'Nom du guide' },
        { key: '{{numberOfPeople}}', description: 'Nombre de personnes' },
        { key: '{{totalPrice}}', description: 'Prix total' },
        { key: '{{amountPaid}}', description: 'Montant payé' },
        { key: '{{amountDue}}', description: 'Montant restant à payer' },
        { key: '{{bookingId}}', description: 'ID de la réservation' },
        { key: '{{bookingLink}}', description: 'Lien vers la réservation' },
        { key: '{{postBookingMessage}}', description: 'Message post-réservation' },
        { key: '{{wazeLink}}', description: 'Lien Waze' },
        { key: '{{googleMapsLink}}', description: 'Lien Google Maps' }
      ],
      booking_reminder: [
        ...commonVariables,
        { key: '{{clientFirstName}}', description: 'Prénom du client' },
        { key: '{{clientLastName}}', description: 'Nom du client' },
        { key: '{{productName}}', description: 'Nom du produit/activité' },
        { key: '{{sessionDate}}', description: 'Date de la session' },
        { key: '{{sessionStartTime}}', description: 'Heure de début' },
        { key: '{{guideName}}', description: 'Nom du guide' }
      ],
      payment_confirmation: [
        ...commonVariables,
        { key: '{{clientFirstName}}', description: 'Prénom du client' },
        { key: '{{clientLastName}}', description: 'Nom du client' },
        { key: '{{productName}}', description: 'Nom du produit/activité' },
        { key: '{{sessionDate}}', description: 'Date de la session' },
        { key: '{{amountPaid}}', description: 'Montant de ce paiement' },
        { key: '{{totalPaid}}', description: 'Total payé' },
        { key: '{{totalPrice}}', description: 'Prix total' },
        { key: '{{amountDue}}', description: 'Montant restant à payer' },
        { key: '{{isFullyPaid}}', description: 'Est entièrement payé (true/false)' }
      ]
    };

    res.json({ variables });
  } catch (error) {
    console.error('Erreur récupération variables:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
