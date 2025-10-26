import React, { useState, useEffect } from 'react';
import { emailTemplatesAPI, settingsAPI } from '../services/api';
import styles from './Common.module.css';

const Emails = () => {
  const [templates, setTemplates] = useState([]);
  const [availableVariables, setAvailableVariables] = useState({});
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [previewTab, setPreviewTab] = useState('html'); // 'html' or 'text'
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  });

  const templateTypes = [
    { value: 'booking_confirmation', label: 'Confirmation de réservation' },
    { value: 'booking_reminder', label: 'Rappel de réservation' },
    { value: 'payment_confirmation', label: 'Confirmation de paiement' },
    { value: 'gift_voucher', label: 'Bon cadeau' },
    { value: 'custom', label: 'Email personnalisé' }
  ];

  useEffect(() => {
    loadTemplates();
    loadVariables();
    loadSettings();
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdownId(null);
      }
    };

    const handleClickOutside = (e) => {
      // Si on clique en dehors du dropdown, le fermer
      if (openDropdownId && !e.target.closest('[data-dropdown]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await emailTemplatesAPI.getAll();
      const templates = response.data.templates || [];

      // Si aucun template n'existe, initialiser les templates par défaut
      if (templates.length === 0) {
        console.log('Aucun template trouvé, initialisation des templates par défaut...');
        await emailTemplatesAPI.initialize();
        // Recharger les templates après initialisation
        const newResponse = await emailTemplatesAPI.getAll();
        setTemplates(newResponse.data.templates || []);
      } else {
        setTemplates(templates);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
      alert('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const loadVariables = async () => {
    try {
      const response = await emailTemplatesAPI.getAvailableVariables();
      setAvailableVariables(response.data.variables || {});
    } catch (error) {
      console.error('Erreur chargement variables:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data.settings || null);
    } catch (error) {
      console.error('Erreur chargement settings:', error);
    }
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        type: template.type,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || '',
        isActive: template.isActive
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        type: '',
        name: '',
        subject: '',
        htmlContent: '',
        textContent: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setFormData({
      type: '',
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      isActive: true
    });
  };

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;

    // Si on change le type de template et qu'on est en mode création
    if (name === 'type' && value && !editingTemplate) {
      try {
        // Charger le template actif pour ce type
        const response = await emailTemplatesAPI.getByType(value);
        if (response.data.template) {
          const activeTemplate = response.data.template;
          setFormData(prev => ({
            ...prev,
            type: value,
            htmlContent: activeTemplate.htmlContent || '',
            textContent: activeTemplate.textContent || ''
          }));
          return;
        }
      } catch (error) {
        console.log('Aucun template actif trouvé pour ce type, champs vides');
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.subject || !formData.htmlContent) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingTemplate) {
        await emailTemplatesAPI.update(editingTemplate.id, formData);
        alert('Template mis à jour avec succès');
      } else {
        await emailTemplatesAPI.create(formData);
        alert('Template créé avec succès');
      }
      handleCloseModal();
      loadTemplates();
    } catch (error) {
      console.error('Erreur sauvegarde template:', error);
      alert('Erreur lors de la sauvegarde du template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }

    try {
      await emailTemplatesAPI.delete(id);
      alert('Template supprimé avec succès');
      loadTemplates();
    } catch (error) {
      console.error('Erreur suppression template:', error);
      alert('Erreur lors de la suppression du template');
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.querySelector('textarea[name="htmlContent"]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.htmlContent;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setFormData(prev => ({
      ...prev,
      htmlContent: before + variable + after
    }));

    // Reposition le curseur
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  };

  const getSampleData = (type) => {
    // Variables de settings (valeurs réelles si disponibles, sinon valeurs par défaut)
    const settingsVariables = {
      '{{companyName}}': settings?.companyName || 'Canyon Life',
      '{{companyEmail}}': settings?.companyEmail || 'contact@canyonlife.fr',
      '{{companyPhone}}': settings?.companyPhone || '+33 6 12 34 56 78',
      '{{logo}}': settings?.logo ? `http://localhost:5000${settings.logo}` : ''
    };

    const sampleData = {
      booking_confirmation: {
        ...settingsVariables,
        '{{clientFirstName}}': 'Jean',
        '{{clientLastName}}': 'Dupont',
        '{{clientEmail}}': 'jean.dupont@email.com',
        '{{productName}}': 'Canyon du Furon - Intégral',
        '{{sessionDate}}': 'Samedi 25 octobre 2025',
        '{{sessionTimeSlot}}': 'Matin',
        '{{sessionStartTime}}': '09:00',
        '{{guideName}}': 'Pierre Martin',
        '{{numberOfPeople}}': '4',
        '{{totalPrice}}': '280',
        '{{amountPaid}}': '140',
        '{{amountDue}}': '140',
        '{{bookingId}}': 'ABC123',
        '{{bookingLink}}': 'http://localhost:3000/client/my-booking/abc123',
        '{{postBookingMessage}}': 'Prévoir des vêtements de sport et des chaussures fermées. Rendez-vous 15 minutes avant le départ.',
        '{{wazeLink}}': 'https://waze.com/ul?ll=45.1234,5.6789',
        '{{googleMapsLink}}': 'https://maps.google.com/?q=45.1234,5.6789'
      },
      booking_reminder: {
        ...settingsVariables,
        '{{clientFirstName}}': 'Jean',
        '{{clientLastName}}': 'Dupont',
        '{{productName}}': 'Canyon du Furon - Intégral',
        '{{sessionDate}}': 'Samedi 25 octobre 2025',
        '{{sessionStartTime}}': '09:00',
        '{{guideName}}': 'Pierre Martin'
      },
      payment_confirmation: {
        ...settingsVariables,
        '{{clientFirstName}}': 'Jean',
        '{{clientLastName}}': 'Dupont',
        '{{productName}}': 'Canyon du Furon - Intégral',
        '{{sessionDate}}': 'Samedi 25 octobre 2025',
        '{{amountPaid}}': '140',
        '{{totalPaid}}': '140',
        '{{totalPrice}}': '280',
        '{{amountDue}}': '140',
        '{{numberOfPeople}}': '4',
        '{{isFullyPaid}}': 'false'
      }
    };

    return sampleData[type] || settingsVariables;
  };

  const handlePreview = () => {
    let html = formData.htmlContent;
    let text = formData.textContent || '';
    const samples = getSampleData(formData.type);

    // Remplacer toutes les variables par les données d'exemple
    Object.keys(samples).forEach(variable => {
      html = html.replaceAll(variable, samples[variable]);
      text = text.replaceAll(variable, samples[variable]);
    });

    setPreviewHtml(html);
    setPreviewText(text);
    setPreviewTab('html');
    setIsPreviewOpen(true);
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>📧 Gestion des Emails</h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>
            Configuration des templates d'emails et des notifications
          </p>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className={styles.emptyState}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>Chargement des templates...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Sujet</th>
                <th>Statut</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>{template.name}</td>
                  <td>{template.subject}</td>
                  <td>
                    {template.isActive ? (
                      <span className={styles.badgeAvailable}>Actif</span>
                    ) : (
                      <span className={styles.badgeUsed}>Inactif</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <div data-dropdown style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          if (openDropdownId === template.id) {
                            setOpenDropdownId(null);
                          } else {
                            const rect = e.target.getBoundingClientRect();
                            setDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left - 80 // Décaler vers la gauche pour centrer
                            });
                            setOpenDropdownId(template.id);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          padding: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          const svg = e.currentTarget.querySelector('svg');
                          if (svg) svg.style.stroke = '#111827';
                        }}
                        onMouseLeave={(e) => {
                          const svg = e.currentTarget.querySelector('svg');
                          if (svg) svg.style.stroke = '#6b7280';
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ stroke: '#6b7280', transition: 'stroke 0.2s' }}
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {openDropdownId === template.id && (
                        <div
                          style={{
                            position: 'fixed',
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            minWidth: '160px',
                            zIndex: 1000,
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            onClick={() => {
                              // Afficher l'aperçu avec remplacement des variables
                              let html = template.htmlContent;
                              let text = template.textContent || '';
                              const samples = getSampleData(template.type);

                              // Remplacer toutes les variables par les données d'exemple
                              Object.keys(samples).forEach(variable => {
                                html = html.replaceAll(variable, samples[variable]);
                                text = text.replaceAll(variable, samples[variable]);
                              });

                              setPreviewHtml(html);
                              setPreviewText(text);
                              setPreviewTab('html');
                              setIsPreviewOpen(true);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              border: 'none',
                              background: 'white',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            👁️ Aperçu
                          </button>
                          <button
                            onClick={() => {
                              handleOpenModal(template);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              border: 'none',
                              background: 'white',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background 0.2s',
                              borderTop: '1px solid #f3f4f6'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            ✏️ Modifier
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modal} onClick={handleCloseModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px' }}
          >
            <h2>{editingTemplate ? 'Modifier le template' : 'Nouveau template'}</h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Type de template *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  disabled={editingTemplate !== null}
                >
                  <option value="">Sélectionner un type</option>
                  {templateTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Nom du template *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Email de confirmation standard"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Sujet de l'email *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Ex: Confirmation de votre réservation"
                  required
                />
              </div>

              {formData.type && availableVariables[formData.type] && (
                <div className={styles.formGroup}>
                  <label>Variables disponibles</label>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '12px',
                    background: '#f3f4f6',
                    borderRadius: '8px'
                  }}>
                    {availableVariables[formData.type].map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => insertVariable(variable.key)}
                        style={{
                          padding: '6px 12px',
                          background: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                        }}
                        title={variable.description}
                      >
                        {variable.key}
                      </button>
                    ))}
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Cliquez sur une variable pour l'insérer dans le contenu HTML
                  </small>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Contenu HTML *</label>
                <textarea
                  name="htmlContent"
                  value={formData.htmlContent}
                  onChange={handleInputChange}
                  rows="15"
                  placeholder="Contenu HTML de l'email..."
                  required
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Contenu texte (optionnel)</label>
                <textarea
                  name="textContent"
                  value={formData.textContent}
                  onChange={handleInputChange}
                  rows="8"
                  placeholder="Version texte de l'email (pour les clients qui n'affichent pas le HTML)"
                />
              </div>

              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Template actif
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleCloseModal}
                >
                  Annuler
                </button>
                {formData.htmlContent && formData.type && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handlePreview}
                    style={{ background: '#8b5cf6', color: 'white', borderColor: '#8b5cf6' }}
                  >
                    👁️ Aperçu
                  </button>
                )}
                <button type="submit" className={styles.btnPrimary}>
                  {editingTemplate ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPreviewOpen && (
        <div className={styles.modal} onClick={() => setIsPreviewOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>👁️ Aperçu de l'email</h2>
              <button
                onClick={() => setIsPreviewOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setPreviewTab('html')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: previewTab === 'html' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: previewTab === 'html' ? '#3b82f6' : '#6b7280',
                  fontWeight: previewTab === 'html' ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
              >
                Version HTML
              </button>
              <button
                onClick={() => setPreviewTab('text')}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: previewTab === 'text' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: previewTab === 'text' ? '#3b82f6' : '#6b7280',
                  fontWeight: previewTab === 'text' ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
              >
                Version Texte
              </button>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white'
            }}>
              {previewTab === 'html' ? (
                <iframe
                  srcDoc={previewHtml}
                  style={{
                    width: '100%',
                    height: '600px',
                    border: 'none',
                    display: 'block'
                  }}
                  title="Aperçu de l'email"
                />
              ) : (
                <pre style={{
                  margin: 0,
                  padding: '20px',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#1f2937',
                  minHeight: '600px'
                }}>
                  {previewText || 'Aucun contenu texte disponible'}
                </pre>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                className={styles.btnSecondary}
                onClick={() => setIsPreviewOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emails;
