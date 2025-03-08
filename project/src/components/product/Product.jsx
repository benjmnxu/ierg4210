import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./style.css";

const Product = () => {
  const { id } = useParams();
  const productId = parseInt(id, 10);
  console.log(productId)

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product from backend
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`);
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        setProduct(data[0]);
        console.log(data[0])
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
    setQuantity(isNaN(value) || value < 0 ? 0 : value);
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
