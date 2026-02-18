import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function WaitingApproval() {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel text-center" style={{ maxWidth: '500px', width: '90%' }}>
        <img src="/logo.png" alt="Wisdom Forms" style={{ height: '50px', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '1rem' }}>Account Pending Approval</h2>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Hello <strong>{userProfile?.displayName}</strong>,<br/>
          Your account has been created successfully but requires administrator approval before you can access the dashboard.
        </p>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Please contact your organization administrator.
        </p>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
