import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectPath = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const [status, setStatus] = useState({
    loading: false,
    error: ""
  });

  const handleChange = event => {
    const { name, value } = event.target;

    setFormData(previous => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    setStatus({
      loading: true,
      error: ""
    });

    try {
      await login(formData);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setStatus({
        loading: false,
        error: error?.response?.data?.message || "Login failed. Please try again."
      });
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">ID</span>
          <div>
            <h1>ID Card Studio</h1>
            <p>Admin login</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          {status.error && <div className="auth-error">{status.error}</div>}

          <button className="btn primary auth-submit" type="submit" disabled={status.loading}>
            {status.loading ? "Checking..." : "Login"}
          </button>
        </form>

        <p className="auth-note">
          Default login: username <b>admin</b>, password <b>Admin@123</b>.
        </p>
      </div>
    </section>
  );
}

export default Login;