import prisma from '../config/database.js';

/**
 * Copie tous les templates d'email d'un utilisateur source vers un nouvel utilisateur
 * @param {string} sourceUserId - ID de l'utilisateur source (généralement le super_admin)
 * @param {string} targetUserId - ID du nouvel utilisateur
 */
export const copyEmailTemplates = async (sourceUserId, targetUserId) => {
  try {
    console.log(`📧 Copie des templates email de ${sourceUserId} vers ${targetUserId}...`);

    // Récupérer tous les templates de l'utilisateur source
    const sourceTemplates = await prisma.emailTemplate.findMany({
      where: { userId: sourceUserId }
    });

    if (sourceTemplates.length === 0) {
      console.warn('⚠️ Aucun template source trouvé. Les templates par défaut seront créés lors du premier seed.');
      return;
    }

    // Copier chaque template pour le nouvel utilisateur
    const copiedTemplates = await Promise.all(
      sourceTemplates.map(template =>
        prisma.emailTemplate.create({
          data: {
            type: template.type,
            name: template.name,
            subject: template.subject,
            htmlContent: template.htmlContent,
            textContent: template.textContent,
            variables: template.variables,
            userId: targetUserId
          }
        })
      )
    );

    console.log(`✅ ${copiedTemplates.length} templates email copiés avec succès pour le nouvel utilisateur`);
    return copiedTemplates;
  } catch (error) {
    console.error('❌ Erreur lors de la copie des templates email:', error);
    throw error;
  }
};

/**
 * Obtient l'ID du super_admin pour utiliser ses templates comme source
 */
export const getSuperAdminId = async () => {
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'super_admin' },
    orderBy: { createdAt: 'asc' }
  });

  if (!superAdmin) {
    throw new Error('Aucun super_admin trouvé dans la base de données');
  }

  return superAdmin.id;
};
