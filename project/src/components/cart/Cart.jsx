import { useEffect, useState } from "react";
import "./Cart.css";

const CartScreen = () => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Retrieve cart from localStorage on component mount
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const handleRemoveFromCart = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart); // Update the local state
    localStorage.setItem("cart", JSON.stringify(updatedCart)); // Update localStorage
  };

  useEffect(() => {
    const removeButtons = document.querySelectorAll(".remove-btn");

    const handleClick = (event) => {
      const id = event.target.getAttribute("data-id");
      handleRemoveFromCart(parseInt(id, 10)); // Call the handler with the item ID
    };

    removeButtons.forEach((button) => {
      button.addEventListener("click", handleClick);
    });

    // Cleanup: Remove event listeners on unmount
    return () => {
      removeButtons.forEach((button) => {
        button.removeEventListener("click", handleClick);
      });
    };
  }, [cart]); // Re-run this effect when `cart` changes

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
            <div>
              <h2>{item.name}</h2>
              <p>Price: {item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <button
                className="remove-btn"
                data-id={item.id}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <h2>Total: ${totalPrice.toFixed(2)}</h2>

      <button>Checkout</button>
    </div>
  );
};

export default CartScreen;
