-- Retirer le teamLeaderId du super_admin
-- Un super_admin ne doit pas avoir de leader

UPDATE users
SET "teamLeaderId" = NULL
WHERE role = 'super_admin';

-- Vérifier le résultat
SELECT id, login, role, "teamLeaderId" FROM users WHERE role = 'super_admin';
