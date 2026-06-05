import { QRCodeCanvas } from "qrcode.react";

function getCardBackground(design = {}) {
  if (design.backgroundType === "gradient") return design.gradient;
  return design.backgroundColor || "#ffffff";
}

function getImageRadius(shape) {
  if (shape === "circle") return "50%";
  if (shape === "rounded") return "14px";
  return "0";
}

function getSafeQrSize(field) {
  const width = Number(field.width) || 100;
  return Math.max(48, width - 12);
}

function buildDigivalQrLogo() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="14" fill="white" />
      <text x="30" y="54" font-size="52" font-weight="700" fill="#111111" font-family="Georgia, serif">D</text>
      <path d="M46 24 L56 36 L72 8 L59 14 L47 29 L42 24 Z" fill="#2196f3" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const digivalQrLogo = buildDigivalQrLogo();

function DigivalLogo() {
  return (
    <img
      src="../../public/digival/digival-logo.png"
      alt="DigiVal Logo"
      className="digival-logo-image"
    />
  );
}

function DotCluster({ left = 28, top = 20 }) {
  const dots = [];

  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      dots.push(
        <span
          key={`${row}-${col}`}
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "#63aef6",
            left: col * 22,
            top: row * 22
          }}
        />
      );
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 92,
        height: 92
      }}
    >
      {dots}
    </div>
  );
}

function findField(template, key) {
  return template.fields?.find(field => field.key === key);
}

function getFieldValue(formData, template, key, fallback = "") {
  return formData?.[key] || findField(template, key)?.defaultValue || fallback;
}

function DigivalFront({ template, formData }) {
  const photo = getFieldValue(formData, template, "photo", "");
  const name = getFieldValue(formData, template, "name", "");
  const employeeId = getFieldValue(formData, template, "employeeId", "");

  return (
    <div className="id-card-preview digival-card">
      <DotCluster left={28} top={20} />
      <DotCluster left={300} top={20} />

      <div className="digival-logo-position">
        <DigivalLogo />
      </div>
<div className="digival-photo-wrap">
  <div className="digival-photo-shape">
    <div className="digival-photo-bg" />

    {photo ? (
      <img
        src={photo}
        alt="Employee Body"
        className="digival-employee-photo-body"
      />
    ) : (
      <div className="digival-photo-placeholder">
        Photo
      </div>
    )}
  </div>

  {photo && (
    <div className="digival-head-overflow">
      <img
        src={photo}
        alt="Employee Head"
        className="digival-employee-photo-head"
      />
    </div>
  )}
</div>
      <div className="digival-name">{name}</div>
      <div className="digival-employee-id">{employeeId}</div>
    </div>
  );
}
function DigivalBack({ template, formData }) {
  const bloodGroup = getFieldValue(formData, template, "bloodGroup", "B+ve");
  const phone = getFieldValue(formData, template, "phone", "7824804804");

  return (
    <div className="id-card-preview digival-card">
      <DotCluster left={28} top={20} />
      <DotCluster left={300} top={20} />

      <div className="digival-logo-position">
        <DigivalLogo />
      </div>

      <div className="digival-qr-box">
        <img
          src="/digival/digival-qr.png"
          alt="DigiVal QR"
          className="digival-static-qr"
        />
      </div>

      <div className="digival-blood">
        Blood Group: {bloodGroup}
      </div>

      <div className="digival-address-title">
        Office Address
      </div>

      <div className="digival-address">
        5th Floor Right Wing, Chennai Citi Centre,
        {"\n"}Dr Radhakrishnan Sulai, Mylapore,
        {"\n"}Chennai - 600004, Tamil Nadu, India
      </div>

      <div className="digival-phone">
        Ph no: {phone}
      </div>

      <div className="digival-website">
        www.digi-val.com
      </div>
    </div>
  );
}
function renderField(field, formData, qrData) {
const value = formData?.[field.key] || "";
  const commonStyle = {
    position: "absolute",
    left: `${field.x || 0}px`,
    top: `${field.y || 0}px`,
    width: `${field.width || 160}px`,
    height: `${field.height || 28}px`,
    fontSize: `${field.fontSize || 14}px`,
    fontWeight: field.bold ? "800" : field.fontWeight || "500",
    color: field.fontColor || "#111827",
    textAlign: field.align || "left",
    fontStyle: field.italic ? "italic" : "normal",
    textDecoration: field.underline ? "underline" : "none",
    overflow: "hidden",

    // important fix
    whiteSpace: field.type === "textarea" ? "pre-wrap" : "nowrap",
    wordBreak: field.type === "textarea" ? "break-word" : "normal",

    lineHeight: "1.35"
  };

  if (field.show === false) return null;

  if (field.type === "image") {
    return value ? (
      <img
        src={value}
        alt={field.label}
        style={{
          ...commonStyle,
          objectFit: "cover",
          borderRadius: getImageRadius(field.imageShape),
          border: "2px solid rgba(255,255,255,0.85)"
        }}
      />
    ) : (
      <div
        style={{
          ...commonStyle,
          borderRadius: getImageRadius(field.imageShape),
          background: "rgba(148,163,184,0.18)",
          border: "1px dashed #94a3b8",
          display: "grid",
          placeItems: "center",
          color: "#64748b",
          fontSize: "11px"
        }}
      >
        {field.label}
      </div>
    );
  }

  if (field.type === "qr") {
    return (
      <div
        style={{
          ...commonStyle,
          display: "grid",
          placeItems: "center",
          background: "#ffffff",
          borderRadius: "12px",
          padding: "6px"
        }}
      >
        <QRCodeCanvas
          value={qrData || JSON.stringify(formData || {})}
          size={getSafeQrSize(field)}
        />
      </div>
    );
  }

  return <div style={commonStyle}>{value || field.label}</div>;
}

function GenericCardSide({ template, side, formData, qrData }) {
  const design = side === "front" ? template.frontDesign : template.backDesign;
  const fields = template.fields?.filter(field => field.side === side) || [];

  return (
    <div
      className="id-card-preview"
      style={{
        width: `${template.cardSize?.width || 260}px`,
        height: `${template.cardSize?.height || 420}px`,
        background: getCardBackground(design),
        borderRadius: `${design?.borderRadius || 18}px`,
        border: `1px solid ${design?.borderColor || "#e5e7eb"}`,
        boxShadow: design?.shadow
          ? "0 24px 60px rgba(15, 23, 42, 0.18)"
          : "none",
        fontFamily: template.styles?.fontFamily || "Inter, Arial, sans-serif"
      }}
    >
      {fields.map((field, index) => (
        <div key={field._id || `${field.key}-${index}`}>
          {renderField(field, formData, qrData)}
        </div>
      ))}
    </div>
  );
}

function CardSide({ template, side, formData, qrData }) {
  if (template.layoutKey === "digival") {
    return side === "front" ? (
      <DigivalFront template={template} formData={formData} />
    ) : (
      <DigivalBack template={template} formData={formData} qrData={qrData} />
    );
  }

  return (
    <GenericCardSide
      template={template}
      side={side}
      formData={formData}
      qrData={qrData}
    />
  );
}

function CardPreview({ template, formData = {}, qrData = "" }) {
  if (!template) {
    return <div className="empty-box">Select a template to preview</div>;
  }

  return (
    <div className="preview-wrap">
      <div>
        <p className="preview-label">Front Side</p>
        <div id="front-card-export">
          <CardSide
            template={template}
            side="front"
            formData={formData}
            qrData={qrData}
          />
        </div>
      </div>

      <div>
        <p className="preview-label">Back Side</p>
        <div id="back-card-export">
          <CardSide
            template={template}
            side="back"
            formData={formData}
            qrData={qrData}
          />
        </div>
      </div>
    </div>
  );
}

export default CardPreview;