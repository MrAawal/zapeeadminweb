// ProductModel.ts
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  getFirestore,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Product {
  id?: string;  // Optional because Firestore auto-generates for new
  tittle: string;
  description: string;
  price: string;
  stock: string;
  discount: string;
  image: string;
  featureImages: string[]; // NEW: array of image URLs
  branch: string;
  category: string;
  subcategory: string;
  itemcategory: string;
  timestamp: any; // firestore Timestamp or serverTimestamp()
  show: boolean;
  available: boolean;
  latest: boolean;
  sponsored: boolean;
  option: boolean;
}

// Fetch all products
export async function fetchProducts(): Promise<Product[]> {
  const productsCol = collection(db, "product");
  const productSnapshot = await getDocs(productsCol);
  return productSnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Product),
  }));
}

// Add new product
export async function addProduct(product: Omit<Product, "id" | "timestamp">): Promise<void> {
  await addDoc(collection(db, "product"), {
    ...product,
    timestamp: Timestamp.now(),
  });
}

// Update existing product by id

export async function updateProduct(productId: string, updatedFields: Partial<Product>): Promise<void> {
  try {
    console.log('updateProduct called with:', { productId, updatedFields });
    
    // Clean the data - remove undefined values and ensure proper types
    const cleanData: Partial<Product> = {};
    
    Object.entries(updatedFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle specific data type conversions
        if (key === 'price' || key === 'stock' || key === 'discount') {
          cleanData[key as keyof Product] = value.toString();
        } else if (key === 'featureImages') {
          cleanData[key as keyof Product] = Array.isArray(value) ? value : [];
        } else {
          cleanData[key as keyof Product] = value;
        }
      }
    });
    
    // Remove timestamp from update (let Firestore handle it)
    delete cleanData.timestamp;
    delete cleanData.id; // Don't update the ID field
    
    console.log('Clean data for update:', cleanData);
    
    const productRef = doc(db, "product", productId);
    await updateDoc(productRef, cleanData);
    
    console.log('Document updated successfully');
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error; // Re-throw to be caught by saveProduct
  }
}

// Delete product by id
export async function deleteProduct(productId: string): Promise<void> {
  const productRef = doc(db, "product", productId);
  await deleteDoc(productRef);
}
