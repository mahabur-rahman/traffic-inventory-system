import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export function RequireAuth(props: { children: React.ReactNode }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return props.children;
}

