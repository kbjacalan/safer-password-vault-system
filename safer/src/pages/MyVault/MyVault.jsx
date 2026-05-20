import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Globe,
  Key,
  Star,
  StarOff,
  MoreHorizontal,
  Shield,
  Lock,
  Loader2,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../providers/SidebarProvider";
import {
  fetchVaultEntries,
  deleteVaultEntry,
  toggleFavorite,
  updateVaultPassword,
} from "../../utils/api";
import { calcStrength, generatePassword } from "../../utils/passwordUtils";
import "./MyVault.css";

const CATEGORIES = [
  "All",
  "Work",
  "Personal",
  "Dev",
  "Social",
  "Finance",
  "Other",
];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Strong", "Vault-ready"];
const STRENGTH_COLORS = ["", "#f97316", "#eab308", "#22c55e", "#2563eb"];

const getFavicon = (url) =>
  `https://www.google.com/s2/favicons?domain=${url}&sz=32`;

const PasswordItem = ({ item, onToggleFav, onDelete, onPasswordChanged }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Change password modal state
  const [changingPw, setChangingPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  const strength = calcStrength(newPassword);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.encrypted_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const openChangePassword = () => {
    setMenuOpen(false);
    setNewPassword("");
    setShowNewPw(false);
    setPwError("");
    setChangingPw(true);
  };

  const handleGenerate = () => {
    const pw = generatePassword();
    setNewPassword(pw);
    setShowNewPw(true);
    setPwError("");
  };

  const handleSavePassword = async () => {
    if (!newPassword) {
      setPwError("Password cannot be empty");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      await updateVaultPassword(item.id, {
        password: newPassword,
        strength_score: strength.score,
      });
      onPasswordChanged(item.id, newPassword, strength.score);
      setChangingPw(false);
      toast.success("Password changed successfully!");
    } catch (err) {
      setPwError(err.message || "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <>
      <div className="vault-item">
        <div className="vault-item-favicon">
          <img
            src={getFavicon(item.site_url)}
            alt={item.site_name}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <span className="vault-item-favicon-fallback">
            <Globe size={16} />
          </span>
        </div>

        <div className="vault-item-info">
          <div className="vault-item-top">
            <span className="vault-item-site">{item.site_name}</span>
            <span
              className="vault-item-strength-dot"
              style={{ background: STRENGTH_COLORS[item.strength_score] }}
              title={STRENGTH_LABELS[item.strength_score]}
            />
          </div>
          <span className="vault-item-username">{item.username}</span>
        </div>

        <div className="vault-item-password-wrap">
          <span className="vault-item-password">
            {visible ? item.encrypted_password : "••••••••••••"}
          </span>
        </div>

        <div className="vault-item-actions">
          <button
            className="vault-action-btn"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            className={`vault-action-btn ${copied ? "vault-action-btn--copied" : ""}`}
            onClick={handleCopy}
            aria-label="Copy password"
          >
            <Copy size={15} />
            {copied && <span className="vault-copy-toast">Copied!</span>}
          </button>
          <button
            className={`vault-action-btn ${item.is_favorited ? "vault-action-btn--fav" : ""}`}
            onClick={() => onToggleFav(item.id)}
            aria-label={item.is_favorited ? "Unfavorite" : "Favorite"}
          >
            {item.is_favorited ? <Star size={15} /> : <StarOff size={15} />}
          </button>
          <div className="vault-menu-wrap">
            <button
              className="vault-action-btn"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="More options"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="vault-menu">
                <button
                  className="vault-menu-item"
                  onClick={openChangePassword}
                >
                  <KeyRound size={13} />
                  <span>Change Password</span>
                </button>
                <button
                  className="vault-menu-item vault-menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(item.id);
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {changingPw && (
        <div className="vault-changepw-card">
          <div className="vault-changepw-header">
            <KeyRound size={14} />
            <span>Change Password — {item.site_name}</span>
          </div>

          <div className="vault-changepw-row">
            <div className="vault-changepw-input-wrap">
              <input
                type={showNewPw ? "text" : "password"}
                className="vault-changepw-input"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwError("");
                }}
                autoFocus
              />
              <button
                className="vault-changepw-eye"
                onClick={() => setShowNewPw((v) => !v)}
                aria-label={showNewPw ? "Hide" : "Show"}
              >
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button className="vault-changepw-gen" onClick={handleGenerate}>
              <RefreshCw size={13} />
              <span>Generate</span>
            </button>
          </div>

          {newPassword && (
            <div className="vault-changepw-strength">
              <div className="vault-changepw-strength-bars">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="vault-changepw-strength-bar"
                    style={{
                      background:
                        strength.score >= n
                          ? STRENGTH_COLORS[strength.score]
                          : "var(--border-color)",
                    }}
                  />
                ))}
              </div>
              <span
                className="vault-changepw-strength-label"
                style={{ color: STRENGTH_COLORS[strength.score] }}
              >
                {STRENGTH_LABELS[strength.score]}
              </span>
            </div>
          )}

          {pwError && <p className="vault-changepw-error">{pwError}</p>}

          <div className="vault-changepw-actions">
            <button
              className="vault-changepw-cancel"
              onClick={() => setChangingPw(false)}
              disabled={pwSaving}
            >
              Cancel
            </button>
            <button
              className="vault-changepw-save"
              onClick={handleSavePassword}
              disabled={pwSaving || !newPassword}
            >
              {pwSaving ? (
                <Loader2 size={13} className="addpw-spinner" />
              ) : null}
              {pwSaving ? "Saving…" : "Save Password"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const MyVault = () => {
  const { isOpen: sidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showFavs, setShowFavs] = useState(false);

  // Fetch entries on mount
  useEffect(() => {
    const load = async () => {
      try {
        const entries = await fetchVaultEntries();
        setPasswords(entries);
      } catch (err) {
        setError(err.message || "Failed to load vault");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleFav = async (id) => {
    const item = passwords.find((p) => p.id === id);
    const wasFavorited = item?.is_favorited;
    // Optimistic update
    setPasswords((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_favorited: !p.is_favorited } : p,
      ),
    );
    try {
      await toggleFavorite(id);
      toast.success(
        wasFavorited ? "Removed from favorites" : "Added to favorites",
      );
    } catch {
      // Revert on failure
      setPasswords((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_favorited: !p.is_favorited } : p,
        ),
      );
    }
  };

  const handleDelete = async (id) => {
    const item = passwords.find((p) => p.id === id);
    // Optimistic removal
    setPasswords((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteVaultEntry(id);
      toast.success("Entry deleted");
    } catch {
      // Revert on failure
      if (item) setPasswords((prev) => [item, ...prev]);
      toast.error("Failed to delete entry");
    }
  };

  const handlePasswordChanged = (id, newPassword, strengthScore) => {
    setPasswords((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              encrypted_password: newPassword,
              strength_score: strengthScore,
            }
          : p,
      ),
    );
  };

  const filtered = passwords.filter((p) => {
    const matchSearch =
      p.site_name.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    const matchFav = !showFavs || p.is_favorited;
    return matchSearch && matchCat && matchFav;
  });

  const totalPasswords = passwords.length;
  const strongCount = passwords.filter((p) => p.strength_score >= 3).length;
  const weakCount = passwords.filter((p) => p.strength_score <= 2).length;

  return (
    <div
      className={`vault-page ${sidebarOpen ? "vault-page--sidebar-open" : "vault-page--sidebar-closed"}`}
    >
      <div className="vault-stats">
        <div className="vault-stat-card">
          <span className="vault-stat-icon vault-stat-icon--blue">
            <Key size={16} />
          </span>
          <div className="vault-stat-info">
            <span className="vault-stat-value">{totalPasswords}</span>
            <span className="vault-stat-label">Total Passwords</span>
          </div>
        </div>
        <div className="vault-stat-card">
          <span className="vault-stat-icon vault-stat-icon--green">
            <Shield size={16} />
          </span>
          <div className="vault-stat-info">
            <span className="vault-stat-value">{strongCount}</span>
            <span className="vault-stat-label">Strong Passwords</span>
          </div>
        </div>
        <div className="vault-stat-card">
          <span className="vault-stat-icon vault-stat-icon--orange">
            <Lock size={16} />
          </span>
          <div className="vault-stat-info">
            <span className="vault-stat-value">{weakCount}</span>
            <span className="vault-stat-label">Weak Passwords</span>
          </div>
        </div>
      </div>

      <div className="vault-toolbar">
        <div className="vault-search">
          <Search size={14} className="vault-search-icon" />
          <input
            type="text"
            placeholder="Search site or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="vault-filters">
          <div className="vault-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`vault-cat-btn ${category === cat ? "vault-cat-btn--active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            className={`vault-fav-toggle ${showFavs ? "vault-fav-toggle--active" : ""}`}
            onClick={() => setShowFavs((p) => !p)}
          >
            <Star size={13} />
            <span>Favorites</span>
          </button>
        </div>
      </div>

      <div className="vault-list-header">
        <span>Site</span>
        <span className="vault-header-password">Password</span>
        <span>Actions</span>
      </div>

      <div className="vault-list">
        {loading ? (
          <div className="vault-empty">
            <Loader2 size={28} className="addpw-spinner" />
            <p>Loading your vault...</p>
          </div>
        ) : error ? (
          <div className="vault-empty">
            <Key size={32} />
            <p>Something went wrong</p>
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vault-empty">
            <Key size={32} />
            <p>No passwords found</p>
            <span>
              {passwords.length === 0
                ? "Add your first entry using the button above"
                : "Try adjusting your search or filters"}
            </span>
          </div>
        ) : (
          filtered.map((item) => (
            <PasswordItem
              key={item.id}
              item={item}
              onToggleFav={handleToggleFav}
              onDelete={handleDelete}
              onPasswordChanged={handlePasswordChanged}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MyVault;
