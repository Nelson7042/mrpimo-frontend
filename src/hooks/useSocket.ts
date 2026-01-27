import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'react-hot-toast';
import { SOCKET_URL } from '@/utils/config';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(SOCKET_URL, {
      auth: {
        userId: user._id,
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join', user._id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen for notifications
    newSocket.on('notification', (data) => {
      toast.success(data.message);
    });

    // Listen for order updates
    newSocket.on('orderUpdate', (data) => {
      toast(`Order ${data.orderId} status updated to ${data.status}`, {
        icon: 'ℹ️',
      });
    });

    // Listen for new messages
    newSocket.on('newMessage', (data) => {
      toast(`New message from ${data.senderName}`, {
        icon: '💬',
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return socket;
};

export const useVendorSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(SOCKET_URL, {
      auth: {
        userId: user._id,
        role: 'vendor',
      },
    });

    newSocket.on('connect', () => {
      console.log('Vendor connected to server');
      newSocket.emit('registerVendor', user._id);
    });

    // Listen for new orders
    newSocket.on('newOrder', (data) => {
      toast.success(`New order received: ${data.orderId}`);
    });

    // Listen for order cancellations
    newSocket.on('orderCancelled', (data) => {
      toast.error(`Order ${data.orderId} was cancelled`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  return socket;
};