// SubcategoryService.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Subcategory {
  id?: string;
  catname: string;
  discription: string;
  image: string;
  show: boolean;
  tittle: string;
  createdTimestamp?: Timestamp;
}

const SUBCATEGORY_COLLECTION = "subcategory";

export async function fetchSubcategories(): Promise<Subcategory[]> {
  const colRef = collection(db, SUBCATEGORY_COLLECTION);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Subcategory),
  }));
}

export async function addSubcategory(
  data: Omit<Subcategory, "id" | "createdTimestamp">
): Promise<void> {
  const colRef = collection(db, SUBCATEGORY_COLLECTION);
  await addDoc(colRef, {
    ...data,
    createdTimestamp: Timestamp.now(),
  });
}

export async function updateSubcategory(
  id: string,
  data: Partial<Omit<Subcategory, "id" | "createdTimestamp">>
): Promise<void> {
  const docRef = doc(db, SUBCATEGORY_COLLECTION, id);
  await updateDoc(docRef, data);
}

export async function deleteSubcategory(id: string): Promise<void> {
  const docRef = doc(db, SUBCATEGORY_COLLECTION, id);
  await updateDoc(docRef, { show: false }); // Or deleteDoc(docRef) if you want to delete
}

// Optional: If you want a search function similar to restaurant service
export async function searchSubcategories(queryText: string): Promise<Subcategory[]> {
  const all = await fetchSubcategories();
  const qLower = queryText.toLowerCase();
  return all.filter(sc =>
    (sc.tittle && sc.tittle.toLowerCase().includes(qLower)) ||
    (sc.catname && sc.catname.toLowerCase().includes(qLower))
  );
}
