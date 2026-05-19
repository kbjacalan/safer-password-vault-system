import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import { SidebarProvider } from "../../providers/SidebarProvider";

const AdminLayout = () => {
  return (
    <>
      <SidebarProvider>
        <AdminSidebar />
        <AdminTopbar />
        <main>
          <Outlet />
        </main>
      </SidebarProvider>
    </>
  );
};

export default AdminLayout;
