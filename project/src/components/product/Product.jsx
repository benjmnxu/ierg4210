import { Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./style.css";

const Product = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  if (!/^\d+$/.test(id)) {
    return <Navigate to="/not-found" />;
  }
  const productId = parseInt(id, 10);

  // Fetch product from backend
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        setProduct(data[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handle quantity input change
  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value, 10);
    if (isNaN(value) || value < 1 || value > 10000) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }
  };

  // Handle add to cart
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

  // Show loading message
  if (loading) {
    return <p>Loading product...</p>;
  }

  // Show error if fetch failed
  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="container">
      <div className="product-page">
        <div className="product-image">
          <img src={product.image ? product.image : "default-image.jpg"} alt={product.name} />
        </div>
        <div className="product-details">
          <h1>{product.name}</h1>
          <p className="product-price">${product.price}</p>
          <p className="product-description">{product.description}</p>

          <label htmlFor="quantity">Quantity:</label>
          <input
            id="quantity"
            type="number"
            placeholder="Enter quantity"
            value={quantity}
            onChange={handleQuantityChange}
            min="1"
            max="10000"
            step="1"
            required
          />

          <button className="add-to-cart" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
