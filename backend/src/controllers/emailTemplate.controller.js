import prisma from '../config/database.js';

/**
 * Récupérer tous les templates d'emails visibles par l'utilisateur
 * Logique : templates personnalisés de l'utilisateur + templates globaux non personnalisés
 */
export const getAllTemplates = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id; // Supporter les deux formats
    const userLogin = req.user.login || 'inconnu';

    console.log(`\n📋 getAllTemplates appelé par: ${userLogin} (${userId})`);

    // Récupérer les templates personnalisés de l'utilisateur
    const personalTemplates = await prisma.emailTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`   👤 Templates personnalisés: ${personalTemplates.length}`);
    personalTemplates.forEach(t => console.log(`      - ${t.type}: ${t.name}`));

    // Récupérer les templates globaux
    const globalTemplates = await prisma.emailTemplate.findMany({
      where: { userId: null },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`   🌍 Templates globaux: ${globalTemplates.length}`);

    // Identifier les types déjà personnalisés
    const personalizedTypes = new Set(personalTemplates.map(t => t.type));

    console.log(`   🔒 Types personnalisés (exclure du global): ${Array.from(personalizedTypes).join(', ') || 'aucun'}`);

    // Combiner : templates personnalisés + templates globaux non personnalisés
    const templates = [
      ...personalTemplates,
      ...globalTemplates.filter(t => !personalizedTypes.has(t.type))
    ];

    console.log(`   ✅ Total retourné: ${templates.length} templates`);
    templates.forEach(t => {
      const source = personalizedTypes.has(t.type) ? '📋 Personnalisé' : '🌍 Global';
      console.log(`      ${source} - ${t.type}: ${t.name}`);
    });
    console.log('');

    res.json({ templates });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer un template par son type
 * Logique : chercher d'abord le template personnalisé, sinon le template global
 */
export const getTemplateByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;

    // Chercher d'abord le template personnalisé de l'utilisateur
    let template = await prisma.emailTemplate.findFirst({
      where: {
        userId,
        type
      }
    });

    // Si pas trouvé, chercher le template global
    if (!template) {
      template = await prisma.emailTemplate.findFirst({
        where: {
          userId: null,
          type
        }
      });
    }

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
 * Créer ou mettre à jour un template (utilisé uniquement par les admins pour les templates globaux)
 */
export const createTemplate = async (req, res) => {
  try {
    const { type, name, subject, htmlContent, textContent, variables, isActive } = req.body;

    // Vérifier si un template global existe déjà pour ce type
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        userId: null,
        type
      }
    });

    let template;

    if (existing) {
      // Mettre à jour le template global
      template = await prisma.emailTemplate.update({
        where: { id: existing.id },
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
      // Créer un nouveau template global
      template = await prisma.emailTemplate.create({
        data: {
          userId: null, // Template global
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
 * Logique différente selon le rôle :
 * - ADMIN : Peut modifier les templates globaux directement (affecte tous les utilisateurs)
 * - GUIDE : Copy-on-write - crée une copie personnalisée sans affecter les autres
 */
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, htmlContent, textContent, variables, isActive } = req.body;
    const userId = req.user.userId || req.user.id; // Supporter les deux formats
    const userRole = req.user.role; // "admin" ou "guide"

    // LOGS DE DÉBOGAGE
    console.log('\n🔍 ===== MISE À JOUR TEMPLATE - DEBUG =====');
    console.log('req.user complet:', JSON.stringify(req.user, null, 2));
    console.log('userId récupéré:', userId);
    console.log('userRole récupéré:', userRole);
    console.log('Template ID à modifier:', id);
    console.log('==========================================\n');

    // Récupérer le template à modifier
    const originalTemplate = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!originalTemplate) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    console.log(`📋 Template actuel - userId: ${originalTemplate.userId === null ? 'NULL (global)' : originalTemplate.userId}`);

    let template;

    // ===== CAS 1 : Template global (userId = null) =====
    if (originalTemplate.userId === null) {

      // Si l'utilisateur est ADMIN, il peut modifier le template global directement
      if (userRole === 'admin') {
        console.log(`👑 ADMIN: Modification du template global ${originalTemplate.type}`);
        template = await prisma.emailTemplate.update({
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
      }
      // Si l'utilisateur est GUIDE, on fait du copy-on-write
      else {
        console.log(`📋 GUIDE: Copy-on-write du template ${originalTemplate.type} pour l'utilisateur ${userId}`);

        // Vérifier si une copie personnalisée existe déjà
        const existingPersonal = await prisma.emailTemplate.findFirst({
          where: {
            userId,
            type: originalTemplate.type
          }
        });

        if (existingPersonal) {
          // Mettre à jour la copie existante
          console.log(`   ✏️  Mise à jour de la copie personnalisée existante`);
          template = await prisma.emailTemplate.update({
            where: { id: existingPersonal.id },
            data: {
              ...(name && { name }),
              ...(subject && { subject }),
              ...(htmlContent && { htmlContent }),
              ...(textContent !== undefined && { textContent }),
              ...(variables && { variables: JSON.stringify(variables) }),
              ...(isActive !== undefined && { isActive })
            }
          });
        } else {
          // Créer une nouvelle copie personnalisée
          console.log(`   ✨ Création d'une nouvelle copie personnalisée`);
          template = await prisma.emailTemplate.create({
            data: {
              userId,
              type: originalTemplate.type,
              name: name || originalTemplate.name,
              subject: subject || originalTemplate.subject,
              htmlContent: htmlContent || originalTemplate.htmlContent,
              textContent: textContent !== undefined ? textContent : originalTemplate.textContent,
              variables: variables ? JSON.stringify(variables) : originalTemplate.variables,
              isActive: isActive !== undefined ? isActive : originalTemplate.isActive
            }
          });
        }
      }
    }
    // ===== CAS 2 : Template personnalisé =====
    else if (originalTemplate.userId === userId) {
      // Le template est déjà personnalisé pour cet utilisateur, le mettre à jour
      console.log(`📝 Mise à jour du template personnalisé ${originalTemplate.type}`);
      template = await prisma.emailTemplate.update({
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
    }
    // ===== CAS 3 : Template d'un autre utilisateur =====
    else {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier ce template' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Erreur mise à jour template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un template personnalisé
 * Si c'est un template global, on ne peut pas le supprimer (seulement les admins peuvent)
 * Si c'est un template personnalisé, on le supprime et l'utilisateur revient au template global
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Récupérer le template
    const template = await prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    // Vérifier que le template appartient à l'utilisateur
    if (template.userId === null) {
      return res.status(403).json({ error: 'Vous ne pouvez pas supprimer un template global' });
    }

    if (template.userId !== userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de supprimer ce template' });
    }

    // Supprimer le template personnalisé
    await prisma.emailTemplate.delete({
      where: { id }
    });

    res.json({ message: 'Template personnalisé supprimé avec succès. Vous utilisez maintenant le template global.' });
  } catch (error) {
    console.error('Erreur suppression template:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Initialiser les templates par défaut s'ils n'existent pas
 * Créer les templates globaux (userId = null)
 */
export const initializeDefaultTemplates = async (req, res) => {
  try {
    const defaultTemplates = [
      {
        type: 'booking_confirmation',
        name: 'Confirmation de réservation',
        subject: 'Confirmation de réservation - {{productName}}',
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de ta réservation – {{productName}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">

  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{logo}}" alt="Logo {{companyName}}" style="max-width: 250px; height: auto; display: block; margin: 0 auto;">
  </div>

  <p>Bonjour {{clientFirstName}},</p>

  <p>Ta réservation est bien confirmée pour <strong>{{productName}}</strong> 🎉  
  Rendez-vous le <strong>{{sessionDate}}</strong> à <strong>{{sessionStartTime}}</strong> !</p>

  <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 12px 16px; margin: 20px 0;">
    <h3 style="margin-top: 0;">💳 Récapitulatif de ta réservation</h3>
    <p><strong>Prix total :</strong> <span style="font-weight: bold; color: #1976d2;">{{totalPrice}} €</span></p>
    <p><strong>Déjà payé :</strong> <span style="font-weight: bold; color: #1976d2;">{{amountPaid}} €</span></p>
    <p><strong>Reste à payer sur place :</strong> <span style="font-weight: bold; color: #1976d2;">{{amountDue}} €</span></p>
  </div>

  <div style="background: #fff9c4; border-left: 4px solid #fbc02d; padding: 12px 16px; margin: 20px 0;">
    ⚠️ <strong>Important :</strong>  
    Si ce n’est pas déjà fait, pense à <a href="{{bookingLink}}" style="color: #1976d2;">remplir le formulaire des participants</a>.  
    Tu pourras encore le modifier jusqu’à la veille de l’activité.
  </div>

  <p>⏰ Merci d’arriver environ <strong>10 minutes avant</strong> l’heure du rendez-vous,  
  le temps de te préparer tranquillement avant de te changer.</p>

  <p><strong>📍 Point de rendez-vous :</strong><br>
    👉 <a href="{{googleMapsLink}}" style="color: #1976d2;">Voir sur Google Maps</a><br>
    👉 <a href="{{wazeLink}}" style="color: #1976d2;">Voir sur Waze</a>
  </p>

  <p><strong>N’oublie pas d’emporter avec toi :</strong></p>
  <ul style="margin: 10px 0; padding-left: 25px;">
    <li>Des chaussures qui accrochent (type baskets), + une paire de rechange pour après l'activité.</li>
    <li>Ton maillot de bain (déjà porté sous tes vêtements).</li>
    <li>Une serviette pour te sécher et te changer après le canyon.</li>
    <li>Une bouteille d’eau pour rester bien hydraté(e).</li>
  </ul>

  <p>Et surtout, amène ta bonne humeur 😄</p>

  <p>Avec tout ça, on est sûr de passer un super moment ensemble !</p>

  <p>À très bientôt,</p>

  <p><strong>{{guideName}}</strong><br>
  (celui que tu devras chercher sur le parking)</p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

  <div style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p>
      🌐 <a href="{{companyWebsite}}" target="_blank" style="color: #1976d2;">{{companyWebsite}}</a><br>
      📧 <a href="mailto:{{companyEmail}}" style="color: #1976d2;">{{companyEmail}}</a><br>
      📞 <a href="tel:{{companyPhone}}" style="color: #1976d2;">{{companyPhone}}</a>
    </p>
  </div>

</body>
</html>`,
        textContent: `Bonjour {{clientFirstName}},

Ta réservation est bien confirmée pour {{productName}} 🎉
📅 Rendez-vous le {{sessionDate}} à {{sessionStartTime}} !

💳 Récapitulatif de ta réservation :

Prix total : {{totalPrice}} €

Déjà payé : {{amountPaid}} €

Reste à payer sur place : {{amountDue}} €

⚠️ Important :
Si ce n’est pas déjà fait, pense à remplir le formulaire des participants ici :
{{bookingLink}}
Tu pourras encore le modifier jusqu’à la veille de l’activité.

⏰ Merci d’arriver environ 10 minutes avant l’heure du rendez-vous,
le temps de te préparer tranquillement avant de te changer.

📍 Point de rendez-vous :

Google Maps : {{googleMapsLink}}

Waze : {{wazeLink}}

À emporter avec toi :

Des chaussures qui accrochent (type baskets), + une paire de rechange pour après l’activité.

Ton maillot de bain (déjà porté sous tes vêtements).

Une serviette pour te sécher et te changer après le canyon.

Une bouteille d’eau pour rester bien hydraté(e).

Et surtout, n’oublie pas ta bonne humeur 😄
Avec tout ça, on est sûr de passer un super moment ensemble !

À très bientôt,
{{guideName}}
(celui que tu devras chercher sur le parking)

En cas de souci ou de retard : {{companyPhone}}
Site : {{companyWebsite}}
Mail : {{companyEmail}}

{{companyName}}`
      },
      {
        type: 'booking_reminder',
        name: 'Rappel de réservation',
        subject: '🔔 Rappel - {{productName}} demain !',
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de ton activité canyoning</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">


  <div style="text-align:center; margin-bottom:20px;">
    <img src="{{logo}}" alt="{{companyName}}" style="max-width:250px; height:auto;">
  </div>

  <p>Salut {{clientFirstName}},</p>

  <p>On se retrouve demain pour une super descente dans le canyon de <strong>{{productName}}</strong> 💦 !  
  Rendez-vous le <strong>{{sessionDate}}</strong> à <strong>{{sessionStartTime}}</strong> 🕘</p>

  <div style="background:#e3f2fd; border-left:4px solid #1976d2; padding:12px 16px; margin:20px 0;">
    <h3 style="margin-top:0;">💳 Récapitulatif de ta réservation</h3>
    <p><strong>Prix total :</strong> <span style="font-weight:bold; color:#1976d2;">{{totalPrice}} €</span></p>
    <p><strong>Déjà payé :</strong> <span style="font-weight:bold; color:#1976d2;">{{amountPaid}} €</span></p>
    <p><strong>Reste à payer sur place :</strong> <span style="font-weight:bold; color:#1976d2;">{{amountDue}} €</span></p>
  </div>

  <div style="background:#e8f5e9; border-left:4px solid #43a047; padding:12px 16px; margin:20px 0;">
    ⏰ Merci d’arriver environ <strong>10 minutes avant</strong> l’heure du rendez-vous,  
    le temps de te préparer tranquillement avant de te changer.
  </div>

  <p><strong>📍 Point de rendez-vous :</strong><br>
    👉 <a href="{{googleMapsLink}}" style="color:#1976d2;">Voir sur Google Maps</a><br>
    👉 <a href="{{wazeLink}}" style="color:#1976d2;">Voir sur Waze</a>
  </p>

  <p><strong>🧺 Pense à prendre :</strong></p>
  <ul style="margin:10px 0; padding-left:25px;">
    <li>Des chaussures qui accrochent (type baskets), + une paire de rechange.</li>
    <li>Ton maillot de bain (déjà porté sous tes vêtements).</li>
    <li>Une serviette et une bouteille d’eau.</li>
  </ul>

  <p>Et surtout, n’oublie pas ta bonne humeur 😄</p>

  <p>À demain !</p>

  <p><strong>{{guideName}}</strong><br>
  (celui que tu devras chercher sur le parking)</p>

  <p style="margin-top:20px;">S’il y a le moindre souci ou retard, tu peux m’appeler directement au <a href="tel:{{companyPhone}}" style="color:#1976d2;">{{companyPhone}}</a>.</p>

  <hr style="margin:30px 0; border:none; border-top:1px solid #ddd;">

  <div style="font-size:14px; color:#555; text-align:center;">
    <p><strong>{{companyName}}</strong></p>
    <p>
      🌐 <a href="{{companyWebsite}}" target="_blank" style="color:#1976d2;">{{companyWebsite}}</a><br>
      📧 <a href="mailto:{{companyEmail}}" style="color:#1976d2;">{{companyEmail}}</a><br>
      📞 <a href="tel:{{companyPhone}}" style="color:#1976d2;">{{companyPhone}}</a>
    </p>
  </div>

</body>
</html>`,
        textContent: `Rappel pour ton activité de demain !

Salut {{clientFirstName}},

On se retrouve demain pour une super descente dans le canyon de {{productName}} 💦
📅 Le {{sessionDate}} à {{sessionStartTime}} 🕘

💳 Récapitulatif de ta réservation :

Prix total : {{totalPrice}} €

Déjà payé : {{amountPaid}} €

Reste à payer sur place : {{amountDue}} €

⏰ Merci d’arriver environ 10 minutes avant l’heure du rendez-vous,
le temps de te préparer tranquillement avant de te changer.

📍 Point de rendez-vous :

Google Maps : {{googleMapsLink}}

Waze : {{wazeLink}}

🧺 Pense à prendre :

Des chaussures qui accrochent (type baskets), + une paire de rechange.

Ton maillot de bain (déjà porté sous tes vêtements).

Une serviette et une bouteille d’eau.

Et surtout, n’oublie pas ta bonne humeur 😄

À demain !

{{guideName}}
(celui que tu devras chercher sur le parking)

En cas de souci ou de retard, tu peux m’appeler au {{companyPhone}}.

{{companyName}}
🌐 {{companyWebsite}}
📧 {{companyEmail}}
📞 {{companyPhone}}`
      },
      {
        type: 'payment_confirmation',
        name: 'Confirmation de paiement',
        subject: 'Paiement reçu - {{productName}}',
        htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paiement confirmé – {{companyName}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">

  <!-- Logo -->
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{logo}}" alt="Logo {{companyName}}" style="max-width: 250px; height: auto; display: block; margin: 0 auto;">
  </div>

  <!-- Message principal -->
  <p>Bonjour {{clientFirstName}},</p>

  <p>Bonne nouvelle 🎉 ! Nous avons bien reçu ton paiement d’un montant de <strong style="color:#1976d2;">{{amountPaid}} €</strong>.</p>

  <div style="background-color: #e8f5e9; border-left: 4px solid #43a047; padding: 12px 16px; margin: 20px 0;">
    💳 <strong>Ton paiement est confirmé.</strong><br>
    Tu recevras (ou as peut-être déjà reçu) un mail de <strong>confirmation de réservation</strong> avec tous les détails pratiques :  
    lieu, horaire, matériel à prévoir, et toutes les infos utiles pour le jour J.
  </div>

  <p>Merci encore pour ta confiance 🙏</p>

  <p>On se retrouve très bientôt pour partager un super moment en canyon 😄</p>

  <p>À très vite,</p>

  <p><strong>L’équipe {{companyName}}</strong></p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

  <!-- Signature -->
  <div style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p>
      🌐 <a href="{{companyWebsite}}" target="_blank" style="color:#1976d2;">{{companyWebsite}}</a><br>
      📧 <a href="mailto:{{companyEmail}}" style="color:#1976d2;">{{companyEmail}}</a><br>
      📞 <a href="tel:{{companyPhone}}" style="color:#1976d2;">{{companyPhone}}</a>
    </p>
  </div>

</body>
</html>`,
        textContent: `Bonjour {{clientFirstName}},

Bonne nouvelle 🎉 !
Nous avons bien reçu ton paiement d’un montant de {{amountPaid}} €.

💳 Ton paiement est confirmé.
Tu recevras (ou as peut-être déjà reçu) un mail de confirmation de réservation avec tous les détails pratiques :
le lieu, l’horaire, le matériel à prévoir et toutes les infos utiles pour le jour J.

Merci encore pour ta confiance 🙏
On se retrouve très bientôt pour partager un super moment en canyon 😄

À très vite,
L’équipe {{companyName}}

🌐 {{companyWebsite}}
📧 {{companyEmail}}
📞 {{companyPhone}}`
      },
      {
        type: 'gift_voucher',
        name: 'Bon cadeau',
        subject: 'Votre bon cadeau',
        htmlContent: `
<!DOCTYPE html>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ton bon cadeau – {{companyName}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
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
  <!-- Logo -->
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{logo}}" alt="Logo {{companyName}}" style="max-width: 250px; height: auto; display: block; margin: 0 auto;">
  </div>

  <!-- Message principal -->
  <p>Bonjour {{clientFirstName}},</p>

  <p>Merci pour ton achat 🎉  
  Ton <strong>bon cadeau d’un montant de {{totalPrice}} €</strong> est prêt à être offert ! 🥳</p>

  <div style="background-color: #e3f2fd; border-left: 4px solid #1976d2; padding: 12px 16px; margin: 20px 0;">
    🎁 <strong>Ton bon cadeau est en pièce jointe</strong> (format PDF imprimable).  
    Tu peux l’imprimer, l’envoyer par mail ou le garder pour plus tard 😉  
  </div>

  <p>💡 Ce bon est <strong>valable pendant 2 ans</strong> à compter de la date d’achat.  
  Il est utilisable sur toutes les activités disponibles sur notre site :</p>

  <p style="text-align:center;">
    🌐 <a href="{{companyWebsite}}" target="_blank">{{companyWebsite}}</a>
  </p>

  <div style="background-color: #e8f5e9; border-left: 4px solid #43a047; padding: 12px 16px; margin: 20px 0;">
    ✅ <strong>Pour l’utiliser :</strong><br>
    - Rends-toi sur notre site internet.<br>
    - Choisis l’activité que tu veux réserver.<br>
    - Au moment du paiement, saisis ton <strong>code cadeau :</strong> <span style="font-weight:bold; color:#1976d2;">{{giftCode}}</span> 🎟️
  </div>

  <p>Le montant du bon sera automatiquement déduit du total de la réservation.  
  Simple, rapide, et idéal pour offrir une expérience inoubliable en canyoning 😄</p>

  <p>À très bientôt dans les canyons,</p>

  <p><strong>L’équipe {{companyName}}</strong></p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

  <!-- Signature -->
  <div style="font-size: 14px; color: #555; text-align: center;">
    <p><strong>{{companyName}}</strong></p>
    <p>
      🌐 <a href="{{companyWebsite}}" target="_blank">{{companyWebsite}}</a><br>
      📧 <a href="mailto:{{companyEmail}}">{{companyEmail}}</a><br>
      📞 <a href="tel:{{companyPhone}}">{{companyPhone}}</a>
    </p>
  </div>
</body>
</html>`,
        textContent: `Bonjour {{clientFirstName}},

Merci pour ton achat 🎉
Ton bon cadeau d’un montant de {{totalPrice}} € est prêt à être offert 🥳

🎁 Le bon cadeau est en pièce jointe (format PDF imprimable).
Tu peux l’imprimer, l’envoyer par mail ou simplement le garder pour plus tard.

💡 Ce bon est valable 2 ans à compter de la date d’achat,
et il peut être utilisé sur toutes les activités disponibles sur notre site :
👉 {{companyWebsite}}

✅ Pour l’utiliser :

Va sur notre site internet

Choisis l’activité que tu veux réserver

Au moment du paiement, entre ton code cadeau : {{giftCode}}

Le montant du bon sera automatiquement déduit du total à payer.

Merci encore pour ta confiance 🙏
Ce bon cadeau va sûrement faire un(e) heureux(se) ! 😄

À très bientôt dans les canyons,
L'équipe {{companyName}}

🌐 {{companyWebsite}}
📧 {{companyEmail}}
📞 {{companyPhone}}`
      },
      {
        type: 'guide_notification',
        name: 'Notification de réservation au guide',
        subject: 'Nouvelle réservation - {{productName}} le {{sessionDate}}',
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
    .highlight {
      font-weight: bold;
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

  <p>👋 Salut {{guideName}},</p>

  <p>Une nouvelle réservation vient d'être enregistrée pour ta session :</p>

  <div class="summary">
    <div class="col">
      <p><strong>🧗 Activité :</strong> {{productName}}</p>
      <p><strong>📅 Date :</strong> {{sessionDate}}</p>
      <p><strong>🕘 Heure :</strong> {{sessionStartTime}}</p>
      <p><strong>👥 Participants :</strong> {{numberOfPeople}}</p>
    </div>
    <div class="col">
      <p><strong>👤 Client :</strong> {{clientFirstName}} {{clientLastName}}</p>
      <p><strong>📧 Email :</strong> {{clientEmail}}</p>
      <p><strong>📞 Téléphone :</strong> {{clientPhone}}</p>
    </div>
  </div>

  <div class="important">
    <p><strong>💳 Paiement :</strong></p>
    <p>Prix total : <span class="amount">{{totalPrice}} €</span><br>
    Déjà payé : <span class="amount">{{amountPaid}} €</span><br>
    Reste à payer sur place : <span class="amount">{{amountDue}} €</span></p>
  </div>

  <p><strong>📊 Places restantes dans la session :</strong> {{remainingSpots}}</p>

  <p><strong>🔗 Lien vers la fiche réservation :</strong> <a href="{{bookingAdminLink}}" style="color: #1976d2;">Ouvrir dans le back-office</a></p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

  <p style="font-size: 13px; color: #777;">Email automatique – {{companyName}}</p>
</body>
</html>`,
        textContent: `Nouvelle réservation

Bonjour {{guideName}},

Une nouvelle réservation a été effectuée pour votre session.

DÉTAILS DE LA SESSION
Activité : {{productName}}
Date : {{sessionDate}}
Créneau : {{sessionTimeSlot}} - {{sessionStartTime}}

INFORMATIONS CLIENT
Nom : {{clientFirstName}} {{clientLastName}}
Email : {{clientEmail}}
Téléphone : {{clientPhone}}
Nombre de personnes : {{numberOfPeople}}

INFORMATIONS DE PAIEMENT
Prix total : {{totalPrice}}€
Montant payé : {{amountPaid}}€
Reste à payer : {{amountDue}}€

Places restantes : {{remainingSpots}}
Lien vers la réservation : {{bookingAdminLink}}

Bonne session !
{{companyName}}`
      }
    ];

    const created = [];
    for (const template of defaultTemplates) {
      // Vérifier si un template global existe déjà pour ce type
      const existing = await prisma.emailTemplate.findFirst({
        where: {
          userId: null,
          type: template.type
        }
      });

      if (!existing) {
        const newTemplate = await prisma.emailTemplate.create({
          data: {
            ...template,
            userId: null // Template global
          }
        });
        created.push(newTemplate);
      }
    }

    res.json({
      message: `${created.length} template(s) global(aux) créé(s)`,
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
      ],
      gift_voucher: [
        ...commonVariables,
        { key: '{{clientFirstName}}', description: 'Prénom du client' },
        { key: '{{giftCode}}', description: 'Code du bon cadeau' },
        { key: '{{totalPrice}}', description: 'Montant du bon cadeau' },
        { key: '{{companyWebsite}}', description: 'Site web de l\'entreprise' }
      ],
      guide_notification: [
        ...commonVariables,
        { key: '{{guideName}}', description: 'Nom du guide' },
        { key: '{{productName}}', description: 'Nom du produit/activité' },
        { key: '{{sessionDate}}', description: 'Date de la session' },
        { key: '{{sessionTimeSlot}}', description: 'Créneau horaire' },
        { key: '{{sessionStartTime}}', description: 'Heure de début' },
        { key: '{{clientFirstName}}', description: 'Prénom du client' },
        { key: '{{clientLastName}}', description: 'Nom du client' },
        { key: '{{clientEmail}}', description: 'Email du client' },
        { key: '{{clientPhone}}', description: 'Téléphone du client' },
        { key: '{{numberOfPeople}}', description: 'Nombre de participants' },
        { key: '{{totalPrice}}', description: 'Prix total' },
        { key: '{{amountPaid}}', description: 'Montant déjà payé' },
        { key: '{{amountDue}}', description: 'Reste à payer sur place' },
        { key: '{{remainingSpots}}', description: 'Places restantes dans la session' },
        { key: '{{bookingAdminLink}}', description: 'Lien vers la réservation (back-office)' }
      ]
    };

    res.json({ variables });
  } catch (error) {
    console.error('Erreur récupération variables:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
