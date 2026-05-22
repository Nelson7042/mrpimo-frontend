"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, AlertTriangle, RefreshCw } from "lucide-react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  _id: string;
  userId: string | { _id: string; firstName?: string; lastName?: string };
  content: string;
  createdAt: string;
}

interface PaginationMetadata {
  total: number;
  currentPage: number;
  hasMore: boolean;
}

interface DisputeChatPaginatedProps {
  issueId: string;
  currentUserId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DisputeChatPaginated({
  issueId,
  currentUserId,
}: DisputeChatPaginatedProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(1);
  const [metadata, setMetadata] = useState<PaginationMetadata>({
    total: 0,
    currentPage: 1,
    hasMore: false,
  });
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send message state
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Initial load failure state
  const [initialLoadFailed, setInitialLoadFailed] = useState(false);

  // Rate limit state
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number>(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // ─── Fetch messages ──────────────────────────────────────────────────────

  const fetchMessages = useCallback(
    async (pageNum: number, append: boolean = false): Promise<boolean> => {
      try {
        const response = await fetchWithAuth(
          `${API_BASE_URL}/issues/${issueId}/chat?page=${pageNum}&limit=20`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to load messages");
        }

        const data = await response.json();
        const fetchedMessages: ChatMessage[] = data.messages || [];
        const fetchedMetadata: PaginationMetadata = data.metadata || {
          total: 0,
          currentPage: pageNum,
          hasMore: false,
        };

        if (append) {
          // Prepend older messages (they go at the top)
          setMessages((prev) => [...prev, ...fetchedMessages]);
        } else {
          setMessages(fetchedMessages);
        }

        setMetadata(fetchedMetadata);
        setError(null);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to load messages");
        return false;
      }
    },
    [issueId]
  );

  // Initial load — most recent 20 messages
  useEffect(() => {
    setIsLoadingInitial(true);
    setInitialLoadFailed(false);
    fetchMessages(1).then((success) => {
      setInitialLoadFailed(!success);
      setIsLoadingInitial(false);
    });
  }, [fetchMessages]);

  // ─── Infinite scroll — load next page when user scrolls to top ───────────

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && metadata.hasMore && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [metadata.hasMore, isLoadingMore, page]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !metadata.hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    // Save scroll position before loading
    const container = chatContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;

    await fetchMessages(nextPage, true);
    setPage(nextPage);
    setIsLoadingMore(false);

    // Restore scroll position after new messages are prepended
    requestAnimationFrame(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - previousScrollHeight;
      }
    });
  };

  // ─── Send message ────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed || isSending || rateLimitCooldown > 0) return;

    setIsSending(true);
    setSendError(null);

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/issues/${issueId}/chat`,
        {
          method: "POST",
          body: JSON.stringify({ content: trimmed }),
        }
      );

      if (response.status === 429) {
        // Rate limited — retain message text in input (Req 15.2)
        const data = await response.json().catch(() => ({}));
        const retryAfter = data.retryAfter || 60;
        startCooldown(retryAfter);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }

      const data = await response.json();
      const sentMessage: ChatMessage = data.message || {
        _id: Date.now().toString(),
        userId: currentUserId,
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      // Add new message to the beginning (most recent first)
      setMessages((prev) => [sentMessage, ...prev]);
      setNewMessage("");

      // Scroll to bottom to show new message
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      });
    } catch (err: any) {
      // Req 15.1: Show inline send error; Req 15.2: message text retained in input
      setSendError(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // ─── Rate limit cooldown ─────────────────────────────────────────────────

  const startCooldown = (seconds: number) => {
    setRateLimitCooldown(seconds);

    // Clear any existing timer
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  // ─── Key handler ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ─── Retry initial load ──────────────────────────────────────────────────

  const handleRetryInitialLoad = () => {
    setIsLoadingInitial(true);
    setInitialLoadFailed(false);
    setError(null);
    fetchMessages(1).then((success) => {
      setInitialLoadFailed(!success);
      setIsLoadingInitial(false);
    });
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getUserName = (userId: ChatMessage["userId"]): string => {
    if (typeof userId === "object" && userId !== null) {
      return [userId.firstName, userId.lastName].filter(Boolean).join(" ") || "User";
    }
    return userId === currentUserId ? "You" : "User";
  };

  const isOwnMessage = (userId: ChatMessage["userId"]): boolean => {
    if (typeof userId === "object" && userId !== null) {
      return userId._id === currentUserId;
    }
    return userId === currentUserId;
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoadingInitial) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="chat-loading">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading messages...</span>
      </div>
    );
  }

  // Req 15.4: Show error state with retry button when initial message load fails
  if (initialLoadFailed) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 space-y-3 border rounded-lg"
        data-testid="chat-load-error"
      >
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-red-600">{error || "Failed to load messages"}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetryInitialLoad}
          data-testid="chat-retry-button"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg" data-testid="dispute-chat">
      {/* Chat messages area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]"
        data-testid="chat-messages-container"
      >
        {/* Loading more indicator at top */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-2" data-testid="loading-more">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            <span className="ml-2 text-xs text-gray-500">Loading older messages...</span>
          </div>
        )}

        {/* Top sentinel for scroll detection */}
        <div ref={topSentinelRef} />

        {/* Messages rendered in reverse (newest at bottom for display) */}
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8" data-testid="no-messages">
            No messages yet. Start the conversation.
          </div>
        ) : (
          [...messages].reverse().map((msg) => (
            <div
              key={msg._id}
              className={`flex flex-col ${
                isOwnMessage(msg.userId) ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  isOwnMessage(msg.userId)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
              <span className="text-xs text-gray-400 mt-1">
                {getUserName(msg.userId)} · {formatTime(msg.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Rate limit cooldown message (Req 15.3) */}
      {rateLimitCooldown > 0 && (
        <div
          className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2"
          data-testid="rate-limit-cooldown"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <p className="text-sm text-yellow-700">
            Rate limit reached. You can send again in {rateLimitCooldown}s.
          </p>
        </div>
      )}

      {/* Message input */}
      <div className="border-t p-3 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending || rateLimitCooldown > 0}
          data-testid="chat-input"
        />
        <Button
          size="sm"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending || rateLimitCooldown > 0}
          data-testid="chat-send-button"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Req 15.1: Inline error notification below message input on send failure */}
      {sendError && (
        <div
          className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2"
          data-testid="chat-send-error"
        >
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-600">{sendError}</p>
        </div>
      )}
    </div>
  );
}
