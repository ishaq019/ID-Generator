import { useEffect, useState } from "react";
import { settingsAPI } from "../services/api";

const defaultSettings = {
  googleFormUrl: "",
  googleFormAppsScriptUrl: "",
  googleFormWebhookSecret: "",
  googleDriveFolderId: "",
  digivalTemplateSlug: "digival-employee-id-card",
  companyWebsite: "www.digi-val.com",
  companyAddress: "",
  backgroundRemovalEnabled: true,
  googleFormRemoveBg: true,
  bgRemovalModel: "small",
  bgRemovalMaxDimension: 1024
};

function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    message: "",
    error: ""
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsAPI.get();

        setSettings(previous => ({
          ...previous,
          ...response.data.settings
        }));

        setStatus({
          loading: false,
          saving: false,
          message: "",
          error: ""
        });
      } catch (error) {
        setStatus({
          loading: false,
          saving: false,
          message: "",
          error: error?.response?.data?.message || "Failed to load settings"
        });
      }
    };

    loadSettings();
  }, []);

  const handleChange = event => {
    const { name, value, type, checked } = event.target;

    setSettings(previous => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    setStatus(previous => ({
      ...previous,
      saving: true,
      message: "",
      error: ""
    }));

    try {
      const payload = {
        ...settings,
        bgRemovalMaxDimension: Number(settings.bgRemovalMaxDimension || 1024)
      };

      const response = await settingsAPI.update(payload);

      setSettings(previous => ({
        ...previous,
        ...response.data.settings
      }));

      setStatus({
        loading: false,
        saving: false,
        message: "Settings saved successfully",
        error: ""
      });
    } catch (error) {
      setStatus({
        loading: false,
        saving: false,
        message: "",
        error: error?.response?.data?.message || "Failed to save settings"
      });
    }
  };

  if (status.loading) {
    return (
      <section className="page-section">
        <p>Loading settings...</p>
      </section>
    );
  }

  return (
    <section className="page-section settings-page">
      <div className="section-heading">
        <span className="eyebrow">Configuration</span>
        <h1>Application Settings</h1>
        <p>
          Update Google Form, Google Drive, company, and background-removal
          configuration from one place.
        </p>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-grid">
          <label>
            Google Form URL
            <input
              type="url"
              name="googleFormUrl"
              value={settings.googleFormUrl || ""}
              onChange={handleChange}
              placeholder="https://forms.gle/..."
            />
          </label>

          <label>
            Google Apps Script URL
            <input
              type="url"
              name="googleFormAppsScriptUrl"
              value={settings.googleFormAppsScriptUrl || ""}
              onChange={handleChange}
              placeholder="https://script.google.com/..."
            />
          </label>

          <label>
            Google Form Webhook Secret
            <input
              type="text"
              name="googleFormWebhookSecret"
              value={settings.googleFormWebhookSecret || ""}
              onChange={handleChange}
              placeholder="Webhook secret used in Apps Script"
            />
          </label>

          <label>
            Google Drive Folder ID
            <input
              type="text"
              name="googleDriveFolderId"
              value={settings.googleDriveFolderId || ""}
              onChange={handleChange}
              placeholder="Drive folder ID"
            />
          </label>

          <label>
            DigiVal Template Slug
            <input
              type="text"
              name="digivalTemplateSlug"
              value={settings.digivalTemplateSlug || ""}
              onChange={handleChange}
              placeholder="digival-employee-id-card"
            />
          </label>

          <label>
            Company Website
            <input
              type="text"
              name="companyWebsite"
              value={settings.companyWebsite || ""}
              onChange={handleChange}
              placeholder="www.digi-val.com"
            />
          </label>

          <label>
            BG Removal Model
            <select
              name="bgRemovalModel"
              value={settings.bgRemovalModel || "small"}
              onChange={handleChange}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
            </select>
          </label>

          <label>
            BG Removal Max Dimension
            <input
              type="number"
              name="bgRemovalMaxDimension"
              value={settings.bgRemovalMaxDimension || 1024}
              onChange={handleChange}
              min="256"
              max="2048"
            />
          </label>
        </div>

        <label>
          Company Address
          <textarea
            name="companyAddress"
            value={settings.companyAddress || ""}
            onChange={handleChange}
            rows="4"
            placeholder="Company address"
          />
        </label>

        <div className="settings-checks">
          <label className="check-row">
            <input
              type="checkbox"
              name="backgroundRemovalEnabled"
              checked={Boolean(settings.backgroundRemovalEnabled)}
              onChange={handleChange}
            />
            Enable background remover
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              name="googleFormRemoveBg"
              checked={Boolean(settings.googleFormRemoveBg)}
              onChange={handleChange}
            />
            Remove background for Google Form photos
          </label>
        </div>

        {status.message && <div className="settings-success">{status.message}</div>}
        {status.error && <div className="settings-error">{status.error}</div>}

        <button className="btn primary" type="submit" disabled={status.saving}>
          {status.saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </section>
  );
}

export default Settings;
