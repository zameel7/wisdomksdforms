import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { useOrganizations } from "../hooks/useOrganizations";
import { useNavigate } from "react-router-dom";

export default function FormBuilder() {
  const { currentOrg } = useOrganizations();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [formSlug, setFormSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  
  const [fields, setFields] = useState([
    { id: Date.now(), type: "text", label: "Untitled Question", required: false, options: [] }
  ]);

  const addField = () => {
    setFields([...fields, { 
      id: Date.now(), 
      type: "text", 
      label: "Untitled Question", 
      required: false, 
      options: ["Option 1"] 
    }]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const addOption = (fieldId) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId, index, value) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const newOptions = [...f.options];
        newOptions[index] = value;
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const removeOption = (fieldId, index) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const newOptions = f.options.filter((_, i) => i !== index);
        return { ...f, options: newOptions };
      }
      return f;
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentOrg?.imgbbApiKey) {
        alert("Please configure ImgBB API Key in Organization Settings first.");
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setLoading(true);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${currentOrg.imgbbApiKey}`, { 
            method: 'POST', 
            body: formData 
        });
        const data = await res.json();
        
        if (data.success) {
            setLogoUrl(data.data.url);
        } else {
            console.error("ImgBB Error:", data);
            alert("Image upload failed: " + (data.error?.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("Error uploading image");
    } finally {
        setLoading(false);
    }
  };

  const saveForm = async () => {
    if (!currentOrg) return alert("No organization selected");
    if (!formSlug) return alert("URL Slug is required");

    setLoading(true);
    try {
      // Check slug uniqueness within org
      const q = query(
        collection(db, "forms"), 
        where("orgId", "==", currentOrg.id),
        where("slug", "==", formSlug)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setLoading(false);
        return alert("This URL slug is already taken for this organization.");
      }

      await addDoc(collection(db, "forms"), {
        orgId: currentOrg.id,
        orgSlug: currentOrg.slug,
        title: formTitle,
        slug: formSlug,
        description,
        logoUrl,
        fields,
        status: isPublished ? "active" : "closed",
        createdAt: serverTimestamp()
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <header className="mb-4">
        <button className="btn mb-4" style={{ background: 'transparent', paddingLeft: 0 }} onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
        <div className="glass-panel p-4">
          <input 
            type="text" 
            className="input-field" 
            style={{ fontSize: '2rem', fontWeight: 'bold', border: 'none', background: 'transparent', padding: 0 }}
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Form Title"
          />
          <input 
            type="text" 
            className="input-field mt-4" 
            style={{ fontSize: '1rem' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Form Description"
          />
          <div className="mt-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
                <label className="text-muted text-sm">URL Slug ({currentOrg?.slug}/...)</label>
                <input 
                    type="text" 
                    className="input-field" 
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. feedback-form"
                />
            </div>
            <div style={{ flex: 1 }}>
                <label className="text-muted text-sm">Logo URL (or Upload)</label>
                <input 
                    type="text" 
                    className="input-field" 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                />
                <input type="file" onChange={handleLogoUpload} className="mt-2" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isPublished} 
                onChange={(e) => setIsPublished(e.target.checked)} 
              />
              <span className="slider round"></span>
            </label>
            <span>{isPublished ? "Published" : "Unpublished (Draft)"}</span>
          </div>
        </div>
      </header>

      <div className="form-fields">
        {fields.map((field, index) => (
          <div key={field.id} className="glass-panel mb-4" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                style={{ flex: 2, fontWeight: '500' }}
                value={field.label}
                onChange={(e) => updateField(field.id, "label", e.target.value)}
                placeholder="Question"
              />
              <select 
                className="input-field" 
                style={{ flex: 1 }}
                value={field.type}
                onChange={(e) => updateField(field.id, "type", e.target.value)}
              >
                <option value="text">Short Answer</option>
                <option value="textarea">Paragraph</option>
                <option value="radio">Multiple Choice</option>
                <option value="checkbox">Checkboxes</option>
                <option value="select">Dropdown</option>
              </select>
            </div>

            {(field.type === "radio" || field.type === "checkbox" || field.type === "select") && (
              <div className="ml-4 mb-4">
                {field.options?.map((option, optIndex) => (
                  <div key={optIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '1rem', height: '1rem', marginTop: '0.5rem', border: '1px solid #ccc', borderRadius: field.type === 'radio' ? '50%' : '2px' }}></div>
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)' }}
                      value={option}
                      onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                    />
                    <button className="btn" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeOption(field.id, optIndex)}>×</button>
                  </div>
                ))}
                <button className="btn" style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', color: 'var(--primary-color)' }} onClick={() => addOption(field.id)}>+ Add Option</button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <input 
                  type="checkbox" 
                  checked={field.required} 
                  onChange={(e) => updateField(field.id, "required", e.target.checked)}
                />
                Required
              </label>
              <button className="btn" style={{ background: 'rgba(255,0,0,0.1)', color: '#fda4af' }} onClick={() => removeField(field.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-center mb-4">
        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={addField}>+ Add Question</button>
      </div>

      <div className="flex-center" style={{ position: 'sticky', bottom: '2rem', zIndex: 10 }}>
        <button className="btn btn-primary" style={{ width: '200px', fontSize: '1.2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} onClick={saveForm} disabled={loading}>
          {loading ? 'Saving...' : 'Save Form'}
        </button>
      </div>
    </div>
  );
}
