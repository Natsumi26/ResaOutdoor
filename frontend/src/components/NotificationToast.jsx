import { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './NotificationToast.css';

const NotificationToast = () => {
  const { notifications } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState([]);

  useEffect(() => {
    // Afficher seulement les nouvelles notifications (non lues)
    const newNotifications = notifications.filter(n => !n.read).slice(0, 3);

    if (newNotifications.length > 0) {
      const latestNotification = newNotifications[0];

      // Vérifier si cette notification n'est pas déjà affichée
      const alreadyVisible = visibleToasts.some(t => t.id === latestNotification.id);

      if (!alreadyVisible) {
        // Ajouter la notification aux toasts visibles
        setVisibleToasts(prev => [...prev, latestNotification]);

        // Retirer automatiquement après 5 secondes
        setTimeout(() => {
          setVisibleToasts(prev => prev.filter(t => t.id !== latestNotification.id));
        }, 5000);
      }
    }
  }, [notifications]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'new-booking':
        return '📅';
      case 'new-message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'toast-high';
      case 'medium':
        return 'toast-medium';
      default:
        return 'toast-normal';
    }
  };

  const handleClose = (id) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id));
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className="notification-toast-container">
      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`notification-toast ${getPriorityClass(toast.priority)} toast-enter`}
          style={{ top: `${index * 90}px` }}
        >
          <div className="toast-icon">{getToastIcon(toast.type)}</div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button
            className="toast-close"
            onClick={() => handleClose(toast.id)}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
