export type BanOptions = {
  reason?: string;
  bannedBy: number;
  bannedUntil?: Date | null;
  isPermanent?: boolean;
}