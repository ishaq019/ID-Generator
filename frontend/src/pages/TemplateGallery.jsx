import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { templateAPI } from "../services/api";
import CardPreview from "../components/CardPreview";

function TemplateGallery() {
  const [templates, setTemplates] = useState([]);
  const [category, setCategory] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await templateAPI.getAll(category);
        setTemplates(response.data);
        setSelectedTemplate(response.data[0] || null);
      } catch (error) {
        alert(error.response?.data?.message || "Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [category]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Template Gallery</span>
          <h1>Choose a professional ID card template</h1>
          <p>Use default office/university templates or create your own custom layout.</p>
        </div>

        <Link className="btn primary" to="/builder">New Template</Link>
      </div>

      <div className="filter-row">
        {["All", "Office", "University", "Custom"].map(item => (
          <button key={item} className={category === item ? "chip active" : "chip"} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-box">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="empty-box">No templates found.</div>
      ) : (
        <div className="gallery-layout">
          <div className="template-grid">
            {templates.map(template => (
              <div
                key={template._id}
                className={`template-card ${selectedTemplate?._id === template._id ? "selected" : ""}`}
                onClick={() => setSelectedTemplate(template)}
              >
                <h3>{template.templateName}</h3>
                <p>{template.category}</p>
                <span>{template.orientation}</span>

                <div className="button-row">
  <Link className="btn primary small" to={`/generate/${template._id}`}>
    Create ID Card
  </Link>

  <Link className="btn secondary small" to={`/cards?templateId=${template._id}`}>
    View Generated Cards
  </Link>
</div>
              </div>
            ))}
          </div>

          <div className="sticky-preview">
            <CardPreview template={selectedTemplate} />
          </div>
        </div>
      )}
    </section>
  );
}

export default TemplateGallery;
