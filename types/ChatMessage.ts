export interface ChatMessage {
  chatMessageId: number;
  streamId: number;
  userId: number;
  message: string;
  createdAt: Date;
  isDeleted: boolean;
  username: string;
  avatar: string | null;
  type?: "user" | "system";
}