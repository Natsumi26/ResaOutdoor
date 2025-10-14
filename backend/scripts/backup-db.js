import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

    console.log('🔄 Création du backup de la base de données...');
    console.log(`📁 Fichier: ${backupFile}`);

    // Créer le dossier backups s'il n'existe pas
    await execAsync(`mkdir -p "${backupDir}"`);

    // Récupérer l'URL de la base de données depuis .env
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL non trouvé dans .env');
    }

    // Parser l'URL (format: postgresql://user:password@host:port/database)
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      throw new Error('Format DATABASE_URL invalide');
    }

    const [, user, password, host, port, database] = match;

    // Créer le backup avec pg_dump
    const command = `PGPASSWORD="${password}" pg_dump -U "${user}" -h "${host}" -p "${port}" -d "${database}" -f "${backupFile}"`;

    await execAsync(command);

    console.log('✅ Backup créé avec succès!');
    console.log(`📍 Emplacement: ${backupFile}`);

    // Lister tous les backups
    const { stdout } = await execAsync(`ls -lh "${backupDir}"`);
    console.log('\n📦 Backups disponibles:');
    console.log(stdout);

  } catch (error) {
    console.error('❌ Erreur lors du backup:', error.message);
    process.exit(1);
  }
}

backupDatabase();
