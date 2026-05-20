import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Check,
  Loader2,
  RefreshCw,
  Globe,
  User,
  Lock,
  Tag,
  FileText,
} from "lucide-react";
import { useSidebar } from "../../providers/SidebarProvider";
import { calcStrength, generatePassword } from "../../utils/passwordUtils";
import { createVaultEntry } from "../../utils/api";
import toast from "react-hot-toast";
import "./AddPassword.css";

const CATEGORIES = ["Personal", "Work", "Dev", "Social", "Finance", "Other"];
const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Strong", "Vault-ready"];
const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#2563eb"];

const AddPassword = () => {
  const navigate = useNavigate();
  const { isOpen: sidebarOpen } = useSidebar();
  const [form, setForm] = useState({
    site: "",
    url: "",
    username: "",
    password: "",
    category: "Personal",
    notes: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState("");

  const strength = calcStrength(form.password);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleGenerate = () => {
    const pw = generatePassword();
    setForm((prev) => ({ ...prev, password: pw }));
    setShowPassword(true);
    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.site.trim()) errs.site = "Site name is required";
    if (!form.username.trim()) errs.username = "Username or email is required";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await createVaultEntry({
        site_name: form.site,
        site_url: form.url,
        username: form.username,
        password: form.password,
        category: form.category,
        strength_score: strength.score,
        notes: form.notes,
      });

      setSaved(true);
      toast.success("Password saved to vault!");
      setTimeout(() => navigate("/my-vault"), 1000);
    } catch (err) {
      setApiError(err.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`addpw-page ${sidebarOpen ? "addpw-page--sidebar-open" : "addpw-page--sidebar-closed"}`}
    >
      <div className="addpw-card">
        <div className="addpw-card-header">
          <div className="addpw-card-header-icon">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="addpw-card-title">New Password Entry</h2>
            <p className="addpw-card-subtitle">
              Store your credentials securely in your vault
            </p>
          </div>
        </div>

        <form className="addpw-form" onSubmit={handleSubmit} noValidate>
          {apiError && <div className="addpw-api-error">{apiError}</div>}

          {/* Site name */}
          <div
            className={`addpw-field ${errors.site ? "addpw-field--error" : ""}`}
          >
            <label className="addpw-label">
              <Globe size={12} />
              Site Name
            </label>
            <input
              type="text"
              placeholder="e.g. Google, GitHub"
              value={form.site}
              onChange={(e) => set("site", e.target.value)}
            />
            {errors.site && <span className="addpw-error">{errors.site}</span>}
          </div>

          {/* URL */}
          <div className="addpw-field">
            <label className="addpw-label">
              <Globe size={12} />
              Website URL
              <span className="addpw-label-optional">optional</span>
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
            />
          </div>

          {/* Username */}
          <div
            className={`addpw-field ${errors.username ? "addpw-field--error" : ""}`}
          >
            <label className="addpw-label">
              <User size={12} />
              Username or Email
            </label>
            <input
              type="text"
              placeholder="you@email.com or @username"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
            />
            {errors.username && (
              <span className="addpw-error">{errors.username}</span>
            )}
          </div>

          {/* Password */}
          <div
            className={`addpw-field ${errors.password ? "addpw-field--error" : ""}`}
          >
            <label className="addpw-label">
              <Lock size={12} />
              Password
            </label>
            <div className="addpw-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter or generate a password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              <button
                type="button"
                className="addpw-pw-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                className="addpw-generate-btn"
                onClick={handleGenerate}
                aria-label="Generate password"
                title="Generate secure password"
              >
                <RefreshCw size={14} />
                <span>Generate</span>
              </button>
            </div>

            {form.password.length > 0 && (
              <div className="addpw-strength">
                <div className="addpw-strength-bars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`addpw-strength-bar ${i <= strength.score ? "addpw-strength-bar--active" : ""}`}
                      style={
                        i <= strength.score
                          ? { backgroundColor: STRENGTH_COLORS[strength.score] }
                          : {}
                      }
                    />
                  ))}
                </div>
                <div className="addpw-strength-row">
                  <span
                    className="addpw-strength-label"
                    style={{ color: STRENGTH_COLORS[strength.score] }}
                  >
                    {STRENGTH_LABELS[strength.score]}
                  </span>
                  <div className="addpw-strength-checks">
                    {[
                      { key: "length", label: "8+" },
                      { key: "upper", label: "A–Z" },
                      { key: "number", label: "0–9" },
                      { key: "symbol", label: "!@#" },
                    ].map(({ key, label }) => (
                      <span
                        key={key}
                        className={`addpw-strength-check ${strength.checks[key] ? "addpw-strength-check--pass" : ""}`}
                      >
                        <Check size={10} strokeWidth={3} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {errors.password && (
              <span className="addpw-error">{errors.password}</span>
            )}
          </div>

          {/* Category */}
          <div className="addpw-field">
            <label className="addpw-label">
              <Tag size={12} />
              Category
            </label>
            <div className="addpw-categories">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`addpw-cat-btn ${form.category === cat ? "addpw-cat-btn--active" : ""}`}
                  onClick={() => set("category", cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="addpw-field">
            <label className="addpw-label">
              <FileText size={12} />
              Notes
              <span className="addpw-label-optional">optional</span>
            </label>
            <textarea
              placeholder="Any extra info about this login..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="addpw-actions">
            <button
              type="button"
              className="addpw-cancel-btn"
              onClick={() => navigate("/my-vault")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`addpw-submit-btn ${saved ? "addpw-submit-btn--saved" : ""}`}
              disabled={loading || saved}
            >
              {saved ? (
                <>
                  <Check size={16} />
                  Saved!
                </>
              ) : loading ? (
                <>
                  <Loader2 size={16} className="addpw-spinner" />
                  Saving...
                </>
              ) : (
                "Save to Vault"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPassword;
