import "./App.css";
import "./style.css"
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar"
import ProductList from "./components/productlist/ProductList"
import Product from "./components/product/Product"
import Cart from "./components/cart/Cart"
import AdminPanel from "./components/admin/Admin"
import AuthPage from "./components/auth/Auth"
import ChangePasswordPage from "./components/changePassword/ChangePassword"
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/origin/:category" element={<ProductList />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/unauthorized" element={<div>You do not have access to this page.</div>} />
      </Routes>
    </div>
  );
}

export default App;
