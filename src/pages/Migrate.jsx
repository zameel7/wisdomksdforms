/**
 * One-time migration: Migrate users with organizationIds to orgMembers + organizations map.
 * Run as superadmin: navigate to /migrate while logged in.
 */
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

export default function Migrate() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  if (userProfile?.role !== "superadmin") {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <div className="glass-panel p-4 text-center">
          <p>Superadmin access required.</p>
          <button className="btn mt-4" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const runMigration = async () => {
    setRunning(true);
    setStatus("Fetching users...");
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      let migrated = 0;
      let skipped = 0;

      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const uid = userDoc.id;
        const orgIds = data.organizationIds;

        if (!orgIds || !Array.isArray(orgIds) || orgIds.length === 0) {
          skipped++;
          continue;
        }

        if (data.organizations && typeof data.organizations === "object" && Object.keys(data.organizations).length > 0) {
          setStatus(`Skipping ${data.email || uid} (already migrated)`);
          skipped++;
          continue;
        }

        setStatus(`Migrating ${data.email || uid}...`);
        const organizations = {};
        const isAdmin = data.role === "admin" || data.role === "superadmin";

        for (const orgId of orgIds) {
          organizations[orgId] = isAdmin ? "admin" : "user";
          await addDoc(collection(db, "orgMembers"), {
            orgId,
            userId: uid,
            email: data.email || "",
            role: isAdmin ? "admin" : "user",
            status: "active",
            invitedBy: data.uid || uid,
            createdAt: serverTimestamp(),
          });
        }

        const updateData = {
          organizations,
          ...(isAdmin && { hasOrgAdminRole: true }),
        };
        await updateDoc(doc(db, "users", uid), updateData);
        migrated++;
      }

      setStatus(`Done. Migrated ${migrated} users, skipped ${skipped}.`);
      setDone(true);
    } catch (err) {
      console.error("Migration error:", err);
      setStatus("Error: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: "100vh" }}>
      <div className="glass-panel p-6 text-center" style={{ maxWidth: "500px" }}>
        <h2 className="mb-4">Migration: organizationIds → orgMembers</h2>
        <p className="text-muted text-sm mb-4">
          Migrates users with organizationIds to the new orgMembers collection and organizations map.
        </p>
        {status && <p className="mb-4" style={{ fontSize: "0.875rem", wordBreak: "break-word" }}>{status}</p>}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={runMigration} disabled={running}>
            {running ? "Running..." : "Run Migration"}
          </button>
          <button className="btn" onClick={() => navigate("/dashboard")} disabled={running}>
            Back to Dashboard
          </button>
        </div>
        {done && (
          <p className="text-muted text-sm mt-4">You can remove the /migrate route after running this once.</p>
        )}
      </div>
    </div>
  );
}
