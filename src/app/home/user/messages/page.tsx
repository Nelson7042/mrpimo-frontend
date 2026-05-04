"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Phone, Search } from "lucide-react";
import ChatContainerHeader from "./(components)/ChatContainerHeader";
import Messages from "./(components)/Messages";
import SendMessage from "./(components)/SendMessage";
import ProductModal from "./(components)/ProductModal";
import ChatList from "./(components)/ChatList";
import { useChats, useMessages } from "@/hooks/queries";
import MessageListSkeleton from "./(components)/MessageListSkeleton";
import SocketService from "@/utils/socketService";
import { useUserStore } from "@/stores/useUserStore";
import { toastConfigError } from "@/app/config/toast.config";
import { useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_BASE_URL } from "@/utils/config";

interface ProductModal {
  isOpen: boolean;
  product: any;
}

// Helper function to format dates for display
const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
};

const Page = () => {
  const { data: chatsData, isLoading } = useChats();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [participantName, setParticipantName] = useState<string>("");
  const [selectedButton, setSelectedButton] = useState<"All" | "Unread">("All");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [currentGroup, setCurrentGroup] = useState<any>(null);
  const [productModal, setProductModal] = useState<ProductModal>({
    isOpen: false,
    product: null,
  });
  const [newMessages, setNewMessages] = useState<{[chatId: string]: any[]}>({});
  const [onlineUsers, setOnlineUsers] = useState<{[userId: string]: boolean}>({});

  const groupedChats = chatsData?.groupedChats || [];

  // Initialize online status from API response
  useEffect(() => {
    if (groupedChats.length > 0) {
      const statuses: {[userId: string]: boolean} = {};
      for (const group of groupedChats) {
        statuses[group._id] = !!group.isOnline;
      }
      setOnlineUsers(prev => ({ ...prev, ...statuses }));
    }
  }, [chatsData]);

  // Handle focused chat from product page
  useEffect(() => {
    const focusedChatId = localStorage.getItem('focusedChatId');
    if (focusedChatId && groupedChats.length > 0) {
      // Find the chat in grouped chats
      for (const group of groupedChats) {
        for (const productChat of group.productChats) {
          if (productChat.chatId === focusedChatId) {
            handleChatSelect(productChat, productChat.product, group);
            localStorage.removeItem('focusedChatId'); // Clean up
            break;
          }
        }
      }
    }
  }, [groupedChats]);

  // Socket.io connection and event handlers
  useEffect(() => {
    if (user?._id) {
      const socket = SocketService.connect(user._id);
      
      // Authenticate user
      socket.emit('authenticate', { userId: user._id });
      
      // Listen for persisted messages
      socket.on('persisted-message', (message: any) => {
        setNewMessages(prev => {
          const currentMessages = prev[message.chatId] || [];
          // Remove optimistic message with same content and add real message
          const filteredMessages = currentMessages.filter(msg => 
            !(msg.isOptimistic && msg.message === message.message && msg.senderId?._id === message.senderId)
          );
          return {
            ...prev,
            [message.chatId]: [...filteredMessages, message]
          };
        });
      });

      socket.on('error', (message: any) => {
        console.error('Socket error:', message);
      })
      
      // Listen for flagged messages
      socket.on('messageFlagged', (data: any) => {
        console.log('Message flagged:', data.flaggedReason);
      });

      // Listen for user presence changes (online/offline)
      socket.on('user-presence-changed', (data: { userId: string; isOnline: boolean }) => {
        setOnlineUsers(prev => ({ ...prev, [data.userId]: data.isOnline }));
      });

      // Listen for individual user status responses
      socket.on('user-status', (data: { userId: string; isOnline: boolean }) => {
        setOnlineUsers(prev => ({ ...prev, [data.userId]: data.isOnline }));
      });

      // Listen for message edits
      socket.on('chat:message-edited', () => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      });
      
      return () => {
        socket.off('persisted-message');
        socket.off('messageFlagged');
        socket.off('user-presence-changed');
        socket.off('user-status');
        socket.off('chat:message-edited');
      };
    }
  }, [user?._id]);

  // Join chat room when selecting a chat
  useEffect(() => {
    if (selectedChat?.chatId) {
      SocketService.joinRoom(selectedChat.chatId);
      return () => {
        SocketService.leaveRoom(selectedChat.chatId);
      };
    }
  }, [selectedChat?.chatId]);

  const handleChatSelect = (chat: any, product: any, group?: any) => {
    setSelectedChat(chat);
    setSelectedProduct(product);
    if (group) {
      setCurrentGroup(group);
      setParticipantName(group.participantName);
      // Check online status of the other participant
      const socket = SocketService.getSocket();
      if (socket) {
        socket.emit('check-online', { userId: group._id });
      }
    }
    setIsChatOpen(true);

    // Mark chat messages as read immediately when opening
    if (chat?.chatId) {
      fetchWithAuth(`${API_BASE_URL}/messages/chat/${chat.chatId}/read`, {
        method: 'PATCH'
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }).catch(err => console.error('Failed to mark chat as read:', err));
    }
  };

  const handleProductSwitch = (newChat: any, newProduct: any) => {
    setSelectedChat(newChat);
    setSelectedProduct(newProduct);
  };

  const handleSendMessage = (messageText: string) => {
  if (!selectedChat || !user || !currentGroup) return;
  
  const socket = SocketService.getSocket();
  if (socket) {
    // 1. Match the backend payload
    const messageData = {
      senderId: user._id,
      receiverId: currentGroup._id,
      message: messageText, // Keep this if your backend expects "message"
      chatId: selectedChat.chatId,
    };

    // 2. Match the MessageBubble interface exactly
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      senderId: { _id: user._id }, 
      text: messageText, // CHANGED FROM 'message' TO 'text'
      chatId: selectedChat.chatId,
      createdAt: new Date().toISOString(),
      read: false,
      isOptimistic: true
    };
    
    setNewMessages(prev => ({
      ...prev,
      [selectedChat.chatId]: [...(prev[selectedChat.chatId] || []), optimisticMessage]
    }));

    socket.emit('send_message', messageData);
  }
};

  return (
    <div className="">
      <div className="">
        <div className="hidden md:block md:mb-5 ">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-semibold text-xl">My messages</h1>
              <p className="text-sm opacity-70">Everything is here!</p>
            </div>
            {/* <div className="flex gap-x-2 items-center border rounded-sm border-gray-400 p-2">
              <Search size={18} strokeWidth={4} className="text-gray-600" />
              <input
                className="xl:w-md"
                type="search"
                placeholder="Search Conversations"
              />
            </div> */}
          </div>
        </div>
        <div className="flex gap-x-2 h-[calc(100vh-200px)]" style={{ minHeight: '600px' }}>
          <div
            className={`${
              isChatOpen ? "hidden lg:block" : "block"
            }  md:mx-0 lg:m-0 w-full lg:w-[45%] xl:w-[40%] border rounded-2xl lg:rounded-none  lg:p-2 bg-white`}
          >
            <h1 className="hidden lg:block text-center font-semibold mb-2">
              Chats
            </h1>
            <div className="flex gap-x-2 items-center border rounded-sm border-gray-400 p-2 m-4 lg:m-2 md:hidden">
              <Search size={18} strokeWidth={4} className="text-gray-600" />
              <input
                className="w-full"
                type="search"
                placeholder="Search Conversationsxx"
              />
            </div>
            <div className="flex gap-x-4 w-full justify-between items-center px-3 md:mt-3 lg:mt-0 mb-4">
              <button
                className={`${
                  selectedButton === "All"
                    ? "bg-[#f5f9ff] border-blue-200"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-300"
                } p-2 rounded-md w-full border transition-colors cursor-pointer disabled:cursor-not-allowed`}
                onClick={() => setSelectedButton("All")}
                disabled={isLoading}
              >
                All
              </button>
              <button
                className={`${
                  selectedButton === "Unread"
                    ? "bg-[#f5f9ff] border-blue-200"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-300"
                } p-2 rounded-md w-full border transition-colors cursor-pointer disabled:cursor-not-allowed`}
                onClick={() => setSelectedButton("Unread")}
                disabled={isLoading}
              >
                Unread
              </button>
            </div>
            {/* Chat List */}
            <div className="flex flex-col w-full h-[calc(100%-80px)] overflow-y-auto mt-2">
              {isLoading ? (
                <div className="px-4">
                  <MessageListSkeleton />
                </div>
                
              ) : (<>
              {groupedChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-center">
                    No conversations yet
                  </p>
                  <p className="text-gray-400 text-sm text-center mt-1">
                    Messages will appear here
                  </p>
                </div>
              ) : (
                <ChatList
                  groupedChats={groupedChats}
                  onChatSelect={handleChatSelect}
                  formatMessageTime={formatMessageTime}
                  filterType={selectedButton}
                  setParticipantName={setParticipantName}
                />
              )}
              </>)}
            </div>
          </div>
          <div className="hidden lg:block lg:w-[55%] xl:w-[60%] border border-blue-300 bg-white">
            {selectedChat ? (
              <div className="w-full h-full flex flex-col">
                <ChatContainerHeader
                  chat={{ ...selectedChat, onlineStatus: onlineUsers[currentGroup?._id] }}
                  product={selectedProduct}
                  closeChat={() => setIsChatOpen(false)}
                  setProductModal={setProductModal}
                  participantName={participantName}
                  currentGroup={currentGroup}
                  onProductSwitch={handleProductSwitch}
                />
                {/* Messages */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1">
                    <Messages 
                      selectedChat={selectedChat} 
                      newMessages={newMessages[selectedChat?.chatId] || []}
                    />
                  </div>
                  <SendMessage
                    userId={selectedChat.senderId}
                    onSend={handleSendMessage}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="bg-gray-50 rounded-lg p-6 text-center w-full max-w-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No Conversation Selected
                  </h3>
                  <p className="text-gray-500">
                    Select a message from the list to view your conversation
                    history.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        {isChatOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white">
            <div className="w-full h-full flex flex-col">
              {/* Chat container header */}
              {selectedChat && (
                <ChatContainerHeader
                  chat={{ ...selectedChat, onlineStatus: onlineUsers[currentGroup?._id] }}
                  product={selectedProduct}
                  closeChat={() => setIsChatOpen(false)}
                  setProductModal={setProductModal}
                  participantName={participantName}
                  currentGroup={currentGroup}
                  onProductSwitch={handleProductSwitch}
                />
              )}
              <div className="flex-1 overflow-hidden flex flex-col">
                {selectedChat ? (
                  <>
                    <div className="flex-1 ">
                      <Messages 
                        selectedChat={selectedChat} 
                        newMessages={newMessages[selectedChat?.chatId] || []}
                      />
                    </div>
                    <div className="border-t bg-white">
                      <SendMessage
                        userId={selectedChat.senderId}
                        onSend={handleSendMessage}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 p-4">
                    Select a message to view details.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Modal */}
        <ProductModal
          isOpen={productModal.isOpen}
          product={productModal.product}
          onClose={() => setProductModal({ isOpen: false, product: null })}
        />
      </div>
    </div>
  );
};

export default Page;
