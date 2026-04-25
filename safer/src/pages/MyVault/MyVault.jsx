import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../providers/SidebarProvider";
import {
  fetchVaultEntries,
  deleteVaultEntry,
  toggleFavorite,
} from "../../utils/api";
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

const PasswordItem = ({ item, onToggleFav, onDelete }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.encrypted_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
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
    // Optimistic update
    setPasswords((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_favorited: !p.is_favorited } : p,
      ),
    );
    try {
      await toggleFavorite(id);
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
    setPasswords((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteVaultEntry(id);
    } catch {
      // Could restore the item here if needed
    }
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MyVault;
