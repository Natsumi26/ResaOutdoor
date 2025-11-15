import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendPasswordResetEmail, sendTwoFactorCode } from '../services/email.service.js';

export const login = async (req, res, next) => {
  try {
    const { login, password, deviceToken } = req.body;

    if (!login || !password) {
      throw new AppError('Login et mot de passe requis', 400);
    }

    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        email: true,
        role: true,
        teamName: true,
        stripeAccount: true,
        paymentMode: true,
        depositType: true,
        depositAmount: true,
        practiceActivities: true,
        confidentialityPolicy: true,
        twoFactorEnabled: true
      }
    });

    if (!user) {
      throw new AppError('Identifiants incorrects', 401);
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Identifiants incorrects', 401);
    }

    // Vérifier si un appareil de confiance existe et est valide
    let trustedDevice = null;
    if (deviceToken && user.twoFactorEnabled) {
      trustedDevice = await prisma.trustedDevice.findUnique({
        where: { deviceToken },
      });

      // Vérifier que le device appartient à l'utilisateur et n'est pas expiré
      if (trustedDevice && trustedDevice.userId === user.id && new Date() < trustedDevice.expiresAt) {
        // Mettre à jour la date de dernière utilisation
        await prisma.trustedDevice.update({
          where: { id: trustedDevice.id },
          data: { lastUsedAt: new Date() }
        });
      } else {
        trustedDevice = null;
      }
    }

    // Si le 2FA est activé, envoyer un code par email (sauf si appareil de confiance)
    if (user.twoFactorEnabled && user.email && !trustedDevice) {
      // Générer un code à 6 chiffres
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Générer un token temporaire pour associer la session
      const tempToken = crypto.randomBytes(32).toString('hex');

      // Créer l'entrée dans la base de données (expire dans 10 minutes)
      await prisma.twoFactorCode.create({
        data: {
          userId: user.id,
          code,
          email: user.email,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          verified: false,
          attempts: 0,
          tempToken
        }
      });

      // Envoyer le code par email
      await sendTwoFactorCode(user.email, code, user.login);

      return res.json({
        success: true,
        requiresTwoFactor: true,
        tempToken,
        message: 'Un code de vérification a été envoyé à votre email'
      });
    }

    // Génération du token JWT (si pas de 2FA ou pas d'email)
    const token = jwt.sign(
      {
        userId: user.id,
        login: user.login,
        role: user.role,
        teamName: user.teamName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Réponse (sans le mot de passe)
    const { password: _, twoFactorEnabled: __, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        login: true,
        email: true,
        role: true,
        teamName: true,
        stripeAccount: true,
        createdAt: true,
        paymentMode: true,
        depositType: true,
        depositAmount: true,
        practiceActivities: true,
        confidentialityPolicy:true
      }
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const superLogin = async (req, res) => {
  const { login, superPassword } = req.body;

  if (superPassword !== process.env.SUPER_ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, error: 'Mot de passe super admin invalide' });
  }

  const user = await prisma.user.findUnique({ 
    where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        email: true,
        role: true,
        teamName: true,
        stripeAccount: true,
        paymentMode: true,
        depositType: true,
        depositAmount: true,
        confidentialityPolicy: true
      }
    });

  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });

  const token = jwt.sign(
    {
      userId: user.id,
      login: user.login,
      role: user.role,
      teamName: user.teamName,
      impersonated: true
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  console.log(`[SUPER_LOGIN] Connexion en tant que ${user.login} via super admin à ${new Date().toISOString()}`);

  res.json({
    success: true,
    token,
    user: userWithoutPassword
  });
};

/**
 * Vérifier le code 2FA et retourner le token JWT
 */
export const verifyTwoFactorCode = async (req, res, next) => {
  try {
    const { tempToken, code, trustDevice, deviceName } = req.body;

    if (!tempToken || !code) {
      throw new AppError('Token temporaire et code requis', 400);
    }

    // Rechercher le code 2FA dans la base de données
    const twoFactorEntry = await prisma.twoFactorCode.findUnique({
      where: { tempToken },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            email: true,
            role: true,
            teamName: true,
            stripeAccount: true,
            paymentMode: true,
            depositType: true,
            depositAmount: true,
            practiceActivities: true,
            confidentialityPolicy: true
          }
        }
      }
    });

    // Vérifier que le code existe et n'est pas expiré
    if (!twoFactorEntry || new Date() > twoFactorEntry.expiresAt) {
      throw new AppError('Code invalide ou expiré', 400);
    }

    // Vérifier que le code n'a pas déjà été vérifié
    if (twoFactorEntry.verified) {
      throw new AppError('Code déjà utilisé', 400);
    }

    // Vérifier le nombre de tentatives (max 3)
    if (twoFactorEntry.attempts >= 3) {
      throw new AppError('Trop de tentatives. Veuillez demander un nouveau code.', 429);
    }

    // Vérifier le code
    if (twoFactorEntry.code !== code) {
      // Incrémenter le nombre de tentatives
      await prisma.twoFactorCode.update({
        where: { id: twoFactorEntry.id },
        data: { attempts: twoFactorEntry.attempts + 1 }
      });

      const remainingAttempts = 3 - (twoFactorEntry.attempts + 1);
      throw new AppError(`Code incorrect. ${remainingAttempts} tentative(s) restante(s).`, 400);
    }

    // Marquer le code comme vérifié
    await prisma.twoFactorCode.update({
      where: { id: twoFactorEntry.id },
      data: { verified: true }
    });

    // Si l'utilisateur veut faire confiance à cet appareil
    let deviceToken = null;
    if (trustDevice) {
      deviceToken = crypto.randomBytes(32).toString('hex');

      await prisma.trustedDevice.create({
        data: {
          userId: twoFactorEntry.user.id,
          deviceToken,
          deviceName: deviceName || 'Appareil inconnu',
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 jours
        }
      });

      console.log(`[2FA] Appareil de confiance créé pour ${twoFactorEntry.user.login}, expire dans 60 jours`);
    }

    // Générer le token JWT (60 jours si trusted device, sinon 7 jours)
    const expiresIn = trustDevice ? '60d' : '7d';
    const token = jwt.sign(
      {
        userId: twoFactorEntry.user.id,
        login: twoFactorEntry.user.login,
        role: twoFactorEntry.user.role,
        teamName: twoFactorEntry.user.teamName
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    console.log(`[2FA] Connexion réussie pour ${twoFactorEntry.user.login} à ${new Date().toISOString()}`);

    res.json({
      success: true,
      token,
      user: twoFactorEntry.user,
      deviceToken // Renvoyer le deviceToken pour le stocker côté client
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Demander une réinitialisation de mot de passe
 */
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { login, email } = req.body;

    if (!login || !email) {
      throw new AppError('Identifiant et email requis', 400);
    }

    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { login },
      select: {
        id: true,
        login: true,
        email: true
      }
    });

    // Pour des raisons de sécurité, on retourne toujours un succès même si l'utilisateur n'existe pas ou si l'email ne correspond pas
    if (!user) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec ces identifiants, un email de réinitialisation a été envoyé.'
      });
    }

    // Vérifier que l'utilisateur a un email
    if (!user.email) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec ces identifiants, un email de réinitialisation a été envoyé.'
      });
    }

    // Vérifier que l'email fourni correspond à celui de l'utilisateur
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec ces identifiants, un email de réinitialisation a été envoyé.'
      });
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Créer l'entrée dans la base de données (expire dans 1 heure)
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
        used: false
      }
    });

    // Envoyer l'email de réinitialisation
    await sendPasswordResetEmail(user.email, resetToken, user.login);

    res.json({
      success: true,
      message: 'Si un compte existe avec ces identifiants, un email de réinitialisation a été envoyé.'
    });
  } catch (error) {
    console.error('Erreur demande de réinitialisation:', error);
    // Ne pas révéler d'information en cas d'erreur
    res.json({
      success: true,
      message: 'Si un compte existe avec ces identifiants, un email de réinitialisation a été envoyé.'
    });
  }
};

/**
 * Vérifier la validité d'un token de réinitialisation
 */
export const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Token requis', 400);
    }

    // Hasher le token pour le comparer
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Rechercher le token dans la base de données
    const resetEntry = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          select: {
            id: true,
            login: true
          }
        }
      }
    });

    // Vérifier que le token existe, n'est pas expiré et n'a pas été utilisé
    if (!resetEntry || resetEntry.used || new Date() > resetEntry.expiresAt) {
      throw new AppError('Token invalide ou expiré', 400);
    }

    res.json({
      success: true,
      valid: true,
      login: resetEntry.user.login
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Réinitialiser le mot de passe
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError('Token et nouveau mot de passe requis', 400);
    }

    // Vérifier que le mot de passe a une longueur minimale
    if (newPassword.length < 6) {
      throw new AppError('Le mot de passe doit contenir au moins 6 caractères', 400);
    }

    // Hasher le token pour le comparer
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Rechercher le token dans la base de données
    const resetEntry = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
      include: {
        user: true
      }
    });

    // Vérifier que le token existe, n'est pas expiré et n'a pas été utilisé
    if (!resetEntry || resetEntry.used || new Date() > resetEntry.expiresAt) {
      throw new AppError('Token invalide ou expiré', 400);
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: resetEntry.userId },
      data: { password: hashedPassword }
    });

    // Marquer le token comme utilisé
    await prisma.passwordReset.update({
      where: { id: resetEntry.id },
      data: { used: true }
    });

    console.log(`[PASSWORD_RESET] Mot de passe réinitialisé pour ${resetEntry.user.login} à ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    next(error);
  }
};


