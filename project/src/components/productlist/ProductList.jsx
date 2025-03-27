import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./style.css";

const ProductList = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(null);
  const [pLoading, setPLoading] = useState(true);
  const [cLoading, setCLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/products");
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setPLoading(false);
      }
    };
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCLoading(false);
      }
    };

    fetchProducts();
    fetchCategories();

  }, []);

  const filteredProducts = category
    ? products.filter((product) => product.catid == category)
    : products;

  useEffect(() => {
    const productListContainer = document.querySelector(".product-list");
    if (!productListContainer) return;

    const handleAddToCartClick = (event) => {
      const button = event.target.closest(".add-to-cart");
      if (button) {
        const pid = parseInt(button.dataset.id, 10);
        const quantityInput = document.getElementById(`quantity-${pid}`);
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
        const product = filteredProducts.find((p) => p.pid === pid);

        if (quantity <= 0) {
          alert("Please enter a quantity greater than 0.");
          return;
        }

        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingProductIndex = cart.findIndex((item) => item.pid === pid);

        if (existingProductIndex > -1) {
          cart[existingProductIndex].quantity += quantity;
        } else {
          cart.push({ pid, quantity });
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`Added ${quantity} x ${product.name} to cart!`);
      }
    };

    productListContainer.addEventListener("click", handleAddToCartClick);

    return () => {
      productListContainer.removeEventListener("click", handleAddToCartClick);
    };
  }, [filteredProducts]);


  return (
    error ?  <div>Error: {error}</div> : <div className="container">
      {!cLoading && (
        <h1>Product List: {category ? categories.find(c => c.catid == category)?.name || "Unknown Category" : "All"}</h1>
      )}
      {!pLoading && <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product.pid}>
            <div className="product-item">
              <a href={`/product/${product.pid}`}>
                <img
                  src={product.thumbnail}
                  alt={`${product.name}`}
                  className="product-image"
                />
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>${product.price}</p>
                </div>
              </a>
            </div>
            <input
              type="number"
              min="1"
              defaultValue="1"
              max="10000"
              className="quantity-input"
              id={`quantity-${product.pid}`}
            />
            <button
              className="add-to-cart"
              data-id={product.pid}
              aria-label={`Add ${product.name} to cart`}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>}
    </div>
  );
};

export default ProductList;
