import { useEffect, useState } from "react";
import "./admin.css";
import { secureFetch } from "../../utils/secureFetch";

const AdminPanel = () => {
  const [mode, setMode] = useState("products");
  const [activeForm, setActiveForm] = useState("insert");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [insertForm, setInsertForm] = useState({
    catid: "",
    name: "",
    price: "",
    description: "",
    image: null,
  });
  const [categoryInsert, setCategoryInsert] = useState({ name: "" });
  const [deleteId, setDeleteId] = useState("");
  const [categoryDeleteId, setCategoryDeleteId] = useState("");

  const sanitizeInput = (str) => {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  };

  const fetchCategories = () =>
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);

  const fetchProducts = () =>
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);

  const fetchOrders = () =>
    secureFetch("/api/admin/orders")
      .then((r) => r.json())
      .then(r => {
        setOrders(r);
      })
      .catch(console.error);

  useEffect(() => {
    fetchCategories();
    if (mode === "products") fetchProducts();
    if (mode === "orders") fetchOrders();
  }, [mode]);

  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const maxSize = 10 * 1024 * 1024;
    if (file && file.size > maxSize) {
      alert("File too large. Max size is 10MB.");
      e.target.value = "";
      return;
    }
    setInsertForm((prev) => ({ ...prev, image: file }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!insertForm.image) {
      alert("Please select an image.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("image", insertForm.image);
      const uploadRes = await secureFetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const { imageKey, thumbnailKey } = await uploadRes.json();
      const productData = {
        name: sanitizeInput(insertForm.name),
        price: parseFloat(insertForm.price),
        description: sanitizeInput(insertForm.description),
        catid: insertForm.catid,
        imageKey,
        thumbnailKey,
      };
      await secureFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      alert("Product added successfully!");
      resetForms();
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error uploading product.");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryData = { name: sanitizeInput(categoryInsert.name) };
      await secureFetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });
      alert("Category added successfully!");
      resetForms();
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Error adding category.");
    }
  };

  const handleProductUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      let updates = {};
      if (insertForm.image) {
        const formData = new FormData();
        formData.append("image", insertForm.image);
        const uploadRes = await secureFetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const { imageKey, thumbnailKey } = await uploadRes.json();
        updates.image_key = imageKey;
        updates.thumbnail_key = thumbnailKey;
      }
      ["name", "price", "description", "catid"].forEach((f) => {
        if (insertForm[f]) {
          updates[f] =
            f === "price"
              ? parseFloat(insertForm[f])
              : sanitizeInput(insertForm[f]);
        }
      });
      if (Object.keys(updates).length === 0) {
        alert("No changes detected.");
        return;
      }
      const res = await secureFetch(`/api/admin/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      alert("Product updated successfully!");
      resetForms();
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error updating product.");
    }
  };

  const handleCategoryUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { name: sanitizeInput(categoryInsert.name) };
      await secureFetch(`/api/admin/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert("Category updated successfully!");
      resetForms();
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Error updating category.");
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      if (mode === "products" && deleteId) {
        await secureFetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
        alert("Product deleted.");
        fetchProducts();
      } else if (mode === "categories" && categoryDeleteId) {
        await secureFetch(`/api/admin/categories/${categoryDeleteId}`, {
          method: "DELETE",
        });
        alert("Category deleted.");
        fetchCategories();
      }
      resetForms();
    } catch (err) {
      console.error(err);
      alert("Error deleting.");
    }
  };

  const resetForms = () => {
    setEditingId(null);
    setInsertForm({ catid: "", name: "", price: "", description: "", image: null });
    setCategoryInsert({ name: "" });
    setDeleteId("");
    setCategoryDeleteId("");
  };

  return (
    <div className="admin-panel">
      <h2 className="admin-title">Admin Panel</h2>

      <div className="toggle-buttons">
        <button
          className={`toggle-button ${mode === "products" ? "active" : ""}`}
          onClick={() => setMode("products")}
        >
          Manage Products
        </button>
        <button
          className={`toggle-button ${mode === "categories" ? "active" : ""}`}
          onClick={() => setMode("categories")}
        >
          Manage Categories
        </button>
        <button
          className={`toggle-button ${mode === "orders" ? "active" : ""}`}
          onClick={() => setMode("orders")}
        >
          View Orders
        </button>
      </div>

      {mode !== "orders" && (
        <>
          <div className="form-tabs">
            <button
              className={`tab-button ${activeForm === "insert" ? "active" : ""}`}
              onClick={() => setActiveForm("insert")}
            >
              Insert
            </button>
            <button
              className={`tab-button ${activeForm === "update" ? "active" : ""}`}
              onClick={() => setActiveForm("update")}
            >
              Update
            </button>
            <button
              className={`tab-button ${activeForm === "delete" ? "active" : ""}`}
              onClick={() => setActiveForm("delete")}
            >
              Delete
            </button>
          </div>

          <div className="form-slider-container">
            {activeForm === "insert" && (
              <form
                onSubmit={mode === "products" ? handleProductSubmit : handleCategorySubmit}
                className="form-container"
              >
                <h3>
                  Add New {mode === "products" ? "Product" : "Category"}
                </h3>
                {mode === "products" ? (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={insertForm.name}
                      onChange={(e) => handleChange(e, setInsertForm)}
                      placeholder="Product Name"
                      minLength={1}
                      maxLength={100}
                      required
                    />
                    <select
                      name="catid"
                      value={insertForm.catid}
                      onChange={(e) => handleChange(e, setInsertForm)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.catid} value={c.catid}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="price"
                      value={insertForm.price}
                      onChange={(e) => handleChange(e, setInsertForm)}
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      required
                    />
                    <textarea
                      name="description"
                      value={insertForm.description}
                      onChange={(e) => handleChange(e, setInsertForm)}
                      placeholder="Description"
                      minLength={1}
                      maxLength={1000}
                      required
                    />
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required
                    />
                  </>
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={categoryInsert.name}
                    onChange={(e) => handleChange(e, setCategoryInsert)}
                    placeholder="Category Name"
                    minLength={1}
                    maxLength={100}
                    required
                  />
                )}
                <button type="submit">
                  Add {mode === "products" ? "Product" : "Category"}
                </button>
              </form>
            )}

            {activeForm === "update" && (
              <form
                onSubmit={
                  mode === "products"
                    ? handleProductUpdateSubmit
                    : handleCategoryUpdateSubmit
                }
                className="form-container"
              >
                <h3>Update {mode === "products" ? "Product" : "Category"}</h3>
                <select
                  value={editingId || ""}
                  onChange={(e) => setEditingId(e.target.value)}
                  required
                >
                  <option value="">Select {mode === "products" ? "Product" : "Category"}</option>
                  {(mode === "products" ? products : categories).map((item) => (
                    <option
                      key={mode === "products" ? item.pid : item.catid}
                      value={mode === "products" ? item.pid : item.catid}
                    >
                      {mode === "products" ? item.name : item.name} (
                      {mode === "products" ? item.pid : item.catid})
                    </option>
                  ))}
                </select>
                {mode === "products" && (
                  <>
                    <input
                      type="text"
                      name="name"
                      value={insertForm.name}
                      onChange={(e) => handleChange(e, setInsertForm)}
                      placeholder="New Name"
                      maxLength={100}
                    />
                    <select
                      name="catid"
                      value={insertForm.catid}
                      onChange={(e) => handleChange(e, setInsertForm)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.catid} value={c.catid}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="price"
                      value={insertForm.price}
                      onChange={(e) => handleChange(e, setInsertForm)}
                      placeholder="New Price"
                      max="10000000"
                    />
                    <textarea
                      name="description"
                      value={insertForm.description}
                      onChange={(e) => handleChange(e, setInsertForm)}
                      placeholder="New Description"
                      maxLength={1000}
                    />
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
                  </>
                )}
                {mode === "categories" && (
                  <input
                    type="text"
                    name="name"
                    value={categoryInsert.name}
                    onChange={(e) => handleChange(e, setCategoryInsert)}
                    placeholder="New Category Name"
                    minLength={1}
                    maxLength={100}
                    required
                  />
                )}
                <button type="submit">
                  Update {mode === "products" ? "Product" : "Category"}
                </button>
              </form>
            )}

            {activeForm === "delete" && (
              <form onSubmit={handleDelete} className="form-container">
                <h3>Delete {mode === "products" ? "Product" : "Category"}</h3>
                <select
                  value={mode === "products" ? deleteId : categoryDeleteId}
                  onChange={(e) =>
                    mode === "products"
                      ? setDeleteId(e.target.value)
                      : setCategoryDeleteId(e.target.value)
                  }
                  required
                >
                  <option value="">
                    Select {mode === "products" ? "Product" : "Category"}
                  </option>
                  {(mode === "products" ? products : categories).map((item) => (
                    <option
                      key={mode === "products" ? item.pid : item.catid}
                      value={mode === "products" ? item.pid : item.catid}
                    >
                      {mode === "products" ? item.name : item.name} (
                      {mode === "products" ? item.pid : item.catid})
                    </option>
                  ))}
                </select>
                <button type="submit">Delete</button>
              </form>
            )}
          </div>
        </>
      )}

      <div className="table-container">
        {mode === "products" && (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Category</th>
                <th>Price</th>
                <th>Description</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.pid}>
                  <td>{p.name}</td>
                  <td>{p.pid}</td>
                  <td>
                    {categories.find((c) => c.catid === p.catid)?.name ||
                      "Uncategorized"}
                  </td>
                  <td>{p.price}</td>
                  <td>{p.description}</td>
                  <td>
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      width="50"
                      height="50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {mode === "categories" && (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.catid}>
                  <td>{c.name}</td>
                  <td>{c.catid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {mode === "orders" && (
          <div className="orders-card-container">
            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="order-card">
                  <h4>Order #{o.id}</h4>
                  <p>
                    <strong>User:</strong> {o.user_id ? o.user_id : "Guest"}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Total:</strong> ${(o.total_price / 100).toFixed(2)}
                  </p>
                  <p>
                    <strong>Status:</strong> Confirmed
                  </p>
                  <ul>
                    {o.items.map((it) => (
                      <li key={`${o.id}-${it.product_id}`}>
                        {it.product_id} x {it.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
