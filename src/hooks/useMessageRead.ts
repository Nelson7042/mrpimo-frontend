import { useRef, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export const useMessageRead = (chatId: string | null, userId: string | null) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const readTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markAsRead = async (chatId: string) => {
    try {
      await fetchWithAuth(`http://localhost:5800/api/v1/messages/chat/${chatId}/read`, {
        method: 'PATCH'
      });
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