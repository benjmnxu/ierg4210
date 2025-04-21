import { useEffect, useState } from "react";
import CheckoutForm from "../checkoutForm/CheckoutForm";
import "./Cart.css";

const CartScreen = () => {
  const [cart, setCart] = useState([]);
  const [rawCart, setRawCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartFetched, setCartFetched] = useState(false);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setRawCart(storedCart);
  }, []);
  
  useEffect(() => {
    if (rawCart.length === 0 || cartFetched) return;
  
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const updatedCart = await Promise.all(
          rawCart.map(async (item) => {
            const response = await fetch(`/api/products/${item.pid}`);
            const productData = await response.json();
            const product = productData[0] || {};
            return {
              ...item,
              name: product.name || "Unknown Product",
              price: Number(product.price) || 0,
            };
          })
        );
        setCart(updatedCart);
        setCartFetched(true);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProductDetails();
  }, [rawCart, cartFetched]);
  

  const handleQuantityChange = (pid, newQuantity) => {
    if (newQuantity < 0) return; // Prevents negative values

    const updatedCart = cart.map(item =>
      item.pid === pid ? { ...item, quantity: newQuantity } : item
    ).filter(item => item.quantity > 0); // Removes items with 0 quantity

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleRemoveFromCart = (pid) => {
    const updatedCart = cart.filter(item => item.pid !== pid);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  if (cart.length === 0) {
    return <h2>Your cart is empty.</h2>;
  }

  const total = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return (
    <div className="cart-screen">
      <h1>Shopping Cart</h1>
      {loading ? <p>Loading product details...</p> : null}
      <div className="item-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <div className="cart-item" key={item.pid}>
              <div>
                <h2>{item.name || "Loading..."}</h2>
                <p>Price: ${item.price?.toFixed(2) || "Fetching..."}</p>
                <div className="quantity-controls">
                  <button onClick={() => handleQuantityChange(item.pid, item.quantity - 1)}>-</button>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.pid, parseInt(e.target.value, 10) || 0)}
                  />
                  <button onClick={() => handleQuantityChange(item.pid, item.quantity + 1)}>+</button>
                </div>
                <button className="remove-btn" onClick={() => handleRemoveFromCart(item.pid)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="payment">
          <h2>Total: ${total.toFixed(2)}</h2>
          <CheckoutForm cart={cart}/>
        </div>
      </div>
    </div>
  );
};

export default CartScreen;
