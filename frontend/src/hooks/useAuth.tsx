import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "../utils/constants";
import { User } from "../types/user";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login(nextToken, nextUser) {
        localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
      },
      logout() {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setToken(null);
        setUser(null);
      }
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

function readStoredUser() {
  const value = localStorage.getItem(USER_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}
