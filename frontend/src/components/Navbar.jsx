import { NavLink } from "react-router-dom";

function Navbar() {
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
    </nav>
  );
}

export default Navbar;
