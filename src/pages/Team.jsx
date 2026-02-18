import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useOrganizations } from "../hooks/useOrganizations";

export default function Team() {
  const { userProfile } = useAuth();
  const { organizations, currentOrg, setCurrentOrg, isOrgAdmin, loading: orgsLoading } = useOrganizations();
  const location = useLocation();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("user");
  const [addLoading, setAddLoading] = useState(false);

  const canManageTeam = currentOrg && (userProfile?.role === "superadmin" || isOrgAdmin(currentOrg.id));

  useEffect(() => {
    const orgId = location.state?.orgId;
    if (orgId && organizations.length > 0) {
      const org = organizations.find((o) => o.id === orgId);
      if (org) setCurrentOrg(org);
    }
  }, [location.state?.orgId, organizations, setCurrentOrg]);

  useEffect(() => {
    if (!currentOrg) {
      setLoading(false);
      return;
    }
    async function fetchMembers() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "orgMembers"),
          where("orgId", "==", currentOrg.id)
        );
        const snapshot = await getDocs(q);
        setMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [currentOrg?.id]);

  const handleAddUser = async () => {
    const email = addEmail.trim().toLowerCase();
    if (!email) return alert("Please enter an email address");
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return alert("Please enter a valid email address");

    setAddLoading(true);
    try {
      await addDoc(collection(db, "orgMembers"), {
        orgId: currentOrg.id,
        email,
        role: addRole,
        status: "pending",
        userId: null,
        invitedBy: userProfile.uid,
        createdAt: serverTimestamp(),
      });
      setAddEmail("");
      setAddRole("user");
      const q = query(collection(db, "orgMembers"), where("orgId", "==", currentOrg.id));
      const snapshot = await getDocs(q);
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user: " + (error.message || "Unknown error"));
    } finally {
      setAddLoading(false);
    }
  };

  if (orgsLoading) {
    return (
      <div className="container flex-center" style={{ minHeight: "50vh" }}>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (organizations?.length === 0) {
    return (
      <div className="container">
        <button className="btn btn-ghost mb-4" style={{ paddingLeft: 0 }} onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <div className="dashboard-select-org">
          <p className="text-muted">You don&apos;t have any organizations.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="container">
        <button className="btn btn-ghost mb-4" style={{ paddingLeft: 0 }} onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <div className="dashboard-select-org">
          <p className="text-muted">Select an organization to manage team members.</p>
          {organizations?.length > 1 && (
            <select
              className="input-field"
              style={{ maxWidth: "300px", marginTop: "1rem" }}
              onChange={(e) => setCurrentOrg(organizations.find((o) => o.id === e.target.value))}
            >
              <option value="">Choose organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary mt-4" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button className="btn btn-ghost mb-4" style={{ paddingLeft: 0 }} onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>

      <div className="dashboard-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="dashboard-title" style={{ marginBottom: "0.25rem" }}>Team</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {organizations?.length > 1 ? (
              <select
                className="input-field"
                style={{ width: "auto", minWidth: "180px" }}
                value={currentOrg.id}
                onChange={(e) => setCurrentOrg(organizations.find((o) => o.id === e.target.value))}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-muted text-sm">{currentOrg.name}</p>
            )}
          </div>
        </div>
      </div>

      {canManageTeam ? (
        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Add member</h3>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <input
              type="email"
              className="input-field"
              style={{ flex: 1, minWidth: "200px" }}
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <select
              className="input-field"
              style={{ width: "120px" }}
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-primary" onClick={handleAddUser} disabled={addLoading}>
              {addLoading ? "Adding..." : "Invite"}
            </button>
          </div>
          <p className="text-muted text-sm">
            Invited users will get access when they sign in with Google using that email.
          </p>
        </div>
      ) : (
        <div className="dashboard-card" style={{ padding: "1.5rem" }}>
          <p className="text-muted">You don&apos;t have permission to manage team members for this organization.</p>
        </div>
      )}

      <div className="dashboard-card" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>Members</h3>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-muted">No members yet. Add members above to get started.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {members.map((m) => (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span style={{ fontWeight: 500 }}>{m.email}</span>
                <span
                  style={{
                    display: "inline-flex",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: m.role === "admin" ? "#dbeafe" : "#f1f5f9",
                      color: m.role === "admin" ? "#1d4ed8" : "var(--text-muted)",
                      fontWeight: 500,
                    }}
                  >
                    {m.role}
                  </span>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: m.status === "active" ? "#dcfce7" : "#fef3c7",
                      color: m.status === "active" ? "#16a34a" : "#b45309",
                      fontSize: "0.75rem",
                    }}
                  >
                    {m.status === "pending" ? "Pending" : "Active"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
