import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import { SidebarProvider } from "../providers/SidebarProvider";
import Topbar from "../components/Topbar/Topbar";

const MainLayout = () => {
  return (
    <>
      <SidebarProvider>
        <Sidebar />
        <Topbar />
        <main>
          <Outlet />
        </main>
      </SidebarProvider>
    </>
  );
};

export default MainLayout;
