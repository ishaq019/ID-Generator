import { createContext, useContext, useMemo, useState } from "react";
import {
  authAPI,
  clearAuthToken,
  getAuthToken,
  getStoredAuthUser,
  setAuthToken,
  setStoredAuthUser
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getStoredAuthUser());

  const login = async ({ username, password }) => {
    const response = await authAPI.login({ username, password });

    setAuthToken(response.data.token);
    setStoredAuthUser(response.data.user);

    setToken(response.data.token);
    setUser(response.data.user);

    return response.data;
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      logout
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
