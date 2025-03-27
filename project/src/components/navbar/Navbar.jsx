import { useState, useEffect } from "react";
import "./style.css";
import { secureFetch } from "../../utils/secureFetch";

function Navbar() {
  const [originDropdownOpen, setOriginDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await secureFetch("/api/verified/me");
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  // Logout function
  const handleLogout = async () => {
    await secureFetch("/api/logout", {
      method: "POST",
    });
    setUser(null);
    window.location.href = "/";
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      const originDropdown = document.getElementById("origin-dropdown");
      const originButton = document.getElementById("origin-button");
      const userDropdown = document.getElementById("user-dropdown");
      const userButton = document.getElementById("user-button");

      if (
        originDropdown &&
        !originDropdown.contains(event.target) &&
        originButton &&
        !originButton.contains(event.target)
      ) {
        setOriginDropdownOpen(false);
      }

      if (
        userDropdown &&
        !userDropdown.contains(event.target) &&
        userButton &&
        !userButton.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <nav className="navbar">
      <div className="flex-container">
        <a href="/" className="button-link">
          Home/All Products
        </a>

        <div className="dropdown">
          <button
            className="dropdown-button"
            id="origin-button"
            onClick={() => setOriginDropdownOpen((prev) => !prev)}
          >
            Origins ▼
          </button>
          <div
            className={`dropdown-menu ${originDropdownOpen ? "open" : ""}`}
            id="origin-dropdown"
          >
            {!loading &&
              categories?.map((category) => (
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

        {user ? (
            <div className="dropdown">
                <button
                    className="dropdown-button"
                    id="user-button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                >
                    Welcome, {user.name} ▼
                </button>
                <div
                    className={`dropdown-menu ${userDropdownOpen ? "open" : ""}`}
                    id="user-dropdown"
                >
                    <button onClick={handleLogout} className="dropdown-item">
                        Logout
                    </button>
                    <a href = "/change-password">
                        Change Password
                    </a>
                </div>
            </div>
        ) : (
          <a href="/login" className="button-link">
            Login
          </a>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
