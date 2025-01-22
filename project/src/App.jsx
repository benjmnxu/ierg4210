import "./App.css";
import "./style.css"
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar"
import ProductList from "./components/productlist/ProductList"
import Product from "./components/product/Product"
import Cart from "./components/cart/Cart"

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </div>
  );
}

export default App;
