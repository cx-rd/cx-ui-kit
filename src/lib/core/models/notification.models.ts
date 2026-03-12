export type NotificationType = 'alert' | 'update';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    summary: string;
    fullContent?: string;
    imageUrl?: string;
    time: string | Date;
    isRead: boolean;
    sender?: string;
}
