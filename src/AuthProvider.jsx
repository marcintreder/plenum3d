import React, { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import App from "./App.jsx";
import LandingPage from "./LandingPage.jsx";
import { fetchSettings, fetchProjects } from "./apiClient.js";

export const TOKEN_LIFETIME_MS = 3600 * 1000; // Google access tokens last 1 hour
export const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // refresh 5 min before expiry

const AuthProvider = () => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("plenum3d_user") || "null"); }
    catch { return null; }
  });
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("plenum3d_user");
    setUser(null);
    setInitialData(null);
  };

  const handleLogin = (userInfo) => {
    localStorage.setItem("plenum3d_user", JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleLogin({ credential: tokenResponse.access_token });
    },
    onError: (error) => console.error("Login failed:", error),
  });

  // Silent token refresh — fires with prompt:'none' so no popup appears
  const triggerSilentRefresh = useGoogleLogin({
    prompt: "none",
    onSuccess: async (tokenResponse) => {
      const refreshedUser = {
        ...user,
        credential: tokenResponse.access_token,
        tokenExpiresAt: Date.now() + TOKEN_LIFETIME_MS,
      };
      localStorage.setItem("plenum3d_user", JSON.stringify(refreshedUser));
      setUser(refreshedUser);
    },
    onError: () => {
      // Silent refresh failed (e.g. user signed out of Google) — force logout
      handleLogout();
    },
  });

  // Schedule silent refresh to run before the access token expires
  useEffect(() => {
    if (!user?.credential) return;

    const expiresAt = user.tokenExpiresAt ?? Date.now() + TOKEN_LIFETIME_MS;
    const delay = Math.max(0, expiresAt - REFRESH_BEFORE_EXPIRY_MS - Date.now());

    const timer = setTimeout(() => triggerSilentRefresh(), delay);
    return () => clearTimeout(timer);
  }, [user?.credential, user?.tokenExpiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch settings + projects from DB after login
  useEffect(() => {
    if (!user?.credential) return;
    setLoading(true);
    Promise.all([
      fetchSettings(user.credential).catch(() => null),
      fetchProjects(user.credential).catch(() => null),
    ]).then(([settings, projectsRes]) => {
      setInitialData({
        settings: settings ?? null,
        projects: projectsRes?.projects ?? null,
      });
    }).finally(() => setLoading(false));
  }, [user?.credential]);

  if (!user) {
    return <LandingPage onLogin={triggerGoogleLogin} />;
  }

  if (loading || !initialData) {
    return (
      <div className="flex h-screen w-screen bg-[#0F0F0F] items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading your workspace…</div>
      </div>
    );
  }

  return <App user={user} onLogout={handleLogout} initialData={initialData} />;
};

export default AuthProvider;
