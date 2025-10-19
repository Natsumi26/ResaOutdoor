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
 * Créer un nouveau template
 */
export const createTemplate = async (req, res) => {
  try {
    const { type, name, subject, htmlContent, textContent, variables } = req.body;

    // Vérifier si le type existe déjà
    const existing = await prisma.emailTemplate.findUnique({
      where: { type }
    });

    if (existing) {
      return res.status(400).json({ error: 'Un template avec ce type existe déjà' });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        type,
        name,
        subject,
        htmlContent,
        textContent,
        variables: variables ? JSON.stringify(variables) : null
      }
    });

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
 * Obtenir les variables disponibles pour les templates
 */
export const getAvailableVariables = async (req, res) => {
  try {
    const variables = {
      booking_confirmation: [
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
        { key: '{{clientFirstName}}', description: 'Prénom du client' },
        { key: '{{clientLastName}}', description: 'Nom du client' },
        { key: '{{productName}}', description: 'Nom du produit/activité' },
        { key: '{{sessionDate}}', description: 'Date de la session' },
        { key: '{{sessionStartTime}}', description: 'Heure de début' },
        { key: '{{guideName}}', description: 'Nom du guide' }
      ],
      payment_confirmation: [
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
