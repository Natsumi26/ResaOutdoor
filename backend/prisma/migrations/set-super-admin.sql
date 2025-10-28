-- Mettre à jour l'utilisateur canyonlife en super_admin
UPDATE users
SET role = 'super_admin'
WHERE login = 'canyonlife';

-- Vérifier le résultat
SELECT id, login, role FROM users WHERE login = 'canyonlife';
