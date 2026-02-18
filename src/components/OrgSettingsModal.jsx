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
      await updateDoc(orgRef, {
        imgbbApiKey: apiKey
      });
      // Optionally update local state via callback to avoid full reload
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
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ width: '400px' }}>
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
            Required for image uploads. Get one at <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>api.imgbb.com</a>.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
