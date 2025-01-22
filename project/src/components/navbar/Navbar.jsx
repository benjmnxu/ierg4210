import "./style.css"
// import profile from "../../assets/profile.png"

function Navbar() {
    return (
        <nav className="navbar">
            <div className="flex-container">
            {/* <img
                src="logo.png"
                alt="Logo"
                class="logo"
                onclick="navigate('/')"
            /> */}
            <a href="/" className="button-link">
                Home/Product List
            </a>
            {/* <button class="nav-button light" onclick="navigate('/compare')">Deals</button> */}
            {/* <button class="nav-button light" onclick="navigate('/products')">F</button> */}
            
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
{/* 
            <div className="user-profile">
                <button
                className="profile-button"
                >
                <img src={profile} alt="Profile" className="profile-icon"/>
                </button>
            </div> */}

            {/* <div className="shopping-cart"> */}
                {/* <button
                className="cart-button"
                // onclick="navigate('/cart')"
                id="shoppingCard"
                >
                <img src={profile} alt="Profile" className="profile-icon"/>
                </button> */}
                <a href="/cart" className="button-link">
                    Your Cart
                </a>
            {/* </div> */}
            </div>
        </nav>
    );
}

export default Navbar;