import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="home">
      <div className="hero">
        <div className="hero-content">
          <span className="eyebrow">Professional MERN ID Card Studio</span>
          <h1>Create premium office and university ID cards in minutes.</h1>
          <p>
            Build custom templates, add dynamic fields, upload photos and logos, generate QR codes,
            save cards, export as PNG or PDF, and print directly.
          </p>

          <div className="button-row">
            <Link className="btn primary" to="/templates">Browse Templates</Link>
            <Link className="btn secondary" to="/builder">Create Template</Link>
          </div>
        </div>

        <div className="hero-preview">
          <div className="sample-card sample-card-one">
            <div className="sample-logo" />
            <div className="sample-photo" />
            <h3>User Name</h3>
            <p>Software Developer Intern</p>
            <span>EMP-1024</span>
          </div>

          <div className="sample-card sample-card-two">
            <div className="sample-qr" />
            <p>Scan for profile details</p>
            <small>Valid Internal ID</small>
          </div>
        </div>
      </div>

      <div className="section-title">
        <h2>What this app includes</h2>
        <p>Clean features that actually matter. No useless complexity.</p>
      </div>

      <div className="feature-grid">
        <div className="feature-card"><h3>Template Builder</h3><p>Create office, university, and custom ID card templates with field positioning.</p></div>
        <div className="feature-card"><h3>Dynamic Forms</h3><p>The generation form changes automatically based on the selected template fields.</p></div>
        <div className="feature-card"><h3>Live Preview</h3><p>See front and back card designs instantly while entering data.</p></div>
        <div className="feature-card"><h3>Export Tools</h3><p>Download PNG, generate PDF, print card, and save generated cards in MongoDB.</p></div>
      </div>
    </section>
  );
}

export default Home;
