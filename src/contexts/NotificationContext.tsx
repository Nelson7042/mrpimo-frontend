"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/useUserStore';
import socketService from '@/utils/socketService';
import { useUserNotifications } from '@/hooks/queries';
import { INotification } from '@/types/notification.type';



interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const { user } = useUserStore();
  const { data: userNotifications } = useUserNotifications(!!user?._id);
  
  
  // Use the initialized socket from socketService
  useEffect(() => {
    if (user?._id) {
      // Get the socket instance from socketService
      const socketInstance = socketService.connect(user._id);
      setSocket(socketInstance);
      
      // Join notification room for this user
      socketService.joinRoom(`notifications-${user._id}`);
      
      return () => {
        socketService.leaveRoom(`notifications-${user._id}`);
        // Note: We don't disconnect here as the socket is managed by socketService
      };
    }
  }, [user]);
  
  // Listen for notifications
  useEffect(() => {
    if (!socket) return;
    
    const handleNotification = (notification: INotification) => {
      // Add new notification to state
      setNotifications(prev => [
        notification,
        ...prev
      ]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png'
        });
        
        // Handle click on notification
        browserNotification.onclick = () => {
          window.focus();
          if (notification.data?.redirectUrl) {
            window.location.href = notification.data.redirectUrl;
          }
        };
      }
    };
    
    // Listen for notification events
    socket.on('notification', handleNotification);
    
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  // Sync notifications from server on initial load
  useEffect(() => {
    if (userNotifications) {
      setNotifications(userNotifications);
    }
  }, [userNotifications]);
  
  // Calculate unread count
  const unreadCount = notifications.filter((n: INotification) => !n.isRead).length;
  
  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
