import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import Logo from "../../assets/logo.png";
import { signin, saveSession } from "../../utils/api";
import "./Signin.css";

/* Component */
const Signin = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  /* Field setter */
  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
    if (apiError) setApiError("");
  };

  /* Validation */
  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    return errs;
  };

  /* Submit — calls Go backend */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const data = await signin({
        email: form.email.trim(),
        password: form.password,
      });

      saveSession(data); // persist token + user
      navigate("/my-vault"); // redirect on success
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Render */
  return (
    <div className="signin-form-page">
      <div className="signin-form-card">
        {/* Brand */}
        <div className="signin-brand">
          <img className="brand-logo" src={Logo} alt="Safer Logo" />
        </div>

        <h2 className="signin-title">Welcome back</h2>
        <p className="signin-subtitle">Sign in to access your Safer vault.</p>

        {/* API error */}
        {apiError && (
          <div className="signin-api-error">
            <AlertCircle size={14} />
            {apiError}
          </div>
        )}

        {/* Form */}
        <form className="signin-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div
            className={`signin-field ${errors.email ? "signin-field--error" : ""}`}
          >
            <label className="signin-label">Email</label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors.email && (
              <span className="signin-error">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div
            className={`signin-field ${errors.password ? "signin-field--error" : ""}`}
          >
            <label className="signin-label">Password</label>
            <div className="signin-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your master password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              <button
                type="button"
                className="signin-password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <span className="signin-error">{errors.password}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="signin-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="signin-spinner" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="signin-switch">
            Don't have an account? <Link to="/">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signin;
