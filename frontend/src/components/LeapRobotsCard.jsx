import { resolveApiAssetUrl } from "../services/api";
import "../styles/leapRobotsCard.css";

const FALLBACKS = {
  name: "Name",
  role: "Role",
  employeeId: "",
  bloodGroup: "",
  phone: "+91 8074143384",
  email: "Info@leaprobots.com",
};

const getDisplayValue = (value, fallback) => {
  const text = String(value || "").trim();
  return text || fallback;
};

const getNameSizeClass = (name) => {
  if (name.length > 24) return "extra-long";
  if (name.length > 17) return "long";
  return "";
};

const getEmailSizeClass = (email) => {
  return email.length > 28 ? "long" : "";
};

const getNumberValue = (value, fallback) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeBloodGroup = (value) => {
  const compactValue = String(value || "").replace(/\s+/g, "");
  const firstCharacter = compactValue.charAt(0).toUpperCase();
  const secondCharacter = compactValue.charAt(1);

  return `${firstCharacter}${secondCharacter}`.slice(0, 2);
};

function LeapRobotsCard({ formData = {}, logoSrc, bgSrc }) {
  const name = getDisplayValue(formData.name, FALLBACKS.name);
  const role = getDisplayValue(formData.role, FALLBACKS.role);
  const employeeId = getDisplayValue(formData.employeeId, FALLBACKS.employeeId);
  const bloodGroup = normalizeBloodGroup(
    getDisplayValue(formData.bloodGroup, FALLBACKS.bloodGroup),
  );
  const bloodGroupBase = bloodGroup.charAt(0);
  const bloodGroupExponent = bloodGroup.charAt(1);
  const phone = getDisplayValue(formData.phone, FALLBACKS.phone);
  const email = getDisplayValue(formData.email, FALLBACKS.email);
  const photoSrc = resolveApiAssetUrl(formData.photo || "");
  const photoStyle = {
    width: `${getNumberValue(formData.photoWidth, 320)}px`,
    height: `${getNumberValue(formData.photoHeight, 260)}px`,
    transform: `translate(${getNumberValue(formData.photoX, 0)}px, ${getNumberValue(
      formData.photoY,
      0,
    )}px)`,
  };

  return (
    <div className="id-card-preview leap-card">
      <img
        src={bgSrc}
        alt=""
        className="leap-bg"
        crossOrigin="anonymous"
        aria-hidden="true"
      />

      <div className="leap-content">
        <div className="leap-logo-wrap">
          <img
            src={logoSrc}
            alt="Leap Robots"
            className="leap-logo"
            crossOrigin="anonymous"
          />
        </div>

        <div className="leap-photo-wrap">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt="Employee"
              className="leap-photo"
              style={photoStyle}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="leap-photo-placeholder">Upload Image</div>
          )}
        </div>

        <div className="leap-name-band">
          <h2 className={getNameSizeClass(name)}>{name}</h2>
          <p>{role}</p>
        </div>

        <div className="leap-info" style={{ backgroundColor: formData.infoBgColor || "#399153cc" }}>
          <p className="leap-info-row">
            <span className="leap-info-label">Employee.ID :</span>
            <span className="leap-info-value">{employeeId}</span>
          </p>

          <p className="leap-info-row">
            <span className="leap-info-label">Blood Group :</span>
            <span className="leap-blood-value">
              {bloodGroupBase}
              {bloodGroupExponent && <sup>{bloodGroupExponent}</sup>}
            </span>
          </p>

          <p className="leap-info-row">
            <span className="leap-info-label">Tel :</span>
            <span className="leap-info-value">{phone}</span>
          </p>

          <p className={`leap-email ${getEmailSizeClass(email)}`}>{email}</p>
        </div>
      </div>
    </div>
  );
}

export default LeapRobotsCard;
