import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { cardAPI, templateAPI, uploadAPI } from "../services/api";
import CardPreview from "../components/CardPreview";
import ExportButtons from "../components/ExportButtons";
import {
  getLocalGeneratedCardById,
  upsertLocalGeneratedCard
} from "../utils/localGeneratedCards";

function GenerateCard() {

  
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();


  const draftId = searchParams.get("draftId");
  const cardId = searchParams.get("cardId");

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || "");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [qrData, setQrData] = useState("");

  const [editingDraftId, setEditingDraftId] = useState("");
  const [editingSavedCardId, setEditingSavedCardId] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);


 const DIGIVAL_HIDDEN_FIELDS = ["address", "website", "qr"];

const isHiddenDigiValField = field => {
  return (
    selectedTemplate?.layoutKey === "digival" &&
    DIGIVAL_HIDDEN_FIELDS.includes(field.key)
  );
};

const getPreparedFormData = () => {
  if (selectedTemplate?.layoutKey !== "digival") {
    return formData;
  }

  const preparedData = { ...formData };

  selectedTemplate.fields.forEach(field => {
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

        if (draftId) {
          const draftCard = getLocalGeneratedCardById(draftId);

          if (draftCard) {
            const draftTemplateId =
              draftCard.templateId?._id ||
              draftCard.templateSnapshot?._id ||
              draftCard.templateId;

            setEditingDraftId(draftCard.localId);
            setSelectedTemplateId(draftTemplateId);
            setFormData(draftCard.formData || {});
            setQrData(draftCard.qrData || "");

            return;
          }
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
  }, [templateId, draftId, cardId]);

  useEffect(() => {
    const fetchSelectedTemplate = async () => {
      if (!selectedTemplateId) return;

      try {
        const response = await templateAPI.getById(selectedTemplateId);
        setSelectedTemplate(response.data);

        if (!draftId && !cardId) {
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
  }, [selectedTemplateId, draftId, cardId]);

  const handleTemplateChange = newTemplateId => {
    setSelectedTemplateId(newTemplateId);
    setEditingDraftId("");
    setEditingSavedCardId("");
    setFormData({});
    setQrData("");
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

  if (selectedTemplate?.layoutKey === "digival" && fieldKey === "photo") {
    if (file.type !== "image/png") {
      alert("Please upload a PNG image for DigiVal ID card photo.");
      return;
    }
  }

  try {
    const response = await uploadAPI.image(file);
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

 

  const addToGeneratedCards = () => {
    if (!validateForm()) return;

    const generatedCard = upsertLocalGeneratedCard({
      localId: editingDraftId || "",
      templateId: {
        _id: selectedTemplate._id,
        templateName: selectedTemplate.templateName,
        category: selectedTemplate.category,
        orientation: selectedTemplate.orientation,
        layoutKey: selectedTemplate.layoutKey,
        slug: selectedTemplate.slug
      },
      templateSnapshot: selectedTemplate,
      formData: getPreparedFormData(),
      photo: formData.photo || "",
      logo: formData.logo || "",
      qrData: getFinalQrData()
    });

    setEditingDraftId(generatedCard.localId);

    alert("Card added to Generated Cards section");
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
        alert("Saved card updated successfully");
      } else {
        await cardAPI.create(payload);
        alert("Card saved to database successfully");
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
              : editingDraftId
                ? "Edit generated ID card"
                : "Fill details and generate your ID card"}
          </h1>
          <p>
            Add card to Generated Cards section first, then save to database only
            when needed.
          </p>
        </div>

        <div className="button-row">
          <button className="btn secondary" onClick={addToGeneratedCards}>
            Add to Generated Cards
          </button>

          <button
            className="btn primary"
            onClick={saveCard}
            disabled={saving || !selectedTemplate}
          >
            {saving
              ? "Saving..."
              : editingSavedCardId
                ? "Update Saved Card"
                : "Save to Database"}
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
    selectedTemplate?.layoutKey === "digival" && field.key === "photo"
      ? "image/png"
      : "image/*"
  }
  onChange={event =>
    handleImageUpload(field.key, event.target.files[0])
  }
/>

    
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