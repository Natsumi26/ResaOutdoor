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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPage, setEmojiPage] = useState(0);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
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
    { value: 'guide_notification', label: 'Notification de réservation (guide)' },
    { value: 'custom', label: 'Email personnalisé' }
  ];

  // Liste complète d'emoji organisés par pages (7 colonnes x 8 lignes = 56 emoji par page)
  const emojiList = [
    // Page 1 - Visages souriants
    ['😀', '😃', '😄', '😁', '😆', '😅', '🤣',
     '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰',
     '😍', '🤩', '😘', '😗', '😚', '😙', '😋',
     '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
     '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶',
     '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
     '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
     '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠'],

    // Page 2 - Émotions
    ['🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
     '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
     '😧', '😨', '😰', '😥', '😢', '😭', '😱',
     '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
     '😤', '😡', '😠', '🤬', '😈', '👿', '💀',
     '☠️', '💩', '🤡', '👹', '👺', '👻', '👽',
     '👾', '🤖', '💪', '🦾', '🦿', '🦵', '🦶',
     '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀'],

    // Page 3 - Mains et gestes
    ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏',
     '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
     '👆', '🖕', '👇', '☝️', '👍', '👎', '✊',
     '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
     '🤝', '🙏', '✍️', '👁️', '👅', '👄', '💋',
     '🩸', '❤️', '💤', '💢', '💬', '🗨️', '🗯️',
     '💭', '👓', '🕶️', '👔', '👕', '👖', '🧣',
     '🧤', '🧥', '🧦', '👗', '👘', '👙', '👚'],

    // Page 4 - Flèches
    ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖',
     '↕', '↔', '↩', '↪', '⤴', '⤵', '⬆', '⬇',
     '⬅', '➡', '🔄', '🔃', '⏪', '⏩', '⏫', '⏬',
     '▶', '◀', '🔼', '🔽', '⏸', '⏹', '⏺', '⏏',
     '🎵', '🎶', '🎤', '🎧', '📻', '🎷', '🎸', '🎹',
     '🎺', '🎻', '🥁', '🎬', '🏆', '🥇', '🥈', '🥉',
     '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱'],

    // Page 5 - Symboles
    ['✅', '☑️', '✔️', '✖️', '❌', '❎', '➕',
     '➖', '➗', '✳️', '✴️', '❇️', '‼️', '⁉️',
     '❓', '❔', '❗', '❕', '〰️', '⚠️', '🚸',
     '🔱', '⚜️', '🔰', '♻️', '💹', '🌐', '💠',
     'Ⓜ️', '🌀', '💯', '🔞', '📵', '🚫', '⛔',
     '📛', '🚷', '🚯', '🚳', '🚱', '🔕', '📴',
     '🆎', '🅰️', '🅱️', '🆑', '🆒', '🆓', 'ℹ️',
     '🆔', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆙'],

    // Page 6 - Nature et météo
    ['🌱', '🌿', '🍀', '🍁', '🍂', '🍃', '🌾',
     '🌺', '🌻', '🌼', '🌷', '🌸', '💐', '🥀',
     '🌹', '🏵️', '🌴', '🌳', '🌲', '🌵', '🎋',
     '🎍', '🍄', '🌏', '🌎', '🌍', '🌐', '🌑',
     '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘',
     '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞',
     '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥',
     '🌈', '☁️', '⛅', '🌤️', '⛈️', '🌧️', '⛱️'],

    // Page 7 - Objets
    ['📱', '📲', '☎️', '📞', '📟', '📠', '🔋',
     '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️',
     '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️',
     '📹', '📷', '📸', '📺', '🎙️', '🎚️', '🎛️',
     '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳',
     '📡', '🔭', '🔬', '🕯️', '💡', '🔦', '🏮',
     '🪔', '📔', '📕', '📖', '📗', '📘', '📙',
     '📚', '📓', '📒', '📃', '📜', '📄', '📑'],

    // Page 8 - Icônes pratiques
    ['📧', '📨', '📩', '📤', '📥', '📦', '📫',
     '📪', '📬', '📭', '📮', '🗳️', '✏️', '✒️',
     '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁',
     '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇',
     '📈', '📉', '📊', '📋', '📌', '📍', '📎',
     '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️',
     '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨',
     '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '💵']
  ];

  useEffect(() => {
    loadTemplates();
    loadVariables();
    loadSettings();
  }, []);

  // Fermer l'emoji picker si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEmojiPicker && !e.target.closest('[data-emoji-picker]')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showEmojiPicker]);

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

  const handleResetTemplate = () => {
    if (!formData.type) {
      alert('Veuillez sélectionner un type de template');
      return;
    }
    setIsResetConfirmOpen(true);
  };

  const confirmResetTemplate = async () => {
    try {
      const response = await emailTemplatesAPI.getByType(formData.type);
      if (response.data.template) {
        const defaultTemplate = response.data.template;
        setFormData(prev => ({
          ...prev,
          htmlContent: defaultTemplate.htmlContent || '',
          textContent: defaultTemplate.textContent || ''
        }));
        setIsResetConfirmOpen(false);
        alert('Template réinitialisé avec succès');
      } else {
        alert('Aucun template par défaut trouvé pour ce type');
      }
    } catch (error) {
      console.error('Erreur réinitialisation template:', error);
      alert('Erreur lors de la réinitialisation du template');
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
    const scrollTop = textarea.scrollTop;

    setFormData(prev => ({
      ...prev,
      htmlContent: before + variable + after
    }));

    // Reposition le curseur sans scroller
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.scrollTop = scrollTop;
    }, 0);
  };

  const insertFormatting = (tag, closingTag = null) => {
    const textarea = document.querySelector('textarea[name="htmlContent"]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.htmlContent;
    const selectedText = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const scrollTop = textarea.scrollTop;

    const closeTag = closingTag || tag.replace('<', '</');
    const newText = before + tag + selectedText + closeTag + after;

    setFormData(prev => ({
      ...prev,
      htmlContent: newText
    }));

    // Reposition le curseur sans scroller
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + tag.length + selectedText.length + closeTag.length;
      textarea.selectionStart = textarea.selectionEnd = newPosition;
      textarea.scrollTop = scrollTop;
    }, 0);
  };

  const insertEmoji = (emoji) => {
    const textarea = document.querySelector('textarea[name="htmlContent"]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.htmlContent;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const scrollTop = textarea.scrollTop;

    setFormData(prev => ({
      ...prev,
      htmlContent: before + emoji + after
    }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.scrollTop = scrollTop;
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
        <div className={styles.modal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px' }}
          >
            <h2>{editingTemplate ? 'Modifier le template' : 'Nouveau template'}</h2>

            <form onSubmit={handleSubmit}>
              {!editingTemplate && (
                <div className={styles.formGroup}>
                  <label>Type de template *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {templateTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingTemplate && (
                <input type="hidden" name="type" value={formData.type} />
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
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

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
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
              </div>

              {formData.type && availableVariables[formData.type] && (() => {
                // Grouper les variables par catégorie
                const groupedVariables = {
                  'Infos entreprise': [],
                  'Infos client': [],
                  'Infos session': [],
                  'Infos réservation': [],
                  'Infos paiement': [],
                  'Liens et messages': []
                };

                availableVariables[formData.type].forEach((variable) => {
                  if (variable.key.includes('company') || variable.key.includes('logo')) {
                    groupedVariables['Infos entreprise'].push(variable);
                  } else if (variable.key.includes('client')) {
                    groupedVariables['Infos client'].push(variable);
                  } else if (variable.key.includes('session') || variable.key.includes('product') || variable.key.includes('guide')) {
                    groupedVariables['Infos session'].push(variable);
                  } else if (variable.key.includes('booking') || variable.key.includes('numberOfPeople')) {
                    groupedVariables['Infos réservation'].push(variable);
                  } else if (variable.key.includes('Price') || variable.key.includes('Paid') || variable.key.includes('Due') || variable.key.includes('amount')) {
                    groupedVariables['Infos paiement'].push(variable);
                  } else {
                    groupedVariables['Liens et messages'].push(variable);
                  }
                });

                return (
                  <div className={styles.formGroup}>
                    <label>Intégrer une variable</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          insertVariable(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                      defaultValue=""
                    >
                      <option value="">Sélectionner une variable...</option>
                      {Object.entries(groupedVariables).map(([category, variables]) =>
                        variables.length > 0 && (
                          <optgroup key={category} label={category}>
                            {variables.map((variable) => (
                              <option key={variable.key} value={variable.key}>
                                {variable.description}
                              </option>
                            ))}
                          </optgroup>
                        )
                      )}
                    </select>
                  </div>
                );
              })()}

              <div className={styles.formGroup}>
                <label>Contenu HTML *</label>

                {/* Barre d'outils de formatage améliorée */}
                <div style={{
                  display: 'flex',
                  gap: '2px',
                  padding: '3px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px 4px 0 0',
                  borderBottom: 'none',
                  alignItems: 'center',
                  flexWrap: 'nowrap',
                  position: 'relative',
                  overflowX: 'auto'
                }}>
                  {/* Police */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        insertFormatting(`<span style="font-family: ${e.target.value};">`, '</span>');
                        e.target.value = '';
                      }
                    }}
                    style={{
                      padding: '2px 4px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      height: '24px',
                      minWidth: '55px'
                    }}
                    defaultValue=""
                  >
                    <option value="">Police</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Times New Roman', serif">Times</option>
                    <option value="'Courier New', monospace">Courier</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Comic Sans MS', cursive">Comic Sans</option>
                  </select>

                  {/* Taille */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        insertFormatting(`<span style="font-size: ${e.target.value};">`, '</span>');
                        e.target.value = '';
                      }
                    }}
                    style={{
                      padding: '2px 4px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      height: '24px',
                      minWidth: '50px'
                    }}
                    defaultValue=""
                  >
                    <option value="">Taille</option>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="32px">32px</option>
                  </select>

                  {/* Séparateur */}
                  <div style={{ width: '1px', height: '18px', background: '#d1d5db', margin: '0 1px' }}></div>

                  {/* Gras, Italique, Souligné */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('<strong>', '</strong>')}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Gras"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<em>', '</em>')}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontStyle: 'italic',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Italique"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<u>', '</u>')}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Souligné"
                  >
                    U
                  </button>

                  {/* Séparateur */}
                  <div style={{ width: '1px', height: '18px', background: '#d1d5db', margin: '0 1px' }}></div>

                  {/* Alignements */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('<p style="text-align: left;">', '</p>')}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Aligner à gauche"
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<p style="text-align: center;">', '</p>')}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Centrer"
                  >
                    ≣
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<p style="text-align: right;">', '</p>')}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Aligner à droite"
                  >
                    ≡
                  </button>

                  {/* Séparateur */}
                  <div style={{ width: '1px', height: '18px', background: '#d1d5db', margin: '0 1px' }}></div>

                  {/* Couleur */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        insertFormatting(`<span style="color: ${e.target.value};">`, '</span>');
                        e.target.value = '';
                      }
                    }}
                    style={{
                      padding: '2px 4px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      height: '24px',
                      minWidth: '60px'
                    }}
                    defaultValue=""
                  >
                    <option value="">Couleur</option>
                    <option value="#000000">⚫ Noir</option>
                    <option value="#ef4444">🔴 Rouge</option>
                    <option value="#10b981">🟢 Vert</option>
                    <option value="#3b82f6">🔵 Bleu</option>
                    <option value="#f59e0b">🟠 Orange</option>
                    <option value="#8b5cf6">🟣 Violet</option>
                    <option value="#fbbf24">🟡 Jaune</option>
                    <option value="#ec4899">💗 Rose</option>
                  </select>

                  {/* Séparateur */}
                  <div style={{ width: '1px', height: '18px', background: '#d1d5db', margin: '0 1px' }}></div>

                  {/* Liste et lien */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Liste à puces"
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkUrl('https://');
                      setIsLinkModalOpen(true);
                    }}
                    style={{
                      padding: '3px 6px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Lien"
                  >
                    🔗
                  </button>

                  {/* Séparateur */}
                  <div style={{ width: '1px', height: '18px', background: '#d1d5db', margin: '0 1px' }}></div>

                  {/* Emoji Picker Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    data-emoji-picker
                    style={{
                      padding: '3px 6px',
                      background: showEmojiPicker ? '#e5e7eb' : 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      minWidth: '24px',
                      height: '24px'
                    }}
                    title="Emoji"
                  >
                    😊
                  </button>

                  {/* Emoji Picker Popup */}
                  {showEmojiPicker && (
                    <>
                      <div
                        onClick={() => setShowEmojiPicker(false)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.3)',
                          zIndex: 9999
                        }}
                      />
                      <div data-emoji-picker style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10000,
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        padding: '12px'
                      }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px',
                        marginBottom: '8px'
                      }}>
                        {emojiList[emojiPage].map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              insertEmoji(emoji);
                              setShowEmojiPicker(false);
                            }}
                            style={{
                              padding: '6px',
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              width: '36px',
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <button
                          type="button"
                          onClick={() => setEmojiPage(Math.max(0, emojiPage - 1))}
                          disabled={emojiPage === 0}
                          style={{
                            padding: '4px 12px',
                            background: emojiPage === 0 ? '#f3f4f6' : 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: emojiPage === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ← Précédent
                        </button>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          {emojiPage + 1} / {emojiList.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmojiPage(Math.min(emojiList.length - 1, emojiPage + 1))}
                          disabled={emojiPage === emojiList.length - 1}
                          style={{
                            padding: '4px 12px',
                            background: emojiPage === emojiList.length - 1 ? '#f3f4f6' : 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: emojiPage === emojiList.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Suivant →
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                </div>

                <textarea
                  name="htmlContent"
                  value={formData.htmlContent}
                  onChange={handleInputChange}
                  rows="15"
                  placeholder="Contenu HTML de l'email..."
                  required
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    borderRadius: '0 0 6px 6px'
                  }}
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

              <div className={styles.modalActions} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  {formData.type && (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleResetTemplate}
                      style={{ background: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
                    >
                      🔄 Réinitialiser
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
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

      {isLinkModalOpen && (
        <div className={styles.modal} onClick={() => setIsLinkModalOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <h2>🔗 Insérer un lien</h2>

            <div className={styles.formGroup}>
              <label>URL du lien *</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                autoFocus
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsLinkModalOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  if (linkUrl && linkUrl.trim()) {
                    insertFormatting(`<a href="${linkUrl}">`, '</a>');
                    setIsLinkModalOpen(false);
                  }
                }}
              >
                Insérer le lien
              </button>
            </div>
          </div>
        </div>
      )}

      {isResetConfirmOpen && (
        <div className={styles.modal} onClick={() => setIsResetConfirmOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ marginBottom: '12px', fontSize: '20px' }}>Réinitialiser le template</h2>
              <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', margin: '0' }}>
                Êtes-vous sûr de vouloir réinitialiser le template ?<br />
                <strong style={{ color: '#ef4444' }}>Toutes les modifications seront perdues.</strong>
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsResetConfirmOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={confirmResetTemplate}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                Oui, réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emails;
