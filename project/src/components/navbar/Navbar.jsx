import { useState, useEffect } from "react";
import "./style.css";

function Navbar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
                        <a href="/origin/Chinese">Chinese</a>
                        <a href="/origin/Japanese">Japanese</a>
                        <a href="/origin/Scottish">Scottish</a>
                        <a href="/origin/French">French</a>
                        <a href="/origin/Russian">Russian</a>
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
            </div>
        </nav>
    );
}

export default Navbar;
