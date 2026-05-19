import { Route, Routes } from "react-router-dom";
import AuthLayout from "./layout/AuthLayout";
import MainLayout from "./layout/MainLayout";
import AdminLayout from "./admin/layout/AdminLayout";
import Signup from "./pages/Signup/Signup";
import Signin from "./pages/Signin/Signin";
import MyVault from "./pages/MyVault/MyVault";
import AddPassword from "./pages/AddPassword/AddPassword";
import AdminUsers from "./admin/pages/Users/Users";

function App() {
  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/my-vault" element={<MyVault />} />
          <Route path="/add-password" element={<AddPassword />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
