import { ProductType } from "./product.type";
import { IUser } from "./user.type";

export interface IChat extends Document {
    participants: string[] | IUser[]; // Array of user IDs
    productId: string | ProductType;
    archivedBy: Map<string, boolean>;
    lastMessageTime: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  
  export interface IMessage extends Document {
    chatId: string;
    senderId: string | IUser;
    receiverId: string | IUser;
    text: string;
    isFlagged: boolean;
    flaggedReason?: string;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
  }