export type UserRole = "admin" | "technical_specialist" | "guest";
export type UserStatus = "pending" | "active" | "blocked";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};
