import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string): Socket {
    if (this.socket?.connected && this.userId === userId) {
      return this.socket;
    }

    this.userId = userId;
    this.socket = io('http://localhost:5800', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.socket?.emit('authenticate', { userId });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinRoom(roomId: string): void {
    this.socket?.emit('join_room', roomId);
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave_room', roomId);
  }

  sendMessage(messageData: {
    senderId: string;
    receiverId: string;
    message: string;
    chatId: string;
  }): void {
    this.socket?.emit('send_message', messageData);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.userId = null;
  }
}

export default new SocketService();