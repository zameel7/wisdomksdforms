import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function hasOrgMembership(userProfile) {
  if (!userProfile) return false;
  if (userProfile.role === "superadmin") return true;
  const orgIds =
    userProfile.organizations && typeof userProfile.organizations === "object"
      ? Object.keys(userProfile.organizations)
      : userProfile.organizationIds || [];
  return orgIds.length > 0;
}

export default function WaitingApproval() {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile && hasOrgMembership(userProfile)) {
      navigate("/dashboard");
    }
  }, [userProfile, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex-center" style={{ minHeight: "100vh" }}>
      <div className="glass-panel text-center" style={{ maxWidth: "500px", width: "90%" }}>
        <img src="/logo.png" alt="Wisdom Forms" style={{ height: "50px", marginBottom: "1rem" }} />
        <h2 style={{ marginBottom: "1rem" }}>No Organization Assigned</h2>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
          Hello <strong>{userProfile?.displayName}</strong>,<br />
          You don&apos;t have access to any organization yet.
        </p>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Ask your administrator to add you by email.
        </p>
        <button className="btn" style={{ background: "rgba(255,255,255,0.1)" }} onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
