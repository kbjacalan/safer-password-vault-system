import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  Settings,
  X,
  User,
  LogOut,
} from "lucide-react";
import { useSidebar } from "../../providers/SidebarProvider";
import "./Topbar.css";

const PAGE_TITLES = {
  "/my-vault": "My Vault",
  "/add-password": "Add Password",
};

const Topbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isOpen: sidebarOpen } = useSidebar();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const pageTitle = PAGE_TITLES[pathname] ?? "Safer";

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen)
      document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <>
      <header
        className={`topbar ${sidebarOpen ? "topbar--sidebar-open" : "topbar--sidebar-closed"}`}
      >
        <span className="topbar-title">{pageTitle}</span>

        <div className="topbar-actions">
          <div className="topbar-user-wrap" ref={dropdownRef}>
            <div
              className={`topbar-user ${dropdownOpen ? "topbar-user--active" : ""}`}
              onClick={() => setDropdownOpen((p) => !p)}
            >
              <div className="topbar-user-avatar">U</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">User</span>
                <span className="topbar-user-role">Member</span>
              </div>
              <span
                className={`topbar-user-chevron ${dropdownOpen ? "topbar-user-chevron--open" : ""}`}
              >
                <ChevronDown size={13} />
              </span>
            </div>

            {dropdownOpen && (
              <div className="topbar-dropdown">
                <div className="topbar-dropdown-header">
                  <div className="topbar-dropdown-avatar">U</div>
                  <div className="topbar-dropdown-user-info">
                    <span className="topbar-dropdown-name">User</span>
                    <span className="topbar-dropdown-email">
                      user@gmail.com
                    </span>
                    <span className="topbar-dropdown-role-badge">Member</span>
                  </div>
                </div>

                <div className="topbar-dropdown-divider" />

                <button
                  className="topbar-dropdown-item topbar-dropdown-item--danger"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Topbar;
