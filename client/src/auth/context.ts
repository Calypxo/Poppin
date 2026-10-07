import { createContext, useContext } from "react";
import type { User } from "../types/account";
export interface SessionResponse {
  token: string;
  user: User;
}
export interface AuthValue {
  user: User | null;
  loading: boolean;
  error: string;
  authenticate: (response: SessionResponse) => void;
  logout: () => void;
  refresh: (restore?: boolean) => Promise<void>;
}
export const AuthContext = createContext<AuthValue | null>(null);
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is missing");
  return auth;
}
