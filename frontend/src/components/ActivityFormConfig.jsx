import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { activityConfigAPI } from '../services/api';
import styles from './ActivityFormConfig.module.css';

const ACTIVITY_NAMES = {
  canyoning: 'Canyoning',
  escalade: 'Escalade',
  'via-ferrata': 'Via Ferrata',
  speleologie: 'Spéléologie'
};

const FIELD_LABELS = {
  firstName: 'Prénom',
  age: 'Âge',
  height: 'Taille (cm)',
  weight: 'Poids (kg)',
  shoeRental: 'Location de chaussures',
  shoeSize: 'Pointure',
  practiceLevel: 'Niveau de pratique',
  comment: 'Commentaire'
};

const ActivityFormConfig = forwardRef(({ practiceActivities }, ref) => {
  const [configs, setConfigs] = useState([]);
  const [wetsuitBrands, setWetsuitBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeActivity, setActiveActivity] = useState(null);

  // Exposer les méthodes save et reset au parent
  useImperativeHandle(ref, () => ({
    save: () => activeActivity && handleSave(activeActivity),
    reset: () => activeActivity && handleReset(activeActivity),
    isSaving: () => saving
  }));

  useEffect(() => {
    loadConfigs();
    loadWetsuitBrands();
  }, []);

  useEffect(() => {
    // Sélectionner la première activité pratiquée par défaut
    if (practiceActivities?.length > 0 && !activeActivity) {
      setActiveActivity(practiceActivities[0]);
    }
  }, [practiceActivities, activeActivity]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await activityConfigAPI.getAll();
      setConfigs(response.data);
    } catch (error) {
      console.error('Erreur chargement configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWetsuitBrands = async () => {
    try {
      const response = await activityConfigAPI.getWetsuitBrands();
      setWetsuitBrands(response.data);
    } catch (error) {
      console.error('Erreur chargement marques:', error);
    }
  };

  const getConfigForActivity = (activityId) => {
    return configs.find(c => c.activityTypeId === activityId) || null;
  };

  const handleFieldToggle = (activityId, fieldName, property) => {
    setConfigs(prev => prev.map(config => {
      if (config.activityTypeId !== activityId) return config;

      const newFields = { ...config.fields };
      newFields[fieldName] = {
        ...newFields[fieldName],
        [property]: !newFields[fieldName][property]
      };

      // Si on désactive un champ, on désactive aussi "required"
      if (property === 'enabled' && newFields[fieldName].enabled === false) {
        newFields[fieldName].required = false;
      }

      return { ...config, fields: newFields };
    }));
  };

  const handleBrandChange = (activityId, brand) => {
    setConfigs(prev => prev.map(config => {
      if (config.activityTypeId !== activityId) return config;
      return { ...config, wetsuitBrand: brand };
    }));
  };

  const handleSave = async (activityId) => {
    const config = getConfigForActivity(activityId);
    if (!config) return;

    try {
      setSaving(true);
      await activityConfigAPI.update(activityId, {
        fields: config.fields,
        wetsuitBrand: config.wetsuitBrand
      });
      setSaveMessage('Configuration sauvegardée !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setSaveMessage('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (activityId) => {
    if (!window.confirm('Réinitialiser la configuration par défaut ?')) return;

    try {
      setSaving(true);
      const response = await activityConfigAPI.reset(activityId);
      setConfigs(prev => prev.map(config => {
        if (config.activityTypeId !== activityId) return config;
        return response.data;
      }));
      setSaveMessage('Configuration réinitialisée !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  // Filtrer pour n'afficher que les activités pratiquées par le guide
  const activitiesToShow = practiceActivities?.length > 0
    ? practiceActivities
    : Object.keys(ACTIVITY_NAMES);

  return (
    <div className={styles.container}>
      {saveMessage && (
        <div className={`${styles.message} ${saveMessage.includes('Erreur') ? styles.error : styles.success}`}>
          {saveMessage}
        </div>
      )}

      {/* Onglets des activités */}
      <div className={styles.tabs}>
        {activitiesToShow.map(activityId => (
          <button
            key={activityId}
            className={`${styles.tab} ${activeActivity === activityId ? styles.active : ''}`}
            onClick={() => setActiveActivity(activityId)}
          >
            {ACTIVITY_NAMES[activityId] || activityId}
          </button>
        ))}
      </div>

      {/* Configuration de l'activité sélectionnée */}
      {activeActivity && (
        <div className={styles.configPanel}>
          {(() => {
            const config = getConfigForActivity(activeActivity);
            if (!config) return <div>Configuration non trouvée</div>;

            return (
              <>
                <div className={styles.fieldsGrid}>
                  {Object.entries(FIELD_LABELS).map(([fieldName, label]) => {
                    const field = config.fields[fieldName];
                    if (!field) return null;

                    return (
                      <div key={fieldName} className={styles.fieldRow}>
                        <div className={styles.fieldLabel}>{label}</div>
                        <div className={styles.fieldControls}>
                          <label className={styles.checkbox}>
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={() => handleFieldToggle(activeActivity, fieldName, 'enabled')}
                            />
                            <span>Activé</span>
                          </label>
                          <label className={`${styles.checkbox} ${!field.enabled ? styles.disabled : ''}`}>
                            <input
                              type="checkbox"
                              checked={field.required}
                              disabled={!field.enabled}
                              onChange={() => handleFieldToggle(activeActivity, fieldName, 'required')}
                            />
                            <span>Obligatoire</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sélecteur de marque de combinaison (uniquement pour canyoning) */}
                {activeActivity === 'canyoning' && (
                  <div className={styles.brandSection}>
                    <h4>Marque de combinaison</h4>
                    <p className={styles.brandDescription}>
                      Sélectionnez la marque utilisée pour calculer automatiquement les tailles de combinaison.
                    </p>
                    <select
                      value={config.wetsuitBrand || 'guara'}
                      onChange={(e) => handleBrandChange(activeActivity, e.target.value)}
                      className={styles.brandSelect}
                    >
                      {wetsuitBrands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
});

export default ActivityFormConfig;
