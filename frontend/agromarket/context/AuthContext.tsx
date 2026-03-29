// context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { connect_socket, disconnect_socket } from "@/lib/socket";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user_data: User, user_token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored_user = localStorage.getItem("user");
      const stored_token = localStorage.getItem("token");

      if (stored_user && stored_token) {
        setUser(JSON.parse(stored_user));
        setToken(stored_token);
        connect_socket();
      }
    } catch (err) {
      console.error("Auth init error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (user_data: User, user_token: string): void => {
    localStorage.setItem("user", JSON.stringify(user_data));
    localStorage.setItem("token", user_token);
    setUser(user_data);
    setToken(user_token);
    connect_socket();
  };

  const logout = (): void => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    disconnect_socket();
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
