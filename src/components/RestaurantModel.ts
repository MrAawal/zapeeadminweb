// RestaurantService.ts
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getAuth } from "firebase/auth";

export interface Restaurant {
  id?: string;
  details: string;
  active: boolean;
  address: string;
  announcement: string;
  bannerImages: string[];
  branchId: string;
  category: string;
  createdTimestamp: Timestamp;
  delivery: number;
  feature: string;
  image: string;
  kmcharge: number;
  mapaddress: string;
  mappin: string;
  minAmount: number;
  online: boolean;
  packing: number;
  phone: string;
  pincode: string;
  policy: string;
  premium: boolean;
  range: number;
  rating: number;
  service: number;
  show: boolean;
  storeLat: string;
  storeLon: string;
  storename: string;
  storeuid: string;
  sublocality: string;
  tax: number;
  uid: string;
}



const auth = getAuth();
const currentUser = auth.currentUser;
const RESTAURANT_COLLECTION = "Restaurant";

if (currentUser) {
  const BranchId = currentUser.uid;  // This is the current logged-in user's ID
  
  



} else {
  console.log("No user is currently signed in.");
}




export async function fetchRestaurants(): Promise<Restaurant[]> {
  const user = getAuth().currentUser;
  const colRef = collection(db, RESTAURANT_COLLECTION);
  const catQuery = query(colRef, where("branchId", "==", user?.uid));

  const snapshot = await getDocs(catQuery);


  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Restaurant)
  }));
}

export async function addRestaurant(
  id: string,  // Custom document ID from form input
  data: Omit<Restaurant, "id" | "createdTimestamp">
): Promise<void> {
  const docRef = doc(db, "Restaurant", id); // Use custom ID

  await setDoc(docRef, {
    ...data,
    createdTimestamp: Timestamp.now(),
  });
}

export async function searchRestaurants(queryText: string): Promise<Restaurant[]> {
  const all = await fetchRestaurants();
  const qLower = queryText.toLowerCase();
  return all.filter(r =>
    (r.storename && r.storename.toLowerCase().includes(qLower)) ||
    (r.id && r.id === queryText)
  );
}


export async function toggleRestaurantActive(id: string, active: boolean): Promise<void> {
  const docRef = doc(db, RESTAURANT_COLLECTION, id);
  await updateDoc(docRef, { active });
}
export async function updateRestaurant(id: string, data: Partial<Omit<Restaurant, "id" | "createdTimestamp">>): Promise<void> {
  const docRef = doc(db, "Restaurant", id);
  await updateDoc(docRef, data);
}