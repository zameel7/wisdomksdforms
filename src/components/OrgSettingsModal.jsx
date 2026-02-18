import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export default function OrgSettingsModal({ org, onClose, onUpdate }) {
  const { userProfile } = useAuth();
  const [apiKey, setApiKey] = useState(org.imgbbApiKey || "");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("user");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    async function fetchMembers() {
      setMembersLoading(true);
      try {
        const q = query(
          collection(db, "orgMembers"),
          where("orgId", "==", org.id)
        );
        const snapshot = await getDocs(q);
        setMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching members:", err);
      } finally {
        setMembersLoading(false);
      }
    }
    fetchMembers();
  }, [org.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const orgRef = doc(db, "organizations", org.id);
      await updateDoc(orgRef, { imgbbApiKey: apiKey });
      if (onUpdate) onUpdate({ ...org, imgbbApiKey: apiKey });
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    const email = addEmail.trim().toLowerCase();
    if (!email) return alert("Please enter an email address");
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return alert("Please enter a valid email address");

    setAddLoading(true);
    try {
      await addDoc(collection(db, "orgMembers"), {
        orgId: org.id,
        email,
        role: addRole,
        status: "pending",
        userId: null,
        invitedBy: userProfile.uid,
        createdAt: serverTimestamp(),
      });
      setAddEmail("");
      setAddRole("user");
      const q = query(collection(db, "orgMembers"), where("orgId", "==", org.id));
      const snapshot = await getDocs(q);
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user: " + (error.message || "Unknown error"));
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ width: "480px", maxWidth: "95vw" }}>
        <h3 className="mb-4">Organization Settings</h3>

        <div className="mb-4">
          <label className="block mb-2 text-sm text-muted">ImgBB API Key</label>
          <input
            type="password"
            className="input-field w-full"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API Key from imgbb.com"
          />
          <p className="text-xs text-muted mt-1">
            Required for image uploads. Get one at{" "}
            <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)" }}>
              api.imgbb.com
            </a>
            .
          </p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "1.5rem 0" }} />

        <div className="mb-4">
          <label className="block mb-2 text-sm text-muted">Team Members</label>
          {membersLoading ? (
            <p className="text-muted text-sm">Loading...</p>
          ) : (
            <ul className="mb-3" style={{ listStyle: "none", padding: 0, maxHeight: "120px", overflowY: "auto" }}>
              {members.map((m) => (
                <li key={m.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--glass-border)", fontSize: "0.875rem" }}>
                  {m.email}
                  <span style={{ marginLeft: "0.5rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {m.role} · {m.status === "pending" ? "Pending" : "Active"}
                  </span>
                </li>
              ))}
              {members.length === 0 && <li className="text-muted text-sm">No members yet</li>}
            </ul>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="email"
              className="input-field"
              style={{ flex: 1, minWidth: "140px" }}
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <select
              className="input-field"
              style={{ width: "100px" }}
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button className="btn btn-primary" onClick={handleAddUser} disabled={addLoading}>
              {addLoading ? "Adding..." : "Add"}
            </button>
          </div>
          <p className="text-xs text-muted mt-1">Invited users will get access when they sign in with Google using that email.</p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
