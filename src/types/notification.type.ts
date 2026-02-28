export interface INotification {
    _id?: string;
    userId: string;
    title: string;
    case: string;
    type: 'order' | 'payment' | 'promotion' | 'system' | 'chat' | 'offer' | 'bid' | 'wallet'
        | 'dispute' | 'subscription' | 'payout' | 'refund' | 'withdrawal'
        | 'verification' | 'advertisement' | 'product' | 'account-warning'
        | 'issue' | 'subscription_upgrade';
    message: string;
    data: {
        redirectUrl: string;
        entityId: string;
        entityType: string;
        chatId?: string;
    };
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}