import { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function OrgSettingsModal({ org, onClose, onUpdate }) {
  const [apiKey, setApiKey] = useState(org.imgbbApiKey || "");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-panel" style={{ width: "480px", maxWidth: "95vw" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3>Organization Settings</h3>
          <button type="button" className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "1.5rem", lineHeight: 1 }} onClick={onClose} aria-label="Close">×</button>
        </div>

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
