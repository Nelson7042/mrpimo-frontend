import { useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { API_BASE_URL } from '@/utils/config';

export const useMessageRead = (chatId: string | null, userId: string | null) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const markAsRead = async (chatId: string) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/messages/chat/${chatId}/read`, {
        method: 'PATCH'
      });
      // Invalidate chats query so unread counts update in the chat list
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const observeMessage = (element: HTMLElement) => {
    if (!observerRef.current || !chatId || !userId) return;

    observerRef.current.observe(element);
  };

  useEffect(() => {
    if (!chatId || !userId) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // Clear existing timeout
          if (readTimeoutRef.current) {
            clearTimeout(readTimeoutRef.current);
          }

          // Set new timeout to mark as read after 1 second of visibility
          readTimeoutRef.current = setTimeout(() => {
            markAsRead(chatId);
          }, 1000);
        }
      },
      {
        threshold: 0.5, // Message is 50% visible
        rootMargin: '0px'
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }
    };
  }, [chatId, userId]);

  return { observeMessage };
};