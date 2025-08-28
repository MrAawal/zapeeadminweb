import React, { useEffect, useState, ChangeEvent } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

// type Product = {
//   id: string;
//   tittle: string;
//   price: string;
//   image: string;
// };

type Product = {
  id: string;
  tittle: string;
  price: string;
  discount: string;
  image: string;
  // available: boolean;
  category: string;
  subcategory: string;
  description: string;
  itemcategory: string;
  // latest: boolean;
  // option: boolean;
  // show: boolean;
  // sponsored: boolean;
  stock: string;
  
};


const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  const [openDialog, setOpenDialog] = useState(false);
  const openCreateDialog = () => setOpenDialog(true);
  const closeCreateDialog = () => setOpenDialog(false);
  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "product"));
      const list: Product[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          image: (data.image as string) ?? "",
          tittle: (data.tittle as string) ?? "",
          discount: (data.discount as string) ?? "",
          price: (data.price as string) ?? "",
         
          
          category: (data.category as string) ?? "",
          subcategory: (data.subcategory as string) ?? "",
          description: (data.description as string) ?? "",
          itemcategory: (data.itemcategory as string) ?? "",
          stock: (data.stock as string) ?? "",

          // image: (data.image as string) ?? "",
          // tittle: (data.tittle as string) ?? "",
          // price: (data.price as string) ?? "",
          // image: (data.image as string) ?? "",
        };
      });
      setProducts(list);
    };

    fetchProducts();
  }, []);

  // Filter products locally by tittle
  const filteredProducts = products.filter((product) =>
    product.tittle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 20 }}>
    <h2 style={{ marginBottom: 20 }}>Product List</h2>

{/* Top bar with search and create button */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  }}
>
  {/* Search input */}
  <input
    type="text"
    placeholder="Search by tittle..."
    value={searchTerm}
    onChange={(e: ChangeEvent<HTMLInputElement>) =>
      setSearchTerm(e.target.value)
    }
    style={{
      padding: "8px 12px",
      fontSize: 16,
      flex: "1 1 250px",
      borderRadius: 6,
      border: "1px solid #ccc",
      outline: "none",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}
  />

  {/* Create Product button */}
  <button
    onClick={() => navigate("/create")}
    style={{
      background: "#4CAF50",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      fontSize: 16,
      borderRadius: 6,
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      transition: "background 0.2s ease",
    }}
    onMouseOver={(e) =>
      ((e.target as HTMLButtonElement).style.background = "#45a049")
    }
    onMouseOut={(e) =>
      ((e.target as HTMLButtonElement).style.background = "#4CAF50")
    }
  >
    ➕ Create Product
  </button>
</div>

      <div
        style={{
          display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20
        }}
      >
 <table
  style={{
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    
  }}
>

  <thead>
    <tr>
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Image</th>
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Title</th>
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Mrp</th>
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Price</th>
      
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Category</th>
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Subcategory</th>
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>description</th>
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Quantity</th>
     
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Stock</th>
      {/* <th style={{ border: "1px solid #ddd", padding: "8px" }}>Created</th> */}
      
      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
    </tr>
  </thead>
  <tbody>
    {filteredProducts.length > 0 ? (
      filteredProducts.map((product) => (
        <tr key={product.id}>
          <td
            style={{
              border: "1px solid #ddd",
              padding: 8,
              width: 160,
              textAlign: "center",
            }}
          >
            <img
              src={product.image || "/placeholder.png"}
              alt={product.tittle}
              style={{ width: 150, height: 100, objectFit: "cover", borderRadius: 5 }}
            />
          </td>
          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}>{product.tittle}</td>
          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}> ${product.discount}</td>
          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}> ${product.price}</td>

          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}>{product.category}</td>
          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}> {product.subcategory}</td>
          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}> {product.description}</td>

          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}>{product.itemcategory}</td>
          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}> {product.stock}</td>
         

          <td style={{ border: "1px solid #ddd", padding: 8, verticalAlign: "middle" }}>
            <button
              onClick={() => navigate(`/create/${product.id}`)}
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Edit
            </button> </td>
        </tr>
      ))
    ) : (
      <tr>
        <td
          colSpan={4}
          style={{ textAlign: "center", padding: 16, color: "#888" }}
        >
          No products found.
        </td>
      </tr>
    )}
  </tbody>
</table>


        {/* No results message */}
        {filteredProducts.length === 0 && (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#888" }}>
            No products found.
          </p>
        )}
      </div>
    </div>
    
  );
};

export default ProductList;
