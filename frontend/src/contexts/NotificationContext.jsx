import { createContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Connexion au serveur Socket.io
  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_BACK_URL || 'http://localhost:5000/api';

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Connecté au serveur de notifications');
      setIsConnected(true);

      // Rejoindre la room appropriée selon le rôle
      newSocket.emit('join-room', {
        role: user.role,
        userId: user.id
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur de notifications');
      setIsConnected(false);
    });

    newSocket.on('notification', (notification) => {
      console.log('🔔 Nouvelle notification reçue:', notification);

      // Ajouter la notification à la liste
      setNotifications((prev) => [notification, ...prev]);

      // Incrémenter le compteur non lu
      setUnreadCount((prev) => prev + 1);

      // Jouer un son (optionnel)
      playNotificationSound();

      // Afficher une notification navigateur si autorisé
      showBrowserNotification(notification);
    });

    newSocket.on('calendar-update', (data) => {
      console.log('📅 Mise à jour du calendrier:', data);

      // Déclencher un événement personnalisé pour rafraîchir le calendrier
      window.dispatchEvent(new CustomEvent('calendar-update', { detail: data }));
    });

    setSocket(newSocket);
console.log("Socket initialisé:", newSocket);
    // Cleanup à la déconnexion
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Demander la permission pour les notifications navigateur
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === notificationId);
      if (notif && !notif.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  // Effacer toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Jouer un son de notification
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore si le son ne peut pas être joué
      });
    } catch (error) {
      // Ignore les erreurs de lecture audio
    }
  };

  // Afficher une notification navigateur
  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: notification.id
      });
    }
  };

  const value = {
    socket,
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
