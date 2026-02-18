import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Login() {
  const { login, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userProfile) {
      if (userProfile.role === 'admin' || userProfile.role === 'superadmin') {
        navigate("/dashboard");
      } else if (userProfile.role === 'pending') {
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
