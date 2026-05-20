import { useState, useEffect } from "react";
import { Globe, Trash2, RotateCcw, PackageSearch, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSidebar } from "../../providers/SidebarProvider";
import {
  fetchTrashedEntries,
  restoreVaultEntry,
  purgeVaultEntry,
} from "../../utils/api";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./Trash.css";

const getFavicon = (url) =>
  `https://www.google.com/s2/favicons?domain=${url}&sz=32`;

const TrashItem = ({ item, onRestore, onPurge }) => {
  const [restoring, setRestoring] = useState(false);
  const [purging, setPurging] = useState(false);

  // Modal state
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restoreVaultEntry(item.id);
      onRestore(item.id);
      toast.success("Entry restored to vault");
    } catch (err) {
      toast.error(err.message || "Failed to restore entry");
    } finally {
      setRestoring(false);
      setRestoreOpen(false);
    }
  };

  const handlePurge = async () => {
    setPurging(true);
    try {
      await purgeVaultEntry(item.id);
      onPurge(item.id);
      toast.success("Permanently deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete entry");
    } finally {
      setPurging(false);
      setPurgeOpen(false);
    }
  };

  return (
    <>
      <div className="trash-item">
        <div className="trash-item-favicon">
          <img
            src={getFavicon(item.site_url)}
            alt={item.site_name}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <span className="trash-item-favicon-fallback">
            <Globe size={16} />
          </span>
        </div>

        <div className="trash-item-info">
          <span className="trash-item-site">{item.site_name}</span>
          <span className="trash-item-username">{item.username}</span>
        </div>

        <div className="trash-item-actions">
          <button
            className="trash-btn trash-btn--restore"
            onClick={() => setRestoreOpen(true)}
            disabled={restoring || purging}
          >
            <RotateCcw size={13} />
            <span>Restore</span>
          </button>
          <button
            className="trash-btn trash-btn--purge"
            onClick={() => setPurgeOpen(true)}
            disabled={restoring || purging}
          >
            <Trash2 size={13} />
            <span>Delete Forever</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={restoreOpen}
        title="Restore entry?"
        message={`"${item.site_name}" will be moved back to your vault.`}
        confirmLabel="Restore"
        variant="primary"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={() => setRestoreOpen(false)}
      />

      <ConfirmModal
        isOpen={purgeOpen}
        title="Delete forever?"
        message={`"${item.site_name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Forever"
        variant="danger"
        loading={purging}
        onConfirm={handlePurge}
        onCancel={() => setPurgeOpen(false)}
      />
    </>
  );
};

const Trash = () => {
  const { isOpen: sidebarOpen } = useSidebar();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTrashedEntries();
        setEntries(data);
      } catch (err) {
        setError(err.message || "Failed to load trash");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRestore = (id) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const handlePurge = (id) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <div
      className={`trash-page ${sidebarOpen ? "trash-page--sidebar-open" : "trash-page--sidebar-closed"}`}
    >
      <div className="trash-header">
        <div className="trash-header-icon">
          <Trash2 size={18} />
        </div>
        <div>
          <h2 className="trash-title">Trash</h2>
          <p className="trash-subtitle">
            Deleted entries can be restored or permanently removed
          </p>
        </div>
      </div>

      <div className="trash-list">
        {loading ? (
          <div className="trash-empty">
            <Loader2 size={28} className="trash-spinner" />
            <p>Loading trash...</p>
          </div>
        ) : error ? (
          <div className="trash-empty">
            <Trash2 size={32} />
            <p>Something went wrong</p>
            <span>{error}</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="trash-empty">
            <PackageSearch size={32} />
            <p>Trash is empty</p>
            <span>Deleted entries will appear here</span>
          </div>
        ) : (
          entries.map((item) => (
            <TrashItem
              key={item.id}
              item={item}
              onRestore={handleRestore}
              onPurge={handlePurge}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Trash;
