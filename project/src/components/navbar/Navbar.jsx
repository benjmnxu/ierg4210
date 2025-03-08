import { useState, useEffect } from "react";
import "./style.css";

function Navbar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [categories, setCategories] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch("http://localhost:3000/api/categories");
          if (!response.ok) {
            throw new Error("Failed to fetch products");
          }
          const data = await response.json();
          setCategories(data);
        } catch (err) {
          setError(err.message);
        } finally {
            setLoading(false)
        }
      };
      fetchCategories();
    }, []);

    useEffect(() => {
        const dropdownButton = document.getElementById("dropdown-button");
        const dropdownMenu = document.getElementById("dropdown-menu");

        const toggleDropdown = () => {
            setDropdownOpen((prev) => !prev);
        };

        const closeDropdown = (event) => {
            if (
                dropdownMenu &&
                !dropdownMenu.contains(event.target) &&
                dropdownButton &&
                !dropdownButton.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
        };

        if (dropdownButton) {
            dropdownButton.addEventListener("click", toggleDropdown);
        }

        document.addEventListener("click", closeDropdown);

        return () => {
            if (dropdownButton) {
                dropdownButton.removeEventListener("click", toggleDropdown);
            }
            document.removeEventListener("click", closeDropdown);
        };
    }, []);


    // if (loading) {
    //     return <div>Loading...</div>;
    // }
    if (error) return <div>Error: {error}</div>;
    return (
        <nav className="navbar">
            <div className="flex-container">
                <a href="/" className="button-link">
                    Home/All Products
                </a>
                <div className="dropdown">
                    <button className="dropdown-button" id="dropdown-button">
                        Origins ▼
                    </button>
                    <div
                        className={`dropdown-menu ${dropdownOpen ? "open" : ""}`}
                        id="dropdown-menu"
                    >
                        {!loading && categories.map((category) => (
                        <a key={category.catid} href={`/origin/${category.catid}`}>
                            {category.name}
                        </a>
                    ))} 
                    </div>
                </div>

                <form className="search-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="search-input"
                            id="searchQuery"
                        />
                        <button type="submit" className="search-button">
                            Search
                        </button>
                    </div>
                </form>

                <a href="/cart" className="button-link">
                    Your Cart/Checkout
                </a>
                <a href="/admin" className="button-link">
                    Admin Panel
                </a>
            </div>
        </nav>
    );
}

export default Navbar;
