import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { cardAPI, templateAPI, uploadAPI } from "../services/api";
import CardPreview from "../components/CardPreview";
import ExportButtons from "../components/ExportButtons";

function GenerateCard() {

  
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  const cardId = searchParams.get("cardId");

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || "");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [qrData, setQrData] = useState("");

  const [editingSavedCardId, setEditingSavedCardId] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);


 const DIGIVAL_HIDDEN_FIELDS = ["address", "website", "qr"];
 const DIGIVAL_PHOTO_DEFAULTS = {
  photoX: "0",
  photoY: "0",
  photoWidth: "300",
  photoHeight: "346"
};
const DIGIVAL_PHOTO_ADJUST_FIELDS = [
  { key: "photoX", label: "X", min: -80, max: 80 },
  { key: "photoY", label: "Y", min: -80, max: 80 },
  { key: "photoWidth", label: "Width", min: 180, max: 440 },
  { key: "photoHeight", label: "Height", min: 220, max: 520 }
];

const isHiddenDigiValField = field => {
  return (
    selectedTemplate?.layoutKey === "digival" &&
    DIGIVAL_HIDDEN_FIELDS.includes(field.key)
  );
};

const isDigiValPhotoField = field => {
  return selectedTemplate?.layoutKey === "digival" && field.key === "photo";
};

const getPreparedFormData = () => {
  if (selectedTemplate?.layoutKey !== "digival") {
    return formData;
  }

  const preparedData = { ...formData };

  selectedTemplate.fields?.forEach(field => {
    if (["address", "website"].includes(field.key)) {
      preparedData[field.key] = field.defaultValue || "";
    }
  });

  return preparedData;
};

const getFinalQrData = () => {
  return selectedTemplate?.layoutKey === "digival"
    ? "STATIC_DIGIVAL_QR"
    : qrData;
};

  const buildEmptyFormData = fields => {
    const emptyData = {};

    fields.forEach(field => {
      emptyData[field.key] = "";
    });

    return emptyData;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const templatesResponse = await templateAPI.getAll();
        setTemplates(templatesResponse.data);

        if (cardId) {
          const cardResponse = await cardAPI.getById(cardId);
          const savedCard = cardResponse.data;

          const savedTemplateId =
            savedCard.templateId?._id || savedCard.templateId;

          setEditingSavedCardId(savedCard._id);
          setSelectedTemplateId(savedTemplateId);
          setFormData(savedCard.formData || {});
          setQrData(savedCard.qrData || "");

          return;
        }

        const firstTemplateId = templateId || templatesResponse.data[0]?._id || "";
        setSelectedTemplateId(firstTemplateId);
      } catch (error) {
        alert(error.response?.data?.message || "Failed to load generator");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [templateId, cardId]);

  useEffect(() => {
    const fetchSelectedTemplate = async () => {
      if (!selectedTemplateId) return;

      try {
        const response = await templateAPI.getById(selectedTemplateId);
        setSelectedTemplate(response.data);

        if (!cardId) {
          const emptyData = buildEmptyFormData(response.data.fields || []);
          setFormData(emptyData);
          setQrData(
            response.data.layoutKey === "digival" ? "STATIC_DIGIVAL_QR" : ""
          );
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to load selected template");
      }
    };

    fetchSelectedTemplate();
  }, [selectedTemplateId, cardId]);

  const handleTemplateChange = newTemplateId => {
    setSelectedTemplateId(newTemplateId);
    setEditingSavedCardId("");
    setFormData({});
    setQrData("");
    navigate(`/generate/${newTemplateId}`, { replace: true });
  };

  const updateValue = (key, value) => {
    const updatedData = {
      ...formData,
      [key]: value
    };

    setFormData(updatedData);

    if (selectedTemplate?.layoutKey === "digival") {
      setQrData("STATIC_DIGIVAL_QR");
    } else {
      setQrData(JSON.stringify(updatedData));
    }
  };

 const handleImageUpload = async (fieldKey, file) => {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Only image files are allowed");
    return;
  }

  try {
    const response = await uploadAPI.image(file);

    if (selectedTemplate?.layoutKey === "digival" && fieldKey === "photo") {
      setFormData(previousData => ({
        ...DIGIVAL_PHOTO_DEFAULTS,
        ...previousData,
        photo: response.data.imageUrl
      }));
      setQrData("STATIC_DIGIVAL_QR");
      return;
    }

    updateValue(fieldKey, response.data.imageUrl);
  } catch (error) {
    alert(error.response?.data?.message || "Image upload failed");
  }
};

  const validateForm = () => {
    if (!selectedTemplate) return false;

    const requiredFields = selectedTemplate.fields.filter(field => field.required);

    for (const field of requiredFields) {
      if (!formData[field.key]) {
        alert(`${field.label} is required`);
        return false;
      }
    }

    const emailFields = selectedTemplate.fields.filter(
      field => field.type === "email" && formData[field.key]
    );

    for (const field of emailFields) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.key])) {
        alert(`${field.label} must be a valid email`);
        return false;
      }
    }

    return true;
  };

 

  const saveCard = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        templateId: selectedTemplate._id,
        formData: getPreparedFormData(),
        photo: formData.photo || "",
        logo: formData.logo || "",
        qrData: getFinalQrData(),
        templateSnapshot: selectedTemplate
      };

      if (editingSavedCardId) {
        await cardAPI.update(editingSavedCardId, payload);
        alert("Card updated successfully");
      } else {
        const response = await cardAPI.create(payload);
        setEditingSavedCardId(response.data._id);
        navigate(`/generate/${selectedTemplate._id}?cardId=${response.data._id}`, {
          replace: true
        });
        alert("Card saved successfully");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save card");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="empty-box">Loading generator...</div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Generate ID Card</span>
          <h1>
            {editingSavedCardId
              ? "Edit saved ID card"
              : "Fill details and generate your ID card"}
          </h1>
          <p>
            Save once to store the card in the project database, then manage it
            from Generated Cards.
          </p>
        </div>

        <div className="button-row">
          <button
            className="btn primary"
            onClick={saveCard}
            disabled={saving || !selectedTemplate}
          >
            {saving
              ? "Saving..."
              : editingSavedCardId
                ? "Update Card"
                : "Save Card"}
          </button>

          <Link className="btn dark" to="/cards">
            View Generated Cards
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="empty-box">
          No templates available. Start your backend first or create a template.
        </div>
      ) : (
        <div className="generate-layout">
          <div className="panel">
            <h2>Card Data</h2>

            <label>
              Select Template
              <select
                value={selectedTemplateId}
                onChange={event => handleTemplateChange(event.target.value)}
              >
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.templateName}
                  </option>
                ))}
              </select>
            </label>

   {selectedTemplate?.fields
  ?.filter(field => field.type !== "qr")
  .filter(field => !isHiddenDigiValField(field))
  .map(field => (
                <label key={field._id || field.key}>
                  {field.label} {field.required && <span className="required">*</span>}

                  {field.type === "image" ? (
  <>
   <input
  type="file"
  accept={
    isDigiValPhotoField(field)
      ? "image/png,image/jpeg,image/jpg,image/webp"
      : "image/*"
  }
  onChange={event =>
    handleImageUpload(field.key, event.target.files[0])
  }
/>

    {isDigiValPhotoField(field) && (
      <>
        <span className="helper-text">
          Upload a straight-facing portrait. PNG with transparent background is
          best, but JPG and WEBP are accepted.
        </span>

        <div className="photo-adjust-grid">
          {DIGIVAL_PHOTO_ADJUST_FIELDS.map(setting => (
            <label key={setting.key}>
              {setting.label}
              <input
                type="number"
                min={setting.min}
                max={setting.max}
                step="1"
                value={
                  formData[setting.key] ??
                  DIGIVAL_PHOTO_DEFAULTS[setting.key]
                }
                onChange={event =>
                  updateValue(setting.key, event.target.value)
                }
              />
            </label>
          ))}
        </div>
      </>
    )}
  </>
) : field.type === "textarea" ? (
                    <textarea
                      value={formData[field.key] || ""}
                      onChange={event => updateValue(field.key, event.target.value)}
                      placeholder={field.defaultValue || field.label}
                    />
                  ) : (
                    <input
                      type={
                        field.type === "email"
                          ? "email"
                          : field.type === "number"
                            ? "number"
                            : field.type === "date"
                              ? "date"
                              : "text"
                      }
                      value={formData[field.key] || ""}
                      onChange={event => updateValue(field.key, event.target.value)}
                      placeholder={field.defaultValue || field.label}
                    />
                  )}
                </label>
              ))}

            {selectedTemplate?.layoutKey !== "digival" && (
              <label>
                QR Data
                <textarea
                  value={qrData}
                  onChange={event => setQrData(event.target.value)}
                  placeholder="QR data will auto-fill from form data"
                />
              </label>
            )}
          </div>

          <div className="panel preview-panel">
            <h2>Live Preview</h2>
           <CardPreview
  template={selectedTemplate}
  formData={getPreparedFormData()}
  qrData={getFinalQrData()}
/>
            <ExportButtons />
          </div>
        </div>
      )}
    </section>
  );
}

export default GenerateCard;
