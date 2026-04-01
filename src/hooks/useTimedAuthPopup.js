import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

export default function useTimedAuthPopup(delay = 45000) {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      return;
    }

    const blockedPages = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
    ];

    if (blockedPages.includes(location.pathname)) {
      setOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      setOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [user, delay, location.pathname]);

  return { open, setOpen };
}
