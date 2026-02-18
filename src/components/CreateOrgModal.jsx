import { useState } from "react";

export default function CreateOrgModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(name, slug);
      onClose();
    } catch (error) {
      alert("Failed to create organization: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Create Organization</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Organization Name</label>
            <input 
              className="input-field" 
              type="text" 
              value={name} 
              onChange={handleNameChange} 
              required 
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="mb-4">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>URL Slug</label>
            <input 
              className="input-field" 
              type="text" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              required 
              placeholder="e.g. acme-corp"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
