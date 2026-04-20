import { User } from "./user";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type RegisterResponse = {
  user: User;
};
