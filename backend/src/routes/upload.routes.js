import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Configuration du dossier uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de multer pour le stockage des produits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// Configuration de multer pour le logo (nom fixe pour toujours remplacer l'ancien)
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'logo' + ext);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  const isMimeValid = allowedMimeTypes.includes(mime);
  const isExtValid = allowedExtensions.includes(ext);

  if (isMimeValid && (isExtValid || ext === '')) {
    cb(null, true);
  } else {
    console.warn(`Fichier rejeté : ${file.originalname} (${file.mimetype})`);
    cb(new Error('Seules les images sont autorisées (jpg, jpeg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2mo max par image
  }
});

const logoUpload = multer({
  storage: logoStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max pour le logo
  }
});

// Route pour upload d'images (multipart/form-data)
router.post('/images', authMiddleware, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    // Générer les URLs des images uploadées
    const urls = req.files.map(file => {
      return `/uploads/${file.filename}`;
    });

    res.status(200).json({
      message: 'Images uploadées avec succès',
      urls
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des images' });
  }
});

// Route pour supprimer une image
router.delete('/images', authMiddleware, (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL de l\'image requise' });
    }

    // Extraire le nom du fichier de l'URL
    const filename = path.basename(url);
    const filePath = path.join(uploadsDir, filename);

    // Vérifier que le fichier existe
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ message: 'Image supprimée avec succès' });
    } else {
      res.status(404).json({ error: 'Image non trouvée' });
    }
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'image' });
  }
});

// Route pour upload du logo
router.post('/logo', authMiddleware, logoUpload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun logo fourni' });
    }

    // Supprimer l'ancien logo s'il existe (avec une extension différente)
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const currentExt = path.extname(req.file.filename).toLowerCase().replace('.', '');

    extensions.forEach(ext => {
      if (ext !== currentExt) {
        const oldLogoPath = path.join(uploadsDir, `logo.${ext}`);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
    });

    // Générer l'URL du logo
    const url = `/uploads/${req.file.filename}`;

    res.status(200).json({
      message: 'Logo uploadé avec succès',
      url
    });
  } catch (error) {
    console.error('Erreur upload logo:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du logo' });
  }
});

export default router;
