import { Navigate, useLocation } from "react-router-dom";

/** Legacy route — forwards to the unified prepare screen. */
export function ImportBookPage() {
  const location = useLocation();
  return <Navigate to="/verify" replace state={location.state} />;
}
