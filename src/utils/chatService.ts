import { fetchWithAuth } from './fetchWithAuth';

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const chatService = {
  async getChats(page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return fetchWithAuth(`/api/v1/messages/chats?${params}`);
  },

  async getChatMessages(chatId: string, page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return fetchWithAuth(`/api/v1/messages/${chatId}/messages?${params}`);
  },

  async sendMessage(chatId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string) {
    return fetchWithAuth(`/api/v1/messages/${chatId}/send`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        messageType,
        fileUrl,
        fileName,
      }),
    });
  },

  async createChat(participantId: string) {
    return fetchWithAuth('/api/v1/messages/create-chat', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  },

  async markAsRead(chatId: string) {
    return fetchWithAuth(`/api/v1/messages/${chatId}/mark-read`, {
      method: 'PATCH',
    });
  },

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetchWithAuth('/api/v1/messages/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  },

  async deleteMessage(messageId: string) {
    return fetchWithAuth(`/api/v1/messages/message/${messageId}`, {
      method: 'DELETE',
    });
  }
};