import { ProductType } from './product.type';
import { IUser } from './user.type';

export interface IChat {
  _id: string;
  participants: string[] | IUser[];
  productId: string | ProductType;
  roles: Record<string, 'buyer' | 'vendor'>;
  archivedBy: Record<string, boolean>;
  lastMessageTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  chatId: string;
  senderId: string | IUser;
  receiverId: string | IUser;
  text: string;
  isFlagged: boolean;
  flaggedReason?: string;
  read: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
