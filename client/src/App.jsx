import { Navigate, Route, Routes, Link } from "react-router-dom";
import HydrosentinelLogo from "./components/HydrosentinelLogo.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StateOverview from "./pages/StateOverview.jsx";
import FarmerDashboard from "./pages/FarmerDashboard.jsx";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("hydrosentinel_token");
  return token ? children : <Navigate to="/login" replace />;
};

const Navbar = () => (
  <nav className="navbar">
    <Link to="/" className="navbar-brand" aria-label="HydroSentinel home">
      <HydrosentinelLogo size={30} className="brand-logo" />
      <span>HydroSentinel</span>
    </Link>
    <div className="navbar-actions">
      <Link to="/state-overview" className="btn btn-secondary small">State Overview</Link>
      <Link to="/farmer-dashboard" className="btn btn-secondary small">Farmer Dashboard</Link>
      <Link to="/login" className="btn btn-secondary small">Login</Link>
      <Link to="/register" className="btn btn-primary small">Register</Link>
    </div>
  </nav>
);

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/state-overview" element={<StateOverview />} />
        <Route path="/farmer-dashboard" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
