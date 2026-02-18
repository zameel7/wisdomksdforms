import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

function hasOrgMembership(userProfile) {
  if (!userProfile) return false;
  if (userProfile.role === "superadmin") return true;
  const orgIds =
    userProfile.organizations && typeof userProfile.organizations === "object"
      ? Object.keys(userProfile.organizations)
      : userProfile.organizationIds || [];
  return orgIds.length > 0;
}

export default function AdminGuard({ children }) {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex-center" style={{ minHeight: "100vh" }}>Loading...</div>;
  }

  if (!userProfile) {
    return <Navigate to="/" />;
  }

  if (!hasOrgMembership(userProfile)) {
    return <Navigate to="/waiting-approval" />;
  }

  return children;
}
