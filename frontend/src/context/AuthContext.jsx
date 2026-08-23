import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("lf_token"));
  const [loading, setLoading] = useState(true);

  // On mount, verify stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me().then(({ data, error }) => {
      if (error) { localStorage.removeItem("lf_token"); setToken(null); }
      else setUser(data.user);
      setLoading(false);
    });
  }, []);

  const saveSession = ({ token: t, user: u }) => {
    localStorage.setItem("lf_token", t);
    setToken(t);
    setUser(u);
  };

  const register = async (body) => {
    const { data, error } = await api.register(body);
    if (error) return { error };
    saveSession(data);
    return { error: null };
  };

  const login = async (body) => {
    const { data, error } = await api.login(body);
    if (error) return { error };
    saveSession(data);
    return { error: null };
  };

  const logout = () => {
    localStorage.removeItem("lf_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
