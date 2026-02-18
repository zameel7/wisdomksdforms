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

  return (
    <div className="container">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '40px' }} onClick={() => navigate('/')} className="cursor-pointer" />
          </div>
          
          {/* Org Selector */}
          {organizations.length > 1 && (
             <select 
               className="input-field" 
               style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
               value={currentOrg?.id || ''}
               onChange={(e) => setCurrentOrg(organizations.find(o => o.id === e.target.value))}
             >
                {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                ))}
             </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
            {canCreateOrg && (
                <button className="btn" style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.875rem' }} onClick={() => setShowCreateOrg(true)}>
                    + New Org
                </button>
            )}
            {showOrgAdminActions && (
                <button className="btn" style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.875rem' }} onClick={() => setShowSettings(true)}>
                    ⚙ Settings
                </button>
            )}
            <button className="btn" onClick={handleLogout} style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.875rem' }}>
            Logout
            </button>
        </div>
      </header>

      <main>
        {/* Branding Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <img src="/logo.png" alt="Wisdom Logo" style={{ height: '80px', marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }} />
            
            {/* Breadcrumbs */}
            <nav style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem', 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                fontWeight: '600'
            }}>
                <span className="cursor-pointer" style={{ transition: 'color 0.2s' }} onClick={() => setCurrentOrg(null)}>Dashboard</span>
                {currentOrg && (
                    <>
                        <span style={{ opacity: 0.5 }}>/</span>
                        <span style={{ color: 'var(--text-main)' }}>{currentOrg.name}</span>
                    </>
                )}
            </nav>
        </div>

        {!currentOrg ? (
            <div className="text-center">
                <h3>Select an Organization to view forms</h3>
                {userProfile.role === 'superadmin' && organizations.length === 0 && (
                     <div className="mt-4">
                        <p>No organizations found.</p>
                        <button className="btn btn-primary mt-4" onClick={() => setShowCreateOrg(true)}>Create First Organization</button>
                     </div>
                )}
            </div>
        ) : (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem' }}>Forms</h3>
                    <button className="btn btn-primary" onClick={() => navigate('/builder')}>
                        + Create New Form
                    </button>
                </div>

                {formsLoading ? (
                    <div className="text-center text-muted">Loading forms...</div>
                ) : forms.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>No forms found for {currentOrg.name}.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {forms.map(form => (
                            <div key={form.id} className="glass-panel p-4" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ marginBottom: '1rem', flex: 1 }}>
                                    <h4 style={{ marginBottom: '0.5rem' }}>{form.title}</h4>
                                    <p className="text-muted text-sm" style={{ marginBottom: '0.5rem' }}>/{currentOrg.slug}/{form.slug}</p>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        background: form.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: form.status === 'active' ? '#34d399' : '#f87171'
                                    }}>
                                        {form.status === 'active' ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    <a href={`/${currentOrg.slug}/${form.slug}`} target="_blank" className="btn" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', background: 'rgba(255,255,255,0.05)', textAlign: 'center' }}>View</a>
                                    <button className="btn" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', background: 'rgba(255,255,255,0.05)' }} onClick={() => navigate(`/builder?id=${form.id}`)}>Edit</button>
                                    <button className="btn" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }} onClick={() => navigate(`/responses/${form.id}`)}>Data</button>
                                    <button className="btn" style={{ padding: '0.5rem', fontSize: '0.875rem', background: 'rgba(255,0,0,0.1)', color: '#fda4af' }} onClick={() => deleteForm(form.id)}>Del</button>
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
