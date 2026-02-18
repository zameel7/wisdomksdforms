import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOrganizations } from "../hooks/useOrganizations";
import { useNavigate } from "react-router-dom";
import CreateOrgModal from "../components/CreateOrgModal";
import OrgSettingsModal from "../components/OrgSettingsModal";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function Dashboard() {
  const { logout, userProfile } = useAuth();
  const { organizations, currentOrg, setCurrentOrg, loading: orgsLoading, createOrganization, isOrgAdmin } = useOrganizations();

  const canCreateOrg = userProfile?.role === "superadmin" || userProfile?.role === "admin" || userProfile?.hasOrgAdminRole;
  const showOrgAdminActions = currentOrg && (userProfile?.role === "superadmin" || isOrgAdmin(currentOrg.id));
  const navigate = useNavigate();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [forms, setForms] = useState([]);
  const [formsLoading, setFormsLoading] = useState(false);

  // Fetch forms when currentOrg changes
  useEffect(() => {
    if (!currentOrg) return;
    async function fetchForms() {
      setFormsLoading(true);
      try {
        const q = query(
          collection(db, "forms"), 
          where("orgId", "==", currentOrg.id),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setForms(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setFormsLoading(false);
      }
    }
    fetchForms();
  }, [currentOrg]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const deleteForm = async (formId) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    try {
      await deleteDoc(doc(db, "forms", formId));
      setForms(forms.filter(f => f.id !== formId));
    } catch (error) {
      console.error("Error deleting form:", error);
      alert("Failed to delete form");
    }
  };

  if (orgsLoading) {
    return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  }

  if (organizations.length === 0) {
      if (canCreateOrg) {
          return (
            <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '1.5rem' }} />
                <h2>Welcome to Wisdom Forms</h2>
                <p className="text-muted mb-4">You don't have any organizations yet.</p>
                <button className="btn btn-primary" onClick={() => setShowCreateOrg(true)}>
                    + Create Your First Organization
                </button>
                <button className="btn mt-4" style={{ background: 'transparent', color: 'var(--text-muted)' }} onClick={handleLogout}>Logout</button>
                
                {showCreateOrg && (
                    <CreateOrgModal 
                        onClose={() => setShowCreateOrg(false)} 
                        onCreate={createOrganization} 
                    />
                )}
            </div>
          );
      } else {
         return (
            <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '1.5rem' }} />
                <h2>No Organization Assigned</h2>
                <p className="text-muted">Please ask your administrator to assign you to an organization.</p>
                <button className="btn mt-4" onClick={handleLogout}>Logout</button>
            </div>
         )
      }
  }

  const FormIcon = () => (
    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );

  return (
    <div className="container">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <img src="/logo.png" alt="Logo" className="dashboard-logo cursor-pointer" onClick={() => navigate('/')} />
          {organizations.length > 1 && (
            <select
              className="input-field dashboard-org-select"
              value={currentOrg?.id || ''}
              onChange={(e) => setCurrentOrg(organizations.find(o => o.id === e.target.value))}
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="dashboard-header-actions">
          {canCreateOrg && (
            <button className="btn btn-secondary" onClick={() => setShowCreateOrg(true)}>+ New Org</button>
          )}
          {showOrgAdminActions && (
            <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>Settings</button>
          )}
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-hero">
          <h1 className="dashboard-title">{currentOrg?.name || 'Dashboard'}</h1>
          <nav className="dashboard-breadcrumb">
            <span className="cursor-pointer" onClick={() => setCurrentOrg(null)}>All organizations</span>
            {currentOrg && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span>{currentOrg.name}</span>
              </>
            )}
          </nav>
        </div>

        {!currentOrg ? (
          <div className="dashboard-select-org">
            <p className="text-muted">Select an organization above to view and manage forms.</p>
            {userProfile?.role === 'superadmin' && organizations.length === 0 && (
              <button className="btn btn-primary mt-4" onClick={() => setShowCreateOrg(true)}>Create First Organization</button>
            )}
          </div>
        ) : (
          <div className="dashboard-forms-section">
            <div className="dashboard-forms-header">
              <h2 className="dashboard-forms-title">Forms</h2>
              <button className="btn btn-primary" onClick={() => navigate('/builder')}>
                + Create New Form
              </button>
            </div>

            {formsLoading ? (
              <div className="dashboard-loading">Loading forms...</div>
            ) : forms.length === 0 ? (
              <div className="empty-state">
                <FormIcon />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No forms yet</h3>
                <p className="text-muted mb-4">Create your first form to start collecting responses for {currentOrg.name}.</p>
                <button className="btn btn-primary" onClick={() => navigate('/builder')}>
                  + Create New Form
                </button>
              </div>
            ) : (
              <div className="dashboard-forms-grid">
                {forms.map(form => (
                  <div key={form.id} className="dashboard-card dashboard-form-card">
                    <div className="form-card-content">
                      <h4 className="form-card-title">{form.title}</h4>
                      <p className="form-card-slug">/{currentOrg.slug}/{form.slug}</p>
                      <span className={`form-card-status form-card-status--${form.status}`}>
                        {form.status === 'active' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="form-card-actions">
                      <a href={`/${currentOrg.slug}/${form.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }}>View</a>
                      <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }} onClick={() => navigate(`/builder?id=${form.id}`)}>Edit</button>
                      <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', color: '#6366f1' }} onClick={() => navigate(`/responses/${form.id}`)}>Data</button>
                      <button className="btn btn-ghost" style={{ padding: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }} onClick={() => deleteForm(form.id)}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showCreateOrg && (
        <CreateOrgModal 
            onClose={() => setShowCreateOrg(false)} 
            onCreate={createOrganization} 
        />
      )}

      {showSettings && currentOrg && (
        <OrgSettingsModal 
            org={currentOrg} 
            onClose={() => setShowSettings(false)} 
            onUpdate={(updatedOrg) => setCurrentOrg(updatedOrg)} 
        />
      )}
    </div>
  );
}
