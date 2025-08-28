// branchService.ts
const geohash = require('ngeohash');
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc,
  setDoc 
} from "firebase/firestore";

// Define Branch interface
export interface Branch {
  uid?: string; // optional Firestore document ID
  announcement: string;
  bannerImages: string[];
  branchId: string;
  delivery: number;
  kmcharge: number;
  minAmount: number;
  online: boolean;
  packing: number;
  phone: string;
  pincode: string;
  policy: string;
  radius: string;
  range: number;
  service: number;
  storeLat: string;
  storeLon: string;
  storecate: string;
  storename: string;
  storeuid: string;
  tax: number;
  timestamp?: any; // Firestore timestamp
}

// Initialize Firestore
const db = getFirestore();

// Fetch all branches
export async function fetchAllBranches(): Promise<Branch[]> {
  const branchesCol = collection(db, "branch");
  const branchesSnapshot = await getDocs(branchesCol);
  return branchesSnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  })) as Branch[];
}

// Add a new branch
export async function addNewBranch(newBranch: Omit<Branch, "timestamp">): Promise<string> {
  if (!newBranch.branchId) {
    throw new Error("branchId is required for document ID");
  }

  const docRef = doc(db, "branch", newBranch.branchId); // Use branchId as document ID

  await setDoc(docRef, {
    ...newBranch,
    timestamp: new Date(),
  });

  return docRef.id; // same as newBranch.branchId
}

export async function saveBranch(branchId: string, lat: number, lng: number) {
  const geoHash = geohash.encode(lat, lng);

  try {
    // Create doc ref with custom ID as branchId inside "Branches" collection
    const docRef = doc(db, "Branches", branchId);

    // Set the document data (overwrites if exists)
    await setDoc(docRef, {
      branchId,
      geohash: geoHash,
      lat,
      lng,
    });

    console.log(`Branch saved with custom ID: ${branchId}`);
  } catch (error) {
    console.error("Error saving branch:", error);
  }
}

// Update an existing branch by uid
export async function updateBranch(
  uid: string, 
  updatedBranch: Partial<Omit<Branch, "uid" | "timestamp">>
): Promise<void> {
  const branchDoc = doc(db, "branch", uid);
  await updateDoc(branchDoc, {
    ...updatedBranch,
    timestamp: new Date(),
  });
}
