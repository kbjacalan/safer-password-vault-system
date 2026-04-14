import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import Logo from "../../assets/logo.png";
import "./Signup.css";

/* Password strength helpers */
const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Strong", "Vault-ready"];
const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#2563eb"];

const calcStrength = (pw) => {
  let score = 0;
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  if (pw.length >= 6) score++;
  if (checks.length) score++;
  if (checks.upper) score++;
  if (checks.number) score++;
  if (checks.symbol) score++;
  return { score: Math.min(score, 4), checks };
};

/* Component */
const Signup = () => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = calcStrength(form.password);
  const passwordsMatch =
    form.confirm.length > 0 && form.password === form.confirm;

  /* Field setter */
  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
    if (apiError) setApiError("");
  };

  /* Validation */
  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "First name is required";
    if (!form.last_name.trim()) errs.last_name = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    else if (strength.score < 2) errs.password = "Password is too weak";
    if (!form.confirm) errs.confirm = "Please confirm your password";
    else if (form.confirm !== form.password)
      errs.confirm = "Passwords do not match";
    return errs;
  };

  /* Submit (UI-only — wire up your API here) */
  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    /* TODO: replace timeout with your real API call */
    setTimeout(() => setLoading(false), 1800);
  };

  /* Render */
  return (
    <div className="signup-form-page">
      <div className="signup-form-card">
        {/* Brand */}
        <div className="signup-brand">
          <img className="brand-logo" src={Logo} alt="Safer Logo" />
        </div>

        <h2 className="signup-title">Create your account</h2>
        <p className="signup-subtitle">
          Secure your passwords with Safer — encrypted, zero-knowledge vault.
        </p>

        {/* API error */}
        {apiError && (
          <div className="signup-api-error">
            <AlertCircle size={14} />
            {apiError}
          </div>
        )}

        {/* Form */}
        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          {/* Name row */}
          <div className="signup-name-row">
            <div
              className={`signup-field ${errors.first_name ? "signup-field--error" : ""}`}
            >
              <label className="signup-label">First Name</label>
              <input
                type="text"
                placeholder="e.g. Bryan"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
              {errors.first_name && (
                <span className="signup-error">{errors.first_name}</span>
              )}
            </div>

            <div
              className={`signup-field ${errors.last_name ? "signup-field--error" : ""}`}
            >
              <label className="signup-label">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Jacalan"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
              {errors.last_name && (
                <span className="signup-error">{errors.last_name}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div
            className={`signup-field ${errors.email ? "signup-field--error" : ""}`}
          >
            <label className="signup-label">Email</label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors.email && (
              <span className="signup-error">{errors.email}</span>
            )}
          </div>

          {/* Master password */}
          <div
            className={`signup-field ${errors.password ? "signup-field--error" : ""}`}
          >
            <label className="signup-label">Master Password</label>
            <div className="signup-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Strength meter */}
            {form.password.length > 0 && (
              <div className="signup-strength">
                <div className="signup-strength-bars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`signup-strength-bar ${i <= strength.score ? `signup-strength-bar--active-${strength.score}` : ""}`}
                    />
                  ))}
                </div>
                <div className="signup-strength-row">
                  <span
                    className="signup-strength-label"
                    style={{ color: STRENGTH_COLORS[strength.score] }}
                  >
                    {STRENGTH_LABELS[strength.score]}
                  </span>
                  <div className="signup-strength-checks">
                    <span
                      className={`signup-strength-check ${strength.checks.length ? "signup-strength-check--pass" : ""}`}
                    >
                      <Check size={10} strokeWidth={3} /> 8+
                    </span>
                    <span
                      className={`signup-strength-check ${strength.checks.upper ? "signup-strength-check--pass" : ""}`}
                    >
                      <Check size={10} strokeWidth={3} /> A–Z
                    </span>
                    <span
                      className={`signup-strength-check ${strength.checks.number ? "signup-strength-check--pass" : ""}`}
                    >
                      <Check size={10} strokeWidth={3} /> 0–9
                    </span>
                    <span
                      className={`signup-strength-check ${strength.checks.symbol ? "signup-strength-check--pass" : ""}`}
                    >
                      <Check size={10} strokeWidth={3} /> !@#
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errors.password && (
              <span className="signup-error">{errors.password}</span>
            )}
          </div>

          {/* Confirm password */}
          <div
            className={`signup-field ${
              errors.confirm
                ? "signup-field--error"
                : passwordsMatch
                  ? "signup-field--match"
                  : ""
            }`}
          >
            <label className="signup-label">Confirm Password</label>
            <div className="signup-password-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
              />
              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordsMatch && !errors.confirm && (
              <span className="signup-match-hint">
                <Check size={11} strokeWidth={3} /> Passwords match
              </span>
            )}
            {errors.confirm && (
              <span className="signup-error">{errors.confirm}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="signup-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="signup-spinner" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="signup-switch">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
