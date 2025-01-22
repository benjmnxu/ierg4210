import { useEffect, useState } from "react";
import "./Cart.css";

const CartScreen = () => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Retrieve cart from localStorage on component mount
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const removeFromCart = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart); // Update the local state
    localStorage.setItem("cart", JSON.stringify(updatedCart)); // Update localStorage
  };

  const totalPrice = cart.reduce((total, item) => {
    const price = parseFloat(item.price.slice(1)); // Remove '$' and convert to number
    return total + price * item.quantity;
  }, 0);

  if (cart.length === 0) {
    return <h2>Your cart is empty.</h2>;
  }

  return (
    <div className="cart-screen">
      <h1>Shopping Cart</h1>
      <div className="cart-items">
        {cart.map((item) => (
          <div className="cart-item" key={item.id}>
            {/* Uncomment if images are needed */}
            {/* <img src={item.image} alt={item.name} /> */}
            <div>
              <h2>{item.name}</h2>
              <p>Price: {item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <button onClick={() => removeFromCart(item.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <h2>Total: ${totalPrice.toFixed(2)}</h2>
    </div>
  );
};

export default CartScreen;
