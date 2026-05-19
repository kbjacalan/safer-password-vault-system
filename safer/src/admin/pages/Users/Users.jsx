import { useState, useEffect } from "react";
import {
  Search,
  Users as UsersIcon,
  UserCheck,
  CalendarDays,
  Trash2,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { useSidebar } from "../../../providers/SidebarProvider";
import { fetchAllUsers, deleteUser } from "../../utils/adminApi";
import "./Users.css";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getInitials = (first, last) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

const AVATAR_COLORS = ["#2563eb"];

const getAvatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// ── UserRow ────────────────────────────────────────────────────────────────────

const UserRow = ({ index, user, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="users-row">
      <div className="users-row-count">{index}</div>
      <div className="users-row-identity">
        <div
          className="users-avatar"
          style={{ backgroundColor: getAvatarColor(user.id) }}
        >
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div className="users-row-info">
          <span className="users-row-name">
            {user.first_name} {user.last_name}
          </span>
          <span className="users-row-email">{user.email}</span>
        </div>
      </div>

      <div className="users-row-id">
        <span className="users-id-badge">#{user.id}</span>
      </div>

      <div className="users-row-date">
        <CalendarDays size={13} className="users-date-icon" />
        <span>{formatDate(user.created_at)}</span>
      </div>

      <div className="users-row-actions">
        <div className="users-menu-wrap">
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
                  onDelete(user.id);
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

// ── Users ──────────────────────────────────────────────────────────────────────

const Users = () => {
  const { isOpen: sidebarOpen } = useSidebar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      await deleteUser(id);
    } catch {
      // no-op — could restore on failure
    }
  };

  const filtered = users.filter(
    (u) =>
      `${u.first_name} ${u.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUsers = users.length;
  const thisMonthCount = users.filter((u) => {
    const d = new Date(u.created_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }).length;

  return (
    <div
      className={`users-page ${sidebarOpen ? "users-page--sidebar-open" : "users-page--sidebar-closed"}`}
    >
      {/* Stats */}
      <div className="vault-stats">
        <div className="vault-stat-card">
          <span className="vault-stat-icon vault-stat-icon--blue">
            <UsersIcon size={16} />
          </span>
          <div className="vault-stat-info">
            <span className="vault-stat-value">{totalUsers}</span>
            <span className="vault-stat-label">Total Users</span>
          </div>
        </div>
        <div className="vault-stat-card">
          <span className="vault-stat-icon vault-stat-icon--green">
            <UserCheck size={16} />
          </span>
          <div className="vault-stat-info">
            <span className="vault-stat-value">{thisMonthCount}</span>
            <span className="vault-stat-label">Joined This Month</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="vault-search">
        <Search size={14} className="vault-search-icon" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table header */}
      <div className="users-list-header">
        <span>#</span>
        <span>User</span>
        <span>ID</span>
        <span>Joined</span>
        <span>Actions</span>
      </div>

      {/* List */}
      <div className="vault-list">
        {loading ? (
          <div className="vault-empty">
            <Loader2 size={28} className="users-spinner" />
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="vault-empty">
            <UsersIcon size={32} />
            <p>Something went wrong</p>
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="vault-empty">
            <UsersIcon size={32} />
            <p>No users found</p>
            <span>
              {users.length === 0
                ? "No registered users yet"
                : "Try adjusting your search"}
            </span>
          </div>
        ) : (
          filtered.map((user, i) => (
            <UserRow
              key={user.id}
              index={i + 1}
              user={user}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Users;
