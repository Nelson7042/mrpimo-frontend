"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/useUserStore';
import socketService from '@/utils/socketService';
import { useUserNotifications } from '@/hooks/queries';
import { useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteAllNotifications } from '@/hooks/useNotifications';
import { INotification } from '@/types/notification.type';



interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  ringing: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [783.99, 1046.50, 1318.51]; // G5, C6, E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
    // AudioContext not available
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode; scope?: "user" | "vendor" }> = ({ children, scope }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [ringing, setRinging] = useState(false);
  const { user } = useUserStore();
  const { data: userNotifications } = useUserNotifications(!!user?._id, scope);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteAllMutation = useDeleteAllNotifications();
  
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
      // Filter by scope — only show notifications relevant to current dashboard
      const notifScope = (notification as any).scope || "general";
      const shouldShow = !scope || notifScope === scope || notifScope === "general";
      
      if (shouldShow) {
        playChime();
        setRinging(true);
        setTimeout(() => setRinging(false), 1000);
        setNotifications(prev => [
          notification,
          ...prev
        ]);
      }
      
      // Show browser notification for ALL scopes regardless of dashboard
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
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    // Call backend API
    markAsReadMutation.mutate(id);
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    // Call backend API
    markAllAsReadMutation.mutate();
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    deleteAllMutation.mutate();
  };
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      ringing,
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
