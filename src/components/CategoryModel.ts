import {
  collection,
  getDocs,
  doc,
  where,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface ProductCategory {
  id?: string;
  tittle: string;              // note: typo kept as per your original definition
  description: string;
  branchId: string[];          // storing multiple branch IDs
  image: string;               // URL to image
  tag: string;                 // string tag, e.g., "3"
  show: boolean;
  createdTimestamp?: Timestamp;
}

const CATEGORY_COLLECTION = "category";
const BranchId = "voT4WYa4VNMQnYgFXlKVcIUeuEL2";

export async function fetchCategories(): Promise<ProductCategory[]> {
  // Create a query on the collection with 'array-contains' filter on 'branchId'
  const colRef = collection(db, CATEGORY_COLLECTION);
  const catQuery = query(colRef, where("branchId", "array-contains", BranchId));

  const snapshot = await getDocs(catQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as ProductCategory)
  }));
}

export async function addCategory(data: Omit<ProductCategory, "id" | "createdTimestamp">): Promise<void> {
  const colRef = collection(db, CATEGORY_COLLECTION);
  await addDoc(colRef, {
    ...data,
    createdTimestamp: Timestamp.now()
  });
}

export async function updateCategory(
  id: string, 
  data: Partial<Omit<ProductCategory, "id" | "createdTimestamp">>
): Promise<void> {
  try {
    console.log('Updating category:', { id, data });
    
    // Clean the data to remove any undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    
    console.log('Clean data for category update:', cleanData);
    
    const docRef = doc(db, CATEGORY_COLLECTION, id);
    await updateDoc(docRef, cleanData);
    
    console.log('Category updated successfully');
  } catch (error) {
    console.error('Error updating category:', error);
    throw new Error(`Failed to update category: ${error}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const docRef = doc(db, CATEGORY_COLLECTION, id);
  await deleteDoc(docRef);
}

// Optional: search categories by title or tag
export async function searchCategories(searchText: string): Promise<ProductCategory[]> {
  const allCategories = await fetchCategories();
  const lower = searchText.toLowerCase();
  return allCategories.filter(cat =>
    cat.tittle.toLowerCase().includes(lower) ||
    cat.tag.includes(searchText)
  );
}
