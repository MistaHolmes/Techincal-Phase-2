import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "admin" | "denied">("loading");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    axios
      .get(`${API_URL}/api/admin/check`, { withCredentials: true })
      .then(() => setStatus("admin"))
      .catch(() => setStatus("denied"));
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e131f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-[Manrope]">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/blogs" replace />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
