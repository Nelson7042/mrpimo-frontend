import React, { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { useMessages } from "@/hooks/queries";
import { useUserStore } from "@/stores/useUserStore";
import MessageSkeletonList from "./MessageListSkeleton";
import { useMessageRead } from "@/hooks/useMessageRead";


interface MessagesProps {
  selectedChat: any;
  newMessages?: any[];
}

const Messages = ({ selectedChat, newMessages = [] }: MessagesProps) => {
  const [shouldScroll, setShouldScroll] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const {user} = useUserStore();
  const { observeMessage } = useMessageRead(selectedChat?.chatId, user?._id);

  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    selectedChat?.chatId,
    messagesPage
  );
  
  const loadOlderMessages = () => {
    if (messagesData?.hasMore) {
      setMessagesPage((prev) => prev + 1);
    }
  };

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if content height exceeds container height
    if (messagesRef.current) {
      const container = messagesRef.current;
      setShouldScroll(container.scrollHeight > container.clientHeight);
    }
  }, [messagesData?.messages]);

  if (messagesLoading) {
    return (
      <MessageSkeletonList />
    );
  }

  return (
    <div
      ref={messagesRef}
      className={`flex-1 p-4 ${
        shouldScroll ? "overflow-y-auto" : "overflow-y-hidden"
      }`}
      style={{
        minHeight: "200px", // Minimum height to prevent tiny chat area
        maxHeight: "calc(100vh - 180px)", // Maximum height to prevent overflow
      }}
    >
      {!messagesData?.messages || messagesData.messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {messagesData?.hasMore && (
            <button
              onClick={loadOlderMessages}
              className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              Load older messages
            </button>
          )}
          {[...messagesData.messages, ...newMessages].map((message: any) => (
            <MessageBubble
              key={message._id || message.id}
              message={message}
              isSent={message.receiverId?._id !== user?._id || message.senderId === user?._id}
              onMessageVisible={observeMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
