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

export default function Login() {
  const { login, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userProfile) {
      if (hasOrgMembership(userProfile)) {
        navigate("/dashboard");
      } else {
        navigate("/waiting-approval");
      }
    }
  }, [currentUser, userProfile, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Failed to log in", error);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel text-center" style={{ maxWidth: '400px', width: '90%' }}>
        <img src="/logo.png" alt="Wisdom Forms" style={{ height: '60px', marginBottom: '1.5rem' }} />
        <h1 style={{ marginBottom: '1.5rem' }}>Welcome to Wisdom Forms</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Create and manage organizational forms with ease and style.
        </p>
        <button className="btn btn-primary" onClick={handleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
