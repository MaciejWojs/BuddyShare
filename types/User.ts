import { Role } from './Roles';
export interface User {
  id: number;
  email: string;
  displayName: string;
  profilePicture: string | null;
  role: Role;
  createdAt: string;
  lastLogin: string;
}