import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

export default function PublicCatalog() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicForms() {
      try {
        const q = query(
          collection(db, "forms"), 
          where("status", "==", "active"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        
        // Enrich with Org Name if needed, but we have orgSlug in form data
        const publicForms = [];
        for (const d of snapshot.docs) {
            const data = d.data();
            // Optional: Fetch org name if not stored in form. 
            // In our saveForm we stored orgSlug but not orgName. 
            // Let's fetch org name for better display or just use title.
            // For efficiency, we should have stored orgName in form, but let's fetch for now or skip.
            // Let's assume we want to show Org Name.
            // A better way is to store orgName in form doc. 
            // I'll fetch it for now.
            let orgName = data.orgSlug; 
            if (data.orgId) {
                try {
                    const orgSnap = await getDoc(doc(db, "organizations", data.orgId));
                    if (orgSnap.exists()) orgName = orgSnap.data().name;
                } catch(e) { console.error(e); }
            }

            publicForms.push({ id: d.id, ...data, orgName });
        }
        setForms(publicForms);
      } catch (error) {
        console.error("Error fetching public forms:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicForms();
  }, []);

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
        <h1 style={{ margin: 0, lineHeight: 0 }}>
            <img src="/logo.png" alt="Wisdom Forms Logo" style={{ height: '50px', verticalAlign: 'middle' }} />
        </h1>

      </header>

      {loading ? (
        <div className="text-center">Loading available forms...</div>
      ) : forms.length === 0 ? (
        <div className="text-center text-muted">
            <h3>No public forms available at the moment.</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {forms.map(form => (
            <div key={form.id} className="glass-panel p-4" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                cursor: 'pointer'
            }}
            onClick={() => window.location.href = `/${form.orgSlug}/${form.slug}`}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', height: '60px' }}>
                {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100px', objectFit: 'contain' }} />
                ) : (
                    <div style={{ width: '40px', height: '40px', background: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {form.orgName?.[0]?.toUpperCase() || 'W'}
                    </div>
                )}
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{form.title}</h3>
              <p className="text-muted" style={{ marginBottom: '1rem', flex: 1 }}>{form.description || "No description provided."}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span className="text-muted text-sm">{form.orgName}</span>
                <span className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Start &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
