import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendPasswordResetEmail, sendTwoFactorCode } from '../services/email.service.js';

export const login = async (req, res, next) => {
  try {
    const { login, password} = req.body;

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
        phone: true,
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

    // 🔎 Vérifier si un refresh token déjà présent en cookie correspond à un TrustedDevice actif
    const existingToken = req.cookies.refreshToken;
    if (existingToken && user.twoFactorEnabled) {
      try {
        const payload = jwt.verify(existingToken, process.env.REFRESH_SECRET);
        const device = await prisma.trustedDevice.findUnique({ where: { jti: payload.jti } });

        if (device && !device.revoked && device.expiresAt > new Date()) {
          // ✅ Appareil de confiance → pas besoin de redemander 2FA
          const accessToken = jwt.sign(
            { userId: user.id, login: user.login, role: user.role, teamName: user.teamName },
            process.env.ACCESS_SECRET,
            { expiresIn: '15m' }
          );

          return res.json({ success: true, accessToken, user });
        }
      } catch (err) {
        // Token invalide ou expiré → on continue le flux normal
      }
    }

    // Si le 2FA est activé → toujours demander le code 2FA
    if (user.twoFactorEnabled && user.email) {
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

    // Si pas de 2FA activé → connexion directe (ne PAS créer de TrustedDevice)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        login: user.login,
        role: user.role,
        teamName: user.teamName
      },
      process.env.ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Nouvelle réponse JSON (sans refresh token ni cookie pour les utilisateurs sans 2FA)
    const { password: _, twoFactorEnabled: __, ...userWithoutPassword } = user;

    res.json({
      success: true,
      accessToken,
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
        phone: true,
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
        phone: true,
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
    process.env.ACCESS_SECRET,
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
    });

    // Vérifier que le code existe et n'est pas expiré
    if (!twoFactorEntry || new Date() > twoFactorEntry.expiresAt|| twoFactorEntry.code !== code) {
      throw new AppError('Code invalide ou expiré', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: twoFactorEntry.userId },
      select: {
        id: true,
        login: true,
        email: true,
        phone: true,
        role: true,
        teamName: true,
        stripeAccount: true,
        paymentMode: true,
        depositType: true,
        depositAmount: true,
        practiceActivities: true,
        confidentialityPolicy: true
      }
    });

    // ✅ Génération Access Token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        login: user.login,
        role: user.role,
        teamName: user.teamName
      },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    // ✅ Générer refresh token UNIQUEMENT si l'utilisateur a coché "Se souvenir de moi"
    if (trustDevice) {
      const jti = uuidv4();
      const refreshExpiryDays = 2; // 60 jours pour les appareils de confiance / 2 jours en test
      const refreshToken = jwt.sign(
        { sub: user.id, jti },
        process.env.REFRESH_SECRET,
        { expiresIn: `${refreshExpiryDays}d` }
      );

      await prisma.trustedDevice.create({
        data: {
          userId: user.id,
          jti,
          deviceName: deviceName || req.headers['user-agent'],
          expiresAt: new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000)
        }
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
        maxAge: refreshExpiryDays * 24 * 60 * 60 * 1000
      });
    }

    // Marquer le code 2FA comme vérifié et le supprimer
    await prisma.twoFactorCode.delete({
      where: { tempToken }
    });


    res.json({
      success: true,
      accessToken,
      user,
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
    if (!user|| !user.email || user.email.toLowerCase() !== email.toLowerCase()) {
      return res.json({
        success: true,
        message: 'Si un compte existe avec ces identifiants, un email de réinitialisation a été envoyé.'
      });
    }

    // Générer un token brut + hash
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


/**
 * Refresh token
 */
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    // Vérification du refresh token
    let payload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    // Vérifier en BDD si le jti existe et n'est pas révoqué
    const device = await prisma.trustedDevice.findUnique({
      where: { jti: payload.jti },
    });

    if (!device || device.revoked || device.expiresAt < new Date()) {
      return res.status(403).json({ error: "Device not trusted or expired" });
    }

    // Révoquer l'ancien refresh token
    await prisma.trustedDevice.update({
      where: { jti: payload.jti },
      data: { revoked: true, lastUsedAt: new Date() },
    });

    // Générer un nouveau refresh token
    const newJti = uuidv4();
    const newRefreshToken = jwt.sign(
      { sub: payload.sub, jti: newJti },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    await prisma.trustedDevice.create({
      data: {
        userId: payload.sub,
        jti: newJti,
        deviceName: device.deviceName,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Générer un nouvel access token
    const newAccessToken = jwt.sign(
      { userId: payload.sub },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    // Mettre le nouveau refresh token en cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/", // important pour le clearCookie
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * déconnexion
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    // Si un refresh token existe, révoquer le TrustedDevice correspondant
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.REFRESH_SECRET);
        if (payload.jti) {
          await prisma.trustedDevice.updateMany({
            where: { jti: payload.jti },
            data: { revoked: true }
          });
        }
      } catch (err) {
        // Token invalide, on continue quand même
      }
    }

    // Toujours effacer le cookie côté client
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/"
    });

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
