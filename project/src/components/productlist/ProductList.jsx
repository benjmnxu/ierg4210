import { useState } from "react";
import "./style.css";
import hibiki from "../../assets/hibiki.webp";
import moutai from "../../assets/moutai.jpg";
import henny from "../../assets/henny.webp";
import scotch from "../../assets/lagavulin.jpg";

const ProductList = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart([...cart, product]);
    alert(`${product.name} added to cart!`);
  };

  const products = [
    { id: 1, name: "Product 1", price: "$10.00", image: hibiki },
    { id: 2, name: "Product 2", price: "$15.00", image: moutai },
    { id: 3, name: "Product 3", price: "$20.00", image: henny },
    { id: 4, name: "Product 4", price: "$25.00", image: scotch },
  ];

  return (
    <div className="container">
      <h1>Product List</h1>
      <div className="product-list">
        {products.map((product) => (
          <div className="product-item" key={product.id}>
            <a
              href={`product/${product.id}`}
            >
              <img src={product.image} alt={`${product.name} Thumbnail`} />
            </a>
            <div className="product-info">
              <p>{product.price}</p>
              <button
                className="add-to-cart"
                onClick={() => addToCart(product)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
      <h2>Cart: {cart.length} items</h2>
    </div>
  );
};

export default ProductList;
