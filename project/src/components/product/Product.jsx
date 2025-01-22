import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./style.css";

import hibiki from "../../assets/hibiki.webp";
import moutai from "../../assets/moutai.jpg";
import henny from "../../assets/henny.webp";
import scotch from "../../assets/lagavulin.jpg";

const products = [
  { id: 1, name: "Hibiki", price: "$10.00", image: hibiki, description: "A premium Japanese whiskey with a smooth, rich flavor." },
  { id: 2, name: "Kweichow Moutai", price: "$15.00", image: moutai, description: "China's most famous spirit, known for its unique aroma and taste." },
  { id: 3, name: "Hennessy", price: "$20.00", image: henny, description: "A world-renowned cognac with bold, aromatic notes." },
  { id: 4, name: "Lagavulin", price: "$25.00", image: scotch, description: "A classic Scotch whisky with smoky, peaty flavors." },
];

const Product = () => {
  const { id } = useParams(); // Extract the product ID from the route
  const productId = parseInt(id, 10); // Convert id to a number
  const product = products.find((p) => p.id === productId); // Find product by ID

  const [quantity, setQuantity] = useState(1); // State for selected quantity

  const quantityRef = useRef(null); // Reference for dropdown
  const buttonRef = useRef(null); // Reference for button

  useEffect(() => {
    const quantityDropdown = quantityRef.current;
    const addToCartButton = buttonRef.current;

    const handleQuantityChange = (event) => {
      setQuantity(Number(event.target.value));
    };

    const handleAddToCart = () => {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existingProductIndex = cart.findIndex((item) => item.id === product.id);

      if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += quantity;
      } else {
        cart.push({ ...product, quantity });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      alert(`Added ${quantity} x ${product.name} to cart!`);
    };

    // Register event listeners
    if (quantityDropdown) {
      quantityDropdown.addEventListener("change", handleQuantityChange);
    }
    if (addToCartButton) {
      addToCartButton.addEventListener("click", handleAddToCart);
    }

    // Cleanup event listeners
    return () => {
      if (quantityDropdown) {
        quantityDropdown.removeEventListener("change", handleQuantityChange);
      }
      if (addToCartButton) {
        addToCartButton.removeEventListener("click", handleAddToCart);
      }
    };
  }, [quantity, product]);

  if (!product) {
    return <p>Product not found.</p>; // Handle invalid product IDs
  }

  return (
    <div className="container">
      <div className="product-page">
        <div className="product-image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-details">
          <h1>{product.name}</h1>
          <p className="product-price">{product.price}</p>
          <p className="product-description">{product.description}</p>

          <label htmlFor="quantity">Quantity:</label>
          <select id="quantity" ref={quantityRef}>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>

          <button className="add-to-cart" ref={buttonRef}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
