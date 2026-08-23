import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || "/my-reports";

  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await login(form);
    setLoading(false);
    if (err) { setError(err); return; }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Fraunces, serif", color: "var(--color-indigo-dark)" }}>
            Lost &amp; Found
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>University Item Recovery</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-card" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-indigo-dark)" }}>Welcome back</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-primary)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <input
                  type="email" required autoComplete="email"
                  className="form-input !pl-10"
                  placeholder="you@university.edu"
                  value={form.email} onChange={set("email")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text-primary)" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                <input
                  type="password" required autoComplete="current-password"
                  className="form-input !pl-10"
                  placeholder="��������"
                  value={form.password} onChange={set("password")}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 mt-2"
              style={{ background: "var(--color-indigo)" }}
            >
              {loading ? "Signing in�" : <><LogIn className="w-4 h-4" /> Sign In</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
            No account?{" "}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: "var(--color-indigo)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
