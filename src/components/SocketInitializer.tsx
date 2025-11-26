"use client";

import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import socketService from '@/utils/socketService';

/**
 * Component to initialize Socket.IO connection when user is logged in
 */
const SocketInitializer = () => {
  const { user } = useUserStore();
  
  useEffect(() => {
    // Connect to socket when user is logged in
    if (user?._id) {
      socketService.connect(user._id);
      
      return () => {
        // Disconnect when component unmounts or user logs out
        socketService.disconnect();
      };
    }
  }, [user?._id]);
  
  // This is a utility component, it doesn't render anything
  return null;
};

export default SocketInitializer;