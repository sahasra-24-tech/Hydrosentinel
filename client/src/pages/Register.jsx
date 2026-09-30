import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.post("/users/register", form);
      localStorage.setItem("hydrosentinel_token", data.token);
      localStorage.setItem("hydrosentinel_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-center-page auth-rain-page">
      <div className="auth-bg-blobs" aria-hidden="true">
        <span className="auth-blob blob-one" />
        <span className="auth-blob blob-two" />
        <span className="auth-blob blob-three" />
      </div>

      <motion.section
        className="auth-card auth-glass-card auth-glass-register"
        initial={{ opacity: 0, y: 20, rotateX: -10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-copy">
          <div className="eyebrow">Join HydroSentinel</div>
          <h2>Register</h2>
          <p className="auth-subtitle">Create an account to save locations, alerts, and advisories.</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <input placeholder="Enter your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <span>Name</span>
          </label>
          <label className="auth-field">
            <input placeholder="Enter your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <span>Email</span>
          </label>
          <label className="auth-field">
            <input placeholder="Create a password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <span>Password</span>
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="btn btn-primary full-width auth-submit" disabled={loading}>{loading ? "Creating account..." : "Register"}</button>
        </form>
      </motion.section>
    </main>
  );
}
