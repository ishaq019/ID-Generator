import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CardPreview from "../components/CardPreview";
import ExportButtons from "../components/ExportButtons";
import { cardAPI, templateAPI, uploadAPI } from "../services/api";

const DIGIVAL_HIDDEN_FIELDS = ["address", "website", "qr"];
const LEAP_ROBOTS_FIELD_KEYS = [
  "name",
  "role",
  "photo",
  "employeeId",
  "bloodGroup",
  "phone",
  "email",
];
const LEAP_ROBOTS_PREPARED_KEYS = [
  ...LEAP_ROBOTS_FIELD_KEYS,
  "photoX",
  "photoY",
  "photoWidth",
  "photoHeight",
];
const DIGIVAL_PHOTO_DEFAULTS = {
  photoX: "0",
  photoY: "0",
  photoWidth: "300",
  photoHeight: "346",
};
const LEAP_ROBOTS_PHOTO_DEFAULTS = {
  photoX: "0",
  photoY: "0",
  photoWidth: "320",
  photoHeight: "260",
};
const DIGIVAL_PHOTO_ADJUST_FIELDS = [
  { key: "photoX", label: "X", min: -80, max: 80 },
  { key: "photoY", label: "Y", min: -80, max: 80 },
  { key: "photoWidth", label: "Width", min: 180, max: 440 },
  { key: "photoHeight", label: "Height", min: 220, max: 520 },
];
const LEAP_ROBOTS_PHOTO_ADJUST_FIELDS = [
  { key: "photoX", label: "X", min: -120, max: 120 },
  { key: "photoY", label: "Y", min: -120, max: 120 },
  { key: "photoWidth", label: "Width", min: 160, max: 440 },
  { key: "photoHeight", label: "Height", min: 180, max: 520 },
];
const ENABLE_UPLOAD_BACKGROUND_REMOVAL =
  import.meta.env.VITE_UPLOAD_BACKGROUND_REMOVAL !== "false";

const buildEmptyFormData = (fields = []) => {
  return fields.reduce((emptyData, field) => {
    emptyData[field.key] = "";
    return emptyData;
  }, {});
};

const isDigiValTemplate = (template) => {
  return template?.layoutKey === "digival";
};

const isLeapRobotsTemplate = (template) => {
  return template?.layoutKey === "leaprobots";
};

const isTemplateQrManaged = (template) => {
  return isDigiValTemplate(template) || isLeapRobotsTemplate(template);
};

const normalizeLeapBloodGroup = (value) => {
  const compactValue = String(value || "").replace(/\s+/g, "");
  const firstCharacter = compactValue.charAt(0).toUpperCase();
  const secondCharacter = compactValue.charAt(1);

  return `${firstCharacter}${secondCharacter}`.slice(0, 2);
};

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

  const isHiddenDigiValField = (field) => {
    return isDigiValTemplate(selectedTemplate) && DIGIVAL_HIDDEN_FIELDS.includes(field.key);
  };

  const isHiddenLeapRobotsField = (field) => {
    return isLeapRobotsTemplate(selectedTemplate) && !LEAP_ROBOTS_FIELD_KEYS.includes(field.key);
  };

  const isDigiValPhotoField = (field) => {
    return isDigiValTemplate(selectedTemplate) && field.key === "photo";
  };

  const isLeapRobotsPhotoField = (field) => {
    return isLeapRobotsTemplate(selectedTemplate) && field.key === "photo";
  };

  const getPreparedFormData = () => {
    if (isLeapRobotsTemplate(selectedTemplate)) {
      return LEAP_ROBOTS_PREPARED_KEYS.reduce((preparedData, key) => {
        if (key === "bloodGroup") {
          preparedData[key] = normalizeLeapBloodGroup(formData[key]);
          return preparedData;
        }

        preparedData[key] = formData[key] || "";
        return preparedData;
      }, {});
    }

    if (!isDigiValTemplate(selectedTemplate)) {
      return formData;
    }

    const preparedData = { ...formData };

    selectedTemplate.fields?.forEach((field) => {
      if (["address", "website"].includes(field.key)) {
        preparedData[field.key] = field.defaultValue || "";
      }
    });

    return preparedData;
  };

  const getFinalQrData = () => {
    if (isDigiValTemplate(selectedTemplate)) return "STATIC_DIGIVAL_QR";
    if (isLeapRobotsTemplate(selectedTemplate)) return "";
    return qrData;
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
          const savedTemplateId = savedCard.templateId?._id || savedCard.templateId;

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
          setFormData(buildEmptyFormData(response.data.fields));
          setQrData(response.data.layoutKey === "digival" ? "STATIC_DIGIVAL_QR" : "");
        }
      } catch (error) {
        alert(error.response?.data?.message || "Failed to load selected template");
      }
    };

    fetchSelectedTemplate();
  }, [selectedTemplateId, cardId]);

  const handleTemplateChange = (newTemplateId) => {
    setSelectedTemplateId(newTemplateId);
    setEditingSavedCardId("");
    setFormData({});
    setQrData("");
    navigate(`/generate/${newTemplateId}`, { replace: true });
  };

  const updateValue = (key, value) => {
    const nextValue =
      isLeapRobotsTemplate(selectedTemplate) && key === "bloodGroup"
        ? normalizeLeapBloodGroup(value)
        : value;
    const updatedData = {
      ...formData,
      [key]: nextValue,
    };

    setFormData(updatedData);
    setQrData(isTemplateQrManaged(selectedTemplate) ? getFinalQrData() : JSON.stringify(updatedData));
  };

  const handleImageUpload = async (fieldKey, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    try {
      const leapRobotsPhotoUpload =
        isLeapRobotsTemplate(selectedTemplate) && fieldKey === "photo";
      const fileNameBase = String(formData.name || "leaprobots").trim() || "leaprobots";
      const response = await uploadAPI.image(file, {
        removeBackground:
          leapRobotsPhotoUpload ||
          (ENABLE_UPLOAD_BACKGROUND_REMOVAL && fieldKey === "photo"),
        fileName: leapRobotsPhotoUpload
          ? `${fileNameBase}-photo.png`
          : formData.employeeId
            ? `${formData.employeeId}-photo.png`
            : file.name,
      });

      if (isDigiValTemplate(selectedTemplate) && fieldKey === "photo") {
        setFormData((previousData) => ({
          ...DIGIVAL_PHOTO_DEFAULTS,
          ...previousData,
          photo: response.data.imageUrl,
        }));
        setQrData("STATIC_DIGIVAL_QR");
        return;
      }

      if (leapRobotsPhotoUpload) {
        setFormData((previousData) => ({
          ...LEAP_ROBOTS_PHOTO_DEFAULTS,
          ...previousData,
          photo: response.data.imageUrl,
        }));
        setQrData("");
        return;
      }

      updateValue(fieldKey, response.data.imageUrl);
    } catch (error) {
      alert(error.response?.data?.message || "Image upload failed");
    }
  };

  const validateForm = () => {
    if (!selectedTemplate) return false;

    const requiredFields = selectedTemplate.fields.filter((field) => field.required);

    for (const field of requiredFields) {
      if (!formData[field.key]) {
        alert(`${field.label} is required`);
        return false;
      }
    }

    const emailFields = selectedTemplate.fields.filter(
      (field) => field.type === "email" && formData[field.key]
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
        templateSnapshot: selectedTemplate,
      };

      if (editingSavedCardId) {
        await cardAPI.update(editingSavedCardId, payload);
        alert("Card updated successfully");
        return;
      }

      const response = await cardAPI.create(payload);
      setEditingSavedCardId(response.data._id);
      navigate(`/generate/${selectedTemplate._id}?cardId=${response.data._id}`, {
        replace: true,
      });
      alert("Card saved successfully");
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
          <h1>{editingSavedCardId ? "Edit saved ID card" : "Fill details and generate your ID card"}</h1>
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
            {saving ? "Saving..." : editingSavedCardId ? "Update Card" : "Save Card"}
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
                onChange={(event) => handleTemplateChange(event.target.value)}
              >
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.templateName}
                  </option>
                ))}
              </select>
            </label>

            {selectedTemplate?.fields
              ?.filter((field) => field.type !== "qr")
              .filter((field) => !isHiddenDigiValField(field))
              .filter((field) => !isHiddenLeapRobotsField(field))
              .map((field) => (
                <label key={field._id || field.key}>
                  {field.label} {field.required && <span className="required">*</span>}

                  {field.type === "image" ? (
                    <>
                      <input
                        type="file"
                        accept={
                          isDigiValPhotoField(field) ||
                          isLeapRobotsPhotoField(field)
                            ? "image/png,image/jpeg,image/jpg,image/webp"
                            : "image/*"
                        }
                        onChange={(event) =>
                          handleImageUpload(field.key, event.target.files[0])
                        }
                      />

                      {isDigiValPhotoField(field) && (
                        <>
                          <span className="helper-text">
                            Upload a straight-facing portrait. PNG with transparent
                            background is best, but JPG and WEBP are accepted.
                          </span>

                          <div className="photo-adjust-grid">
                            {DIGIVAL_PHOTO_ADJUST_FIELDS.map((setting) => (
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
                                  onChange={(event) =>
                                    updateValue(setting.key, event.target.value)
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        </>
                      )}

                      {isLeapRobotsPhotoField(field) && (
                        <>
                          <span className="helper-text">
                            Upload a portrait photo. Background removal is applied
                            automatically for this layout.
                          </span>

                          <div className="photo-adjust-grid">
                            {LEAP_ROBOTS_PHOTO_ADJUST_FIELDS.map((setting) => (
                              <label key={setting.key}>
                                {setting.label}
                                <input
                                  type="number"
                                  min={setting.min}
                                  max={setting.max}
                                  step="1"
                                  value={
                                    formData[setting.key] ??
                                    LEAP_ROBOTS_PHOTO_DEFAULTS[setting.key]
                                  }
                                  onChange={(event) =>
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
                      onChange={(event) => updateValue(field.key, event.target.value)}
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
                      onChange={(event) => updateValue(field.key, event.target.value)}
                      placeholder={field.defaultValue || field.label}
                    />
                  )}
                </label>
              ))}

            {!isTemplateQrManaged(selectedTemplate) && (
              <label>
                QR Data
                <textarea
                  value={qrData}
                  onChange={(event) => setQrData(event.target.value)}
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
