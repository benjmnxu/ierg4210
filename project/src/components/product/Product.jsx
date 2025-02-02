import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./style.css";

import hibiki from "../../assets/hibiki.webp";
import moutai from "../../assets/moutai.jpg";
import henny from "../../assets/henny.webp";
import scotch from "../../assets/lagavulin.jpg";
import smirnoff from "../../assets/smirnoff.webp";
import pinot_noir from "../../assets/pinot-noir.webp";

const products = [
  { id: 1, name: "Hibiki", price: "$10.00", image: hibiki, description: "Hibiki Whisky is a celebrated Japanese whisky produced by Suntory, known for its exceptional craftsmanship and artistry. It is a harmonious blend of meticulously aged malt and grain whiskies, offering a smooth, balanced flavor profile with complex notes of fruit, honey, and subtle oak. Packaged in an iconic 24-faceted bottle symbolizing the Japanese seasons, Hibiki embodies the spirit of harmony and tradition, making it a favorite among whisky enthusiasts worldwide." },
  { id: 2, name: "Kweichow Moutai", price: "$15.00", image: moutai, description: "Discover the spirit of tradition and prestige with Kweichow Moutai, China's most iconic and luxurious liquor. Crafted in the heart of Maotai Town using centuries-old techniques, this premium baijiu offers a rich, complex flavor with notes of soy, dried fruits, and a delicate floral finish. Revered as the 'national liquor' of China, Moutai is the ultimate symbol of celebration, sophistication, and status. Whether you're toasting to success or gifting a masterpiece, choose Kweichow Moutai for a taste of heritage in every sip. Elevate your moments—experience the unparalleled excellence of Moutai today." },
  { id: 3, name: "Hennessy", price: "$20.00", image: henny, description: "Hennessy is the epitome of luxury and craftsmanship, celebrated worldwide as the gold standard of cognac. With over 250 years of expertise, Hennessy blends tradition and innovation to create smooth, rich, and complex flavors that captivate the senses. From its bold VS to the refined XO, every sip tells a story of elegance and mastery. Whether you're elevating a celebration or enjoying a moment of sophistication, Hennessy is more than a drink—it's an experience of timeless excellence. Choose Hennessy, where heritage meets perfection." },
  { id: 4, name: "Lagavulin", price: "$25.00", image: scotch, description: "Step into the world of bold flavors and timeless tradition with Lagavulin, the iconic single malt Scotch whisky from the Isle of Islay. Renowned for its signature peaty richness, smoky complexity, and smooth finish, Lagavulin is a whisky that commands respect and admiration. Each bottle embodies over 200 years of craftsmanship, offering a taste that is both robust and refined. Perfect for savoring life's most memorable moments, Lagavulin is not just a drink—it's an experience of unparalleled depth. Embrace the extraordinary. Choose Lagavulin." },
  { id: 5, name: "Smirnoff", price: "$35.00", image: smirnoff, description: "Smirnoff Red Label is a globally recognized, premium vodka renowned for its exceptional quality and smooth taste. Distilled three times and filtered ten times, it offers a clean, crisp flavor that makes it a versatile choice for mixing in cocktails or enjoying on the rocks. Perfect for any occasion, Smirnoff Red delivers a timeless, classic vodka experience that embodies sophistication and enjoyment. Whether you're hosting a party, toasting to special moments, or relaxing with friends, Smirnoff Red Label is the ideal spirit to elevate your celebration." },
  { id: 6, name: "1945 Domaine de La Romanée-Conti", price: "$224121.00", image: pinot_noir, description: "The 1945 Domaine de La Romanée-Conti Romanée-Conti Grand Cru is one of the most legendary wines ever produced. The final vintage before the estate’s historic replanting, it represents the last expression of pre-phylloxera vines. With only 600 bottles produced, its rarity is unparalleled, making it a true collector’s masterpiece. This vintage is celebrated for its profound depth, extraordinary complexity, and ethereal elegance, embodying the pinnacle of Burgundy. A once-in-a-lifetime opportunity to own a piece of vinous history, it is more than a wine—it is an icon." },
];

const Product = () => {
  const { id } = useParams();
  const productId = parseInt(id, 10);
  const product = products.find((p) => p.id === productId);

  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const quantityInput = document.getElementById("quantity");
    const addToCartButton = document.getElementById("add-to-cart");

    const handleQuantityChange = (event) => {
      const value = parseInt(event.target.value, 10);
      setQuantity(isNaN(value) || value < 0 ? 0 : value);
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
    return <p>Product not found.</p>;
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
            placeholder="Enter quantity"
          />

          <button className="add-to-cart" id="add-to-cart">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
