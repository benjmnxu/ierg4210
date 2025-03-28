import { useEffect, useState } from "react";
import "./admin.css";
import { secureFetch } from "../../utils/secureFetch";

const AdminPanel = () => {
  const [mode, setMode] = useState("products");
  const [activeForm, setActiveForm] = useState("insert");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [insertForm, setInsertForm] = useState({ catid: "", name: "", price: "", description: "", image: null });
  const [categoryInsert, setCategoryInsert] = useState({ name: "" });

  const [deleteId, setDeleteId] = useState("");
  const [categoryDeleteId, setCategoryDeleteId] = useState("");

  const sanitizeInput = (str) => {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  };

  useEffect(() => {
    fetchCategories();
    if (mode === "products") fetchProducts();
  }, [mode]);

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  };

  const fetchProducts = () => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  };

  const handleChange = (e, formSetter) => {
    const { name, value } = e.target;
    formSetter((prev) => ({ ...prev, [name]: value }));
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

      const uploadResponse = await secureFetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const { imageKey, thumbnailKey } = await uploadResponse.json();

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
    } catch (error) {
      console.error("❌ Error uploading:", error);
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
    } catch (error) {
      console.error("❌ Error adding category:", error);
    }
  };

  const handleProductUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      let updates = {};
  
      if (insertForm.image) {
        const formData = new FormData();
        formData.append("image", insertForm.image);
  
        const uploadResponse = await secureFetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
  
        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }
  
        const uploadData = await uploadResponse.json();
        updates.image_key = uploadData.imageKey;
        updates.thumbnail_key = uploadData.thumbnailKey;
      }
  
      // 🔹 Add only modified fields to `updates`
      ["name", "price", "description", "catid"].forEach((field) => {
        if (insertForm[field]) {
          updates[field] = field === "price" ? parseFloat(insertForm[field]) : sanitizeInput(insertForm[field]);
        }
      });
  
      if (Object.keys(updates).length === 0) {
        alert("No changes detected.");
        return;
      }
  
      // 🔹 Send only the modified fields
      const response = await secureFetch(`/api/admin/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update product");
      }
  
      alert("Product updated successfully!");
      resetForms();
      fetchProducts();
    } catch (error) {
      console.error("❌ Error updating product:", error);
      alert("Error updating product.");
    }
  };
  
  

  const handleCategoryUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedCategoryData = { name: sanitizeInput(categoryInsert.name) };

      await secureFetch(`/api/admin/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCategoryData),
      });

      alert("Category updated successfully!");
      resetForms();
      fetchCategories();
    } catch (error) {
      console.error("❌ Error updating category:", error);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      if (mode === "products" && deleteId) {
        const response = await secureFetch(`/api/admin/products/${deleteId}`, {
          method: "DELETE",
        });
        
        if (response.ok) {
          alert("Product deleted successfully!");
        } else {
          let message = "Unable to delete product.";
          alert(message);}

        fetchProducts();
      } else if (mode === "categories" && categoryDeleteId) {
        const response = await secureFetch(`/api/admin/categories/${categoryDeleteId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("Category deleted successfully!");
        } else {
          let message = "Unable to delete category.";
          try {
            const { error } = await response.json();
            if (error?.includes("foreign key constraint fails")) {
              message += "\nThis category is assigned to existing products. Please update or remove those products first.";
            } else {
              message += `\n${error || "An unexpected error occurred."}`;
            }
          } catch {
            message += `\nServer responded with status ${response.status}.`;
          }
          alert(message);
        }
        fetchCategories();
      }
      resetForms();
    } catch (error) {
      console.error("❌ Error deleting:", error);
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
        <button className={`toggle-button ${mode === "products" ? "active" : "inactive"}`} onClick={() => setMode("products")}>
          Manage Products
        </button>
        <button className={`toggle-button ${mode === "categories" ? "active" : "inactive"}`} onClick={() => setMode("categories")}>
          Manage Categories
        </button>
      </div>

      <div className="form-tabs">
        <button className={`tab-button ${activeForm === "insert" ? "active" : ""}`} onClick={() => setActiveForm("insert")}>
          Insert
        </button>
        <button className={`tab-button ${activeForm === "update" ? "active" : ""}`} onClick={() => setActiveForm("update")}>
          Update
        </button>
        <button className={`tab-button ${activeForm === "delete" ? "active" : ""}`} onClick={() => setActiveForm("delete")}>
          Delete
        </button>
      </div>

      <div className="form-slider-container">
        {/* Insert/Update/Delete Forms */}
        {activeForm === "insert" && (
          <form onSubmit={mode === "products" ? handleProductSubmit : handleCategorySubmit} className="form-container">
            <h3>{mode === "products" ? "Add New Product" : "Add New Category"}</h3>
            {mode === "products" ? (
              <>
                <input type="text" name="name" value={insertForm.name} onChange={(e) => handleChange(e, setInsertForm)} placeholder="Product Name" minLength = {1} maxLength={100} required/>
                <select name="catid" value={insertForm.catid} onChange={(e) => handleChange(e, setInsertForm)} required>
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.catid} value={category.catid}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input type="number" name="price" value={insertForm.price} onChange={(e) => handleChange(e, setInsertForm)} placeholder="Price" min="0" max="10000000" step="0.01" required />
                <textarea name="description" value={insertForm.description} onChange={(e) => handleChange(e, setInsertForm)} placeholder="Description" minLength = {1} maxLength={1000} required />
                <input type="file" name="image" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} required />
              </>
            ) : (
              <input type="text" name="name" value={categoryInsert.name} onChange={(e) => handleChange(e, setCategoryInsert)} placeholder="Category Name" minLength = {1} maxLength={100} required />
            )}
            <button type="submit">Add {mode === "products" ? "Product" : "Category"}</button>
          </form>
        )}

        {/* Update Forms */}
        {activeForm === "update" && (
          <form onSubmit={mode === "products" ? handleProductUpdateSubmit : handleCategoryUpdateSubmit} className="form-container">
            <h3>Update {mode === "products" ? "Product" : "Category"}</h3>
            {mode === "products" ? (
              <>
              <select value={editingId || ""} onChange={(e) => setEditingId(e.target.value)}>
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.pid} value={product.pid}>
                    {product.name} ({product.pid})
                  </option>
                ))}
              </select>
              <input type="text" name="name" value={insertForm.name} onChange={(e) => handleChange(e, setInsertForm)} placeholder="Product Name" maxLength={100}/>
              <select name="catid" value={insertForm.catid} onChange={(e) => handleChange(e, setInsertForm)} >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.catid} value={category.catid}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input type="number" name="price" value={insertForm.price} onChange={(e) => handleChange(e, setInsertForm)} placeholder="Price" max="10000000"/>
              <textarea name="description" value={insertForm.description} onChange={(e) => handleChange(e, setInsertForm)} placeholder="Description" maxLength={1000}/>
              <input type="file" name="image" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} />
              </>
            ) : (
              <>
                <select value={editingId || ""} onChange={(e) => setEditingId(e.target.value)}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.catid} value={category.catid}>
                      {category.name} ({category.catid})
                    </option>
                  ))}
                </select>
                <input type="text" name="name" value={categoryInsert.name} onChange={(e) => handleChange(e, setCategoryInsert)} placeholder="New Category Name" minLength={1} maxLength={100} required />
              </>
            )}
            <button type="submit">Update {mode === "products" ? "Product" : "Category"}</button>
          </form>
        )}

        {/* Delete Forms */}
        {activeForm === "delete" && (
          <form onSubmit={handleDelete} className="form-container">
            <h3>Delete {mode === "products" ? "Product" : "Category"}</h3>
            {mode === "products" ? (
              <select name="id" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} required>
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.pid} value={product.pid}>
                    {product.name} (ID: {product.pid})
                  </option>
                ))}
              </select>
            ) : (
              <select name="catid" value={categoryDeleteId} onChange={(e) => setCategoryDeleteId(e.target.value)} required>
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.catid} value={category.catid}>
                    {category.name} (ID: {category.catid})
                  </option>
                ))}
              </select>
            )}
            <button type="submit">Delete</button>
          </form>
        )}
      </div>

      <div className="table-container">
        {mode === "products" ? (
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
              {products.map((product) => (
                <tr key={product.pid}>
                  <td>{product.name}</td>
                  <td>{product.pid}</td>
                  <td>{categories.find((cat) => cat.catid === product.catid)?.name || "Uncategorized"}</td>
                  <td>{product.price}</td>
                  <td>{product.description}</td>
                  <td>
                    <img src={product.thumbnail} alt={product.name} width="50" height="50" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.catid}>
                  <td>{category.name}</td>
                  <td>{category.catid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
