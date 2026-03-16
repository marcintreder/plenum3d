import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import { fetchSettings, fetchProjects } from "./apiClient.js";
import "./index.css";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Root = () => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("plenum3d_user") || "null"); }
    catch { return null; }
  });
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleLogin = (userInfo) => {
    localStorage.setItem("plenum3d_user", JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const handleLogout = () => {
    localStorage.removeItem("plenum3d_user");
    setUser(null);
    setInitialData(null);
  };

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={CLIENT_ID}>
        <LoginPage onLogin={handleLogin} />
      </GoogleOAuthProvider>
    );
  }

  if (loading || !initialData) {
    return (
      <div className="flex h-screen w-screen bg-[#0F0F0F] items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading your workspace…</div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App user={user} onLogout={handleLogout} initialData={initialData} />
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
