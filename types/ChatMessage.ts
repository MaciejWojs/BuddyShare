export interface ChatMessage {
  chatMessageId: number;
  streamId: number;
  userId: number;
  message: string;
  createdAt: Date;
  isDeleted: boolean;
  username: string;
}
