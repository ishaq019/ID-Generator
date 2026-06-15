import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="brand">
        <span className="brand-mark">ID</span>
        <span>Card Studio</span>
      </div>

      <div className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/templates">Templates</NavLink>
        <NavLink to="/builder">Builder</NavLink>
        <NavLink to="/generate">Generate</NavLink>
        <NavLink to="/cards">Saved Cards</NavLink>
      </div>

      <div className="nav-actions">
        <span className="nav-user">{user?.username || "Admin"}</span>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
