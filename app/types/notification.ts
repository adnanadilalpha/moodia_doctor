export interface Notification {
  id: string;
  doctorId: string;
  message: string;
  chatId: string;
  createdAt: Date;
  read: boolean;
  // Add any other properties that your notifications have
}
