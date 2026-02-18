import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function PublicFormView() {
  const { orgSlug, formSlug } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchForm() {
      try {
        const q = query(
          collection(db, "forms"), 
          where("orgSlug", "==", orgSlug),
          where("slug", "==", formSlug)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError("Form not found");
        } else {
          const formData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          if (formData.status !== 'active') {
            setError("This form is currently closed.");
          } else {
            setForm(formData);
          }
        }
      } catch (err) {
        console.error("Error fetching form:", err);
        setError("Failed to load form");
      } finally {
        setLoading(false);
      }
    }
    fetchForm();
  }, [orgSlug, formSlug]);

  const handleInputChange = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId, option, checked) => {
    setAnswers(prev => {
      const current = prev[fieldId] || [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, option] };
      } else {
        return { ...prev, [fieldId]: current.filter(item => item !== option) };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Validate required fields
    for (const field of form.fields) {
        if (field.required) {
            const val = answers[field.id];
            if (!val || (Array.isArray(val) && val.length === 0)) {
                alert(`Please answer the required question: "${field.label}"`);
                setSubmitting(false);
                return;
            }
        }
    }

    try {
      await addDoc(collection(db, "responses"), {
        formId: form.id,
        formTitle: form.title,
        orgId: form.orgId,
        answers,
        submittedAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  if (error) return <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}><h2>Error</h2><p>{error}</p></div>;
  if (submitted) return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
        <div className="glass-panel p-4 text-center">
            <h1>Thank You!</h1>
            <p className="mb-4">Your response has been recorded.</p>
            <a href="/" className="btn btn-primary">Back to Home</a>
        </div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
      <div className="glass-panel p-4 mb-4 text-center">
        {form.logoUrl && <img src={form.logoUrl} alt="Logo" style={{ maxHeight: '100px', marginBottom: '1rem' }} />}
        <h1>{form.title}</h1>
        {form.description && <p className="text-muted mt-4">{form.description}</p>}
      </div>

      <form onSubmit={handleSubmit}>
        {form.fields.map(field => (
          <div key={field.id} className="glass-panel p-4 mb-4">
            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', fontSize: '1.1rem' }}>
                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            
            {field.type === 'text' && (
                <input 
                    type="text" 
                    className="input-field" 
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                />
            )}
            
            {field.type === 'textarea' && (
                <textarea 
                    className="input-field" 
                    rows="4"
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                />
            )}

            {field.type === 'radio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {field.options.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input 
                                type="radio" 
                                name={field.id} 
                                value={opt}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                required={field.required}
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            )}

            {field.type === 'checkbox' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {field.options.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                value={opt}
                                onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            )}

            {field.type === 'select' && (
                <select 
                    className="input-field"
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                    defaultValue=""
                >
                    <option value="" disabled>Select an option</option>
                    {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            )}
          </div>
        ))}

        <div className="flex-center mt-4">
            <button type="submit" className="btn btn-primary" style={{ width: '200px', fontSize: '1.2rem' }} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
            </button>
        </div>
      </form>
    </div>
  );
}
