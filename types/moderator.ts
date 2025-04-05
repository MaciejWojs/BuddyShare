import { Role } from "./Roles";
export interface Moderator {
  streamModeratorId: number;
  streamerId: number;
  moderatorId: number;
  moderator: {
    moderatorId: number;
    userId: number;
    user: {
      userId: number;
      userInfoId: number;
      userSettingsId: number;
      userInfo: {
        userInfoId: number;
        username: string;
        profilePicture: string | null;
        description: string | null;
        email: string;
        isBanned: boolean;
        createdAt: string;
        updatedAt: string;
        userRole: Role;
      };
    };
  };
}
