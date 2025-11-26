import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle, Package, Clock, MessageSquareOff } from 'lucide-react';

interface ChatListProps {
  groupedChats: any[];
  onChatSelect: (chat: any, product: any, group?: any) => void;
  setParticipantName: (name: string) => void; 
  formatMessageTime: (date: Date) => string;
  filterType: 'All' | 'Unread';
}

const ChatList = ({ groupedChats, onChatSelect, formatMessageTime, filterType, setParticipantName }: ChatListProps) => {
  
  // Filter chats based on filterType
  const filteredChats = groupedChats.filter(group => {
    if (filterType === 'Unread') {
      return group.totalUnread > 0;
    }
    return true; // Show all for 'All' filter
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleProduct = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  return (
    <div className="space-y-1 px-2">
      {filteredChats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <MessageSquareOff size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {filterType === 'Unread' ? 'No unread messages' : 'No conversations'}
          </p>
        </div>
      ) : (
        filteredChats.map((group: any) => {
        const isGroupExpanded = expandedGroups.has(group._id);
        
        return (
          <div key={group._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {/* Group Header */}
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => toggleGroup(group._id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {group.participantName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{group.participantName}</h3>
                  <p className="text-xs text-gray-500">{group.productChats.length} product{group.productChats.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {group.totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {group.totalUnread}
                  </span>
                )}
                {isGroupExpanded ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Product Chats */}
            {isGroupExpanded && (
              <div className="border-t border-gray-100 bg-gray-50">
                {group.productChats.map((productChat: any) => {
                  const isProductExpanded = expandedProducts.has(productChat.chatId);
                  // Calculate unread count for this product
                  const unreadCount = productChat.recentMessages?.filter((msg: any) => !msg.read && msg.senderId._id !== group._id).length || 0;
                  
                  return (
                    <div key={productChat.chatId} className="border-b border-gray-100 last:border-b-0">
                      {/* Product Header */}
                      <div 
                        className="flex items-center justify-between p-3 hover:bg-white cursor-pointer transition-colors"
                        onClick={() => toggleProduct(productChat.chatId)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {productChat.product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(new Date(productChat.lastMessageTime))}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              {unreadCount}
                            </span>
                          )}
                          {isProductExpanded ? (
                            <ChevronDown size={14} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={14} className="text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Latest Message Preview - Only when collapsed */}
                      {!isProductExpanded && (
                        <div className="px-3 pb-3">
                          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="flex items-start gap-2">
                              <MessageCircle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {productChat.lastMessage}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-400">
                                    Latest message
                                  </span>
                                  {unreadCount > 0 && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      {unreadCount} unread
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Full Chat View - Only when expanded */}
                      {isProductExpanded && (
                        <div className="p-3 bg-white">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onChatSelect(productChat, productChat.product, group);
                              setParticipantName(group.participantName);
                              // Close expansion
                              setExpandedProducts(new Set());
                              setExpandedGroups(new Set());
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm"
                          >
                            Open Conversation
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }))}
    </div>
  );
};

export default ChatList;