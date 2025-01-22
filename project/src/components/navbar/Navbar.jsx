import "./style.css"
// import profile from "../../assets/profile.png"

function Navbar() {
    return (
        <nav className="navbar">
            <div className="flex-container">
            <a href="/" className="button-link">
                Home/Product List
            </a>
            
            <form className="search-form">
                <div className="input-group">
                <input
                    type="text"
                    placeholder="Search..."
                    className="search-input"
                    id="searchQuery"
                />
                <button type="submit" className="search-button">Search</button>
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