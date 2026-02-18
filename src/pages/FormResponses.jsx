import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function FormResponses() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch form details
        const formSnap = await getDoc(doc(db, "forms", formId));
        if (formSnap.exists()) {
          setForm({ id: formSnap.id, ...formSnap.data() });
        } else {
          alert("Form not found");
          navigate("/dashboard");
          return;
        }

        // Fetch responses
        const q = query(
          collection(db, "responses"), 
          where("formId", "==", formId),
          orderBy("submittedAt", "desc")
        );
        const snapshot = await getDocs(q);
        setResponses(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [formId, navigate]);

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(form.title, 14, 22);
    doc.setFontSize(11);
    doc.text(`Responses Report - ${new Date().toLocaleDateString()}`, 14, 30);

    // Prepare table data
    const headers = form.fields.map(f => f.label);
    const data = responses.map(r => {
        return form.fields.map(f => {
            const val = r.answers[f.id];
            if (Array.isArray(val)) return val.join(", ");
            return val || "";
        });
    });

    doc.autoTable({
      head: [headers],
      body: data,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [99, 102, 241] } // Indigo 500
    });

    doc.save(`${form.slug}-responses.pdf`);
  };

  if (loading) return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;

  return (
    <div className="container">
      <header className="mb-4 flex items-center justify-between">
        <div>
            <button className="btn mb-4" style={{ background: 'transparent', paddingLeft: 0 }} onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
            </button>
            <h1>Responses: {form.title}</h1>
            <p className="text-muted">Total Responses: {responses.length}</p>
        </div>
        <button className="btn btn-primary" onClick={exportPDF} disabled={responses.length === 0}>
            Download PDF
        </button>
      </header>

      {responses.length === 0 ? (
        <div className="glass-panel p-4 text-center">
            <p className="text-muted">No responses yet.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', minWidth: '150px' }}>Date</th>
                        {form.fields.map(field => (
                            <th key={field.id} style={{ padding: '1rem', textAlign: 'left', minWidth: '150px' }}>{field.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {responses.map(response => (
                        <tr key={response.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                {response.submittedAt?.toDate().toLocaleString()}
                            </td>
                            {form.fields.map(field => (
                                <td key={field.id} style={{ padding: '1rem' }}>
                                    {Array.isArray(response.answers[field.id]) 
                                        ? response.answers[field.id].join(", ") 
                                        : response.answers[field.id]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
