import { Role } from './Roles';

export interface User {
  userId: number;
  userInfoId: number;
  userSettingsId: number;
  userInfo: UserInfo;
  settings?: {
    notificationsEnabled: boolean;
    darkMode: boolean;
  }
};

export interface UserInfo {
  userInfoId: number;
  username: string;
  profilePicture: string;
  description: string;
  email: string;
  isBanned: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  userRole: Role;
}
