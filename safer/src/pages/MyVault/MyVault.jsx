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
  StickyNote,
  Pencil,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../providers/SidebarProvider";
import {
  fetchVaultEntries,
  deleteVaultEntry,
  toggleFavorite,
  updateVaultPassword,
  updateVaultNotes,
} from "../../utils/api";
import { calcStrength, generatePassword } from "../../utils/passwordUtils";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
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

const SORT_OPTIONS = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "name-asc", label: "Name (A→Z)" },
  { key: "name-desc", label: "Name (Z→A)" },
  { key: "strength-desc", label: "Strongest First" },
  { key: "strength-asc", label: "Weakest First" },
];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Strong", "Vault-ready"];
const STRENGTH_COLORS = ["", "#f97316", "#eab308", "#22c55e", "#2563eb"];

const getFavicon = (url) =>
  `https://www.google.com/s2/favicons?domain=${url}&sz=32`;

const PasswordItem = ({
  item,
  onToggleFav,
  onDelete,
  onPasswordChanged,
  onNotesChanged,
}) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Change password modal state
  const [changingPw, setChangingPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  // Delete confirm modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Notes state
  const [showNotes, setShowNotes] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState("");

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

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(item.id);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
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

  const openEditNotes = () => {
    setNotesDraft(item.notes || "");
    setNotesError("");
    setEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setNotesError("");
    try {
      await updateVaultNotes(item.id, notesDraft);
      onNotesChanged(item.id, notesDraft);
      setEditingNotes(false);
      toast.success("Notes saved");
    } catch (err) {
      setNotesError(err.message || "Failed to save notes");
    } finally {
      setNotesSaving(false);
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
          <button
            className={`vault-action-btn ${showNotes ? "vault-action-btn--notes-active" : ""}`}
            onClick={() => {
              if (!showNotes) {
                setShowNotes(true);
                if (!item.notes) {
                  setNotesDraft("");
                  setNotesError("");
                  setEditingNotes(true);
                }
              } else {
                setShowNotes(false);
                setEditingNotes(false);
              }
            }}
            aria-label={showNotes ? "Hide notes" : "Show notes"}
          >
            <StickyNote size={15} />
          </button>
          <div className="vault-menu-wrap" ref={menuRef}>
            <button
              className={`vault-action-btn ${menuOpen ? "vault-action-btn--menu-active" : ""}`}
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
                    setDeleteOpen(true);
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

      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete entry?"
        message={`"${item.site_name}" will be moved to Trash. You can restore it later.`}
        confirmLabel="Move to Trash"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {showNotes && (item.notes || editingNotes) && (
        <div className="vault-notes-card">
          <div className="vault-notes-header">
            <StickyNote size={13} />
            <span>Notes</span>
            {!editingNotes && (
              <button
                className="vault-notes-edit-btn"
                onClick={openEditNotes}
                aria-label="Edit notes"
              >
                <Pencil size={12} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editingNotes ? (
            <>
              <textarea
                className="vault-notes-textarea"
                value={notesDraft}
                onChange={(e) => {
                  setNotesDraft(e.target.value);
                  setNotesError("");
                }}
                placeholder="Add a note…"
                rows={3}
                autoFocus
              />
              {notesError && <p className="vault-notes-error">{notesError}</p>}
              <div className="vault-notes-actions">
                <button
                  className="vault-notes-cancel"
                  onClick={() => {
                    setEditingNotes(false);
                    if (!item.notes) setShowNotes(false);
                  }}
                  disabled={notesSaving}
                >
                  Cancel
                </button>
                <button
                  className="vault-notes-save"
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                >
                  {notesSaving && (
                    <Loader2 size={12} className="vault-notes-spinner" />
                  )}
                  {notesSaving ? "Saving…" : "Save Notes"}
                </button>
              </div>
            </>
          ) : (
            <p className="vault-notes-body">{item.notes}</p>
          )}
        </div>
      )}

      {changingPw && (
        <div className="vault-changepw-card">
          <div className="vault-changepw-header">
            <KeyRound size={14} />
            <span>Change Password: {item.site_name}</span>
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
  const [sortBy, setSortBy] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("safer_user"));
      return localStorage.getItem(`vault-sort:${user.id}`) || "newest";
    } catch {
      return "newest";
    }
  });
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

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

  const handleNotesChanged = (id, notes) => {
    setPasswords((prev) =>
      prev.map((p) => (p.id === id ? { ...p, notes } : p)),
    );
  };

  const filtered = passwords
    .filter((p) => {
      const matchSearch =
        p.site_name.toLowerCase().includes(search.toLowerCase()) ||
        p.username.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || p.category === category;
      const matchFav = !showFavs || p.is_favorited;
      return matchSearch && matchCat && matchFav;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.site_name.localeCompare(b.site_name);
        case "name-desc":
          return b.site_name.localeCompare(a.site_name);
        case "strength-desc":
          return b.strength_score - a.strength_score;
        case "strength-asc":
          return a.strength_score - b.strength_score;
        case "newest":
          return b.id - a.id;
        case "oldest":
          return a.id - b.id;
        default:
          return 0;
      }
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
          <div className="vault-filters-right">
            <div className="vault-sort-wrap" ref={sortRef}>
              <button
                className={`vault-sort-btn ${sortOpen ? "vault-sort-btn--open" : ""}`}
                onClick={() => setSortOpen((p) => !p)}
                title={SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
              >
                <ArrowUpDown size={13} />
                <span>{SORT_OPTIONS.find((o) => o.key === sortBy)?.label}</span>
                <ChevronDown
                  size={12}
                  className={`vault-sort-chevron ${sortOpen ? "vault-sort-chevron--open" : ""}`}
                />
              </button>
              {sortOpen && (
                <div className="vault-sort-dropdown">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      className={`vault-sort-option ${sortBy === opt.key ? "vault-sort-option--active" : ""}`}
                      onClick={() => {
                        try {
                          const user = JSON.parse(
                            localStorage.getItem("safer_user"),
                          );
                          localStorage.setItem(
                            `vault-sort:${user.id}`,
                            opt.key,
                          );
                        } catch {}
                        setSortBy(opt.key);
                        setSortOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
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
              onNotesChanged={handleNotesChanged}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MyVault;
