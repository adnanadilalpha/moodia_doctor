export interface Notification {
  id: string;
  doctorId: string;
  message: string;
  createdAt: Date;
  read: boolean;
  type: 'message' | 'session' | 'update' | 'daily_summary';
  priority?: 'low' | 'medium' | 'high';
  relatedId?: string; // ID of related item (e.g., messageId, sessionId)
  metadata?: {
    [key: string]: any;
  };
}
