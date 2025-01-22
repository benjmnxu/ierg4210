import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./style.css";

import hibiki from "../../assets/hibiki.webp";
import moutai from "../../assets/moutai.jpg";
import henny from "../../assets/henny.webp";
import scotch from "../../assets/lagavulin.jpg";

const products = [
  { id: 1, name: "Hibiki", price: "$10.00", image: hibiki, description: "Hibiki Whisky is a celebrated Japanese whisky produced by Suntory, known for its exceptional craftsmanship and artistry. It is a harmonious blend of meticulously aged malt and grain whiskies, offering a smooth, balanced flavor profile with complex notes of fruit, honey, and subtle oak. Packaged in an iconic 24-faceted bottle symbolizing the Japanese seasons, Hibiki embodies the spirit of harmony and tradition, making it a favorite among whisky enthusiasts worldwide." },
  { id: 2, name: "Kweichow Moutai", price: "$15.00", image: moutai, description: "Discover the spirit of tradition and prestige with Kweichow Moutai, China's most iconic and luxurious liquor. Crafted in the heart of Maotai Town using centuries-old techniques, this premium baijiu offers a rich, complex flavor with notes of soy, dried fruits, and a delicate floral finish. Revered as the 'national liquor' of China, Moutai is the ultimate symbol of celebration, sophistication, and status. Whether you're toasting to success or gifting a masterpiece, choose Kweichow Moutai for a taste of heritage in every sip. Elevate your moments—experience the unparalleled excellence of Moutai today."},
  { id: 3, name: "Hennessy", price: "$20.00", image: henny, description: "Hennessy is the epitome of luxury and craftsmanship, celebrated worldwide as the gold standard of cognac. With over 250 years of expertise, Hennessy blends tradition and innovation to create smooth, rich, and complex flavors that captivate the senses. From its bold VS to the refined XO, every sip tells a story of elegance and mastery. Whether you're elevating a celebration or enjoying a moment of sophistication, Hennessy is more than a drink—it's an experience of timeless excellence. Choose Hennessy, where heritage meets perfection." },
  { id: 4, name: "Lagavulin", price: "$25.00", image: scotch, description: "Step into the world of bold flavors and timeless tradition with Lagavulin, the iconic single malt Scotch whisky from the Isle of Islay. Renowned for its signature peaty richness, smoky complexity, and smooth finish, Lagavulin is a whisky that commands respect and admiration. Each bottle embodies over 200 years of craftsmanship, offering a taste that is both robust and refined. Perfect for savoring life's most memorable moments, Lagavulin is not just a drink—it's an experience of unparalleled depth. Embrace the extraordinary. Choose Lagavulin." },
];

const Product = () => {
  const { id } = useParams(); // Extract the product ID from the route
  const productId = parseInt(id, 10); // Convert id to a number
  const product = products.find((p) => p.id === productId); // Find product by ID

  const [quantity, setQuantity] = useState(null); // State for selected quantity
  const buttonRef = useRef(null); // Reference for button
  const inputRef = useRef(null); // Reference for input

  useEffect(() => {
    const addToCartButton = buttonRef.current;
    const quantityInput = inputRef.current;

    const handleQuantityChange = (event) => {
      const value = parseInt(event.target.value, 10);
      setQuantity(isNaN(value) || value < 0 ? 0 : value); // Allow 0 but prevent negative values
    };

    const handleAddToCart = () => {
      if (quantity <= 0) {
        alert("Please enter a quantity greater than 0.");
        return;
      }

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

    if (quantityInput) {
      quantityInput.addEventListener("input", handleQuantityChange);
    }
    if (addToCartButton) {
      addToCartButton.addEventListener("click", handleAddToCart);
    }

    return () => {
      if (quantityInput) {
        quantityInput.removeEventListener("input", handleQuantityChange);
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
          <input
            id="quantity"
            type="number"
            ref={inputRef}
            placeholder="Enter quantity"
          />

          <button className="add-to-cart" ref={buttonRef}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
