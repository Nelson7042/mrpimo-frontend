export interface INotification {
    _id?: string;
    userId: string;
    title: string;
    case: string;
    type: 'order' | 'payment' | 'promotion' | 'system' | 'chat';
    message: string;
    data: {
        redirectUrl: string;
        entityId: string;
        entityType: string;
    };
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}