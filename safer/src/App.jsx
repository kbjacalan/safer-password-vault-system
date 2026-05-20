import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthLayout from "./layout/AuthLayout";
import MainLayout from "./layout/MainLayout";
import AdminLayout from "./admin/layout/AdminLayout";
import Signup from "./pages/Signup/Signup";
import Signin from "./pages/Signin/Signin";
import MyVault from "./pages/MyVault/MyVault";
import AddPassword from "./pages/AddPassword/AddPassword";
import Trash from "./pages/Trash/Trash";
import AdminUsers from "./admin/pages/Users/Users";

function App() {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: "#ffffff",
            color: "#64748b",
            fontFamily: '"Geist", sans-serif',
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "10px",
            padding: "10px 16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/my-vault" element={<MyVault />} />
          <Route path="/add-password" element={<AddPassword />} />
          <Route path="/trash" element={<Trash />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
