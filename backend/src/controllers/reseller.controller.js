import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Récupérer tous les revendeurs
export const getAllResellers = async (req, res) => {
  try {
    const resellers = await prisma.reseller.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    res.json({ resellers });
  } catch (error) {
    console.error('Erreur lors de la récupération des revendeurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer un nouveau revendeur
export const createReseller = async (req, res) => {
  try {
    const { name, email, phone, website, commission, notes } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom du revendeur est requis' });
    }

    const reseller = await prisma.reseller.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        commission: commission ? parseFloat(commission) : null,
        notes: notes?.trim() || null
      }
    });

    res.status(201).json({ reseller });
  } catch (error) {
    console.error('Erreur lors de la création du revendeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Mettre à jour un revendeur
export const updateReseller = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, website, commission, notes } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Le nom du revendeur est requis' });
    }

    const reseller = await prisma.reseller.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        commission: commission ? parseFloat(commission) : null,
        notes: notes?.trim() || null
      }
    });

    res.json({ reseller });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }
    console.error('Erreur lors de la mise à jour du revendeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer un revendeur
export const deleteReseller = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.reseller.delete({
      where: { id }
    });

    res.json({ message: 'Revendeur supprimé avec succès' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }
    console.error('Erreur lors de la suppression du revendeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
