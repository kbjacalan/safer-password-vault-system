import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 825);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 825) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
