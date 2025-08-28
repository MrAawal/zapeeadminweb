// firestoreQueries.ts
import { 
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';

import { useParams } from "react-router-dom";



export interface Product {
  available: boolean;
  branch: string;
  category: string;
  description: string;
  discount: string;
  featureImages: string[];
  id: string;
  image: string;
  itemcategory: string;
  latest: boolean;
  option: boolean;
  price: string;
  show: boolean;
  sponsored: boolean;
  stock: string;
  subcategory: string;
  timestamp: any; // Firestore timestamp type
  tittle: string;
}

export interface CategoryType {
  id: string;
  tittle: string;
}
export interface SubCategoryType {
  id: string;
  tittle: string;
  catname: string;
}

// Generate random 9 digit string ID
export const generateRandom9DigitId = (): string =>
  Math.floor(100000000 + Math.random() * 900000000).toString();

// Fetch categories for current user's branch
export const fetchCategories = async (): Promise<CategoryType[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User not logged in');

  const q = query(
    collection(db, 'category'),
    where('branch', '==', currentUser.uid),
    where('show', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    tittle: doc.data().tittle,
  }));
};

// Fetch subcategories for selected category
export const fetchSubcategories = async (categoryId: string): Promise<SubCategoryType[]> => {
  if (!categoryId) return [];
  const q = query(collection(db, 'subcategory'), where('catname', '==', categoryId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    tittle: doc.data().tittle,
    catname: doc.data().catname,
  }));
};

// Upload a single image file to Firebase Storage
export const uploadImageFile = async (userId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `product/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

/**
 * Creates a product document in Firestore.
 * @param productData - Product fields EXCEPT id, timestamp, branch, image, featureImages.
 * @param singleImageFile - Main image file.
 * @param featureImageFiles - Array of feature image files.
 */
export const createProduct = async (
  productData: Omit<Product, 'id' | 'timestamp' | 'branch' | 'image' | 'featureImages'>,
  singleImageFile: File,
  featureImageFiles: File[]
): Promise<void> => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) throw new Error('User not logged in');

  // Upload main image
  const mainImageUrl = await uploadImageFile(currentUser.uid, singleImageFile);

  // Upload feature images up to max of 6 (UI should enforce limit)
  const featureImageUrls: string[] = [];
  for (let f of featureImageFiles) {
    const url = await uploadImageFile(currentUser.uid, f);
    featureImageUrls.push(url);
  }

  const newId = generateRandom9DigitId();

  // Compose complete product object with no duplicated keys 
  const product: Product = {
    id: newId,
    branch: currentUser.uid,
    image: mainImageUrl,
    featureImages: featureImageUrls,
    timestamp: serverTimestamp(),
    ...productData,
  };

  const newProductRef = doc(db, 'product', newId);
  await setDoc(newProductRef, product);
};
