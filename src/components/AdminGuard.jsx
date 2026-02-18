import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function AdminGuard({ children }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  }

  if (!userProfile) {
    return <Navigate to="/" />;
  }

  if (userProfile.role === 'pending') {
    return <Navigate to="/waiting-approval" />;
  }

  if (userProfile.role === 'admin' || userProfile.role === 'superadmin') {
    return children;
  }

  return <Navigate to="/" />;
}
