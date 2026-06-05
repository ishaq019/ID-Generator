import { useState } from "react";
import { templateAPI } from "../services/api";
import CardPreview from "../components/CardPreview";
import FieldEditor from "../components/FieldEditor";

const emptyField = {
  label: "New Field",
  key: "newField",
  type: "text",
  side: "front",
  required: false,
  defaultValue: "",
  show: true,
  x: 20,
  y: 20,
  width: 180,
  height: 28,
  fontSize: 14,
  fontWeight: "500",
  fontColor: "#111827",
  align: "left",
  bold: false,
  italic: false,
  underline: false,
  imageShape: "rounded"
};

function TemplateBuilder() {
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("Custom");
  const [orientation, setOrientation] = useState("vertical");
  const [cardSize, setCardSize] = useState({ width: 260, height: 420, unit: "px" });
  const [saving, setSaving] = useState(false);

  const [frontDesign, setFrontDesign] = useState({
    backgroundType: "gradient",
    backgroundColor: "#ffffff",
    gradient: "linear-gradient(135deg, #ffffff, #dbeafe)",
    borderRadius: 18,
    shadow: true,
    borderColor: "#e5e7eb"
  });

  const [backDesign, setBackDesign] = useState({
    backgroundType: "solid",
    backgroundColor: "#f8fafc",
    gradient: "linear-gradient(135deg, #f8fafc, #e0f2fe)",
    borderRadius: 18,
    shadow: true,
    borderColor: "#e5e7eb"
  });

  const [fields, setFields] = useState([]);

  const template = {
    templateName,
    category,
    orientation,
    cardSize,
    frontDesign,
    backDesign,
    fields,
    styles: {
      fontFamily: "Inter, Arial, sans-serif",
      primaryColor: "#2563eb",
      secondaryColor: "#111827"
    }
  };

  const addField = () => {
    const newKey = `field${fields.length + 1}`;
    setFields([...fields, { ...emptyField, key: newKey, label: `Field ${fields.length + 1}` }]);
  };

  const validateTemplate = () => {
    if (!templateName.trim()) {
      alert("Template name is required");
      return false;
    }

    for (const field of fields) {
      if (!field.label.trim() || !field.key.trim()) {
        alert("Every field must have a label and unique key");
        return false;
      }
    }

    const keys = fields.map(field => field.key.toLowerCase());
    if (new Set(keys).size !== keys.length) {
      alert("Field keys must be unique");
      return false;
    }

    return true;
  };

  const saveTemplate = async () => {
    if (!validateTemplate()) return;

    try {
      setSaving(true);
      await templateAPI.create(template);
      alert("Template saved successfully");
      setTemplateName("");
      setFields([]);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleOrientationChange = value => {
    setOrientation(value);
    setCardSize(value === "horizontal" ? { width: 420, height: 260, unit: "px" } : { width: 260, height: 420, unit: "px" });
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Template Builder</span>
          <h1>Create your own ID card template</h1>
          <p>Use X and Y values for simple positioning. Easy to understand and control.</p>
        </div>

        <button className="btn primary" onClick={saveTemplate} disabled={saving}>{saving ? "Saving..." : "Save Template"}</button>
      </div>

      <div className="builder-layout">
        <div className="panel">
          <h2>Template Settings</h2>

          <div className="form-grid">
            <label>Template Name<input value={templateName} onChange={event => setTemplateName(event.target.value)} placeholder="Example: Event Staff ID" /></label>
            <label>Category<select value={category} onChange={event => setCategory(event.target.value)}><option value="Office">Office</option><option value="University">University</option><option value="Custom">Custom</option></select></label>
            <label>Orientation<select value={orientation} onChange={event => handleOrientationChange(event.target.value)}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></label>
            <label>Width<input type="number" value={cardSize.width} onChange={event => setCardSize({ ...cardSize, width: Number(event.target.value) })} /></label>
            <label>Height<input type="number" value={cardSize.height} onChange={event => setCardSize({ ...cardSize, height: Number(event.target.value) })} /></label>
          </div>

          <h2>Front Design</h2>
          <div className="form-grid">
            <label>Background Type<select value={frontDesign.backgroundType} onChange={event => setFrontDesign({ ...frontDesign, backgroundType: event.target.value })}><option value="solid">Solid</option><option value="gradient">Gradient</option></select></label>
            <label>Color<input type="color" value={frontDesign.backgroundColor} onChange={event => setFrontDesign({ ...frontDesign, backgroundColor: event.target.value })} /></label>
            <label>Gradient<input value={frontDesign.gradient} onChange={event => setFrontDesign({ ...frontDesign, gradient: event.target.value })} /></label>
            <label>Border Radius<input type="number" value={frontDesign.borderRadius} onChange={event => setFrontDesign({ ...frontDesign, borderRadius: Number(event.target.value) })} /></label>
          </div>

          <h2>Back Design</h2>
          <div className="form-grid">
            <label>Background Type<select value={backDesign.backgroundType} onChange={event => setBackDesign({ ...backDesign, backgroundType: event.target.value })}><option value="solid">Solid</option><option value="gradient">Gradient</option></select></label>
            <label>Color<input type="color" value={backDesign.backgroundColor} onChange={event => setBackDesign({ ...backDesign, backgroundColor: event.target.value })} /></label>
            <label>Gradient<input value={backDesign.gradient} onChange={event => setBackDesign({ ...backDesign, gradient: event.target.value })} /></label>
            <label>Border Radius<input type="number" value={backDesign.borderRadius} onChange={event => setBackDesign({ ...backDesign, borderRadius: Number(event.target.value) })} /></label>
          </div>

          <div className="section-between">
            <h2>Fields</h2>
            <button type="button" className="btn secondary small" onClick={addField}>Add Field</button>
          </div>

          <FieldEditor fields={fields} setFields={setFields} />
        </div>

        <div className="panel preview-panel">
          <h2>Live Preview</h2>
          <CardPreview template={template} />
        </div>
      </div>
    </section>
  );
}

export default TemplateBuilder;
