import { useEffect } from "react";
import "./style.css";
import hibiki from "../../assets/hibiki.webp";
import moutai from "../../assets/moutai.jpg";
import henny from "../../assets/henny.webp";
import scotch from "../../assets/lagavulin.jpg";
import smirnoff from "../../assets/smirnoff.webp";
import pinot_noir from "../../assets/pinot-noir.webp";

const products = [
  { id: 1, name: "Hibiki", price: "$10.00", image: hibiki },
  { id: 2, name: "Moutai", price: "$15.00", image: moutai },
  { id: 3, name: "Hennessy", price: "$20.00", image: henny },
  { id: 4, name: "Lagavulin", price: "$25.00", image: scotch },
  { id: 5, name: "Smirnoff", price: "$35.00", image: smirnoff },
  { id: 6, name: "1945 Domaine de La Romanée-Conti Romanée-Conti Grand Cru", price: "$224121.00", image: pinot_noir },
];

const ProductList = () => {

  useEffect(() => {
    const handleAddToCartClick = (event) => {
      const button = event.target.closest(".add-to-cart");
      if (button) {
        const productId = parseInt(button.dataset.id, 10);
        const quantityInput = document.getElementById(`quantity-${productId}`);
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;
        const product = products.find((p) => p.id === productId);
      
        if (quantity <= 0) {
          alert("Please enter a quantity greater than 0.");
          return;
        }
  
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingProductIndex = cart.findIndex((item) => item.id === productId);
  
        if (existingProductIndex > -1) {
          cart[existingProductIndex].quantity += quantity;
        } else {
          cart.push({ ...product, quantity });
        }
  
        localStorage.setItem("cart", JSON.stringify(cart));
        alert(`Added ${quantity} x ${product.name} to cart!`);
      }
    };

    const productListContainer = document.querySelector(".product-list");
    productListContainer.addEventListener("click", handleAddToCartClick);

    return () => {
      productListContainer.removeEventListener("click", handleAddToCartClick);
    };
  }, []); 
  
  return (
    <div className="container">
      <h1>Product List</h1>
      <div className="product-list">
        {products.map((product) => (
          <div key={product.id}>
            <div className="product-item">
              <a href={`product/${product.id}`}>
                <img
                  src={product.image}
                  alt={`${product.name}`}
                  className="product-image"
                />
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>{product.price}</p>
                </div>
              </a>
            </div>
            <input
              type="number"
              min="1"
              defaultValue="1"
              className="quantity-input"
              id={`quantity-${product.id}`}
            />
            <button
              className="add-to-cart"
              data-id={product.id}
              aria-label={`Add ${product.name} to cart`}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
